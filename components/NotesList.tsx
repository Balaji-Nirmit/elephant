"use client";
import { motion } from "framer-motion";
import { Trash2, Search, Paperclip } from "lucide-react";

export interface Note {
  id: string;
  title: string;
  preview: string;
  time: string;
  hasAttachment?: boolean;
}

interface NotesListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

const NotesList = ({ notes, activeNoteId, onSelectNote, onDeleteNote }: NotesListProps) => {
  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
              Remore
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">All Ideas</h2>
          <div className="flex items-center gap-2">
            <motion.button 
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button 
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectNote(note.id)}
            className={`note-item p-4 border-b border-border cursor-pointer ${
              activeNoteId === note.id ? 'active' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate mb-1">
                  {note.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {note.preview}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {note.time}
                </span>
                {note.hasAttachment && (
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add New Ideas Button */}
      <div className="p-4 border-t border-border">
        <motion.button
          className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">+</span>
          <span className="font-medium">Add New Ideas</span>
        </motion.button>
      </div>
    </div>
  );
};

export default NotesList;