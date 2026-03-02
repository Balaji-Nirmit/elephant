// useActiveNote.ts
import { useState, useEffect, useRef } from "react";
import { StorageEngine } from "@/lib/storage-engine";
import { NoteBlock } from "@/lib/types";

export const useActiveNote = (noteId: string | undefined) => {
    const [blocks, setBlocks] = useState<NoteBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Track if the initial load is complete to prevent overwriting with empty state
    const isLoaded = useRef(false);

    // --- 1. FETCH ON NAVIGATION ---
    useEffect(() => {
        isLoaded.current = false;

        if (!noteId) {
            setBlocks([]);
            setIsLoading(false);
            return;
        }

        const loadContent = async () => {
            setIsLoading(true);
            const data = await StorageEngine.loadNoteBlocks(noteId);
            setBlocks(data);
            setIsLoading(false);
            isLoaded.current = true;
        };

        loadContent();
    }, [noteId]);

    // --- 2. AUTO-SAVE ON CHANGE ---
    useEffect(() => {
        // Only save if we have an ID, we aren't loading, and we have blocks to save
        if (noteId && isLoaded.current && !isLoading) {
            StorageEngine.saveNoteBlocksDebounced(noteId, blocks);
        }
    }, [blocks, noteId, isLoading]);

    return {
        blocks,
        setBlocks,
        isLoading,
    };
};