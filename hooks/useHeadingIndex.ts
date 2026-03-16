import { NoteBlock } from "@/lib/types";
import { useMemo } from "react";

export interface HeadingIndex {
  id: string;
  text: string;
  level: 1 | 2 | 3; // heading1, heading2, heading3
  indent: number; // 0, 1, 2 based on hierarchy
  blockIndex: number; // position in blocks array
}

/**
 * Hook to extract a document index from note blocks.
 * Defensive checks added to prevent "forEach is not a function" 
 * during initial async load or metadata sync.
 */
export const useHeadingIndex = (blocks: NoteBlock[] = []) => {
  const index = useMemo(() => {
    // CRITICAL: Defensive check for production stability
    // Ensures 'blocks' is an array before attempting iteration
    if (!blocks || !Array.isArray(blocks)) {
      return [];
    }

    const headings: HeadingIndex[] = [];

    blocks.forEach((block, blockIndex) => {
      // heading1 -> Level 1
      if (block.type === "heading1") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 1,
          indent: 0,
          blockIndex,
        });
      } 
      // heading2 -> Level 2
      else if (block.type === "heading2") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 2,
          indent: 1,
          blockIndex,
        });
      } 
      // heading3 -> Level 3
      else if (block.type === "heading3") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 3,
          indent: 2,
          blockIndex,
        });
      }
    });

    return headings;
  }, [blocks]);

  const scrollToHeading = (headingId: string) => {
    // Find the block element by data attribute in the NotionEditor
    const element = document.querySelector(`[data-block-id="${headingId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Glassmorphism-style highlight animation
      (element as HTMLElement).classList.add("ring-2", "ring-primary", "rounded-lg", "transition-all");
      
      setTimeout(() => {
        (element as HTMLElement).classList.remove("ring-2", "ring-primary", "rounded-lg");
      }, 1500);
    }
  };

  return { index, scrollToHeading };
};