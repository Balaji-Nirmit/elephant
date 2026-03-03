import { useState, useEffect, useCallback } from "react";
import { NoteIndex, Folder } from "@/lib/types"; // Ensure paths are correct
import { StorageEngine } from "@/lib/storage-engine";

export const useNotes = () => {
  const [noteIndexes, setNoteIndexes] = useState<NoteIndex[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initial Load: Only fetch the index and folder manifests
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

  // 2. Auto-Save: Debounced sync of metadata only
  useEffect(() => {
    if (isInitialized) StorageEngine.saveIndexesDebounced(noteIndexes);
  }, [noteIndexes, isInitialized]);

  useEffect(() => {
    if (isInitialized) StorageEngine.saveFoldersDebounced(folders);
  }, [folders, isInitialized]);

  // 3. Actions
  const createNoteIndex = useCallback((folderId: string | null = null): string => {
    const id = crypto.randomUUID();
    const newIndex: NoteIndex = {
      id,
      title: "Untitled",
      tags: [],
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNoteIndexes(prev => [newIndex, ...prev]);
    return id; // Return ID so router can navigate immediately
  }, []);

  const updateNoteIndex = useCallback((id: string, updates: Partial<NoteIndex>) => {
    setNoteIndexes(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNoteIndexes(prev => prev.filter(n => n.id !== id));
    StorageEngine.deleteNoteFile(id); // Physically wipe content from disk
  }, []);

  const createFolder = useCallback((name: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      color: "blue",
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
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

  const deleteFolder = useCallback((id: string) => {
    // 1. Remove the folder itself
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    // 2. Orphan the notes that were in that folder (set folderId to null)
    setNoteIndexes((prev) =>
      prev.map((index) =>
        index.folderId === id ? { ...index, folderId: null } : index
      )
    );
  }, []);

  return { 
    isInitialized, 
    noteIndexes, 
    folders, 
    createNoteIndex, 
    updateNoteIndex, 
    deleteNote,
    createFolder,
    getRecentNoteIndexes,
    deleteFolder,
    getNoteIndexesForFolder
  };
};