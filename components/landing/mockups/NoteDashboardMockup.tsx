'use client'
import { motion } from "framer-motion";
import { FileText, Folder, Search, Bold, Italic, Underline, List, CheckSquare, Image, Code, MoreHorizontal, ChevronRight, Hash, Star, Clock } from "lucide-react";

const sidebarItems = [
    { icon: Folder, label: "Folders", active: true },
    { icon: FileText, label: "Documents", active: false },
    { icon: Star, label: "Favorites", active: false },
    { icon: Clock, label: "Recent", active: false },
    { icon: Hash, label: "Tags", active: false },
];

const NoteDashboardMockup = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 bg-secondary/50 px-3 py-2 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/60 sm:h-3 sm:w-3" />
                    <div className="h-2.5 w-2.5 rounded-full bg-accent/70 sm:h-3 sm:w-3" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--green-badge))]/60 sm:h-3 sm:w-3" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background/80 px-2 py-1 sm:px-3">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground sm:text-[11px]">Search notes...</span>
                </div>
                <div className="h-5 w-5 rounded-full bg-[hsl(var(--green-badge))]/20 flex items-center justify-center sm:h-6 sm:w-6">
                    <span className="text-[8px] font-bold text-[hsl(var(--green-badge))] sm:text-[9px]">JD</span>
                </div>
            </div>

            <div className="flex" style={{ minHeight: 200 }}>
                <div className="hidden md:block w-44 shrink-0 border-r border-border/30 bg-secondary/30 p-3">
                    <div className="space-y-1">
                        {sidebarItems.map((item, i) => (
                            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} whileHover={{ x: 2 }}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer transition-all duration-200 ${item.active ? "bg-[hsl(var(--green-badge))]/10 text-[hsl(var(--green-badge))] font-medium" : "text-muted-foreground hover:bg-secondary"}`}>
                                <item.icon className="h-3.5 w-3.5" />{item.label}
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-4 border-t border-border/30 pt-3">
                        <p className="px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-2">Pages</p>
                        {["Meeting Notes", "Product Roadmap", "Design System"].map((page, i) => (
                            <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }} whileHover={{ x: 2 }}
                                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary cursor-pointer transition-all">
                                <ChevronRight className="h-3 w-3" />{page}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 p-3 sm:p-5 overflow-hidden">
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-3 flex items-center gap-0.5 border-b border-border/30 pb-2 sm:mb-4 sm:gap-1 sm:pb-3">
                        {[Bold, Italic, Underline, List, CheckSquare, Image, Code].map((Icon, i) => (
                            <motion.button key={i} whileHover={{ scale: 1.15, backgroundColor: "hsl(var(--green-light))" }} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors sm:p-1.5">
                                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </motion.button>
                        ))}
                        <div className="ml-auto"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <h2 className="text-base font-bold text-foreground sm:text-xl">Weekly Sprint Planning</h2>
                        <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">Last edited · Mar 8, 2026</p>
                        <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }} className="rounded-lg bg-[hsl(var(--green-light))]/50 p-2 sm:p-2.5" style={{ borderLeftWidth: 3, borderLeftColor: "hsl(var(--green-badge))" }}>
                                <p className="text-[10px] font-medium text-foreground sm:text-[11px]">✅ Design review completed</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 sm:text-[10px]">All components approved by team</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 }} className="rounded-lg bg-[hsl(var(--yellow-light))]/50 p-2 sm:p-2.5" style={{ borderLeftWidth: 3, borderLeftColor: "hsl(var(--accent))" }}>
                                <p className="text-[10px] font-medium text-foreground sm:text-[11px]">🔄 API integration in progress</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 sm:text-[10px]">Estimated completion: Thursday</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 }} className="rounded-lg bg-[hsl(var(--peach-bg))]/50 p-2 sm:p-2.5" style={{ borderLeftWidth: 3, borderLeftColor: "hsl(var(--destructive) / 0.4)" }}>
                                <p className="text-[10px] font-medium text-foreground sm:text-[11px]">📋 User testing scheduled</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 sm:text-[10px]">5 participants confirmed for Friday</p>
                            </motion.div>
                        </div>
                        <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="mt-3 h-4 w-0.5 bg-[hsl(var(--green-badge))] rounded-full" />
                    </motion.div>
                </div>

                <div className="hidden lg:block w-48 shrink-0 border-l border-border/30 bg-secondary/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">Mind Map</p>
                    <div className="relative h-full">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }} className="absolute left-1/2 top-8 -translate-x-1/2 rounded-lg bg-[hsl(var(--green-badge))] px-2.5 py-1 text-[9px] font-medium text-white shadow-sm">Sprint</motion.div>
                        {[
                            { label: "Design", x: 4, y: 60, color: "bg-accent/30 text-accent-foreground", delay: 0.9 },
                            { label: "Backend", x: 90, y: 50, color: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-badge))]", delay: 1.0 },
                            { label: "Testing", x: 20, y: 110, color: "bg-[hsl(var(--peach-bg))] text-foreground", delay: 1.1 },
                            { label: "Deploy", x: 85, y: 105, color: "bg-[hsl(var(--yellow-light))] text-foreground", delay: 1.2 },
                        ].map((node) => (
                            <motion.div key={node.label} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: node.delay, type: "spring" }} whileHover={{ scale: 1.1 }}
                                className={`absolute rounded-md px-2 py-0.5 text-[8px] font-medium ${node.color} cursor-pointer transition-shadow hover:shadow-md`} style={{ left: node.x, top: node.y }}>
                                {node.label}
                            </motion.div>
                        ))}
                        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                            {[[76, 28, 32, 60], [76, 28, 105, 50], [76, 28, 42, 110], [76, 28, 102, 105]].map(([x1, y1, x2, y2], i) => (
                                <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--green-badge))" strokeWidth="1" opacity="0.2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }} />
                            ))}
                        </svg>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NoteDashboardMockup;
