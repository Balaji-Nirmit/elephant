import { NoteBlock } from "@/contexts/NotesContext";
import { useMemo } from "react";

export interface HeadingIndex {
  id: string;
  text: string;
  level: 1 | 2 | 3; // heading1, heading2, heading3
  indent: number; // 0, 1, 2 based on hierarchy
  blockIndex: number; // position in blocks array
}

export const useHeadingIndex = (blocks: NoteBlock[]) => {
  const index = useMemo(() => {
    const headings: HeadingIndex[] = [];
    let lastLevel = 0;

    blocks.forEach((block, blockIndex) => {
      if (block.type === "heading1") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 1,
          indent: 0,
          blockIndex,
        });
        lastLevel = 1;
      } else if (block.type === "heading2") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 2,
          indent: 1,
          blockIndex,
        });
        lastLevel = 2;
      } else if (block.type === "heading3") {
        headings.push({
          id: block.id,
          text: block.content || "Untitled Heading",
          level: 3,
          indent: 2,
          blockIndex,
        });
        lastLevel = 3;
      }
    });

    return headings;
  }, [blocks]);

  const scrollToHeading = (headingId: string) => {
    // Find the block element by data attribute
    const element = document.querySelector(`[data-block-id="${headingId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Add a subtle highlight animation
      (element as HTMLElement).classList.add("ring-2", "ring-primary", "rounded-lg");
      setTimeout(() => {
        (element as HTMLElement).classList.remove("ring-2", "ring-primary", "rounded-lg");
      }, 1500);
    }
  };

  return { index, scrollToHeading };
};
