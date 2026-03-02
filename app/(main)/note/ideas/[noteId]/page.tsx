'use client';
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import NoteEditorFull from "@/components/NoteEditorFull";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface NoteEditorPageProps {
    params: Promise<{
        noteId: string;
    }>;
}

const NoteEditorPage = ({ params }: NoteEditorPageProps) => {
    const { noteId } = use(params);
    const router = useRouter();
    const { isInitialized, noteIndexes, updateNote, deleteNote, getNoteById } = useNotesContext();
    const [focusMode, setFocusMode] = useState(false);
    const [hasWaited, setHasWaited] = useState(false);

    const activeNote = getNoteById(noteId);
    const noteIndex = noteIndexes.find((n) => n.id === noteId);

    // Small delay to ensure state propagation after creation
    useEffect(() => {
        const timer = setTimeout(() => setHasWaited(true), 150);
        return () => clearTimeout(timer);
    }, [noteId]);

    // Redirect if note doesn't exist
    useEffect(() => {
        if (isInitialized && hasWaited && !noteIndex) {
            router.push("/note/ideas");
        }
    }, [isInitialized, hasWaited, noteIndex, router]);

    const handleDeleteNote = () => {
        deleteNote(noteId);
        router.push("/note/ideas");
    };

    // Keyboard shortcut for focus mode (Escape to exit)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && focusMode) {
                setFocusMode(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusMode]);

    if (!activeNote) {
        if (!isInitialized || !hasWaited) {
            return (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <div className="animate-pulse text-muted-foreground">Loading note...</div>
                </div>
            );
        }
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-muted-foreground">Note not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden relative">
            {/* Editor */}
            <NoteEditorFull
                note={activeNote}
                onUpdate={(updates) => updateNote(noteId, updates)}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
            />
        </div>
    );
};

export default NoteEditorPage;
