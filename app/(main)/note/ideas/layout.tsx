'use client';
import { useRouter, useParams } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import NotesListPanel from "@/components/NotesListPanel";
import { motion } from "framer-motion";

const IdeasLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const params = useParams();
    const noteId = params.noteId as string;
    
    // Changed: createNote -> createNoteIndex
    // Removed: getNoteById (Context no longer stores blocks)
    const { isInitialized, noteIndexes, createNoteIndex, deleteNote } = useNotesContext();

    const handleCreateNote = () => {
        // Returns string ID
        const newNoteId = createNoteIndex();
        router.push(`/note/ideas/${newNoteId}`);
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
            {/* Notes List Panel */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-full md:w-80 shrink-0 border-r border-border bg-card ${
                    noteId ? "hidden md:flex" : "flex"
                }`}
            >   
                <NotesListPanel
                    title="All Ideas"
                    noteIndexes={noteIndexes}
                    activeNoteId={noteId}
                    onSelectNote={handleSelectNote}
                    onDeleteNote={handleDeleteNote}
                    onCreateNote={handleCreateNote}
                    // We no longer pass getNoteById. 
                    // NotesListPanel should render based on noteIndexes (metadata).
                />
            </motion.div>

            {/* Main Content Area */}
            <div className={`flex-1 overflow-hidden h-full ${
                noteId ? "flex" : "hidden md:flex"
            }`}>
                {children}
            </div>
        </div>
    );
};

export default IdeasLayout;