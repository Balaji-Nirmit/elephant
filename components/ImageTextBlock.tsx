'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, ArrowLeftRight, ZoomIn, Trash2, Upload } from "lucide-react";

// --- Internal Auto-Sizing Component ---
interface AutoResizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

const AutoResizeTextarea = ({ value, className, ...props }: AutoResizeProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const node = textareaRef.current;
        if (node) {
            node.style.height = "auto";
            node.style.height = `${node.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            value={value}
            rows={1}
            spellCheck={false}
            className={`w-full bg-transparent outline-none resize-none overflow-hidden transition-all ${className}`}
        />
    );
};

// --- Main ImageTextBlock Component ---
interface ImageTextBlockProps {
    imageUrl: string;
    title: string;
    description: string;
    layout: "imageLeft" | "imageRight";
    onUpdate: (updates: {
        imageTextUrl?: string;
        imageTextTitle?: string;
        imageTextDescription?: string;
        imageTextLayout?: "imageLeft" | "imageRight";
    }) => void;
    onOpenLightbox?: (images: { url: string }[], index: number) => void;
}

const ImageTextBlock = ({
    imageUrl,
    title,
    description,
    layout,
    onUpdate,
    onOpenLightbox
}: ImageTextBlockProps) => {
    const [hoverCard, setHoverCard] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLeft = layout === "imageLeft";

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const text = e.dataTransfer.getData("text");
        if (text) onUpdate({ imageTextUrl: text });
    };

    return (
        <div className="py-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden bg-card border border-border/20 shadow-sm transition-shadow duration-500"
                onMouseEnter={() => setHoverCard(true)}
                onMouseLeave={() => setHoverCard(false)}
            >
                <div className={`flex flex-col sm:flex-row ${!isLeft ? "sm:flex-row-reverse" : ""} min-h-55`}>

                    {/* IMAGE SECTION - Matches standalone image block design */}
                    <div
                        className="sm:w-[45%] relative overflow-hidden bg-muted/30"
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {imageUrl ? (
                            <div className="relative group/image h-full w-full">
                                <img
                                    src={imageUrl}
                                    alt="Embedded"
                                    className="w-full h-full object-cover min-h-55 cursor-pointer"
                                    onClick={() => onOpenLightbox?.([{ url: imageUrl }], 0)}
                                />
                                {/* Overlay matches standalone block: bg-black/50, group-hover opacity */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                    <div className="flex gap-2 pointer-events-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenLightbox?.([{ url: imageUrl }], 0);
                                            }}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            <ZoomIn className="w-4 h-4 text-white" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdate({ imageTextUrl: "" });
                                            }}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`flex flex-col items-center justify-center h-full min-h-55 p-8 transition-colors duration-300 cursor-pointer ${isDragging ? "bg-primary/10 border-2 border-dashed border-primary/40" : "hover:bg-muted/50"
                                    }`}
                                onClick={() => fileInputRef.current?.focus()}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                                    {isDragging ? <Upload className="w-7 h-7 text-primary" /> : <ImagePlus className="w-7 h-7 text-muted-foreground/40" />}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="text"
                                    placeholder="Paste image URL and press Enter..."
                                    className="text-xs text-center bg-muted/40 rounded-lg px-4 py-2 outline-none text-muted-foreground placeholder:text-muted-foreground/30 w-full max-w-55 focus:ring-2 ring-primary/20"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            onUpdate({ imageTextUrl: (e.target as HTMLInputElement).value });
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* TEXT CONTENT SECTION */}
                    <div className="sm:w-[55%] p-8 flex flex-col justify-center relative">
                        {/* Minimal Accent Line */}
                        <div className={`absolute top-8 ${isLeft ? "left-8" : "right-8"} w-10 h-1 rounded-full bg-primary/20`} />

                        <AutoResizeTextarea
                            value={title}
                            onChange={(e) => onUpdate({ imageTextTitle: e.target.value })}
                            className="text-2xl font-bold text-foreground tracking-tight placeholder:text-muted-foreground/25 mb-3 mt-4"
                            placeholder="Add a title…"
                        />

                        <AutoResizeTextarea
                            value={description}
                            onChange={(e) => onUpdate({ imageTextDescription: e.target.value })}
                            className="text-[15px] text-muted-foreground leading-relaxed placeholder:text-muted-foreground/20"
                            placeholder="Write your content here…"
                        />
                    </div>
                </div>

                {/* LAYOUT TOGGLE - Positioned relative to the whole card */}
                <AnimatePresence>
                    {hoverCard && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-3 right-3"
                        >
                            <button
                                onClick={() => onUpdate({ imageTextLayout: isLeft ? "imageRight" : "imageLeft" })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/40 text-muted-foreground hover:text-foreground transition-all shadow-md text-xs font-medium"
                            >
                                <ArrowLeftRight className="w-3 h-3" />
                                Swap
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ImageTextBlock;