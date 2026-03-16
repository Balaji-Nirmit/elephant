import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Minus } from "lucide-react";

interface ComparisonColumn {
  id: string;
  name: string;
  highlighted?: boolean;
}

interface ComparisonRow {
  id: string;
  feature: string;
  values: Record<string, "yes" | "no" | "partial" | string>;
}

interface ComparisonTableBlockProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  onUpdate: (updates: { comparisonColumns?: ComparisonColumn[]; comparisonRows?: ComparisonRow[] }) => void;
}

const ComparisonTableBlock = ({ columns, rows, onUpdate }: ComparisonTableBlockProps) => {
  const addColumn = () => {
    if (columns.length >= 5) return;
    const newCol: ComparisonColumn = { id: crypto.randomUUID(), name: "" };
    const newRows = rows.map(r => ({ ...r, values: { ...r.values, [newCol.id]: "" as const } }));
    onUpdate({ comparisonColumns: [...columns, newCol], comparisonRows: newRows });
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 2) return;
    onUpdate({
      comparisonColumns: columns.filter(c => c.id !== id),
      comparisonRows: rows.map(r => {
        const { [id]: _, ...rest } = r.values;
        return { ...r, values: rest };
      }),
    });
  };

  const addRow = () => {
    const values: Record<string, string> = {};
    columns.forEach(c => { values[c.id] = ""; });
    onUpdate({ comparisonRows: [...rows, { id: crypto.randomUUID(), feature: "", values }] });
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    onUpdate({ comparisonRows: rows.filter(r => r.id !== id) });
  };

  const updateColumnName = (id: string, name: string) => {
    onUpdate({ comparisonColumns: columns.map(c => c.id === id ? { ...c, name } : c) });
  };

  const toggleHighlight = (id: string) => {
    onUpdate({ comparisonColumns: columns.map(c => c.id === id ? { ...c, highlighted: !c.highlighted } : c) });
  };

  const updateFeature = (id: string, feature: string) => {
    onUpdate({ comparisonRows: rows.map(r => r.id === id ? { ...r, feature } : r) });
  };

  const cycleValue = (rowId: string, colId: string) => {
    const current = rows.find(r => r.id === rowId)?.values[colId] || "";
    const cycle = ["yes", "no", "partial", ""];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    onUpdate({
      comparisonRows: rows.map(r =>
        r.id === rowId ? { ...r, values: { ...r.values, [colId]: next } } : r
      ),
    });
  };

  const renderValue = (value: string) => {
    switch (value) {
      case "yes":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          </motion.div>
        );
      case "no":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-red-400" />
          </motion.div>
        );
      case "partial":
        return (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Minus className="w-3.5 h-3.5 text-amber-500" />
          </motion.div>
        );
      default:
        return <div className="w-6 h-6 rounded-full border border-dashed border-border/40" />;
    }
  };

  return (
    <div className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/30 overflow-hidden bg-card/80 backdrop-blur-sm"
      >
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 pb-3 border-b border-border/20 min-w-40">
                  <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Feature</span>
                </th>
                {columns.map((col) => (
                  <th key={col.id} className={`p-4 pb-3 border-b border-border/20 min-w-30 text-center ${col.highlighted ? "bg-primary/5" : ""}`}>
                    <div className="flex flex-col items-center gap-1.5 group/col">
                      <input
                        value={col.name}
                        onChange={(e) => updateColumnName(col.id, e.target.value)}
                        className="text-sm font-semibold text-foreground bg-transparent outline-none text-center w-full placeholder:text-muted-foreground/30"
                        placeholder="Option"
                      />
                      <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleHighlight(col.id)}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${col.highlighted ? "bg-primary/15 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                        >
                          {col.highlighted ? "★" : "☆"}
                        </button>
                        {columns.length > 2 && (
                          <button onClick={() => removeColumn(col.id)} className="text-muted-foreground/30 hover:text-destructive p-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ri * 0.03 }}
                  className="group/row border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        value={row.feature}
                        onChange={(e) => updateFeature(row.id, e.target.value)}
                        className="text-[13px] text-foreground/80 bg-transparent outline-none w-full placeholder:text-muted-foreground/25"
                        placeholder="Feature name…"
                      />
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="opacity-0 group-hover/row:opacity-100 p-0.5 text-muted-foreground/30 hover:text-destructive transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  {columns.map((col) => (
                    <td key={col.id} className={`p-3 text-center ${col.highlighted ? "bg-primary/5" : ""}`}>
                      <button
                        onClick={() => cycleValue(row.id, col.id)}
                        className="mx-auto flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        title="Click to cycle: ✓ → ✗ → ◐ → empty"
                      >
                        {renderValue(row.values[col.id] || "")}
                      </button>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border/15 bg-muted/10">
          <button onClick={addRow} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <Plus className="w-3 h-3" /> Add row
          </button>
          {columns.length < 5 && (
            <button onClick={addColumn} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Plus className="w-3 h-3" /> Add column
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ComparisonTableBlock;
