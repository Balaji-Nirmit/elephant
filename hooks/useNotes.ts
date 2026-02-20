import { useState, useEffect, useCallback } from "react";

export interface FlashcardItem {
  id: string;
  content: string;
  color: string;
}

export interface NoteBlock {
  id: string;
  type: 
    | "text" | "heading1" | "heading2" | "heading3" 
    | "bullet" | "numbered" | "todo" | "quote" | "divider" 
    | "code" | "callout" | "table" | "toggle" 
    | "image" | "bookmark" | "equation" | "progress" | "video" | "columns"
    // New block types
    | "file" | "audio" | "timeline" | "kanban" | "rating" | "countdown" | "embed" | "database" | "mindmap" | "gallery"
    // Flashcard block type
    | "flashcard"
    // Chart block type
    | "chart";
  content: string;
  checked?: boolean;
  tableData?: string[][];
  cellFormattingMap?: Record<string, { bold?: boolean; italic?: boolean; color?: string; bgColor?: string }>;
  isExpanded?: boolean; // for toggle blocks
  toggleContent?: string; // editable content inside toggle
  imageUrl?: string; // for image blocks
  bookmarkUrl?: string; // for bookmark blocks
  bookmarkTitle?: string;
  bookmarkDescription?: string;
  progressValue?: number; // for progress blocks (0-100)
  progressColor?: string;
  videoUrl?: string; // for video embeds
  columns?: NoteBlock[][]; // for column layout
  columnTitles?: string[]; // editable column headings
  // New properties
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  audioUrl?: string;
  timelineItems?: { id: string; title: string; description: string; date: string; color: string }[];
  kanbanColumns?: { id: string; title: string; cards: { id: string; content: string }[] }[];
  ratingValue?: number;
  ratingMax?: number;
  countdownDate?: string;
  countdownTitle?: string;
  embedUrl?: string;
  embedType?: "spotify" | "twitter" | "figma" | "codepen" | "generic";
  databaseRows?: { id: string; cells: { [key: string]: string } }[];
  databaseColumns?: { id: string; name: string; type: "text" | "number" | "select" | "date" | "checkbox" }[];
  mermaidCode?: string;
  galleryImages?: { id: string; url: string; caption?: string }[];
  // Mind map data
  mindMapNodes?: { 
    id: string; 
    text: string; 
    x: number; 
    y: number; 
    color: string; 
    shape?: 'rectangle' | 'diamond' | 'oval';
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }[];
  mindMapConnections?: { id: string; from: string; to: string }[];
  // Flashcard data
  flashcards?: FlashcardItem[];
  // Chart data
  chartType?: "bar" | "line" | "pie" | "area" | "donut" | "scatter" | "radar" | "stackedBar" | "horizontalBar" | "combo";
  chartTitle?: string;
  chartColumns?: { id: string; key: string; type: "text" | "number" }[];
  chartRows?: { id: string; cells: { [key: string]: string | number } }[];
  chartXAxisKey?: string;
  chartSelectedSeries?: string[];
  chartSeriesColors?: { [key: string]: string };
  linkedTableId?: string; // For charts linked to table data
  indentLevel?: number; // For nested lists (0-3)
  // Legacy support
  chartData?: { id: string; label: string; value: number; color: string }[];
}

export interface Note {
  id: string;
  title: string;
  blocks: NoteBlock[];
  tags: { id: string; label: string; color: string }[];
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

const NOTES_KEY = "elephant-notes";
const FOLDERS_KEY = "elephant-folders";

const getStoredNotes = (): Note[] => {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getStoredFolders = (): Folder[] => {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>(getStoredNotes);
  const [folders, setFolders] = useState<Folder[]>(getStoredFolders);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }, [folders]);

  const createNote = useCallback((folderId: string | null = null): Note => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      blocks: [{ id: crypto.randomUUID(), type: "text", content: "" }],
      tags: [],
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const createFolder = useCallback((name: string): Folder => {
    const colors = ["green", "blue", "purple", "orange", "pink"];
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    setNotes((prev) =>
      prev.map((note) =>
        note.folderId === id ? { ...note, folderId: null } : note
      )
    );
  }, []);

  const getNotesForFolder = useCallback(
    (folderId: string | null) => {
      return notes.filter((note) => note.folderId === folderId);
    },
    [notes]
  );

  const getRecentNotes = useCallback(
    (limit = 5) => {
      return [...notes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    },
    [notes]
  );

  const searchNotes = useCallback(
    (query: string) => {
      const lower = query.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lower) ||
          note.blocks.some((block) => block.content.toLowerCase().includes(lower))
      );
    },
    [notes]
  );

  return {
    notes,
    folders,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    deleteFolder,
    getNotesForFolder,
    getRecentNotes,
    searchNotes,
  };
};
