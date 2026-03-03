'use client';
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import NoteEditorFull from "@/components/NoteEditorFull";
import { useActiveNote } from "@/hooks/useActiveNotes";

interface NoteEditorPageProps {
    params: Promise<{
        noteId: string;
    }>;
}

const NoteEditorPage = ({ params }: NoteEditorPageProps) => {
    const { noteId } = use(params);
    const router = useRouter();

    // 1. Metadata from Context (Titles, Folders, IDs)
    const { isInitialized, noteIndexes, updateNoteIndex, deleteNote } = useNotesContext();
    
    // 2. Content from File System (The "Heavy" Note Blocks)
    const { blocks, setBlocks, isLoading: isBlocksLoading } = useActiveNote(noteId);

    const [focusMode, setFocusMode] = useState(false);
    const [hasWaited, setHasWaited] = useState(false);

    // Find just the metadata for this note
    const noteIndex = noteIndexes.find((n) => n.id === noteId);

    // Small delay to ensure state propagation
    useEffect(() => {
        const timer = setTimeout(() => setHasWaited(true), 150);
        return () => clearTimeout(timer);
    }, [noteId]);

    // Redirect if metadata is loaded and the note doesn't exist
    useEffect(() => {
        if (isInitialized && hasWaited && !noteIndex) {
            router.push("/note/ideas");
        }
    }, [isInitialized, hasWaited, noteIndex, router]);

    const handleDeleteNote = () => {
        deleteNote(noteId);
        router.push("/note/ideas");
    };

    // Keyboard shortcut for focus mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && focusMode) {
                setFocusMode(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusMode]);

    // ASSEMBLY: Check if we have both the Index and the Blocks
    if (!noteIndex || isBlocksLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Opening atomic note...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden relative">
            <NoteEditorFull
                // Combine the metadata and blocks into one object for the component
                note={{ ...noteIndex, blocks }}
                onUpdate={(updates) => {
                    // Update content atomically in the hook
                    if (updates.blocks) {
                        setBlocks(updates.blocks);
                    }
                    // Update metadata (title/tags) in the global context
                    if (updates.title !== undefined || updates.tags !== undefined) {
                        updateNoteIndex(noteId, updates);
                    }
                }}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
            />
        </div>
    );
};

export default NoteEditorPage;