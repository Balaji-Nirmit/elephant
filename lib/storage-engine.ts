import { Folder, NoteBlock, NoteIndex } from "./types";
import { GoogleDriveSync } from "./GoogleDriveSync";

const INDEXES_FILE = "note-indexes-nickblake.json";
const FOLDERS_FILE = "folders-nickblake.json";
const MANIFEST_FILE = "sync-manifest.json";
const NOTES_DIR = "notes";

export type SyncStatus = "synced" | "syncing" | "error" | "offline";
export type SyncProgress = { current: number; total: number };

let statusListener: ((status: SyncStatus) => void) | null = null;
let progressListener: ((progress: SyncProgress) => void) | null = null;

let manifest: Record<string, { id: string; v: number; dirty: boolean }> = {};
const saveTimeouts: Record<string, any> = {};
const uploadQueue: Record<string, Promise<any>> = {};
let manifestSyncTimeout: any = null;
let initPromise: Promise<void> | null = null;

const getRoot = () => navigator.storage.getDirectory();

export const StorageEngine = {
  onStatusChange(cb: (s: SyncStatus) => void) { statusListener = cb; },
  onProgressChange(cb: (p: SyncProgress) => void) { progressListener = cb; },

  async init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const root = await getRoot();
      try {
        await root.getDirectoryHandle(NOTES_DIR, { create: true });

        let localManifestExist = false;
        try {
          const handle = await root.getFileHandle(MANIFEST_FILE);
          manifest = JSON.parse(await (await handle.getFile()).text());
          localManifestExist = true;
        } catch {
          manifest = {};
          localManifestExist = false;
        }

        if (navigator.onLine) {
          const cloudMeta = await GoogleDriveSync.findFileByName(MANIFEST_FILE);
          
          if (cloudMeta) {
            if (!localManifestExist) {
              await this.restoreMetadata(cloudMeta.id);
              return; 
            } else {
              await this.syncWithCloud(cloudMeta.id);
            }
          } else {
            if (!localManifestExist) {
              // Initial Skeleton for New User
              await this._saveToLocal(FOLDERS_FILE, [], false);
              await this._saveToLocal(INDEXES_FILE, [], false);
              manifest = { [MANIFEST_FILE]: { id: "", v: 0, dirty: true } };
              await this._persistManifest();
            }
          }
        }

        if (navigator.onLine) {
          await this.syncDirtyFiles();
        } else if (statusListener) {
          statusListener("synced"); // Default to synced (offline mode)
        }
      } catch (e) { 
        console.warn("StorageEngine Ready."); 
        if (statusListener) statusListener("synced");
      }
    })();
    return initPromise;
  },

  async syncWithCloud(cloudManifestId: string) {
    try {
      const cloudManifest = await GoogleDriveSync.downloadFile(cloudManifestId);
      let localNeedsUpdate = false;

      for (const fileName in cloudManifest) {
        const remote = cloudManifest[fileName];
        const local = manifest[fileName];

        if (!local) {
          manifest[fileName] = { ...remote, dirty: false };
          localNeedsUpdate = true;
        } else if (remote.v > local.v) {
          if (local.dirty) {
            await this._handleConflict(fileName, remote);
          } else {
            manifest[fileName] = { ...remote, dirty: false };
            localNeedsUpdate = true;
          }
        }
      }
      if (localNeedsUpdate) await this._persistManifest();
    } catch (e) { console.error("Cloud check failed", e); }
  },

  async _handleConflict(id: string, remoteMeta: any) {
    if (id.includes('nickblake')) return; 
    const remoteData = await GoogleDriveSync.downloadFile(remoteMeta.id);
    const localData = await this.loadNoteBlocks(id);

    const conflictId = `CONFLICT-${Date.now()}-${id}`;
    await this._saveToLocal(conflictId, localData, true);
    manifest[conflictId] = { id: "", v: 0, dirty: true };

    await this._saveToLocal(id, remoteData, true);
    manifest[id] = { ...remoteMeta, dirty: false };
    await this._persistManifest();
  },

  async restoreMetadata(driveId: string) {
    try {
      if (statusListener) statusListener("syncing");
      const cloudManifest = await GoogleDriveSync.downloadFile(driveId);
      manifest = cloudManifest;
      await this._persistManifest();
      
      const idxId = manifest[INDEXES_FILE]?.id;
      const fldId = manifest[FOLDERS_FILE]?.id;
      if (idxId) await this._saveToLocal(INDEXES_FILE, await GoogleDriveSync.downloadFile(idxId), false);
      if (fldId) await this._saveToLocal(FOLDERS_FILE, await GoogleDriveSync.downloadFile(fldId), false);
      
      if (statusListener) statusListener("synced");
      window.location.reload();
    } catch (e) {
      if (statusListener) statusListener("error");
    }
  },

  async _performWrite(fileName: string, data: any, isNote: boolean) {
    await this.init();
    await this._saveToLocal(fileName, data, isNote);

    if (!manifest[fileName]) manifest[fileName] = { id: "", v: 0, dirty: true };
    manifest[fileName].dirty = true;
    
    // Ensure the manifest itself is marked dirty so it gets updated eventually
    if (!manifest[MANIFEST_FILE]) manifest[MANIFEST_FILE] = { id: "", v: 0, dirty: true };
    manifest[MANIFEST_FILE].dirty = true;
    
    await this._persistManifest();

    if (navigator.onLine) {
      this._uploadToDrive(fileName, data, isNote);
    } else if (statusListener) {
      statusListener("offline");
    }
  },

  async _uploadToDrive(fileName: string, data: any, isNote: boolean) {
    const existingUpload = uploadQueue[fileName];
    if (existingUpload) await existingUpload;

    const perform = async () => {
      if (statusListener) statusListener("syncing");
      try {
        const driveName = isNote ? `${fileName}.json` : fileName;
        const driveId = manifest[fileName]?.id;
        const result = await GoogleDriveSync.syncFile(driveName, data, driveId);
        
        if (result && result.id) {
          manifest[fileName].id = result.id;
          manifest[fileName].v = (manifest[fileName].v || 0) + 1;
          manifest[fileName].dirty = false;
          await this._persistManifest();
          
          // Only trigger manifest sync if NO OTHER content files are dirty
          const hasContentDirty = Object.keys(manifest).some(key => key !== MANIFEST_FILE && manifest[key].dirty);
          if (!hasContentDirty) {
            await this._debouncedManifestSync();
          }
        }
      } catch (e) {
        if (statusListener) statusListener("error");
      } finally {
        delete uploadQueue[fileName];
      }
    };

    const currentUpload = perform();
    uploadQueue[fileName] = currentUpload;
    return currentUpload;
  },

  async _debouncedManifestSync() {
    if (manifestSyncTimeout) clearTimeout(manifestSyncTimeout);
    return new Promise((resolve) => {
      manifestSyncTimeout = setTimeout(async () => {
        const selfId = manifest[MANIFEST_FILE]?.id;
        try {
          const res = await GoogleDriveSync.syncFile(MANIFEST_FILE, manifest, selfId);
          if (res) {
            manifest[MANIFEST_FILE].id = res.id;
            manifest[MANIFEST_FILE].v = (manifest[MANIFEST_FILE].v || 0) + 1;
            manifest[MANIFEST_FILE].dirty = false;
            await this._persistManifest();
          }
          if (statusListener) statusListener("synced");
          resolve(true);
        } catch (e) {
          if (statusListener) statusListener("error");
          resolve(false);
        }
      }, 2000);
    });
  },

  async loadIndexes(): Promise<NoteIndex[]> {
    await this.init();
    try {
      const h = await (await getRoot()).getFileHandle(INDEXES_FILE);
      return JSON.parse(await (await h.getFile()).text());
    } catch { return []; }
  },

  async loadFolders(): Promise<Folder[]> {
    await this.init();
    try {
      const h = await (await getRoot()).getFileHandle(FOLDERS_FILE);
      return JSON.parse(await (await h.getFile()).text());
    } catch { return []; }
  },

  async loadNoteBlocks(id: string): Promise<NoteBlock[]> {
    await this.init();
    try {
      const d = await (await getRoot()).getDirectoryHandle(NOTES_DIR);
      const h = await d.getFileHandle(`${id}.json`);
      return JSON.parse(await (await h.getFile()).text());
    } catch {
      const driveId = manifest[id]?.id;
      if (driveId && navigator.onLine) {
        try {
          if (statusListener) statusListener("syncing");
          const cloudData = await GoogleDriveSync.downloadFile(driveId);
          await this._saveToLocal(id, cloudData, true);
          if (statusListener) statusListener("synced");
          return cloudData;
        } catch { return [{ id: crypto.randomUUID(), type: "text", content: "" }]; }
      }
      return [{ id: crypto.randomUUID(), type: "text", content: "" }];
    }
  },

  async syncDirtyFiles() {
    if (!navigator.onLine) return;
    const dirty = Object.keys(manifest).filter(n => manifest[n].dirty && n !== MANIFEST_FILE);
    
    if (dirty.length === 0) {
      if (manifest[MANIFEST_FILE]?.dirty) {
        await this._debouncedManifestSync();
      } else if (statusListener) {
        statusListener("synced");
      }
      return;
    }

    if (statusListener) statusListener("syncing");
    for (let i = 0; i < dirty.length; i++) {
      if (progressListener) progressListener({ current: i + 1, total: dirty.length });
      const name = dirty[i];
      const isNote = !name.includes('nickblake');
      try {
        let data;
        if (isNote) data = await this.loadNoteBlocks(name);
        else if (name === FOLDERS_FILE) data = await this.loadFolders();
        else data = await this.loadIndexes();
        await this._uploadToDrive(name, data, isNote);
      } catch { continue; }
    }
    if (progressListener) progressListener({ current: 0, total: 0 });
  },

  async deleteNoteFile(id: string) {
    await this.init();
    try {
      const root = await getRoot();
      const dir = await root.getDirectoryHandle(NOTES_DIR);
      await dir.removeEntry(`${id}.json`);
      const driveId = manifest[id]?.id;
      delete manifest[id];
      if (manifest[MANIFEST_FILE]) manifest[MANIFEST_FILE].dirty = true;
      await this._persistManifest();
      if (navigator.onLine && driveId) {
        await GoogleDriveSync.deleteFile(driveId);
        await this._debouncedManifestSync();
      }
    } catch (e) { console.warn("Deleted locally."); }
  },

  async _saveToLocal(fileName: string, data: any, isNote: boolean) {
    const root = await getRoot();
    const dir = isNote ? await root.getDirectoryHandle(NOTES_DIR, { create: true }) : root;
    const name = isNote && !fileName.endsWith('.json') ? `${fileName}.json` : fileName;
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data));
    await writable.close();
  },

  async _persistManifest() {
    const root = await getRoot();
    const handle = await root.getFileHandle(MANIFEST_FILE, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(manifest));
    await writable.close();
  },

  saveIndexesDebounced(i: NoteIndex[]) { this._writeFile(INDEXES_FILE, i, false); },
  saveFoldersDebounced(f: Folder[]) { this._writeFile(FOLDERS_FILE, f, false); },
  saveNoteBlocksDebounced(id: string, b: NoteBlock[]) { this._writeFile(id, b, true); },

  _writeFile(name: string, data: any, isNote: boolean) {
    if (saveTimeouts[name]) clearTimeout(saveTimeouts[name]);
    saveTimeouts[name] = setTimeout(() => { this._performWrite(name, data, isNote); }, 800);
  }
};