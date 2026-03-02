import { StorageEngine } from "@/lib/storage-engine";
import { Folder, Note, NoteBlock, NoteIndex } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

const NOTE_INDEXES_KEY = "elephant-note-indexes";
const NOTE_BLOCKS_KEY = "elephant-note-blocks";
const FOLDERS_KEY = "elephant-folders";

const getStoredNoteIndexes = (): NoteIndex[] => {
  try {
    const stored = localStorage.getItem(NOTE_INDEXES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getStoredNoteBlocks = (): Record<string, NoteBlock[]> => {
  try {
    const stored = localStorage.getItem(NOTE_BLOCKS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getStoredFolders = (): Folder[] => {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useNotes = () => {
  const [noteIndexes, setNoteIndexes] = useState<NoteIndex[]>([]);
  const [noteBlocks, setNoteBlocks] = useState<Record<string, NoteBlock[]>>({});
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // // Initialize from localStorage on mount
  // useEffect(() => {
  //   setNoteIndexes(getStoredNoteIndexes());
  //   setNoteBlocks(getStoredNoteBlocks());
  //   setFolders(getStoredFolders());
  //   setIsInitialized(true);
  // }, []);

  useEffect(() => {
    const init = async () => {
      const [idx, fld] = await Promise.all([
        StorageEngine.loadIndexes(),
        StorageEngine.loadFolders(),
      ]);
      setNoteIndexes(idx);
      setFolders(fld);
      setIsInitialized(true);
    };
    init();
  }, []);

  // Persist noteIndexes to localStorage
  useEffect(() => {
    if (isInitialized) {
      // localStorage.setItem(NOTE_INDEXES_KEY, JSON.stringify(noteIndexes));
      StorageEngine.saveIndexesDebounced(noteIndexes);
    }
  }, [noteIndexes, isInitialized]);

  // Persist noteBlocks to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(NOTE_BLOCKS_KEY, JSON.stringify(noteBlocks));
    }
  }, [noteBlocks, isInitialized]);

  // Persist folders to localStorage
  useEffect(() => {
    if (isInitialized) {
      // localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      StorageEngine.saveFoldersDebounced(folders);
    }
  }, [folders, isInitialized]);

  const createNote = useCallback((folderId: string | null = null): Note => {
    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create note index (metadata only)
    const newNoteIndex: NoteIndex = {
      id: noteId,
      title: "Untitled",
      tags: [],
      folderId,
      createdAt: now,
      updatedAt: now,
    };

    // Create initial blocks
    const initialBlocks: NoteBlock[] = [
      { id: crypto.randomUUID(), type: "text", content: "" }
    ];

    // Update state
    setNoteIndexes((prev) => [newNoteIndex, ...prev]);
    setNoteBlocks((prev) => ({ ...prev, [noteId]: initialBlocks }));

    // Return full Note object for type compatibility
    return {
      id: noteId,
      title: "Untitled",
      blocks: initialBlocks,
      tags: [],
      folderId,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    const now = new Date().toISOString();

    // Update noteIndex (metadata)
    setNoteIndexes((prev) =>
      prev.map((index) =>
        index.id === id
          ? {
            ...index,
            ...(updates.title && { title: updates.title }),
            ...(updates.tags && { tags: updates.tags }),
            ...(updates.folderId !== undefined && { folderId: updates.folderId }),
            ...(updates.isPinned !== undefined && { isPinned: updates.isPinned }),
            updatedAt: now,
          }
          : index
      )
    );

    // Update blocks if provided
    if (updates.blocks) {
      setNoteBlocks((prev) => ({ ...prev, [id]: updates.blocks! }));
    }
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNoteIndexes((prev) => prev.filter((index) => index.id !== id));
    setNoteBlocks((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const createFolder = useCallback((name: string): Folder => {
    const colors = ["green", "blue", "purple", "orange", "pink"];
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    setNoteIndexes((prev) =>
      prev.map((index) =>
        index.folderId === id ? { ...index, folderId: null } : index
      )
    );
  }, []);

  const getRecentNoteIndexes = useCallback(
    (limit = 5) => {
      return [...noteIndexes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    },
    [noteIndexes]
  );

  const getNoteIndexesForFolder = useCallback(
    (folderId: string | null) => {
      return noteIndexes.filter((index) => index.folderId === folderId);
    },
    [noteIndexes]
  );

  // Get full Note by combining index + blocks
  const getNoteById = useCallback(
    (id: string): Note | undefined => {
      const index = noteIndexes.find((index) => index.id === id);
      if (!index) return undefined;

      const blocks = noteBlocks[id] || [];

      return {
        id: index.id,
        title: index.title,
        blocks,
        tags: index.tags,
        folderId: index.folderId,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
        isPinned: index.isPinned,
      };
    },
    [noteIndexes, noteBlocks]
  );

  // Search across both indexes and blocks
  const searchNotes = useCallback(
    (query: string) => {
      const lower = query.toLowerCase();
      return noteIndexes.filter((index) => {
        const matchesTitle = index.title.toLowerCase().includes(lower);
        const blocks = noteBlocks[index.id] || [];
        const matchesContent = blocks.some((block) =>
          block.content.toLowerCase().includes(lower)
        );
        return matchesTitle || matchesContent;
      });
    },
    [noteIndexes, noteBlocks]
  );

  // Get blocks for a specific note
  const getBlocksForNote = useCallback(
    (noteId: string): NoteBlock[] => {
      return noteBlocks[noteId] || [];
    },
    [noteBlocks]
  );

  return {
    isInitialized,
    noteIndexes,
    noteBlocks,
    folders,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    deleteFolder,
    getRecentNoteIndexes,
    getNoteIndexesForFolder,
    searchNotes,
    getNoteById,
    getBlocksForNote,
  };
};
