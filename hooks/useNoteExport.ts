import { useCallback } from "react";
import { Note, NoteBlock } from "@/hooks/useNotes";

type ExportFormat = "markdown" | "text" | "html";

const blockToMarkdown = (block: NoteBlock): string => {
  switch (block.type) {
    case "heading1": return `# ${block.content}`;
    case "heading2": return `## ${block.content}`;
    case "heading3": return `### ${block.content}`;
    case "bullet": return `- ${block.content}`;
    case "numbered": return `1. ${block.content}`;
    case "todo": return `- [${block.checked ? "x" : " "}] ${block.content}`;
    case "quote": return `> ${block.content}`;
    case "code": return `\`\`\`\n${block.content}\n\`\`\``;
    case "divider": return "---";
    case "callout": return `> 💡 ${block.content}`;
    case "toggle": return `<details>\n<summary>${block.content}</summary>\n${block.toggleContent || ""}\n</details>`;
    case "image": return block.imageUrl ? `![Image](${block.imageUrl})` : "";
    case "bookmark": return block.bookmarkUrl ? `[${block.bookmarkTitle || block.bookmarkUrl}](${block.bookmarkUrl})` : "";
    case "video": return block.videoUrl ? `[Video](${block.videoUrl})` : "";
    case "equation": return `$$${block.content}$$`;
    case "progress": return `Progress: ${block.progressValue || 0}%`;
    case "rating": return `Rating: ${"★".repeat(block.ratingValue || 0)}${"☆".repeat((block.ratingMax || 5) - (block.ratingValue || 0))}`;
    case "table":
      if (!block.tableData?.length) return "";
      const header = `| ${block.tableData[0].join(" | ")} |`;
      const sep = `| ${block.tableData[0].map(() => "---").join(" | ")} |`;
      const rows = block.tableData.slice(1).map((r) => `| ${r.join(" | ")} |`).join("\n");
      return `${header}\n${sep}\n${rows}`;
    default: return block.content || "";
  }
};

const blockToText = (block: NoteBlock): string => {
  switch (block.type) {
    case "heading1": case "heading2": case "heading3": return block.content;
    case "bullet": return `• ${block.content}`;
    case "numbered": return block.content;
    case "todo": return `[${block.checked ? "✓" : " "}] ${block.content}`;
    case "quote": return `"${block.content}"`;
    case "code": return block.content;
    case "divider": return "────────────";
    case "toggle": return `${block.content}\n  ${block.toggleContent || ""}`;
    case "table":
      return (block.tableData || []).map((r) => r.join("\t")).join("\n");
    default: return block.content || "";
  }
};

const blockToHtml = (block: NoteBlock): string => {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  switch (block.type) {
    case "heading1": return `<h1>${esc(block.content)}</h1>`;
    case "heading2": return `<h2>${esc(block.content)}</h2>`;
    case "heading3": return `<h3>${esc(block.content)}</h3>`;
    case "bullet": return `<ul><li>${esc(block.content)}</li></ul>`;
    case "numbered": return `<ol><li>${esc(block.content)}</li></ol>`;
    case "todo": return `<div><input type="checkbox" ${block.checked ? "checked" : ""} disabled> ${esc(block.content)}</div>`;
    case "quote": return `<blockquote>${esc(block.content)}</blockquote>`;
    case "code": return `<pre><code>${esc(block.content)}</code></pre>`;
    case "divider": return `<hr>`;
    case "callout": return `<div style="background:#f0f9ff;padding:12px;border-left:4px solid #3b82f6;border-radius:4px;">💡 ${esc(block.content)}</div>`;
    case "image": return block.imageUrl ? `<img src="${block.imageUrl}" alt="Image" style="max-width:100%;">` : "";
    case "toggle": return `<details><summary>${esc(block.content)}</summary><p>${esc(block.toggleContent || "")}</p></details>`;
    default: return `<p>${esc(block.content || "")}</p>`;
  }
};

const download = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const useNoteExport = () => {
  const exportNote = useCallback((note: Note, format: ExportFormat) => {
    const safeName = note.title.replace(/[^a-z0-9]/gi, "_").slice(0, 50) || "note";

    if (format === "markdown") {
      const md = `# ${note.title}\n\n${note.blocks.map(blockToMarkdown).join("\n\n")}`;
      download(md, `${safeName}.md`, "text/markdown");
    } else if (format === "text") {
      const txt = `${note.title}\n${"=".repeat(note.title.length)}\n\n${note.blocks.map(blockToText).join("\n\n")}`;
      download(txt, `${safeName}.txt`, "text/plain");
    } else {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${note.title}</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:0 20px;color:#333}h1,h2,h3{margin-top:1.5em}blockquote{border-left:3px solid #ddd;margin-left:0;padding-left:1em;color:#666}pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto}hr{border:none;border-top:1px solid #eee;margin:2em 0}details{margin:1em 0;padding:8px}summary{cursor:pointer;font-weight:600}</style></head><body>${note.blocks.map(blockToHtml).join("\n")}</body></html>`;
      download(html, `${safeName}.html`, "text/html");
    }
  }, []);

  return { exportNote };
};
