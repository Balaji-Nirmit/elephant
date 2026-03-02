// StorageEngine.ts

import { Folder, NoteBlock, NoteIndex } from "./types";

const INDEXES_FILE = "note-indexes-nickblake.json";
const FOLDERS_FILE = "folders-nickblake.json";
const NOTES_DIR = "notes";

/**
 * UTILITY: Get the Origin Private File System root
 */
const getRoot = () => navigator.storage.getDirectory();

/**
 * DEBOUNCE CACHE: Stores timeout IDs for each unique file
 */
const saveTimeouts: Record<string, any> = {};

export const StorageEngine = {
    /**
     * INTERNAL: Handles the debounced asynchronous writing to disk.
     * @param fileName - The name of the file or Note ID
     * @param data - The object to stringify and save
     * @param isNoteContent - If true, saves into the /notes directory
     */
    async _writeFile(fileName: string, data: any, isNoteContent: boolean = false) {
        const key = isNoteContent ? `note_${fileName}` : fileName;

        // Clear existing timeout to reset the debounce timer
        if (saveTimeouts[key]) clearTimeout(saveTimeouts[key]);

        saveTimeouts[key] = setTimeout(async () => {
            try {
                const root = await getRoot();
                let fileHandle: FileSystemFileHandle;

                if (isNoteContent) {
                    const dir = await root.getDirectoryHandle(NOTES_DIR, { create: true });
                    fileHandle = await dir.getFileHandle(`${fileName}.json`, { create: true });
                } else {
                    fileHandle = await root.getFileHandle(fileName, { create: true });
                }

                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data));
                await writable.close();

                delete saveTimeouts[key];
                console.log(`[StorageEngine] Saved: ${key}`);
            } catch (error) {
                console.error(`[StorageEngine] Failed to save ${key}:`, error);
            }
        }, 800); // 800ms debounce window
    },

    // --- INDEXES MANAGEMENT ---

    saveIndexesDebounced(indexes: NoteIndex[]) {
        this._writeFile(INDEXES_FILE, indexes);
    },

    async loadIndexes(): Promise<NoteIndex[]> {
        try {
            const root = await getRoot();
            const handle = await root.getFileHandle(INDEXES_FILE);
            const file = await handle.getFile();
            return JSON.parse(await file.text());
        } catch {
            return [];
        }
    },

    // --- FOLDERS MANAGEMENT ---

    saveFoldersDebounced(folders: Folder[]) {
        this._writeFile(FOLDERS_FILE, folders);
    },

    async loadFolders(): Promise<Folder[]> {
        try {
            const root = await getRoot();
            const handle = await root.getFileHandle(FOLDERS_FILE);
            const file = await handle.getFile();
            return JSON.parse(await file.text());
        } catch {
            return [];
        }
    },

    // --- ATOMIC NOTE CONTENT ---

    saveNoteBlocksDebounced(id: string, blocks: NoteBlock[]) {
        this._writeFile(id, blocks, true);
    },

    async loadNoteBlocks(id: string): Promise<NoteBlock[]> {
        try {
            const root = await getRoot();
            const dir = await root.getDirectoryHandle(NOTES_DIR);
            const handle = await dir.getFileHandle(`${id}.json`);
            const file = await handle.getFile();
            return JSON.parse(await file.text());
        } catch {
            // Return a default initial block if the file is not found
            return [{ id: crypto.randomUUID(), type: "text", content: "" }];
        }
    },

    /**
     * Physically removes the note file from the disk.
     */
    async deleteNoteFile(id: string): Promise<void> {
        try {
            const root = await getRoot();
            const dir = await root.getDirectoryHandle(NOTES_DIR);
            await dir.removeEntry(`${id}.json`);
            console.log(`[StorageEngine] Deleted file: ${id}.json`);
        } catch (e) {
            // File likely doesn't exist locally, ignore
        }
    }
};