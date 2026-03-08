'use client'
import { motion } from "framer-motion";
import { GitBranch, LayoutGrid, GripVertical, Plus, MoreHorizontal, CheckCircle2, Circle, Clock } from "lucide-react";

const mindMapNodes = [
    { label: "Project Hub", x: "42%", y: "10%", color: "bg-[hsl(var(--green-badge))] text-white", size: "large" },
    { label: "Research", x: "10%", y: "32%", color: "bg-accent/40 text-accent-foreground", size: "med" },
    { label: "Design", x: "70%", y: "25%", color: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-badge))]", size: "med" },
    { label: "User Interviews", x: "2%", y: "55%", color: "bg-[hsl(var(--peach-bg))] text-foreground", size: "small" },
    { label: "Competitor Analysis", x: "18%", y: "60%", color: "bg-[hsl(var(--yellow-light))] text-accent-foreground", size: "small" },
    { label: "Wireframes", x: "60%", y: "48%", color: "bg-[hsl(var(--lavender-bg))] text-foreground", size: "small" },
    { label: "Prototypes", x: "80%", y: "50%", color: "bg-[hsl(var(--mint-bg))] text-[hsl(var(--green-badge))]", size: "small" },
    { label: "Development", x: "38%", y: "70%", color: "bg-[hsl(var(--green-badge))]/20 text-[hsl(var(--green-badge))]", size: "med" },
    { label: "Frontend", x: "22%", y: "85%", color: "bg-accent/25 text-accent-foreground", size: "small" },
    { label: "Backend", x: "55%", y: "85%", color: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-badge))]", size: "small" },
];

const connections = [
    { from: [52, 18], to: [22, 34] }, { from: [52, 18], to: [78, 28] },
    { from: [22, 34], to: [12, 56] }, { from: [22, 34], to: [30, 62] },
    { from: [78, 28], to: [68, 50] }, { from: [78, 28], to: [88, 52] },
    { from: [52, 18], to: [48, 72] }, { from: [48, 72], to: [30, 87] }, { from: [48, 72], to: [63, 87] },
];

const kanbanColumns = [
    { title: "To Do", color: "bg-accent/20", items: [{ text: "Design system tokens", tag: "Design", tagColor: "bg-accent/30" }, { text: "API documentation", tag: "Backend", tagColor: "bg-[hsl(var(--green-badge))]/15" }] },
    { title: "In Progress", color: "bg-[hsl(var(--green-badge))]/10", items: [{ text: "Auth flow", tag: "Frontend", tagColor: "bg-[hsl(var(--peach-bg))]" }, { text: "Database schema", tag: "Backend", tagColor: "bg-[hsl(var(--green-badge))]/15" }] },
    { title: "Done", color: "bg-[hsl(var(--green-light))]", items: [{ text: "Landing page", tag: "Design", tagColor: "bg-accent/30" }] },
];

const MindMapKanbanMockup = () => (
    <div className="w-full space-y-3 sm:space-y-4">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-3 shadow-xl sm:p-4" style={{ height: 180 }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3 text-[hsl(var(--green-badge))] sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] font-semibold text-foreground sm:text-[11px]">Mind Map</span>
                </div>
                <div className="flex items-center gap-1"><Plus className="h-3 w-3 text-muted-foreground" /><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></div>
            </div>
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                {connections.map((conn, i) => (
                    <motion.line key={i} x1={`${conn.from[0]}%`} y1={`${conn.from[1]}%`} x2={`${conn.to[0]}%`} y2={`${conn.to[1]}%`} stroke="hsl(var(--green-badge))" strokeWidth="1.5" opacity="0.15" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }} />
                ))}
            </svg>
            {mindMapNodes.map((node, i) => (
                <motion.div key={node.label} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 200 }} whileHover={{ scale: 1.12, zIndex: 10 }}
                    className={`absolute rounded-lg px-1.5 py-0.5 text-[7px] font-medium sm:px-2 sm:py-1 sm:text-[8px] ${node.color} cursor-pointer shadow-sm transition-shadow hover:shadow-md ${node.size === "large" ? "text-[8px] px-2 py-1 sm:text-[10px] sm:px-3 sm:py-1.5" : ""}`}
                    style={{ left: node.x, top: node.y }}>{node.label}</motion.div>
            ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="overflow-hidden rounded-2xl border border-border/50 bg-card p-3 shadow-xl sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3 text-accent-foreground sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] font-semibold text-foreground sm:text-[11px]">Kanban Board</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {kanbanColumns.map((col, ci) => (
                    <motion.div key={col.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + ci * 0.1 }} className={`rounded-xl ${col.color} p-1.5 sm:p-2`}>
                        <p className="text-[8px] font-semibold text-foreground mb-1.5 flex items-center gap-0.5 sm:text-[10px] sm:mb-2 sm:gap-1">
                            {col.title === "Done" ? <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--green-badge))] sm:h-3 sm:w-3" /> : col.title === "In Progress" ? <Clock className="h-2.5 w-2.5 text-accent-foreground sm:h-3 sm:w-3" /> : <Circle className="h-2.5 w-2.5 text-muted-foreground sm:h-3 sm:w-3" />}
                            <span className="truncate">{col.title}</span>
                            <span className="ml-auto text-[7px] text-muted-foreground sm:text-[9px]">{col.items.length}</span>
                        </p>
                        <div className="space-y-1 sm:space-y-1.5">
                            {col.items.map((item) => (
                                <motion.div key={item.text} whileHover={{ scale: 1.03, y: -1 }} className="rounded-lg bg-card p-1.5 shadow-sm border border-border/30 cursor-pointer transition-shadow hover:shadow-md sm:p-2">
                                    <div className="flex items-start gap-0.5 sm:gap-1">
                                        <GripVertical className="h-2.5 w-2.5 text-muted-foreground/30 mt-0.5 shrink-0 sm:h-3 sm:w-3" />
                                        <div className="min-w-0">
                                            <p className="text-[7px] font-medium text-foreground truncate sm:text-[9px]">{item.text}</p>
                                            <span className={`mt-0.5 inline-block rounded-full ${item.tagColor} px-1 py-0.5 text-[6px] font-medium sm:px-1.5 sm:text-[7px]`}>{item.tag}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    </div>
);

export default MindMapKanbanMockup;
