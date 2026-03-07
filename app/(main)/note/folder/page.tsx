'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Trash2, FolderOpen, StickyNote, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotesContext } from "@/contexts/NotesContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NoteIndex } from "@/lib/types";

const FolderPage = () => {

  const router = useRouter();

  const {
    isInitialized,
    folders,
    createFolder,
    deleteFolder,
    createNoteIndex,
    getNoteIndexesForFolder
  } = useNotesContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const folderNotes = selectedFolderId ? getNoteIndexesForFolder(selectedFolderId) : [];

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowCreateModal(false);
  };

  const getFolderColor = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-primary/10 text-primary",
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
      pink: "bg-pink-100 text-pink-600",
    };
    return colors[color] || colors.green;
  };

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading folders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        {selectedFolder && (
          <button
            onClick={() => setSelectedFolderId(null)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">
          {selectedFolder ? selectedFolder.name : "Folders"}
        </h1>
      </div>
      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* FOLDER LIST */}
        {!selectedFolder && (
          <div className="space-y-2">
            {folders.length === 0 && (
              <div className="text-center py-16">
                <Folder className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No folders yet</p>
              </div>
            )}
            {folders.map((folder, index) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFolderId(folder.id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFolderColor(folder.color)}`}>
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getNoteIndexesForFolder(folder.id).length} notes
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </motion.div>
            ))}
            {/* CREATE FOLDER BUTTON */}
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" />
              New Folder
            </motion.button>
          </div>
        )}
        {/* FOLDER NOTES */}
        {selectedFolder && (
          <div>
            {folderNotes.length === 0 ? (
              <div className="text-center py-16">
                <StickyNote className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No notes in this folder
                </p>
                <button
                  onClick={() => {
                    const noteId = createNoteIndex(selectedFolder.id);
                    router.push(`/note/ideas/${noteId}`);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  Create Note
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {folderNotes.map((note: NoteIndex, index: number) => (
                  <Link key={note.id} href={`/note/ideas/${note.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <h3 className="font-medium truncate">
                        {note.title || "Untitled"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Modified {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  </Link>
                ))}
                <motion.button
                  onClick={() => {
                    const noteId = createNoteIndex(selectedFolder.id);
                    router.push(`/note/ideas/${noteId}`);
                  }}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* CREATE FOLDER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6 z-50"
            >
              <h3 className="text-lg font-semibold mb-4">
                Create Folder
              </h3>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FolderPage;