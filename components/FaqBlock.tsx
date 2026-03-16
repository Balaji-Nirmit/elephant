'use client'
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, X, HelpCircle, MessageCircle } from "lucide-react";

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

interface FaqBlockProps {
    items: FaqItem[];
    onUpdate: (items: FaqItem[]) => void;
}

// Helper component for auto-expanding textareas
const AutoSizeTextarea = ({
    value,
    onChange,
    placeholder,
    className
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    className: string;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${className} resize-none overflow-hidden`}
            placeholder={placeholder}
            rows={1}
        />
    );
};

const FaqBlock = ({ items, onUpdate }: FaqBlockProps) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addItem = () => {
        const newItem: FaqItem = { id: crypto.randomUUID(), question: "", answer: "" };
        onUpdate([...items, newItem]);
        setExpandedIds(prev => new Set(prev).add(newItem.id));
    };

    const removeItem = (id: string) => {
        if (items.length <= 1) return;
        onUpdate(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, updates: Partial<FaqItem>) => {
        onUpdate(items.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const expandAll = () => setExpandedIds(new Set(items.map(i => i.id)));
    const collapseAll = () => setExpandedIds(new Set());

    return (
        <div className="py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">FAQ</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={expandAll} className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground px-1.5 py-0.5 rounded transition-colors">
                        Expand all
                    </button>
                    <span className="text-muted-foreground/20">·</span>
                    <button onClick={collapseAll} className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground px-1.5 py-0.5 rounded transition-colors">
                        Collapse all
                    </button>
                </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-2">
                {/* Fix: Added mode="popLayout" and initial={false} to prevent mount-jitter */}
                <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item, index) => {
                        const isExpanded = expandedIds.has(item.id);
                        return (
                            <motion.div
                                key={item.id}
                                layout // Fix: Allows items to slide smoothly when others are removed
                                className="rounded-xl border border-border/60 overflow-hidden bg-card/50 hover:border-border transition-colors"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }} // Changed from height: 0 to scale for stability
                                transition={{ duration: 0.2 }}
                            >
                                {/* Question */}
                                <div
                                    className="flex items-center gap-3 p-3 cursor-pointer group"
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                                    </motion.div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <MessageCircle className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
                                        <AutoSizeTextarea
                                            value={item.question}
                                            onChange={(val) => updateItem(item.id, { question: val })}
                                            placeholder="Question..."
                                            className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/40 p-0 leading-relaxed"
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Answer */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-3 pl-10">
                                                <AutoSizeTextarea
                                                    value={item.answer}
                                                    onChange={(val) => updateItem(item.id, { answer: val })}
                                                    placeholder="Answer..."
                                                    className="w-full bg-muted/30 rounded-lg border-none outline-none text-sm text-muted-foreground p-2.5 leading-relaxed placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Add item */}
            <motion.button
                onClick={addItem}
                className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors px-3 py-2"
                whileHover={{ x: 4 }}
            >
                <Plus className="w-3.5 h-3.5" />
                Add question
            </motion.button>
        </div>
    );
};

export default FaqBlock;