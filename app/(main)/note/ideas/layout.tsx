'use client';
import { useRouter, useParams } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import NotesListPanel from "@/components/NotesListPanel";
import { motion } from "framer-motion";

const IdeasLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const params = useParams();
    const noteId = params.noteId as string;
    const { isInitialized, noteIndexes, createNote, deleteNote, getNoteById } = useNotesContext();

    const handleCreateNote = () => {
        const note = createNote();
        router.push(`/note/ideas/${note.id}`);
    };

    const handleSelectNote = (id: string) => {
        router.push(`/note/ideas/${id}`);
    };

    const handleDeleteNote = (id: string) => {
        deleteNote(id);
        if (noteId === id) {
            router.push("/note/ideas");
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Loading ideas...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex overflow-hidden">
            {/* Notes List - Always visible on desktop, shown on mobile when no note is active */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-full md:w-80 shrink-0 border-r border-border bg-card ${noteId ? "hidden md:flex" : "flex"
                    }`}
            >
                <NotesListPanel
                    title="All Ideas"
                    noteIndexes={noteIndexes}
                    activeNoteId={noteId}
                    onSelectNote={handleSelectNote}
                    onDeleteNote={handleDeleteNote}
                    onCreateNote={handleCreateNote}
                    getNoteById={getNoteById}
                />
            </motion.div>

            {/* Main Content Area (Editor or Empty State) - Always visible on desktop, shown on mobile when a note is active */}
            <div className={`flex-1 overflow-hidden h-full ${noteId ? "flex" : "hidden md:flex"
                }`}>
                {children}
            </div>
        </div>
    );
};

export default IdeasLayout;
