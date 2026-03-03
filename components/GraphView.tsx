"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesContext } from "@/contexts/NotesContext";
import { NoteIndex, NoteBlock } from "@/lib/types";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StorageEngine } from "@/lib/storage-engine";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  type: "note" | "tag";
  indexData?: NoteIndex;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: "tag" | "link";
}

interface GraphViewProps {
  onSelectNote?: (noteId: string) => void;
}

const nodeColors = {
  note: "#3b82f6",
  tag: "#f59e0b",
};

const edgeColors = {
  tag: "rgba(245, 158, 11, 0.4)",
  link: "rgba(59, 130, 246, 0.5)",
};

const GraphView = ({ onSelectNote }: GraphViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const { noteIndexes } = useNotesContext();
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedNodeBlocks, setSelectedNodeBlocks] = useState<NoteBlock[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 1. Fetch blocks only when a node is selected (Atomic loading)
  useEffect(() => {
    let isMounted = true;
    const fetchBlocks = async () => {
      if (selectedNode?.type === "note") {
        setIsLoadingBlocks(true);
        try {
          const blocks = await StorageEngine.loadNoteBlocks(selectedNode.id);
          if (isMounted) setSelectedNodeBlocks(blocks);
        } catch (err) {
          console.error("Failed to load blocks for graph preview", err);
        } finally {
          if (isMounted) setIsLoadingBlocks(false);
        }
      } else {
        setSelectedNodeBlocks([]);
      }
    };
    fetchBlocks();
    return () => { isMounted = false; };
  }, [selectedNode]);

  // 2. Get unique tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    noteIndexes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag.label));
    });
    return Array.from(tagSet).sort();
  }, [noteIndexes]);

  // 3. Filtering logic (Metadata based)
  const highlightedNodeIds = useMemo(() => {
    const hasFilter = searchQuery.trim() !== "" || selectedTags.length > 0;
    if (!hasFilter) return null;

    const matchingNoteIds = new Set<string>();
    const matchingTagIds = new Set<string>();

    noteIndexes.forEach((note) => {
      const matchesSearch = searchQuery.trim() === "" ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some((sTag) => note.tags.some((nTag) => nTag.label === sTag));

      if (matchesSearch && matchesTags) {
        matchingNoteIds.add(note.id);
        note.tags.forEach((tag) => matchingTagIds.add(`tag-${tag.label}`));
      }
    });

    selectedTags.forEach((tag) => matchingTagIds.add(`tag-${tag}`));
    return new Set([...matchingNoteIds, ...matchingTagIds]);
  }, [noteIndexes, searchQuery, selectedTags]);

  // 4. Build Graph Structure
  const graphData = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];
    const tagMap = new Map<string, string[]>();

    noteIndexes.forEach((note, index) => {
      const angle = (2 * Math.PI * index) / Math.max(noteIndexes.length, 1);
      const radius = 150 + Math.random() * 100;

      graphNodes.push({
        id: note.id,
        label: note.title || "Untitled",
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        color: nodeColors.note,
        radius: 24,
        type: "note",
        indexData: note,
      });

      note.tags.forEach((tag) => {
        const existing = tagMap.get(tag.label) || [];
        existing.push(note.id);
        tagMap.set(tag.label, existing);
      });
    });

    tagMap.forEach((noteIds, tagLabel) => {
      if (noteIds.length > 1) {
        const tagId = `tag-${tagLabel}`;
        const connectedNotes = noteIds.map(id => graphNodes.find(n => n.id === id)!).filter(Boolean);
        
        if (connectedNotes.length > 0) {
          const avgX = connectedNotes.reduce((sum, n) => sum + n.x, 0) / connectedNotes.length;
          const avgY = connectedNotes.reduce((sum, n) => sum + n.y, 0) / connectedNotes.length;

          graphNodes.push({
            id: tagId,
            label: tagLabel,
            x: avgX + (Math.random() - 0.5) * 50,
            y: avgY + (Math.random() - 0.5) * 50,
            vx: 0, vy: 0, color: nodeColors.tag, radius: 16, type: "tag",
          });

          noteIds.forEach(noteId => {
            graphEdges.push({ source: noteId, target: tagId, strength: 0.5, type: "tag" });
          });
        }
      }
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [noteIndexes, dimensions]);

  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 5. Force Simulation (Fixed EffectCallback TS Error)
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const simulate = () => {
      setNodes((prev) => {
        const next = prev.map(n => ({ ...n }));
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (next[i].radius + next[j].radius) * 3;
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.5;
              next[i].vx -= dx * force; next[i].vy -= dy * force;
              next[j].vx += dx * force; next[j].vy += dy * force;
            }
          }
        }
        edges.forEach(edge => {
          const s = next.find(n => n.id === edge.source);
          const t = next.find(n => n.id === edge.target);
          if (s && t) {
            const dx = t.x - s.x; const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist > 120) {
              const f = (dist - 120) / dist * edge.strength * 0.1;
              s.vx += dx * f; s.vy += dy * f;
              t.vx -= dx * f; t.vy -= dy * f;
            }
          }
        });
        const cx = dimensions.width / 2; const cy = dimensions.height / 2;
        next.forEach(n => {
          n.vx += (cx - n.x) * 0.001; n.vy += (cy - n.y) * 0.001;
          n.vx *= 0.9; n.vy *= 0.9;
          n.x += n.vx; n.y += n.vy;
          n.x = Math.max(n.radius, Math.min(dimensions.width - n.radius, n.x));
          n.y = Math.max(n.radius, Math.min(dimensions.height - n.radius, n.y));
        });
        return next;
      });
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, edges, dimensions]);

  // 6. Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    edges.forEach(edge => {
      const s = nodes.find(n => n.id === edge.source);
      const t = nodes.find(n => n.id === edge.target);
      if (s && t) {
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = edgeColors.tag; ctx.lineWidth = 1; ctx.stroke();
      }
    });

    nodes.forEach(node => {
      const isDimmed = highlightedNodeIds !== null && !highlightedNodeIds.has(node.id);
      const isMatch = highlightedNodeIds !== null && highlightedNodeIds.has(node.id);
      ctx.globalAlpha = isDimmed ? 0.2 : 1;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isMatch ? "#22c55e" : node.color;
      ctx.fill();
      
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y);
    });
    ctx.restore();
  }, [nodes, edges, scale, offset, dimensions, highlightedNodeIds]);

  const getNodeAt = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (cx - rect.left - offset.x) / scale;
    const y = (cy - rect.top - offset.y) / scale;
    return [...nodes].reverse().find(n => Math.hypot(n.x - x, n.y - y) < n.radius);
  }, [nodes, scale, offset]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          const node = getNodeAt(e.clientX, e.clientY);
          if (node) setSelectedNode(node);
          else { 
            setIsDragging(true); 
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); 
          }
        }}
        onMouseMove={(e) => {
          if (isDragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
          else setHoveredNode(getNodeAt(e.clientX, e.clientY) || null);
        }}
        onMouseUp={() => setIsDragging(false)}
        onWheel={(e) => setScale(s => Math.max(0.3, Math.min(3, s * (e.deltaY > 0 ? 0.9 : 1.1))))}
      />

      <div className="absolute top-4 left-4 right-4 flex gap-3">
        <Input 
          placeholder="Search metadata..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs bg-zinc-800 border-zinc-700 text-white"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
              <Tag className="w-4 h-4 mr-2" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
            {allTags.map(t => (
              <DropdownMenuCheckboxItem 
                key={t} 
                checked={selectedTags.includes(t)}
                onCheckedChange={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
              >
                {t}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {selectedNode?.type === "note" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 p-4 bg-zinc-800/95 border border-zinc-700 rounded-xl w-64 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold truncate">{selectedNode.label}</h3>
              <X className="w-4 h-4 text-zinc-500 cursor-pointer" onClick={() => setSelectedNode(null)} />
            </div>
            <p className="text-xs text-zinc-400 line-clamp-3 mb-4">
              {isLoadingBlocks ? "Loading..." : selectedNodeBlocks.find(b => b.content)?.content || "No text content."}
            </p>
            <Button size="sm" className="w-full" onClick={() => onSelectNote?.(selectedNode.id)}>
              Open Note
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button size="icon" variant="secondary" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}><RotateCcw className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

export default GraphView;