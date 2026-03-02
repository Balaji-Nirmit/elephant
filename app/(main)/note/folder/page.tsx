'use client';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Trash2, FolderOpen, StickyNote, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotesContext } from "@/contexts/NotesContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

const FolderPage = () => {
  const router = useRouter();
  const { isInitialized, folders, noteIndexes, createFolder, deleteFolder, createNote, getNoteIndexesForFolder, getNoteById } = useNotesContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowCreateModal(false);
    }
  };

  const getNotesInFolder = (folderId: string) => {
    return getNoteIndexesForFolder(folderId);
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

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const folderNotes = selectedFolderId ? getNotesInFolder(selectedFolderId) : [];

  if (!isInitialized) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading folders...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-background overflow-hidden flex">
      {/* Folders List */}
      <div className="w-80 h-full bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SidebarTrigger className="-ml-1"/>
            <h2 className="text-xl font-semibold text-foreground">Folders</h2>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {folders.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No folders yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer group transition-colors ${selectedFolderId === folder.id
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-muted"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFolderColor(folder.color)}`}>
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getNotesInFolder(folder.id).length} notes
                    </p>
                  </div>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.id);
                      if (selectedFolderId === folder.id) setSelectedFolderId(null);
                    }}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create Folder Button */}
        <div className="p-4 border-t border-border">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Folder</span>
          </motion.button>
        </div>
      </div>

      {/* Folder Contents */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
        {selectedFolder ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getFolderColor(selectedFolder.color)}`}>
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{selectedFolder.name}</h1>
                <p className="text-muted-foreground">{folderNotes.length} notes</p>
              </div>
            </div>

            {folderNotes.length === 0 ? (
              <div className="text-center py-16">
                <StickyNote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No notes in this folder</p>
                <motion.button
                  onClick={() => {
                    const note = createNote(selectedFolder?.id || null);
                    router.push(`/note/ideas/${note.id}`);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create note in this folder
                </motion.button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Notes</h3>
                  <motion.button
                    onClick={() => {
                      const note = createNote(selectedFolder?.id || null);
                      router.push(`/note/ideas/${note.id}`);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-4 h-4" />
                    New Note
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folderNotes.map((noteIndex, index) => {
                    const fullNote = getNoteById(noteIndex.id);
                    return (
                      <Link key={noteIndex.id} href={`/note/ideas/${noteIndex.id}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                        >
                          <h3 className="font-medium text-foreground truncate mb-2">
                            {noteIndex.title || "Untitled"}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {fullNote?.blocks.find((b) => b.content)?.content || "No content"}
                          </p>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Select a folder</h2>
              <p className="text-muted-foreground">
                Choose a folder from the list to view its contents
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card rounded-2xl shadow-xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Folder</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Folder name"
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border outline-none focus:border-primary mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCreateFolder}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FolderPage;
