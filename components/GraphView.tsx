"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesContext, Note } from "@/contexts/NotesContext";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X, Search, Filter, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  noteData?: Note;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: "tag" | "similar" | "link";
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
  similar: "rgba(139, 92, 246, 0.3)",
  link: "rgba(59, 130, 246, 0.5)",
};

const GraphView = ({ onSelectNote }: GraphViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const { notes } = useNotesContext();
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag.label));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter logic: determine which nodes should be highlighted
  const highlightedNodeIds = useMemo(() => {
    const hasFilter = searchQuery.trim() !== "" || selectedTags.length > 0;
    if (!hasFilter) return null; // null means no filter active, show all normally

    const matchingNoteIds = new Set<string>();
    const matchingTagIds = new Set<string>();
    
    notes.forEach((note) => {
      const matchesSearch = searchQuery.trim() === "" || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.blocks.some((b) => b.content.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some((selectedTag) => 
          note.tags.some((noteTag) => noteTag.label === selectedTag)
        );
      
      if (matchesSearch && matchesTags) {
        matchingNoteIds.add(note.id);
        note.tags.forEach((tag) => matchingTagIds.add(`tag-${tag.label}`));
      }
    });

    // Also add tag nodes that are selected in the filter
    selectedTags.forEach((tag) => matchingTagIds.add(`tag-${tag}`));

    return new Set([...matchingNoteIds, ...matchingTagIds]);
  }, [notes, searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  // Build graph data from notes
  const graphData = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];
    const tagMap = new Map<string, string[]>(); // tag -> noteIds
    
    // Create note nodes
    notes.forEach((note, index) => {
      const angle = (2 * Math.PI * index) / Math.max(notes.length, 1);
      const radius = 150 + Math.random() * 100;
      
      graphNodes.push({
        id: note.id,
        label: note.title || "Untitled",
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        color: nodeColors.note,
        radius: 24 + Math.min(note.blocks.length * 2, 16),
        type: "note",
        noteData: note,
      });
      
      // Track tags
      note.tags.forEach((tag) => {
        const existing = tagMap.get(tag.label) || [];
        existing.push(note.id);
        tagMap.set(tag.label, existing);
      });
    });
    
    // Create tag nodes and edges
    tagMap.forEach((noteIds, tagLabel) => {
      if (noteIds.length > 1) {
        const tagId = `tag-${tagLabel}`;
        const connectedNotes = noteIds.map((id) => graphNodes.find((n) => n.id === id)!).filter(Boolean);
        
        if (connectedNotes.length > 0) {
          const avgX = connectedNotes.reduce((sum, n) => sum + n.x, 0) / connectedNotes.length;
          const avgY = connectedNotes.reduce((sum, n) => sum + n.y, 0) / connectedNotes.length;
          
          graphNodes.push({
            id: tagId,
            label: tagLabel,
            x: avgX + (Math.random() - 0.5) * 50,
            y: avgY + (Math.random() - 0.5) * 50,
            vx: 0,
            vy: 0,
            color: nodeColors.tag,
            radius: 16,
            type: "tag",
          });
          
          noteIds.forEach((noteId) => {
            graphEdges.push({
              source: noteId,
              target: tagId,
              strength: 0.5,
              type: "tag",
            });
          });
        }
      }
    });
    
    // Find similar content connections (simple word overlap)
    notes.forEach((note1, i) => {
      notes.slice(i + 1).forEach((note2) => {
        const content1 = note1.blocks.map((b) => b.content.toLowerCase()).join(" ");
        const content2 = note2.blocks.map((b) => b.content.toLowerCase()).join(" ");
        
        const words1 = new Set(content1.split(/\s+/).filter((w) => w.length > 4));
        const words2 = new Set(content2.split(/\s+/).filter((w) => w.length > 4));
        
        let overlap = 0;
        words1.forEach((word) => {
          if (words2.has(word)) overlap++;
        });
        
        if (overlap >= 3) {
          graphEdges.push({
            source: note1.id,
            target: note2.id,
            strength: Math.min(overlap / 10, 1),
            type: "similar",
          });
        }
      });
    });
    
    return { nodes: graphNodes, edges: graphEdges };
  }, [notes, dimensions]);

  // Initialize nodes when graph data changes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const simulate = () => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => ({ ...node }));
        
        // Repulsion between nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (newNodes[i].radius + newNodes[j].radius) * 3;
            
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.5;
              newNodes[i].vx -= dx * force;
              newNodes[i].vy -= dy * force;
              newNodes[j].vx += dx * force;
              newNodes[j].vy += dy * force;
            }
          }
        }
        
        // Edge attraction
        edges.forEach((edge) => {
          const source = newNodes.find((n) => n.id === edge.source);
          const target = newNodes.find((n) => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = 120;
            
            if (dist > idealDist) {
              const force = (dist - idealDist) / dist * edge.strength * 0.1;
              source.vx += dx * force;
              source.vy += dy * force;
              target.vx -= dx * force;
              target.vy -= dy * force;
            }
          }
        });
        
        // Center gravity
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        
        // Apply velocities and damping
        newNodes.forEach((node) => {
          // Slight pull to center
          node.vx += (centerX - node.x) * 0.001;
          node.vy += (centerY - node.y) * 0.001;
          
          // Damping
          node.vx *= 0.9;
          node.vy *= 0.9;
          
          // Update position
          node.x += node.vx;
          node.y += node.vy;
          
          // Bounds
          node.x = Math.max(node.radius, Math.min(dimensions.width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(dimensions.height - node.radius, node.y));
        });
        
        return newNodes;
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

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Draw edges
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = edgeColors[edge.type];
        ctx.lineWidth = 1 + edge.strength * 2;
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = highlightedNodeIds === null || highlightedNodeIds.has(node.id);
      const isDimmed = highlightedNodeIds !== null && !highlightedNodeIds.has(node.id);
      
      // Calculate opacity based on filter state
      const nodeOpacity = isDimmed ? 0.2 : 1;
      
      // Glow effect for highlighted/matched nodes
      if ((isHovered || isSelected || (highlightedNodeIds !== null && isHighlighted)) && !isDimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          node.x, node.y, node.radius,
          node.x, node.y, node.radius + 12
        );
        const glowColor = highlightedNodeIds !== null && isHighlighted ? "#22c55e" : node.color;
        gradient.addColorStop(0, glowColor + "60");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.globalAlpha = nodeOpacity;
      ctx.fillStyle = highlightedNodeIds !== null && isHighlighted ? "#22c55e" : node.color;
      ctx.fill();
      
      // Border
      ctx.strokeStyle = isSelected ? "#ffffff" : highlightedNodeIds !== null && isHighlighted ? "#22c55e" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = isSelected ? 3 : highlightedNodeIds !== null && isHighlighted ? 2 : 1;
      ctx.stroke();
      
      // Label
      ctx.font = `${node.type === "tag" ? "11px" : "12px"} Inter, system-ui, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const maxWidth = node.radius * 1.6;
      let label = node.label;
      if (ctx.measureText(label).width > maxWidth) {
        while (ctx.measureText(label + "...").width > maxWidth && label.length > 1) {
          label = label.slice(0, -1);
        }
        label += "...";
      }
      ctx.fillText(label, node.x, node.y);
      ctx.globalAlpha = 1;
    });
    
    ctx.restore();
  }, [nodes, edges, scale, offset, hoveredNode, selectedNode, dimensions, highlightedNodeIds]);

  // Mouse handlers
  const getNodeAtPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;
    
    for (const node of [...nodes].reverse()) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius) {
        return node;
      }
    }
    return null;
  }, [nodes, scale, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      setSelectedNode(node);
      if (node.type === "note" && onSelectNote) {
        onSelectNote(node.id);
      }
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(3, s * delta)));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-xl overflow-hidden"
    >
      {/* Empty state */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <Maximize2 className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-lg font-medium">No notes yet</p>
            <p className="text-zinc-500 text-sm mt-1">Create notes to see the knowledge graph</p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <motion.button
          onClick={() => setScale((s) => Math.min(3, s * 1.2))}
          className="p-2 bg-zinc-800/80 backdrop-blur-sm rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          onClick={() => setScale((s) => Math.max(0.3, s * 0.8))}
          className="p-2 bg-zinc-800/80 backdrop-blur-sm rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
        <motion.button
          onClick={resetView}
          className="p-2 bg-zinc-800/80 backdrop-blur-sm rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Search and Filter Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-800/80 backdrop-blur-sm border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary"
          />
        </div>

        {/* Tag Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 bg-zinc-800/80 backdrop-blur-sm border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white ${
                selectedTags.length > 0 ? "border-primary text-primary" : ""
              }`}
            >
              <Tag className="w-4 h-4" />
              Filter Tags
              {selectedTags.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary rounded-full text-primary-foreground">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="bg-zinc-800 border-zinc-700 max-h-64 overflow-y-auto"
          >
            {allTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">No tags found</div>
            ) : (
              allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                  className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {(searchQuery || selectedTags.length > 0) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 rounded-md transition-colors"
          >
            Clear
          </motion.button>
        )}

        {/* Match count */}
        {highlightedNodeIds !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-md"
          >
            {highlightedNodeIds.size} matches
          </motion.div>
        )}
      </div>

      {/* Legend - moved below search bar */}
      <div className="absolute top-20 left-4 flex flex-col gap-2 p-3 bg-zinc-800/60 backdrop-blur-sm rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.note }} />
          <span className="text-xs text-zinc-300">Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.tag }} />
          <span className="text-xs text-zinc-300">Shared Tags</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ backgroundColor: edgeColors.tag }} />
          <span className="text-xs text-zinc-300">Tag Connection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ backgroundColor: edgeColors.similar }} />
          <span className="text-xs text-zinc-300">Similar Content</span>
        </div>
        {highlightedNodeIds !== null && (
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-700">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-zinc-300">Matched</span>
          </div>
        )}
      </div>

      {/* Selected node info */}
      <AnimatePresence>
        {selectedNode && selectedNode.type === "note" && selectedNode.noteData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 max-w-xs p-4 bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-700"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white truncate pr-2">
                {selectedNode.noteData.title || "Untitled"}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
              {selectedNode.noteData.blocks[0]?.content || "No content"}
            </p>
            {selectedNode.noteData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedNode.noteData.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400"
                  >
                    {tag.label}
                  </span>
                ))}
                {selectedNode.noteData.tags.length > 3 && (
                  <span className="text-xs text-zinc-500">
                    +{selectedNode.noteData.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats - moved to bottom right above controls */}
      <div className="absolute bottom-16 right-4 px-3 py-2 bg-zinc-800/60 backdrop-blur-sm rounded-lg">
        <p className="text-xs text-zinc-400">
          {nodes.filter((n) => n.type === "note").length} notes · {edges.length} connections
        </p>
      </div>
    </div>
  );
};

export default GraphView;
