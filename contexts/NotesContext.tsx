import { createContext, useContext, ReactNode } from "react";
import { useNotes, Note, Folder, NoteBlock, FlashcardItem } from "@/hooks/useNotes";

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  createNote: (folderId?: string | null) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  getNotesForFolder: (folderId: string | null) => Note[];
  getRecentNotes: (limit?: number) => Note[];
  searchNotes: (query: string) => Note[];
}

const NotesContext = createContext<NotesContextType | null>(null);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const notesHook = useNotes();

  return (
    <NotesContext.Provider value={notesHook}>{children}</NotesContext.Provider>
  );
};

export const useNotesContext = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within a NotesProvider");
  }
  return context;
};

export type { Note, Folder, NoteBlock, FlashcardItem };