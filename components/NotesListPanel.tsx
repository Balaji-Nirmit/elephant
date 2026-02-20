"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Search, Paperclip, Plus, X } from "lucide-react";
import { Note } from "@/contexts/NotesContext";
import { formatDistanceToNow } from "date-fns";

interface NotesListPanelProps {
  title: string;
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  showSearch?: boolean;
}

const NotesListPanel = ({
  title,
  notes,
  activeNoteId,
  onSelectNote,
  onDeleteNote,
  onCreateNote,
  showSearch = true,
}: NotesListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredNotes = searchQuery
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.blocks.some((b) =>
            b.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : notes;

  const getPreview = (note: Note) => {
    const textBlock = note.blocks.find((b) => b.content);
    return textBlock?.content.slice(0, 50) || "No content";
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: false })
        .replace("about ", "")
        .replace("less than a minute", "now");
    } catch {
      return "recently";
    }
  };

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            {showSearch && (
              <motion.button
                onClick={() => setIsSearching(!isSearching)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSearching ? (
                  <X className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Search className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
            />
          </motion.div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchQuery ? "No notes found" : "No notes yet"}
          </div>
        ) : (
          filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectNote(note.id)}
              className={`note-item p-4 border-b border-border cursor-pointer group ${
                activeNoteId === note.id ? "active" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {note.title || "Untitled"}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {getPreview(note)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(note.updatedAt)}
                  </span>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add New Note Button */}
      <div className="p-4 border-t border-border">
        <motion.button
          onClick={onCreateNote}
          className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Note</span>
        </motion.button>
      </div>
    </div>
  );
};

export default NotesListPanel;