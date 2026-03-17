"use client";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesContext } from "@/contexts/NotesContext";
import { RotateCcw, X, Zap, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- TYPES ---
interface RGB { r: number; g: number; b: number; }
interface GraphNode {
  id: string; label: string; x: number; y: number; vx: number; vy: number;
  baseColor: RGB; accentColor: RGB; radius: number; type: "note" | "tag";
}
interface GraphEdge {
  source: string; target: string; type: "tag" | "discovery";
  commonWords?: string[];
}

const COLORS = {
  blue: { base: { r: 59, g: 130, b: 246 } },
  amber: { base: { r: 251, g: 191, b: 36 } },
  purple: { base: { r: 168, g: 85, b: 247 } },
  background: "#020204",
  edge: "rgba(255, 255, 255, 0.08)",
};

const workerCode = `
  self.onmessage = async (e) => {
    const { selectedId, noteIndexes, stopWords } = e.data;
    const stopWordsSet = new Set(stopWords);
    try {
      const root = await navigator.storage.getDirectory();
      const notesDir = await root.getDirectoryHandle("notes");
      const file = await notesDir.getFileHandle(\`\${selectedId}.json\`);
      const data = JSON.parse(await (await file.getFile()).text());
      const blocks = Array.isArray(data) ? data : (data.blocks || []);
      const sourceText = blocks.map(b => (b.content || "").toLowerCase()).join(" ");
      const sourceWords = new Set(sourceText.match(/\\b[a-z]{4,}\\b/g)?.filter(w => !stopWordsSet.has(w)) || []);

      if (sourceWords.size === 0) { self.postMessage({ edges: [] }); return; }

      const discoveryEdges = [];
      for (const note of noteIndexes) {
        if (note.id === selectedId) continue;
        try {
          const h = await notesDir.getFileHandle(\`\${note.id}.json\`);
          const d = JSON.parse(await (await h.getFile()).text());
          const b = Array.isArray(d) ? d : (d.blocks || []);
          const text = b.map(bl => (bl.content || "").toLowerCase()).join(" ");
          const words = text.match(/\\b[a-z]{4,}\\b/g) || [];
          const overlap = Array.from(new Set(words.filter(w => sourceWords.has(w)))).slice(0, 3);
          if (overlap.length > 0) discoveryEdges.push({ source: selectedId, target: note.id, type: 'discovery', commonWords: overlap });
        } catch (err) { continue; }
      }
      self.postMessage({ edges: discoveryEdges });
    } catch (error) { self.postMessage({ edges: [] }); }
  };
`;

const GraphView = ({ onSelectNote }: { onSelectNote?: (id: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  const { noteIndexes } = useNotesContext();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dpr, setDpr] = useState(1);
  const [isMapping, setIsMapping] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1);
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;
    worker.onmessage = (e) => {
      if (e.data.edges) {
        const tagEdges = edgesRef.current.filter(edge => edge.type === 'tag');
        edgesRef.current = [...tagEdges, ...e.data.edges];
      }
      setIsMapping(false);
    };
    return () => { worker.terminate(); cancelAnimationFrame(animationRef.current); };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    const w = containerRef.current?.clientWidth || 1200;
    const h = containerRef.current?.clientHeight || 800;

    const noteNodes: GraphNode[] = noteIndexes.map(note => ({
      id: note.id, label: note.title || "Untitled", x: Math.random() * w, y: Math.random() * h,
      vx: 0, vy: 0, baseColor: COLORS.blue.base, accentColor: COLORS.blue.base, radius: 10, type: "note"
    }));
    const tagNodes: GraphNode[] = Array.from(new Set(noteIndexes.flatMap(n => n.tags.map(t => t.label)))).map(tag => ({
      id: `tag-${tag}`, label: tag, x: Math.random() * w, y: Math.random() * h,
      vx: 0, vy: 0, baseColor: COLORS.amber.base, accentColor: COLORS.amber.base, radius: 7, type: "tag"
    }));

    nodesRef.current = [...noteNodes, ...tagNodes];
    edgesRef.current = noteIndexes.flatMap(note => note.tags.map(t => ({ source: note.id, target: `tag-${t.label}`, type: 'tag' })));
    return () => window.removeEventListener("resize", updateSize);
  }, [noteIndexes]);

  useEffect(() => {
    if (!selectedNodeId || !workerRef.current) {
      edgesRef.current = edgesRef.current.filter(e => e.type !== 'discovery');
      return;
    }
    const node = nodesRef.current.find(n => n.id === selectedNodeId);
    if (node?.type === 'note') {
      setIsMapping(true);
      workerRef.current.postMessage({ selectedId: selectedNodeId, noteIndexes, stopWords: ['this', 'that', 'with', 'from', 'about'] });
    }
  }, [selectedNodeId, noteIndexes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const run = () => {
      timeRef.current += 0.015;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // 1. CRITICAL BUG FIX: CLEAR THE BUFFER COMPLETELY
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for clearing
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. APPLY TRANSFORMATIONS
      ctx.scale(dpr, dpr);
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // 3. PHYSICS
      for (const n of nodes) {
        n.vx += (dimensions.width / 2 - n.x) * 0.0004;
        n.vy += (dimensions.height / 2 - n.y) * 0.0004;
        n.vx *= 0.9; n.vy *= 0.9;
        n.x += n.vx; n.y += n.vy;
      }
      for (const e of edges) {
        const s = nodes.find(n => n.id === e.source), t = nodes.find(n => n.id === e.target);
        if (s && t) {
          const dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx*dx + dy*dy) || 1;
          const f = (d - (e.type === 'discovery' ? 180 : 120)) * 0.006;
          s.vx += (dx/d) * f; s.vy += (dy/d) * f;
          t.vx -= (dx/d) * f; t.vy -= (dy/d) * f;
        }
      }

      // 4. DRAWING
      const pulse = Math.sin(timeRef.current * 3.5) * 0.5 + 0.5;

      for (const e of edges) {
        const s = nodes.find(n => n.id === e.source), t = nodes.find(n => n.id === e.target);
        if (!s || !t) continue;
        const active = selectedNodeId === s.id || selectedNodeId === t.id;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
        if (e.type === 'discovery') {
          ctx.setLineDash([6, 4]); ctx.lineDashOffset = -timeRef.current * 20;
          ctx.strokeStyle = active ? `rgba(168, 85, 247, ${0.3 + pulse * 0.5})` : "rgba(168, 85, 247, 0.1)";
          ctx.lineWidth = active ? 2 : 1;
        } else {
          ctx.setLineDash([]); ctx.strokeStyle = active ? "rgba(59, 130, 246, 0.4)" : COLORS.edge;
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      for (const n of nodes) {
        const isMatch = searchQuery && n.label.toLowerCase().includes(searchQuery.toLowerCase());
        const isSelected = selectedNodeId === n.id;
        const opacity = (!searchQuery || isMatch || isSelected) ? 1 : 0.2;

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 4);
        g.addColorStop(0, `rgba(${n.baseColor.r},${n.baseColor.g},${n.baseColor.b},${(isSelected || isMatch) ? 0.3 : 0.08 * opacity})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * 4, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * (isSelected ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = isSelected || isMatch ? "#fff" : `rgba(${n.baseColor.r}, ${n.baseColor.g}, ${n.baseColor.b}, ${opacity})`;
        ctx.fill();

        if (scale > 0.6 || isMatch || isSelected) {
          ctx.fillStyle = isSelected ? "#fff" : `rgba(255,255,255,${0.5 * opacity})`;
          ctx.font = isSelected ? "bold 11px Inter" : "10px Inter";
          ctx.textAlign = "center"; ctx.fillText(n.label, n.x, n.y + 22);
        }
      }
      animationRef.current = requestAnimationFrame(run);
    };
    animationRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animationRef.current);
  }, [offset, scale, searchQuery, selectedNodeId, dpr, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#020204] rounded-xl overflow-hidden border border-white/5">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        width={dimensions.width * dpr}
        height={dimensions.height * dpr}
        onMouseDown={(e) => {
          if (e.buttons === 1) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            const hit = nodesRef.current.find(n => Math.hypot(n.x - x, n.y - y) < 25);
            setSelectedNodeId(hit ? hit.id : null);
          }
        }}
        onMouseMove={(e) => { if (e.buttons === 1 && !selectedNodeId) setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); }}
        onWheel={(e) => setScale(s => Math.max(0.1, Math.min(4, s - e.deltaY * 0.001)))}
      />

      <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 p-2 pl-5 rounded-full w-80">
        <Search className="w-3.5 h-3.5 text-zinc-500" />
        <Input 
          placeholder="Search Graph..." 
          className="h-7 bg-transparent border-none text-white text-sm focus-visible:ring-0 p-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isMapping && <Loader2 className="w-4 h-4 text-purple-400 animate-spin mr-2" />}
      </div>

      <AnimatePresence>
        {selectedNodeId && !selectedNodeId.startsWith('tag-') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 right-10 w-80 bg-[#111113]/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <Zap className="w-5 h-5 text-purple-400" />
              <button onClick={() => setSelectedNodeId(null)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <h3 className="text-white font-medium text-xl leading-tight mb-2">{nodesRef.current.find(n => n.id === selectedNodeId)?.label}</h3>
            <p className="text-zinc-500 text-[10px] tracking-widest uppercase font-bold mb-8">Discovery Engine Active</p>
            <Button className="w-full bg-white text-black font-extrabold text-xs h-12 rounded-xl hover:bg-zinc-200 transition-all" onClick={() => onSelectNote?.(selectedNodeId)}>
              OPEN DOCUMENT
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6">
        <Button variant="ghost" size="icon" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="rounded-2xl w-12 h-12 bg-white/5 border border-white/10 text-zinc-400 hover:text-white">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default GraphView;