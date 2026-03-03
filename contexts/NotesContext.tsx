'use client';
import { createContext, useContext, ReactNode } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NoteIndex, Folder } from "@/lib/types";

interface NotesContextType {
  isInitialized: boolean;
  noteIndexes: NoteIndex[];
  folders: Folder[];
  createNoteIndex: (folderId?: string | null) => string;
  updateNoteIndex: (id: string, updates: Partial<NoteIndex>) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => void;
  getRecentNoteIndexes: (limit?: number) => NoteIndex[];
  deleteFolder: (id: string) => void; 
  getNoteIndexesForFolder: (folderId: string | null) => NoteIndex[];
}

const NotesContext = createContext<NotesContextType | null>(null);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const notes = useNotes();
  return (
    <NotesContext.Provider value={notes}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotesContext = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotesContext must be used within NotesProvider");
  return context;
};