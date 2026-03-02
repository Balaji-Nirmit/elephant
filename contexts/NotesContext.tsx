import { useNotes } from "@/hooks/useNotes";
import { Folder, Note, NoteBlock, NoteIndex, FlashcardItem } from "@/lib/types";
import { createContext, useContext, ReactNode } from "react";

interface NotesContextType {
  isInitialized: boolean;
  noteIndexes: NoteIndex[];
  noteBlocks: Record<string, NoteBlock[]>;
  folders: Folder[];
  createNote: (folderId?: string | null) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  getRecentNoteIndexes: (limit?: number) => NoteIndex[];
  getNoteIndexesForFolder: (folderId: string | null) => NoteIndex[];
  searchNotes: (query: string) => NoteIndex[];
  getNoteById: (id: string) => Note | undefined;
  getBlocksForNote: (noteId: string) => NoteBlock[];
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

export type { Note, Folder, NoteBlock, FlashcardItem, NoteIndex };
