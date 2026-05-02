import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  Bold,
  Italic,
  Underline,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";

export type MobileBlockType =
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet"
  | "numbered"
  | "todo"
  | "quote"
  | "divider"
  | "code";

interface MobileEditorToolbarProps {
  /**
   * Convert the currently-focused block to one of the basic types.
   * Should be a no-op if no block is focused.
   */
  onConvertBlock: (type: MobileBlockType) => void;
  /** True when an editable surface in the note is focused. */
  isEditing: boolean;
}

const BASIC_BLOCKS: { type: MobileBlockType; icon: React.ElementType; label: string }[] = [
  { type: "text", icon: Type, label: "Text" },
  { type: "heading1", icon: Heading1, label: "H1" },
  { type: "heading2", icon: Heading2, label: "H2" },
  { type: "heading3", icon: Heading3, label: "H3" },
  { type: "bullet", icon: List, label: "Bullet" },
  { type: "numbered", icon: ListOrdered, label: "Numbered" },
  { type: "todo", icon: CheckSquare, label: "To-do" },
  { type: "quote", icon: Quote, label: "Quote" },
  { type: "code", icon: Code, label: "Code" },
  { type: "divider", icon: Minus, label: "Divider" },
];

/**
 * Fixed toolbar that anchors itself just above the on-screen keyboard
 * using the VisualViewport API. Provides the basic block-conversion + inline
 * formatting actions that replace the desktop "/" slash menu on touch devices.
 */
const MobileEditorToolbar = ({ onConvertBlock, isEditing }: MobileEditorToolbarProps) => {
  const [bottomOffset, setBottomOffset] = useState(0);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const lastScrollEl = useRef<Element | null>(null);

  /* ---- Track the visual viewport so the bar floats above the keyboard. ---- */
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;

    const updateOffset = () => {
      // Distance from the bottom of the layout viewport to the bottom of the visual viewport.
      // When the keyboard is up, this is the keyboard height.
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setBottomOffset(offset);
    };

    updateOffset();
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);
    return () => {
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
    };
  }, []);

  /* ---- Keep the focused editable in view above the toolbar + keyboard. ---- */
  useEffect(() => {
    if (!isEditing) return;

    const TOOLBAR_HEIGHT = 56;
    const PADDING = 12;

    const ensureVisible = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !(el as any).getBoundingClientRect) return;
      // Only act on editable surfaces.
      const editable =
        el.isContentEditable ||
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA";
      if (!editable) return;

      const rect = el.getBoundingClientRect();
      const vv = (window as any).visualViewport as VisualViewport | undefined;
      const viewportBottom = vv ? vv.height + vv.offsetTop : window.innerHeight;
      const safeBottom = viewportBottom - TOOLBAR_HEIGHT - PADDING;

      if (rect.bottom > safeBottom) {
        const delta = rect.bottom - safeBottom;
        // Find a scrollable ancestor and scroll it.
        let parent: HTMLElement | null = el.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          const overflowY = style.overflowY;
          if (
            (overflowY === "auto" || overflowY === "scroll") &&
            parent.scrollHeight > parent.clientHeight
          ) {
            parent.scrollBy({ top: delta, behavior: "smooth" });
            lastScrollEl.current = parent;
            return;
          }
          parent = parent.parentElement;
        }
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
    };

    // Run when focus changes, when the viewport (keyboard) resizes, and
    // periodically while typing (caret can move below the safe area).
    const onFocusIn = () => requestAnimationFrame(ensureVisible);
    const onSelectionChange = () => requestAnimationFrame(ensureVisible);
    const onResize = () => setTimeout(ensureVisible, 50);

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("selectionchange", onSelectionChange);
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    vv?.addEventListener("resize", onResize);

    // Initial pass.
    setTimeout(ensureVisible, 100);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("selectionchange", onSelectionChange);
      vv?.removeEventListener("resize", onResize);
    };
  }, [isEditing]);

  /* ---- Inline formatting (works on the live selection). ---- */
  const exec = useCallback((cmd: "bold" | "italic" | "underline") => {
    document.execCommand(cmd, false);
  }, []);

  const handleConvert = (type: MobileBlockType) => {
    onConvertBlock(type);
    setShowBlockSheet(false);
  };

  if (!isEditing && bottomOffset === 0) {
    // Nothing to show.
    return null;
  }

  return (
    <>
      {/* Bottom sheet of basic blocks (replaces ⌘+/ on touch). */}
      <AnimatePresence>
        {showBlockSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlockSheet(false)}
              onTouchStart={(e) => {
                // Prevent the keyboard from staying up if user taps backdrop.
                e.preventDefault();
                setShowBlockSheet(false);
              }}
              className="fixed inset-0 z-[9998] bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              style={{ bottom: bottomOffset }}
              className="fixed left-0 right-0 z-[9999] bg-card border-t border-border rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-sm font-semibold text-foreground">Insert block</span>
                <button
                  onClick={() => setShowBlockSheet(false)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 pb-5">
                {BASIC_BLOCKS.map((b) => (
                  <button
                    key={b.type}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleConvert(b.type)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-muted/40 hover:bg-muted active:scale-95 transition-all"
                  >
                    <b.icon className="w-5 h-5 text-foreground" />
                    <span className="text-[11px] text-muted-foreground">{b.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent toolbar pinned just above the keyboard. */}
      <motion.div
        initial={false}
        animate={{ y: 0 }}
        style={{ bottom: bottomOffset }}
        className="fixed left-0 right-0 z-[9997] bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
        // Prevent taps on the toolbar from blurring the editor (which would dismiss the keyboard).
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => {
          // Only swallow if we're not pressing an input.
          const t = e.target as HTMLElement;
          if (!t.closest("input, textarea")) e.preventDefault();
        }}
      >
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-thin">
          {/* Insert / convert (replaces "/" slash menu) */}
          <button
            onClick={() => setShowBlockSheet(true)}
            className="flex items-center gap-1 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" />
            Block
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          <div className="w-px h-5 bg-border mx-1 shrink-0" />

          {/* Quick block conversion */}
          <ToolbarIcon icon={Heading1} label="H1" onClick={() => onConvertBlock("heading1")} />
          <ToolbarIcon icon={Heading2} label="H2" onClick={() => onConvertBlock("heading2")} />
          <ToolbarIcon icon={List} label="Bullet" onClick={() => onConvertBlock("bullet")} />
          <ToolbarIcon icon={ListOrdered} label="Numbered" onClick={() => onConvertBlock("numbered")} />
          <ToolbarIcon icon={CheckSquare} label="To-do" onClick={() => onConvertBlock("todo")} />
          <ToolbarIcon icon={Quote} label="Quote" onClick={() => onConvertBlock("quote")} />

          <div className="w-px h-5 bg-border mx-1 shrink-0" />

          {/* Inline formatting */}
          <ToolbarIcon icon={Bold} label="Bold" onClick={() => exec("bold")} />
          <ToolbarIcon icon={Italic} label="Italic" onClick={() => exec("italic")} />
          <ToolbarIcon icon={Underline} label="Underline" onClick={() => exec("underline")} />
        </div>
      </motion.div>

      {/* Spacer so the editor scroll area can reach above the toolbar. */}
      <div aria-hidden style={{ height: 56 + bottomOffset }} />
    </>
  );
};

const ToolbarIcon = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    aria-label={label}
    className="h-9 w-9 flex items-center justify-center rounded-lg text-foreground hover:bg-muted active:scale-95 transition-all shrink-0"
  >
    <Icon className="w-4 h-4" />
  </button>
);

export default MobileEditorToolbar;
