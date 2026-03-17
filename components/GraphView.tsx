"use client";
import { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesContext } from "@/contexts/NotesContext";
import { RotateCcw, X, ExternalLink, Command, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RGB { r: number; g: number; b: number; }
interface GraphNode {
  id: string; label: string; x: number; y: number; vx: number; vy: number;
  baseColor: RGB; accentColor: RGB; radius: number; type: "note" | "tag" | "folder";
}

const COLORS = {
  blue: { base: { r: 59, g: 130, b: 246 }, accent: { r: 147, g: 197, b: 253 } },
  amber: { base: { r: 251, g: 191, b: 36 }, accent: { r: 253, g: 230, b: 138 } },
  folder: { base: { r: 161, g: 161, b: 170 }, accent: { r: 244, g: 244, b: 245 } },
  background: "#020204",
  edge: "rgba(255, 255, 255, 0.1)",
};

const GraphView = ({ onSelectNote }: { onSelectNote?: (id: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const { noteIndexes, folders } = useNotesContext();

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string }[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [bgHue, setBgHue] = useState<RGB>(COLORS.blue.base);

  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach(f => map.set(f.id, f.name));
    return map;
  }, [folders]);

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const matches = new Set<string>();
    const query = searchQuery.toLowerCase();
    noteIndexes.forEach(note => {
      if (note.title.toLowerCase().includes(query)) {
        matches.add(note.id);
        if (note.folderId) matches.add(`folder-${note.folderId}`);
        note.tags.forEach(t => matches.add(`tag-${t.label}`));
      }
    });
    return matches;
  }, [noteIndexes, searchQuery]);

  useEffect(() => {
    const active = selectedNode || hoveredNode;
    if (active?.type === 'tag') setBgHue(COLORS.amber.base);
    else if (active?.type === 'folder') setBgHue(COLORS.folder.base);
    else setBgHue(COLORS.blue.base);
  }, [selectedNode, hoveredNode]);

  useEffect(() => {
    // 1. Build Note Nodes
    const noteNodes: GraphNode[] = noteIndexes.map(note => ({
      id: note.id, label: note.title || "Untitled", x: Math.random() * 800, y: Math.random() * 600,
      vx: 0, vy: 0, baseColor: COLORS.blue.base, accentColor: COLORS.blue.accent, radius: 11, type: "note"
    }));

    // 2. Build Tag Nodes
    const tagNames = Array.from(new Set(noteIndexes.flatMap(n => n.tags.map(t => t.label))));
    const tagNodes: GraphNode[] = tagNames.map(tag => ({
      id: `tag-${tag}`, label: tag, x: Math.random() * 800, y: Math.random() * 600,
      vx: 0, vy: 0, baseColor: COLORS.amber.base, accentColor: COLORS.amber.accent, radius: 8, type: "tag"
    }));

    // 3. Build Folder Nodes
    const folderIds = Array.from(new Set(noteIndexes.map(n => n.folderId).filter(Boolean)));
    const folderNodes: GraphNode[] = folderIds.map(fId => ({
      id: `folder-${fId}`,
      // Look up name from map, fallback to ID, then "General"
      label: folderMap.get(fId!) || fId || "General",
      x: Math.random() * 800, y: Math.random() * 600,
      vx: 0, vy: 0, baseColor: COLORS.folder.base, accentColor: COLORS.folder.accent, radius: 15, type: "folder"
    }));

    setNodes([...noteNodes, ...tagNodes, ...folderNodes]);

    // 4. Build Edges (Tags + Folders)
    const folderEdges = noteIndexes
      .filter(n => n.folderId)
      .map(n => ({ source: n.id, target: `folder-${n.folderId}` }));

    const tagEdges = noteIndexes.flatMap(note =>
      note.tags.map(t => ({ source: note.id, target: `tag-${t.label}` }))
    );

    setEdges([...tagEdges, ...folderEdges]);
  }, [noteIndexes, folderMap]);

  useEffect(() => {
    const runPhysics = () => {
      timeRef.current += 0.01;
      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));

        for (let i = 0; i < next.length; i++) {
          if (next[i].id === draggedNode) continue;
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x, dy = next[j].y - next[i].y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (next[i].radius + next[j].radius) * 18;
            if (d < minDist) {
              const f = (minDist - d) * 0.04;
              next[i].vx -= (dx / d) * f; next[i].vy -= (dy / d) * f; next[j].vx += (dx / d) * f; next[j].vy += (dy / d) * f;
            }
          }
        }

        edges.forEach(e => {
          const s = next.find(n => n.id === e.source), t = next.find(n => n.id === e.target);
          if (s && t) {
            const dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            // Folder connections are tighter
            const idealDist = t.type === 'folder' || s.type === 'folder' ? 100 : 140;
            const f = (d - idealDist) * 0.007;
            if (s.id !== draggedNode) { s.vx += (dx / d) * f; s.vy += (dy / d) * f; }
            if (t.id !== draggedNode) { t.vx -= (dx / d) * f; t.vy -= (dy / d) * f; }
          }
        });

        next.forEach(n => {
          if (n.id !== draggedNode) {
            n.vx += (dimensions.width / 2 - n.x) * 0.0005; n.vy += (dimensions.height / 2 - n.y) * 0.0005;
            n.vx *= 0.88; n.vy *= 0.88; n.x += n.vx; n.y += n.vy;
          }
        });
        return next;
      });
      animationRef.current = requestAnimationFrame(runPhysics);
    };
    animationRef.current = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animationRef.current);
  }, [edges, dimensions, draggedNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const { clientWidth: w, clientHeight: h } = containerRef.current!;
      canvas.width = w * window.devicePixelRatio; canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = COLORS.background; ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 4; i++) {
        ctx.save();
        const depth = 0.05 + (i * 0.05);
        ctx.translate(w / 2 + offset.x * depth, h / 2 + offset.y * depth);
        const t = timeRef.current * 0.3 + i;
        ctx.beginPath();
        ctx.moveTo(-w * 2, h * 0.25 * i - h);
        ctx.bezierCurveTo(-w, Math.sin(t) * 180, w, Math.cos(t) * 180, w * 2, h * 0.25 * i - h);
        ctx.strokeStyle = `rgba(${bgHue.r}, ${bgHue.g}, ${bgHue.b}, ${0.012 - (i * 0.002)})`;
        ctx.lineWidth = 50 + (i * 25);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      edges.forEach(edge => {
        const s = nodes.find(n => n.id === edge.source), t = nodes.find(n => n.id === edge.target);
        if (s && t) {
          const isInteracting = hoveredNode?.id === s.id || hoveredNode?.id === t.id || selectedNode?.id === s.id || selectedNode?.id === t.id || draggedNode === s.id || draggedNode === t.id;
          const isFilteredOut = filteredNodeIds && (!filteredNodeIds.has(s.id) || !filteredNodeIds.has(t.id));

          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = isInteracting ? `rgba(${bgHue.r}, ${bgHue.g}, ${bgHue.b}, 0.55)` : COLORS.edge;
          ctx.globalAlpha = isFilteredOut ? 0.02 : 1;
          ctx.lineWidth = (s.type === 'folder' || t.type === 'folder') ? 0.4 : 0.6;
          ctx.setLineDash((s.type === 'folder' || t.type === 'folder') ? [5, 5] : []); // Folders get dashed lines
          ctx.stroke();
          ctx.setLineDash([]);

          if (isInteracting) {
            const pT = (timeRef.current * 1.5) % 1;
            const px = s.x + (t.x - s.x) * pT, py = s.y + (t.y - s.y) * pT;
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      });

      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id, isSelected = selectedNode?.id === node.id, isDragged = draggedNode === node.id;
        const isMatched = filteredNodeIds?.has(node.id);
        const isFilteredOut = filteredNodeIds && !isMatched;

        ctx.globalAlpha = isFilteredOut ? 0.08 : 1;
        const b = node.baseColor, a = node.accentColor;
        const coreR = (isHovered || isMatched || isDragged) ? node.radius * 1.2 : node.radius;

        const pulse = isMatched ? Math.sin(timeRef.current * 5) * 0.8 : 0;
        const glowFactor = (isMatched || isDragged) ? (8 + pulse) : (node.type === 'folder' ? 3 : 5);
        const glowAlpha = (isMatched || isDragged) ? 0.18 : 0.08;

        const gGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, coreR * glowFactor);
        gGlow.addColorStop(0, `rgba(${b.r},${b.g},${b.b},${glowAlpha})`);
        gGlow.addColorStop(1, "transparent");
        ctx.fillStyle = gGlow; ctx.beginPath(); ctx.arc(node.x, node.y, coreR * glowFactor, 0, Math.PI * 2); ctx.fill();

        const gCore = ctx.createRadialGradient(node.x - coreR * 0.2, node.y - coreR * 0.2, 0, node.x, node.y, coreR);
        const coreOpacity = isFilteredOut ? 0.2 : (node.type === 'folder' ? 0.4 : 1);
        gCore.addColorStop(0, `rgba(${a.r},${a.g},${a.b},${coreOpacity})`);
        gCore.addColorStop(1, `rgba(${b.r},${b.g},${b.b},${coreOpacity * 0.95})`);

        ctx.fillStyle = gCore;
        if (node.type === 'folder') {
          ctx.strokeStyle = `rgba(${a.r},${a.g},${a.b}, 0.8)`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(node.x, node.y, coreR, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(node.x, node.y, coreR, 0, Math.PI * 2); ctx.fill();
        }

        if (scale > 0.45 || isHovered || isMatched || isDragged) {
          ctx.font = `500 ${node.type === 'folder' ? '14px' : '12px'} "SF Pro Text", -apple-system, sans-serif`;
          ctx.fillStyle = isMatched ? `rgba(${a.r},${a.g},${a.b},1)` : (isHovered || isDragged) ? "#fff" : "rgba(255,255,255,0.25)";
          ctx.textAlign = "center"; ctx.fillText(node.label, node.x, node.y + coreR + 24);
        }
      });
      ctx.restore();
    };
    render();
  }, [nodes, edges, scale, offset, hoveredNode, selectedNode, draggedNode, bgHue, filteredNodeIds]);

  useEffect(() => {
    const update = () => containerRef.current && setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    window.addEventListener("resize", update); update();
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (hoveredNode) setDraggedNode(hoveredNode.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    if (draggedNode) {
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x, y, vx: 0, vy: 0 } : n));
    } else {
      setHoveredNode(nodes.find(n => Math.hypot(n.x - x, n.y - y) < n.radius * 6) || null);
      if (e.buttons === 1) setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handleMouseUp = () => setDraggedNode(null);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#020204] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => setScale(s => Math.max(0.1, Math.min(4, s - e.deltaY * 0.0012)))}
        onClick={() => !draggedNode && setSelectedNode(hoveredNode)}
      />

      <div className="absolute top-5 left-5 flex items-center gap-3 bg-white/4 backdrop-blur-3xl border border-white/10 p-2 pl-5 rounded-full pointer-events-auto group focus-within:bg-white/8 transition-all shadow-xl">
        <Command className="w-3 h-3 text-zinc-500 group-focus-within:text-white transition-colors" />
        <Input
          placeholder="Search Index..."
          className="h-7 w-60 bg-transparent border-none text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-0 p-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="pr-3 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 right-10 w-80 bg-[#111113]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                {selectedNode.type === 'folder' ? <Folder className="w-5 h-5 text-zinc-400" /> : <ExternalLink className="w-5 h-5 text-zinc-400" />}
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <h3 className="text-white font-medium text-xl leading-tight mb-1">{selectedNode.label}</h3>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-8 opacity-60">
              {selectedNode.type.toUpperCase()} // {selectedNode.id.slice(0, 8)}
            </p>
            {selectedNode.type === 'note' && (
              <Button onClick={() => onSelectNote?.(selectedNode.id)} className="w-full h-12 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all active:scale-[0.98]">Reveal Details</Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-5 left-5">
        <Button variant="outline" size="icon" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="rounded-2xl w-11 h-11 bg-white/3 border-white/10 text-zinc-500 hover:text-white backdrop-blur-3xl shadow-xl"><RotateCcw className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

export default GraphView;