'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft, FileText, BookOpen, HelpCircle, Zap, Type, Heading1, List, ListOrdered,
  CheckSquare, Quote, Minus, Code2, Lightbulb, Table as TableIcon, ChevronRight,
  Image as ImageIcon, Bookmark, Sigma, BarChart3, Video, Columns, File, Music,
  Calendar, Trello, Star, Timer, Globe, Database, Network, GalleryHorizontal,
  Layers, Grid3x3, ListChecks, SeparatorHorizontal, HelpCircle as FaqIcon, Rows, 
  ImagePlus, Sparkles, Search, Command, X, Settings, Download, RefreshCw, Sliders,
  GraduationCap
} from "lucide-react";
import Link from "next/link";

type BlockDoc = {
  type: string;
  name: string;
  icon: any;
  description: string;
  usage: string;
};

interface FeatureDoc {
  name: string;
  shortcut?: string;
  description: string;
  icon: any;
  uiLocation: string;
}

const blockCategories: { title: string; description: string; blocks: BlockDoc[] }[] = [
  {
    title: "Basic Blocks",
    description: "Core text and structural blocks for everyday writing.",
    blocks: [
      { type: "text", name: "Text", icon: Type, description: "A plain paragraph for everyday writing. Supports inline rich text formatting.", usage: "Type / and select Text, or just start typing on an empty line." },
      { type: "heading1", name: "Heading 1", icon: Heading1, description: "Large section title used for the top of a page.", usage: "Type /heading1 or use layout defaults." },
      { type: "heading2", name: "Heading 2", icon: Heading1, description: "Medium subsection heading.", usage: "Type /heading2 for clean layout nesting." },
      { type: "heading3", name: "Heading 3", icon: Heading1, description: "Small heading for nested topics.", usage: "Type /heading3 for deep hierarchies." },
      { type: "bullet", name: "Bullet List", icon: List, description: "Unordered list with bullet markers. Supports nesting up to 3 levels via tab indent.", usage: "Type /bullet. Press Tab to toggle nested list views." },
      { type: "numbered", name: "Numbered List", icon: ListOrdered, description: "Auto-numbered ordered list with multi-tier nesting mechanics.", usage: "Type /numbered. Press Tab to toggle nested indentation levels." },
      { type: "todo", name: "To-do", icon: CheckSquare, description: "Checklist item with a tickable checkbox. Great for tracking core tasks.", usage: "Type /todo to spawn an interactive task line item." },
      { type: "quote", name: "Quote", icon: Quote, description: "Highlight an important passage with a styled flat left accent border.", usage: "Type /quote to segment a callout passage." },
      { type: "divider", name: "Divider", icon: Minus, description: "Horizontal line to separate explicit content sections cleanly.", usage: "Type /divider to drop a structural breakpoint line." },
      { type: "callout", name: "Callout", icon: Lightbulb, description: "Highlighted component block for warnings, tips, or architectural notes.", usage: "Type /callout to insert a spotlight tracking window." },
      { type: "code", name: "Code Block", icon: Code2, description: "Monospaced editor block with language syntax highlighting rules.", usage: "Type /code to initialize your formatting framework." },
    ],
  },
  {
    title: "Media & Embeds",
    description: "Bring in images, video, audio, files, and third-party responsive viewframes.",
    blocks: [
      { type: "image", name: "Image", icon: ImageIcon, description: "Embed media files from local storage uploads or secure network URLs.", usage: "Type /image to mount a visual asset holder." },
      { type: "video", name: "Video", icon: Video, description: "Embed streaming media frames from YouTube, Vimeo, or direct raw source targets.", usage: "Type /video to spin up a video target window." },
      { type: "audio", name: "Audio", icon: Music, description: "Embed native audio player mechanics for standard recording or asset streaming clips.", usage: "Type /audio to mount an sound node frame." },
      { type: "file", name: "File", icon: File, description: "Attach documents directly with full filename metadata indicators.", usage: "Type /file to assign a localized file asset hook." },
      { type: "bookmark", name: "Bookmark", icon: Bookmark, description: "Rich URL link preview card framing asset title and site tracking descriptions.", usage: "Type /bookmark to render explicit remote hyper-links." },
      { type: "embed", name: "Embed", icon: Globe, description: "Inline integration for responsive Spotify, X, Figma, or custom web iframe layouts.", usage: "Type /embed to map external platform nodes." },
      { type: "gallery", name: "Gallery", icon: GalleryHorizontal, description: "Grid canvas structure displaying responsive image layouts with sub-captions.", usage: "Type /gallery to configure multiple structural image frames." },
    ],
  },
  {
    title: "Data & Analysis",
    description: "Structured data models, charts, and table engines for variable tracking.",
    blocks: [
      { type: "table", name: "Table", icon: TableIcon, description: "Flat grid model mapping rows and columns with custom data parsing configurations.", usage: "Type /table to build static analytical grids." },
      { type: "chart", name: "Chart", icon: BarChart3, description: "Render dynamic bar, line, pie, or radar chart visualizations mapped to database nodes.", usage: "Type /chart to bind schema properties visually." },
      { type: "progress", name: "Progress Bar", icon: CheckSquare, description: "Visual completion slider tracing values mapped across a solid baseline track.", usage: "Type /progress to track pipeline states." },
      { type: "rating", name: "Rating", icon: Star, description: "Interactive star value metric tracing product evaluation matrices.", usage: "Type /rating to mount numerical appraisal loops." },
    ],
  },
  {
    title: "Layout & Formatting",
    description: "Organize layout blocks with structured columns, toggles, and split grids.",
    blocks: [
      { type: "columns", name: "Columns", icon: Columns, description: "Multi-column layout structure framing nested tracking panels side-by-side.", usage: "Type /columns to split code canvas segments." },
      { type: "toggle", name: "Toggle", icon: ChevronRight, description: "Collapsible component hiding dense sub-text until explicit expansion is requested.", usage: "Type /toggle to fold sub-tier notes logic." },
      { type: "tabs", name: "Tabs", icon: Layers, description: "Iterate across block groupings under clean horizontal menu buttons.", usage: "Type /tabs to establish tabular view controls." },
      { type: "steps", name: "Steps", icon: ListChecks, description: "Sequential timeline item stack grouping tracking records to validation states.", usage: "Type /steps to document precise setup guides." },
      { type: "labeledDivider", name: "Labeled Divider", icon: SeparatorHorizontal, description: "Structural baseline breakpoint framing central tracking text parameters.", usage: "Type /labeledDivider to organize content breaks." },
      { type: "imageText", name: "Image + Text", icon: ImagePlus, description: "Split layout element pairing visual components with descriptions side-by-side.", usage: "Type /imageText to initiate asymmetrical presentation sections." },
    ],
  },
  {
    title: "Productivity & Strategy",
    description: "Advanced planning boards, custom timelines, and diagnostic evaluation matrix modules.",
    blocks: [
      { type: "kanban", name: "Kanban Board", icon: Trello, description: "Drag-and-drop task workflow module grouping system column card matrices.", usage: "Type /kanban to render full task pipelines." },
      { type: "timeline", name: "Timeline", icon: Calendar, description: "Vertical roadmap item array pairing chronologically organized project tracking notes.", usage: "Type /timeline to document sprint history." },
      { type: "faq", name: "FAQ", icon: FaqIcon, description: "Accordion interface component parsing structured query and answer tracking nodes.", usage: "Type /faq to construct reference catalogs." },
      { type: "swot", name: "SWOT Analysis", icon: Grid3x3, description: "Four-quadrant matrix plotting internal Strengths, Weaknesses, Opportunities, and Threats.", usage: "Type /swot to format structural review modules." },
      { type: "comparisonTable", name: "Comparison Table", icon: Rows, description: "Evaluates multi-item structures side-by-side with boolean verification columns.", usage: "Type /comparisonTable to review system specs." },
      { type: "flashcard", name: "Flashcards", icon: Layers, description: "Two-sided utility panel flipping data states for study evaluation loops.", usage: "Type /flashcard to design active retention items." },
      { type: "mindmap", name: "Mind Map", icon: Network, description: "Interactive canvas layout tracking relational tree nodes and architecture paths.", usage: "Type /mindmap to spawn relational structure node paths." },
      { type: "equation", name: "Equation", icon: Sigma, description: "High-contrast KaTeX execution environment rendering technical mathematical notation.", usage: "Type /equation to process complex formula logic." },
    ],
  },
];

