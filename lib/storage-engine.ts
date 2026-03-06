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
        
        try {
          const handle = await root.getFileHandle(MANIFEST_FILE);
          manifest = JSON.parse(await (await handle.getFile()).text());
        } catch { manifest = {}; }

        // Initial Cloud Discovery for the Manifest itself
        if (navigator.onLine && !manifest[MANIFEST_FILE]?.id) {
          const cloudMeta = await GoogleDriveSync.findFileByName(MANIFEST_FILE);
          if (cloudMeta) {
            manifest[MANIFEST_FILE] = { id: cloudMeta.id, v: 1, dirty: false };
            await this._persistManifest();
          }
        }

        if (navigator.onLine) this.syncDirtyFiles();
      } catch (e) { console.warn("StorageEngine: Ready."); }
    })();
    return initPromise;
  },

  // --- WRITES (OPFS First, then Background Cloud) ---

  async _performWrite(fileName: string, data: any, isNote: boolean) {
    await this.init();
    
    // 1. Immediate local save
    await this._saveToLocal(fileName, data, isNote);

    // 2. Mark dirty in manifest
    if (!manifest[fileName]) manifest[fileName] = { id: "", v: 0, dirty: true };
    manifest[fileName].dirty = true;
    await this._persistManifest();

    // 3. Cloud Upload
    if (navigator.onLine) {
      await this._uploadToDrive(fileName, data, isNote);
    } else if (statusListener) {
      statusListener("offline");
    }
  },

  async _uploadToDrive(fileName: string, data: any, isNote: boolean) {
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
        
        // After a successful upload, check if anything else is still dirty
        const remainingDirty = Object.values(manifest).some(item => item.dirty);
        if (!remainingDirty) {
            this._debouncedManifestSync(); // Upload the registry last
            if (statusListener) statusListener("synced");
        }
      }
    } catch (e) {
      if (statusListener) statusListener("error");
    }
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
          console.error("Registry sync failed");
          if (statusListener) statusListener("error");
      }
    }, 3000);
  },

  // --- READS (Strictly OPFS) ---

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
    } catch { return [{ id: crypto.randomUUID(), type: "text", content: "" }]; }
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