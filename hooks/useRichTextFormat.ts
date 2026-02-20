import { useCallback, useEffect, useState } from "react";

export interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
}

export const useRichTextFormat = () => {
  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  });

  // Check current selection formatting state
  const updateFormatState = useCallback(() => {
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
      code: false, // No native command for inline code
    });
  }, []);

  // Apply formatting command
  const applyFormat = useCallback((format: string, value?: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    switch (format) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "underline":
        document.execCommand("underline", false);
        break;
      case "strikethrough":
        document.execCommand("strikeThrough", false);
        break;
      case "code":
        // Wrap selection in <code> tag
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const selectedText = range.toString();
          const codeElement = document.createElement("code");
          codeElement.className = "bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary";
          codeElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeElement);
          // Move cursor after the code element
          selection.collapseToEnd();
        }
        break;
      case "textColor":
        if (value) {
          document.execCommand("foreColor", false, value);
        }
        break;
      case "highlight":
        if (value && value !== "transparent") {
          document.execCommand("hiliteColor", false, value);
        } else {
          document.execCommand("removeFormat", false);
        }
        break;
      case "fontFamily":
        if (value) {
          document.execCommand("fontName", false, value);
        }
        break;
      case "fontSize":
        // execCommand fontSize only accepts 1-7, so we use a different approach
        if (value) {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.fontSize = value;
            range.surroundContents(span);
          }
        }
        break;
      case "alignLeft":
        document.execCommand("justifyLeft", false);
        break;
      case "alignCenter":
        document.execCommand("justifyCenter", false);
        break;
      case "alignRight":
        document.execCommand("justifyRight", false);
        break;
      case "justify":
        document.execCommand("justifyFull", false);
        break;
      case "link":
        const url = prompt("Enter URL:", "https://");
        if (url) {
          document.execCommand("createLink", false, url);
        }
        break;
      case "removeFormat":
        document.execCommand("removeFormat", false);
        break;
      default:
        break;
    }

    // Update format state after applying
    setTimeout(updateFormatState, 10);
  }, [updateFormatState]);

  // Handle keyboard shortcuts
  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Check if we're in a contenteditable element
    const target = e.target as HTMLElement;
    if (!target.isContentEditable) return;

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (!modKey) return;

    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        applyFormat("bold");
        break;
      case "i":
        e.preventDefault();
        applyFormat("italic");
        break;
      case "u":
        e.preventDefault();
        applyFormat("underline");
        break;
      case "s":
        if (e.shiftKey) {
          e.preventDefault();
          applyFormat("strikethrough");
        }
        break;
      case "e":
        e.preventDefault();
        applyFormat("code");
        break;
      case "k":
        e.preventDefault();
        applyFormat("link");
        break;
      case "\\":
        e.preventDefault();
        applyFormat("removeFormat");
        break;
    }
  }, [applyFormat]);

  // Setup global keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcuts);
    document.addEventListener("selectionchange", updateFormatState);

    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcuts);
      document.removeEventListener("selectionchange", updateFormatState);
    };
  }, [handleKeyboardShortcuts, updateFormatState]);

  return {
    formatState,
    applyFormat,
    updateFormatState,
  };
};
