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
const uploadQueue: Record<string, Promise<any>> = {}; // Problem 1: Race Condition Fix
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
            // If local doesn't exist, this is a NEW DEVICE (Case 2)
            if (!localManifestExist) {
              await this.restoreMetadata(cloudMeta.id);
              return; 
            } else {
              // EXISTING DEVICE (Case 1): Check for updates/conflicts (Problem 2)
              await this.syncWithCloud(cloudMeta.id);
            }
          } else {
            // NEW USER (Case 3)
            if (!localManifestExist) {
              await this._saveToLocal(FOLDERS_FILE, [], false);
              await this._saveToLocal(INDEXES_FILE, [], false);
              manifest = { [MANIFEST_FILE]: { id: "", v: 0, dirty: true } };
              await this._persistManifest();
            }
          }
        }

        if (navigator.onLine) {
          this.syncDirtyFiles();
        }
      } catch (e) { console.warn("StorageEngine: Ready."); }
    })();
    return initPromise;
  },

  // Problem 2: Conflict Detection Architecture
  async syncWithCloud(cloudManifestId: string) {
    try {
      const cloudManifest = await GoogleDriveSync.downloadFile(cloudManifestId);
      let localNeedsUpdate = false;

      for (const fileName in cloudManifest) {
        const remote = cloudManifest[fileName];
        const local = manifest[fileName];

        // 1. New file from another device
        if (!local) {
          manifest[fileName] = { ...remote, dirty: false };
          localNeedsUpdate = true;
        } 
        // 2. Remote has a higher version
        else if (remote.v > local.v) {
          if (local.dirty) {
            // CONFLICT: Create a duplicate local copy so no work is lost
            await this._handleConflict(fileName, remote);
          } else {
            // UPDATE: Just accept the remote version
            manifest[fileName] = { ...remote, dirty: false };
            localNeedsUpdate = true;
          }
        }
      }
      
      if (localNeedsUpdate) {
        await this._persistManifest();
      }
    } catch (e) { console.error("Cloud check failed", e); }
  },

  async _handleConflict(id: string, remoteMeta: any) {
    if (id.includes('nickblake')) return; // Don't conflict-split folders/indexes

    const remoteData = await GoogleDriveSync.downloadFile(remoteMeta.id);
    const localData = await this.loadNoteBlocks(id);

    // Save current local "dirty" work as a separate conflict file
    const conflictId = `CONFLICT-${Date.now()}-${id}`;
    await this._saveToLocal(conflictId, localData, true);
    manifest[conflictId] = { id: "", v: 0, dirty: true };

    // Update the original ID with the remote version
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

  // --- WRITES ---

  async _performWrite(fileName: string, data: any, isNote: boolean) {
    await this.init();
    await this._saveToLocal(fileName, data, isNote);

    if (!manifest[fileName]) manifest[fileName] = { id: "", v: 0, dirty: true };
    manifest[fileName].dirty = true;
    await this._persistManifest();

    if (navigator.onLine) {
      this._uploadToDrive(fileName, data, isNote);
    } else if (statusListener) {
      statusListener("offline");
    }
  },
  
  // Problem 1: Sequential Upload Queue (Fixed for TS)
  async _uploadToDrive(fileName: string, data: any, isNote: boolean) {
    // If an upload is already in flight for this specific file, wait for it.
    const existingUpload = uploadQueue[fileName];
    if (existingUpload) {
      await existingUpload;
    }

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
          
          const remainingDirty = Object.values(manifest).some(item => item.dirty);
          if (!remainingDirty) {
            this._debouncedManifestSync();
            if (statusListener) statusListener("synced");
          }
        }
      } catch (e) {
        if (statusListener) statusListener("error");
      } finally {
        // IMPORTANT: Only delete from queue if this specific promise is still the one there
        if (uploadQueue[fileName] === currentUpload) {
          delete uploadQueue[fileName];
        }
      }
    };

    const currentUpload = perform();
    uploadQueue[fileName] = currentUpload;
    return currentUpload;
  },

  _debouncedManifestSync() {
    if (manifestSyncTimeout) clearTimeout(manifestSyncTimeout);
    manifestSyncTimeout = setTimeout(async () => {
      const selfId = manifest[MANIFEST_FILE]?.id;
      try {
        const res = await GoogleDriveSync.syncFile(MANIFEST_FILE, manifest, selfId);
        if (res && !selfId) {
          manifest[MANIFEST_FILE] = { id: res.id, v: 1, dirty: false };
          await this._persistManifest();
        }
        if (statusListener) statusListener("synced");
      } catch (e) {
        if (statusListener) statusListener("error");
      }
    }, 3000);
  },

  // --- READS ---

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

  // --- SYNC & UTILS ---

  async syncDirtyFiles() {
    if (!navigator.onLine) return;
    const dirty = Object.keys(manifest).filter(n => manifest[n].dirty && n !== MANIFEST_FILE);
    if (dirty.length === 0) {
      if (statusListener) statusListener("synced");
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
      await this._persistManifest();
      if (navigator.onLine && driveId) {
        await GoogleDriveSync.deleteFile(driveId);
        this._debouncedManifestSync();
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