const systemFeatures: FeatureDoc[] = [
  {
    name: "Find & Replace Engine",
    shortcut: "Ctrl + F / Ctrl + R",
    description: "Natively traces the dynamic content stack to update targeted text loops without altering fundamental block IDs.",
    icon: Search,
    uiLocation: "Note Workspace Canvas"
  },
  {
    name: "Multi-Format Export",
    shortcut: "Export Option",
    description: "Compiles local node trees into highly structured, clean static payloads for HTML, PDF, raw text, or Markdown.",
    icon: Download,
    uiLocation: "Document Actions Menu Bar"
  },
  {
    name: "Active Study Viewframe",
    shortcut: "Read Study Mode Menu",
    description: "Launches an immersive active-retention terminal directly over any flashcard deck interface to sequence card items.",
    icon: GraduationCap,
    uiLocation: "Flashcard Deck Header Bar"
  },
  {
    name: "Table-to-Chart Hotlink",
    shortcut: "Link Chart Action",
    description: "Instantly pairs linear data sets to customizable data visualization charts directly from a layout trigger.",
    icon: BarChart3,
    uiLocation: "Table Element Footer Block"
  },
  {
    name: "Storage Purge Framework",
    shortcut: "Clear Storage Utility",
    description: "Hard resets local browser storage buffers and runtime data indices to initialize a pristine application state.",
    icon: RefreshCw,
    uiLocation: "System Settings Workspace Menu"
  },
  {
    name: "Backup Portability Modules",
    shortcut: "Import / Export Backups",
    description: "Assembles or extracts entire local note structures, custom files, and tags out of single raw configuration data strings.",
    icon: Sliders,
    uiLocation: "System Settings Workspace Menu"
  }
];

