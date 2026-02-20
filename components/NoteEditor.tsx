"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Bold, 
  Underline, 
  AlignLeft, 
  AlignCenter,
  AlignJustify,
  List,
  ListOrdered,
  Upload,
  X,
  FileText,
  Image,
  Video
} from "lucide-react";

interface Tag {
  id: string;
  label: string;
  color: string;
}

interface AttachedFile {
  id: string;
  name: string;
  type: "document" | "image";
}

interface NoteEditorProps {
  title: string;
  content: string;
  tags: Tag[];
  files: AttachedFile[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onRemoveTag: (id: string) => void;
  onAddTag: () => void;
  onUploadClick: () => void;
}

const NoteEditor = ({
  title,
  content,
  tags,
  files,
  onTitleChange,
  onContentChange,
  onRemoveTag,
  onAddTag,
  onUploadClick
}: NoteEditorProps) => {
  const [font] = useState("Rubik");
  const [fontSize] = useState(24);

  const toolbarButtons = [
    { icon: Bold, label: "Bold" },
    { icon: Underline, label: "Underline" },
    { type: "divider" },
    { icon: AlignLeft, label: "Align Left" },
    { icon: AlignCenter, label: "Align Center" },
    { icon: AlignJustify, label: "Justify" },
    { type: "divider" },
    { icon: List, label: "Bullet List" },
    { icon: ListOrdered, label: "Numbered List" },
  ];

  return (
    <div className="flex-1 h-full bg-card flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2 bg-card">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm">
          <span className="text-muted-foreground">{font}</span>
          <span className="text-muted-foreground">▾</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm">
          <span className="text-muted-foreground">{fontSize}</span>
          <span className="text-muted-foreground">▾</span>
        </div>
        
        <div className="h-6 w-px bg-border mx-2" />

        {toolbarButtons.map((btn, index) => 
          btn.type === "divider" ? (
            <div key={index} className="h-6 w-px bg-border mx-1" />
          ) : (
            <motion.button
              key={index}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={btn.label}
            >
              {btn.icon && <btn.icon className="w-4 h-4 text-muted-foreground" />}
            </motion.button>
          )
        )}

        <div className="ml-auto">
          <motion.button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full text-3xl font-semibold text-foreground bg-transparent border-none outline-none mb-4 placeholder:text-muted-foreground"
          placeholder="Untitled Note"
        />

        {/* Tags */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tags.map((tag) => (
            <motion.span
              key={tag.id}
              className={`tag-badge ${
                tag.color === 'green' 
                  ? 'bg-primary/10 text-primary border-primary/20' 
                  : 'bg-muted text-muted-foreground border-border'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {tag.label}
              <button 
                onClick={() => onRemoveTag(tag.id)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
          <motion.button
            onClick={onAddTag}
            className="tag-badge bg-transparent border-dashed hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add
          </motion.button>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full min-h-75 text-foreground bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-muted-foreground"
          placeholder="Start writing your note..."
        />

        {/* Attached Files */}
        {files.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-3 flex-wrap">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  className="file-item"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{file.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="p-6 pt-0">
        <motion.div
          onClick={onUploadClick}
          className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <Image className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="p-2 rounded-lg bg-muted">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Photo documents and audio</p>
          <p className="text-sm text-primary font-medium underline underline-offset-2">
            Click or drag to upload
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NoteEditor;