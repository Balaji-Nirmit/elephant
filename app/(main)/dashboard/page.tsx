'use client'
import { motion } from "framer-motion";
import { StickyNote, Clock, FolderOpen, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/contexts/NotesContext";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { NoteIndex } from "@/lib/types"; // Import your type

const Dashboard = () => {
  const router = useRouter();
  // Changed: createNote -> createNoteIndex, searchNotes -> searchNoteIndexes
  // Removed: getNoteById (as it's heavy and context doesn't hold blocks)
  const { 
    isInitialized, 
    noteIndexes, 
    folders, 
    getRecentNoteIndexes, 
    createNoteIndex 
  } = useNotesContext();
  
  const recentNoteIndexes = getRecentNoteIndexes ? getRecentNoteIndexes(6) : [];

  const stats = [
    { label: "Total Notes", value: noteIndexes.length, icon: StickyNote, color: "primary" },
    { label: "Folders", value: folders.length, icon: FolderOpen, color: "accent" },
  ];

  const handleQuickNote = () => {
    // Changed: createNoteIndex returns just the ID now
    const noteId = createNoteIndex();
    router.push(`/note/ideas/${noteId}`);
  };

  if (!isInitialized) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto p-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your notes
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10`}>
                <stat.icon className={`w-5 h-5 text-primary`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}

          {/* Quick Action Button */}
          <motion.button
            onClick={handleQuickNote}
            className="bg-primary/10 hover:bg-primary/20 rounded-xl p-4 border border-primary/20 flex flex-col items-center justify-center gap-2 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">Quick Note</p>
          </motion.button>

          <Link href="/note/ideas">
            <motion.div
              className="bg-card hover:bg-muted rounded-xl p-4 border border-border flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer h-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All Notes</p>
            </motion.div>
          </Link>
        </div>

        {/* Recent Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Notes
            </h2>
            <Link href="/note/ideas" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>

          {recentNoteIndexes.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No notes yet</p>
              <motion.button
                onClick={handleQuickNote}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create your first note
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNoteIndexes.map((noteIndex: NoteIndex, index: number) => {
                // Note: We don't fetch full blocks here to maintain "Atomic" performance.
                // Dashboard only shows metadata.
                return (
                  <Link key={noteIndex.id} href={`/note/ideas/${noteIndex.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all h-full"
                    >
                      <h3 className="font-medium text-foreground truncate mb-2">
                        {noteIndex.title || "Untitled"}
                      </h3>
                      
                      {/* Substituted preview for a "Metadata only" view */}
                      <p className="text-xs text-muted-foreground mb-3">
                        Last edited {formatDistanceToNow(new Date(noteIndex.updatedAt), { addSuffix: true })}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {noteIndex.tags?.slice(0, 2).map((tag: any) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;