const sections = [
  { icon: FileText, title: "Getting Started", description: "Initialize workspace parameters and map your environment.", links: ["Create your first note", "Sidebar navigation", "Folders & tags", "Search Framework"] },
  { icon: Zap, title: "Editor Essentials", description: "Master the structure of flat block layout architecture.", links: ["Slash Commands Menu", "Tab-Driven Nesting", "Markdown Interop", "Drag Logic"] },
];

const categoryAccents = [
  { bg: "bg-emerald-500/5", icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", ring: "hover:border-emerald-500/40", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/5", icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400", ring: "hover:border-amber-500/40", dot: "bg-amber-500" },
  { bg: "bg-sky-500/5", icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400", ring: "hover:border-sky-500/40", dot: "bg-sky-500" },
  { bg: "bg-violet-500/5", icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400", ring: "hover:border-violet-500/40", dot: "bg-violet-500" },
  { bg: "bg-rose-500/5", icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400", ring: "hover:border-rose-500/40", dot: "bg-rose-500" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Documentation = () => {
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [nestingLevels, setNestingLevels] = useState<{ [key: string]: number }>({});
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const allBlocks = useMemo(() => {
    return blockCategories.flatMap(c => c.blocks);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return blockCategories;
    const q = query.toLowerCase();
    return blockCategories
      .map((c) => ({
        ...c,
        blocks: c.blocks.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.type.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.blocks.length > 0);
  }, [query]);

  const filteredFeatures = useMemo(() => {
    if (!query.trim()) return systemFeatures;
    const q = query.toLowerCase();
    return systemFeatures.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.description.toLowerCase().includes(q) ||
      f.uiLocation.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredSlashBlocks = useMemo(() => {
    if (!menuFilter.trim()) return allBlocks;
    return allBlocks.filter(b => 
      b.name.toLowerCase().includes(menuFilter.toLowerCase()) || 
      b.type.toLowerCase().includes(menuFilter.toLowerCase())
    );
  }, [menuFilter, allBlocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setMenuFilter("");
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const handleListKeyDown = (e: React.KeyboardEvent, blockType: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setNestingLevels(prev => {
        const currentLevel = prev[blockType] || 0;
        const nextLevel = currentLevel >= 3 ? 0 : currentLevel + 1;
        return { ...prev, [blockType]: nextLevel };
      });
    }
  };

  const totalBlocks = allBlocks.length;

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto overflow-x-hidden antialiased">
      
      {/* High Contrast Flat Header Structure */}
      <div className="relative border-b border-border/40 bg-card/30 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-12">
            <Link 
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors shadow-xs" 
              href="/"
            >
              <ArrowLeft className="h-3.5 w-3.5"/>
              Back to Ploopus
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary border border-primary text-primary-foreground px-4 py-1.5 text-xs font-medium hover:bg-primary/95 transition-all shadow-xs"
              >
                <span>Trigger Menu Layout ( / )</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-[11px] font-mono text-muted-foreground shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                v1.3.0 · Table Matrix Stack
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 rounded bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-widest uppercase mb-4">
                <Sparkles className="h-3 w-3"/>
                System Matrix Schema
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4 leading-[1.15]">
                Refined Document Building.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                An active technical catalog containing your real system building blocks and workspace engine routines. Type <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs border border-border/50">/</code> to execute interactive context selection frames or test structural nested list layouts natively.
              </p>
            </div>
            
            <div className="hidden lg:grid grid-cols-2 gap-2 border border-border/50 bg-background p-2.5 rounded-xl shadow-xs">
              <div className="p-3 border border-border/30 bg-card rounded-lg text-center">
                <div className="text-xl font-black text-foreground font-mono tracking-tight">{totalBlocks}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Blocks Map</div>
              </div>
              <div className="p-3 border border-border/30 bg-card rounded-lg text-center">
                <div className="text-xl font-black text-foreground font-mono tracking-tight">{systemFeatures.length}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Routines</div>
              </div>
            </div>
          </div>

          <div className="mt-10 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query blocks, actions, core hotkeys, engine parameters..."
              className="w-full rounded-xl border border-border/60 bg-background pl-11 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10 transition-all shadow-xs"
            />
            {query ? (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-xs">
                <Command className="h-3 w-3"/>K
              </kbd>
            )}
          </div>

        </div>
      </div>

      {/* Main Structural Navigation Framing Container */}
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-16">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
          
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
                  Scope Sections
                </p>
                <ul className="space-y-1.5">
                  <li><a href="#topics" className="text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5">Layout Workspace</a></li>
                  <li><a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5">Workspace Operations</a></li>
                  <li><a href="#blocks" className="text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5">Component Matrix</a></li>
                  <li><a href="#help" className="text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5">Support Terminals</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
                  Engine Modules
                </p>
                <ul className="space-y-1.5">
                  {blockCategories.map((c, i) => (
                    <li key={c.title}>
                      <a href={`#${slug(c.title)}`} className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5">
                        <span className={`h-1 w-1 rounded-full ${categoryAccents[i % categoryAccents.length].dot}`} />
                        <span className="truncate">{c.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <div className="space-y-24 min-w-0">
            
            {/* Quickstart Workspace Topics Framework */}
            <section id="topics">
              <div className="mb-6">
                <h2 className="text-sm uppercase tracking-wider font-black text-foreground">Topics Workspace</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {sections.map((section, i) => (
                  <div key={section.title} className="rounded-xl border border-border/40 bg-card p-5 transition-colors shadow-xs">
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${categoryAccents[i % categoryAccents.length].icon}`}>
                        <section.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground tracking-tight">{section.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{section.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 border-t border-border/30 pt-3">
                      {section.links.map((link) => (
                        <li key={link}>
                          <a href="#" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-between py-0.5 group">
                            <span>{link}</span>
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* REDESIGNED: High Visibility Workspace Utilities Micro-Matrix */}
            <section id="features" className="border-t border-border/30 pt-16 scroll-mt-16">
              <div className="mb-8">
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground mb-1">Workspace Operations Ledger</h2>
                <p className="text-xs text-muted-foreground">Built-in operations, dynamic mutations, and runtime parameters engineered for the editor canvas layer.</p>
              </div>

              {filteredFeatures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-xs font-mono text-muted-foreground">
                  No execution features match your tracking filters.
                </div>
              ) : (
                <div className="border border-border/60 bg-card rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/50 font-mono text-[10px] uppercase text-muted-foreground tracking-wider">
                          <th className="py-3 px-4 font-bold min-w-50">Core System Engine</th>
                          <th className="py-3 px-4 font-bold min-w-32.5">Trigger Key / Path</th>
                          <th className="py-3 px-4 font-bold min-w-65">Behavior Mapping Description</th>
                          <th className="py-3 px-4 font-bold min-w-40 text-right">UI Anchor Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-normal text-muted-foreground">
                        {filteredFeatures.map((feat) => {
                          const FeatIcon = feat.icon;
                          return (
                            <tr key={feat.name} className="hover:bg-muted/20 transition-colors">
                              {/* Engine Name Column */}
                              <td className="py-3.5 px-4 font-semibold text-foreground">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <FeatIcon className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="truncate">{feat.name}</span>
                                </div>
                              </td>
                              {/* Trigger Macro Column */}
                              <td className="py-3.5 px-4">
                                {feat.shortcut ? (
                                  <span className="font-mono text-[10px] font-bold bg-muted border border-border/80 rounded px-1.5 py-0.5 text-foreground shadow-2xs">
                                    {feat.shortcut}
                                  </span>
                                ) : (
                                  <span className="text-[11px] italic text-muted-foreground/60">—</span>
                                )}
                              </td>
                              {/* Behavior Mapping Description Column */}
                              <td className="py-3.5 px-4 text-[11px] leading-relaxed max-w-sm">
                                {feat.description}
                              </td>
                              {/* UI Location Target Context Column */}
                              <td className="py-3.5 px-4 font-mono text-[10px] text-right text-foreground font-medium">
                                {feat.uiLocation}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Master Document Schema Processing Stack */}
            <section id="blocks" className="border-t border-border/30 pt-16">
              <div className="mb-12">
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground mb-1">Standard Structural Nodes</h2>
                <p className="text-xs text-muted-foreground">Comprehensive system records of compiled block parameters ready for execution schemas.</p>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center shadow-xs">
                  <Search className="h-5 w-5 text-muted-foreground mx-auto mb-2"/>
                  <p className="text-xs text-muted-foreground font-mono">Zero entries found within requested scope filters.</p>
                </div>
              ) : (
                <div className="space-y-16">
                  {filteredCategories.map((cat) => {
                    const accent = categoryAccents[blockCategories.findIndex((c) => c.title === cat.title) % categoryAccents.length];
                    return (
                      <div key={cat.title} id={slug(cat.title)} className="scroll-mt-16">
                        <div className="flex items-center gap-2.5 mb-6 border-b border-border/20 pb-3">
                          <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">{cat.title}</h3>
                          <span className="text-[9px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50 ml-1 shadow-xs">
                            {cat.blocks.length} Schema Elements
                          </span>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {cat.blocks.map((block) => {
                            const Icon = block.icon;
                            const currentNest = nestingLevels[block.type] || 0;
                            const isListElement = block.type === "bullet" || block.type === "numbered";

                            return (
                              <div
                                key={block.type}
                                tabIndex={isListElement ? 0 : undefined}
                                onKeyDown={(e) => isListElement && handleListKeyDown(e, block.type)}
                                className={`group relative rounded-xl border border-border/50 bg-card p-4.5 transition-all focus:outline-none focus:ring-1 focus:ring-primary/40 outline-none shadow-xs ${accent.ring}`}
                                style={{
                                  paddingLeft: isListElement ? `${18 + currentNest * 14}px` : '18px',
                                  transition: 'padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              >
                                <div>
                                  <div className="flex items-start gap-3 mb-3.5">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent.icon}`}>
                                      <Icon className="h-4 w-4"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5 tracking-tight">
                                        {block.name}
                                        {isListElement && currentNest > 0 && (
                                          <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 rounded font-mono font-bold">Nesting Level {currentNest}</span>
                                        )}
                                      </h4>
                                      <code className="text-[10px] text-muted-foreground font-mono">/{block.type}</code>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-12 line-clamp-3">
                                    {block.description}
                                  </p>
                                  <div className="pt-2.5 border-t border-border/30">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                      <span className="font-semibold text-foreground">Action Link: </span>
                                      {isListElement ? `${block.usage} (Focus Card + Tap Tab to Cycle Level)` : block.usage}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Assistance Terminal Node */}
            <section id="help" className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary tracking-widest uppercase mb-3">
                  <HelpCircle className="h-3 w-3"/> Helpdesk Terminal
                </div>
                <h2 className="text-sm font-bold text-foreground tracking-tight mb-1">Additional Framework Inquiries?</h2>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Open structural support requests to cross-examine template behavior parameters across standard nodes.</p>
                <div className="flex justify-center gap-2">
                  <a href="mailto:cursorbits@gmail.com" className="rounded-lg bg-primary border border-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors shadow-xs">Contact Desk</a>
                  <a href="https://www.youtube.com/@CursorBits" className="rounded-lg border border-border/80 bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs">See on youtube</a>
                </div>
              </div>
            </section>

            <footer className="text-center text-[10px] font-mono text-muted-foreground border-t border-border/20 pt-6">
              Ploopus Workspace Indexing Matrix Framework Engine
            </footer>
          </div>
        </div>
      </div>

      {/* Dynamic Popover Context Slash Menu Matrix */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/30 backdrop-blur-xs">
            <motion.div
              ref={slashMenuRef}
              initial={{ opacity: 0, scale: 0.98, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="w-full max-w-lg rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden flex flex-col max-h-100"
            >
              <div className="flex items-center gap-2 border-b border-border/50 px-3.5 py-3 bg-muted/40">
                <span className="text-sm font-mono font-black text-primary">/</span>
                <input 
                  type="text"
                  autoFocus
                  value={menuFilter}
                  onChange={(e) => setMenuFilter(e.target.value)}
                  placeholder="Type an operational block path parameter..."
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button 
                  onClick={() => { setIsMenuOpen(false); setMenuFilter(""); }}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                {filteredSlashBlocks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                    Zero registered blueprint matrix profiles matched
                  </div>
                ) : (
                  filteredSlashBlocks.map((block) => {
                    const ItemIcon = block.icon;
                    return (
                      <button
                        key={`menu-${block.type}`}
                        onClick={() => {
                          setQuery(block.name);
                          setIsMenuOpen(false);
                          setMenuFilter("");
                          setTimeout(() => {
                            const elem = document.getElementById(block.type);
                            elem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 80);
                        }}
                        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left hover:bg-muted group transition-colors focus:outline-none focus:bg-muted"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <ItemIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground leading-none">{block.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-1">/{block.type}</div>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-1 group-hover:translate-x-0"/>
                      </button>
                    );
                  })
                )}
              </div>
              
              <div className="border-t border-border/40 px-3.5 py-2 bg-muted/20 text-[9px] font-mono text-muted-foreground flex items-center justify-between">
                <span>Select a node row item to anchor search query parsing parameters</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Documentation;