import { useState, useEffect, useRef } from "react";
import { NoteBlock } from "@/lib/types";
import { StorageEngine } from "@/lib/storage-engine";

export const useActiveNote = (noteId: string | undefined) => {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoaded = useRef(false);

  // Load content when noteId changes (Navigation)
  useEffect(() => {
    isLoaded.current = false;
    if (!noteId) return;

    const load = async () => {
      setIsLoading(true);
      const data = await StorageEngine.loadNoteBlocks(noteId);
      setBlocks(data);
      setIsLoading(false);
      isLoaded.current = true;
    };
    load();
  }, [noteId]);

  // Auto-save blocks when they change (Debounced)
  useEffect(() => {
    if (noteId && isLoaded.current && !isLoading) {
      StorageEngine.saveNoteBlocksDebounced(noteId, blocks);
    }
  }, [blocks, noteId, isLoading]);

  return { blocks, setBlocks, isLoading };
};