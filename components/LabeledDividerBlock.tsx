import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Star, Circle, Diamond, Sparkles } from "lucide-react";

interface LabeledDividerBlockProps {
  label: string;
  style: string;
  onUpdate: (updates: { dividerLabel?: string; dividerStyle?: string }) => void;
}

const dividerStyles = [
  { id: "simple", label: "Simple" },
  { id: "dashed", label: "Dashed" },
  { id: "dots", label: "Dots" },
  { id: "gradient", label: "Gradient" },
  { id: "fancy", label: "Fancy" },
];

const LabeledDividerBlock = ({ label, style, onUpdate }: LabeledDividerBlockProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const renderLine = (side: "left" | "right") => {
    const baseClass = "flex-1 h-px";
    switch (style) {
      case "dashed":
        return <div className={`${baseClass} border-t border-dashed border-border`} />;
      case "dots":
        return (
          <div className={`${baseClass} flex items-center ${side === "left" ? "justify-end pr-2" : "justify-start pl-2"}`}>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-border" />
              ))}
            </div>
          </div>
        );
      case "gradient":
        return (
          <div className={`${baseClass} bg-gradient-to-${side === "left" ? "r" : "l"} from-transparent via-border to-border`} />
        );
      case "fancy":
        return (
          <div className={`${baseClass} relative`}>
            <div className={`absolute inset-0 bg-gradient-to-${side === "left" ? "r" : "l"} from-transparent to-primary/30`} />
          </div>
        );
      default:
        return <div className={`${baseClass} bg-border`} />;
    }
  };

  const renderDecoration = () => {
    if (style === "fancy") {
      return (
        <div className="flex items-center gap-1.5 mx-1">
          <Diamond className="w-2.5 h-2.5 text-primary/40" />
        </div>
      );
    }
    if (style === "dots") {
      return (
        <div className="flex items-center gap-1 mx-1">
          <Circle className="w-1.5 h-1.5 fill-muted-foreground/30 text-muted-foreground/30" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="py-4 group">
      <div className="flex items-center gap-3">
        {renderLine("left")}
        {renderDecoration()}
        <input
          value={label}
          onChange={(e) => onUpdate({ dividerLabel: e.target.value })}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 bg-transparent border-none outline-none text-center min-w-10 max-w-50 placeholder:text-muted-foreground/30"
          placeholder="LABEL"
          style={{ width: Math.max(40, label.length * 9) }}
        />
        {renderDecoration()}
        {renderLine("right")}
      </div>

      {/* Style picker on hover */}
      <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {showPicker ? (
          <motion.div
            className="flex items-center gap-1 bg-popover border border-border rounded-lg p-1 shadow-lg"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {dividerStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => { onUpdate({ dividerStyle: s.id }); setShowPicker(false); }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  style === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            Change style
          </button>
        )}
      </div>
    </div>
  );
};

export default LabeledDividerBlock;
