import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Shield, AlertTriangle, Zap, Target } from "lucide-react";

interface SwotBlockProps {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  onUpdate: (updates: {
    swotStrengths?: string[];
    swotWeaknesses?: string[];
    swotOpportunities?: string[];
    swotThreats?: string[];
  }) => void;
}

const quadrants = [
  {
    key: "strengths" as const,
    label: "Strengths",
    subtitle: "Internal advantages",
    icon: Shield,
    updateKey: "swotStrengths" as const,
    accentHsl: "142 71% 45%",
    dotClass: "bg-emerald-500",
    iconGradient: "from-emerald-400 to-green-500",
    pillBg: "bg-emerald-500/8 hover:bg-emerald-500/12",
    pillBorder: "border-emerald-500/15",
  },
  {
    key: "weaknesses" as const,
    label: "Weaknesses",
    subtitle: "Areas to improve",
    icon: AlertTriangle,
    updateKey: "swotWeaknesses" as const,
    accentHsl: "38 92% 50%",
    dotClass: "bg-amber-500",
    iconGradient: "from-amber-400 to-orange-500",
    pillBg: "bg-amber-500/8 hover:bg-amber-500/12",
    pillBorder: "border-amber-500/15",
  },
  {
    key: "opportunities" as const,
    label: "Opportunities",
    subtitle: "External potential",
    icon: Zap,
    updateKey: "swotOpportunities" as const,
    accentHsl: "217 91% 60%",
    dotClass: "bg-blue-500",
    iconGradient: "from-blue-400 to-indigo-500",
    pillBg: "bg-blue-500/8 hover:bg-blue-500/12",
    pillBorder: "border-blue-500/15",
  },
  {
    key: "threats" as const,
    label: "Threats",
    subtitle: "External risks",
    icon: Target,
    updateKey: "swotThreats" as const,
    accentHsl: "0 84% 60%",
    dotClass: "bg-rose-500",
    iconGradient: "from-rose-400 to-red-500",
    pillBg: "bg-rose-500/8 hover:bg-rose-500/12",
    pillBorder: "border-rose-500/15",
  },
];

const SwotBlock = ({ strengths, weaknesses, opportunities, threats, onUpdate }: SwotBlockProps) => {
  const data = { strengths, weaknesses, opportunities, threats };
  const [focusedQuadrant, setFocusedQuadrant] = useState<string | null>(null);

  const addItem = (q: typeof quadrants[number]) => {
    onUpdate({ [q.updateKey]: [...data[q.key], ""] });
  };

  const updateItem = (q: typeof quadrants[number], index: number, value: string) => {
    const newItems = [...data[q.key]];
    newItems[index] = value;
    onUpdate({ [q.updateKey]: newItems });
  };

  const removeItem = (q: typeof quadrants[number], index: number) => {
    onUpdate({ [q.updateKey]: data[q.key].filter((_, i) => i !== index) });
  };

  const totalItems = strengths.length + weaknesses.length + opportunities.length + threats.length;

  return (
    <div className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl border border-border/30 shadow-sm"
      >
        {/* Minimal Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-muted to-muted/50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-foreground/70">
                <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">SWOT Analysis</h3>
              <p className="text-[11px] text-muted-foreground/50">{totalItems} items across 4 quadrants</p>
            </div>
          </div>
        </div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-2 gap-px bg-border/20">
          {quadrants.map((q, qi) => {
            const Icon = q.icon;
            const items = data[q.key];
            const isFocused = focusedQuadrant === q.key;

            return (
              <motion.div
                key={q.key}
                className={`relative p-5 bg-card/90 transition-colors duration-300 ${
                  isFocused ? "bg-card" : ""
                }`}
                onMouseEnter={() => setFocusedQuadrant(q.key)}
                onMouseLeave={() => setFocusedQuadrant(null)}
              >
                {/* Subtle corner accent */}
                <div
                  className="absolute top-0 left-0 w-12 h-12 opacity-[0.04] rounded-br-full"
                  style={{ background: `hsl(${q.accentHsl})` }}
                />

                {/* Quadrant Header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${q.iconGradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground tracking-tight">
                      {q.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground/40 leading-none mt-0.5">{q.subtitle}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground/30 tabular-nums">
                    {items.filter(i => i.trim()).length}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 min-h-12">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group/item flex items-center gap-2 rounded-lg px-2.5 py-1.5 -mx-1 hover:bg-muted/40 transition-colors"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${q.dotClass} shrink-0 opacity-60`}
                        />
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem(q, index, e.target.value)}
                          className="flex-1 text-[13px] bg-transparent outline-none text-foreground/90 placeholder:text-muted-foreground/25 leading-snug"
                          placeholder={`Add ${q.label.toLowerCase().slice(0, -1)}…`}
                        />
                        <button
                          onClick={() => removeItem(q, index)}
                          className="p-0.5 rounded-md opacity-0 group-hover/item:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add button */}
                <motion.button
                  onClick={() => addItem(q)}
                  className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${q.pillBg} ${q.pillBorder}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SwotBlock;
