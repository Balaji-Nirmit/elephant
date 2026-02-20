"use client";
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  code: string;
  id: string;
}

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
});

const MermaidDiagram = ({ code, id }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || !containerRef.current) return;

      try {
        setError(null);
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, code);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [code, id]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
        <p className="text-sm text-destructive font-medium">Diagram Error</p>
        <p className="text-xs text-destructive/80 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex justify-center p-4 bg-background rounded-lg overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
