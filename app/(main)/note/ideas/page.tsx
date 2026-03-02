'use client';
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import { StickyNote } from "lucide-react";
import { motion } from "framer-motion";

const IdeasPage = () => {
  const router = useRouter();
  const { createNote } = useNotesContext();

  const handleCreateNote = () => {
    const note = createNote();
    router.push(`/note/ideas/${note.id}`);
  };

  return (
    <div className="flex-1 h-full flex items-center justify-center bg-background">
      {/* Empty State on Desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <StickyNote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Select a note</h2>
        <p className="text-muted-foreground mb-4">
          Choose a note from the list or create a new one
        </p>
        <motion.button
          onClick={handleCreateNote}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Create new note
        </motion.button>
      </motion.div>
    </div>
  );
};

export default IdeasPage;
