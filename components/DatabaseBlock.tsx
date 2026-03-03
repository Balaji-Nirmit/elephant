"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Type,
  Calendar,
  CheckSquare,
  Hash,
  GripVertical,
  BarChart3,
} from "lucide-react";
import { NoteBlock } from "@/lib/types";

interface DatabaseBlockProps {
  block: NoteBlock;
  onUpdate: (updates: Partial<NoteBlock>) => void;
  onCreateChart?: (chartData: { columns: any[]; rows: any[] }) => void;
}

const columnTypeIcons = {
  text: <Type className="w-3 h-3" />,
  number: <Hash className="w-3 h-3" />,
  date: <Calendar className="w-3 h-3" />,
  checkbox: <CheckSquare className="w-3 h-3" />,
  select: <div className="w-3 h-3 text-xs">▼</div>,
};

const columnTypeOptions = [
  { value: "text", label: "Text", icon: <Type className="w-3 h-3" /> },
  { value: "number", label: "Number", icon: <Hash className="w-3 h-3" /> },
  { value: "date", label: "Date", icon: <Calendar className="w-3 h-3" /> },
  { value: "checkbox", label: "Checkbox", icon: <CheckSquare className="w-3 h-3" /> },
  { value: "select", label: "Select", icon: <div className="text-xs">▼</div> },
];

const DatabaseBlock = ({ block, onUpdate, onCreateChart }: DatabaseBlockProps) => {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const databaseColumns = block.databaseColumns || [];
  const databaseRows = block.databaseRows || [];

  const addColumn = (type: "text" | "number" | "date" | "checkbox" | "select" = "text") => {
    const newColumn = {
      id: crypto.randomUUID(),
      name: `Column ${databaseColumns.length + 1}`,
      type,
    };

    // Add new column to all existing rows
    const newRows = databaseRows.map((row) => ({
      ...row,
      cells: { ...row.cells, [newColumn.id]: "" },
    }));

    onUpdate({
      databaseColumns: [...databaseColumns, newColumn],
      databaseRows: newRows.length > 0 ? newRows : databaseRows,
    });

    setShowColumnMenu(false);
  };

  const deleteColumn = (columnId: string) => {
    const newColumns = databaseColumns.filter((col) => col.id !== columnId);
    const newRows = databaseRows.map((row) => {
      const newCells = { ...row.cells };
      delete newCells[columnId];
      return { ...row, cells: newCells };
    });

    onUpdate({
      databaseColumns: newColumns,
      databaseRows: newRows,
    });
  };

  const updateColumnName = (columnId: string, newName: string) => {
    const newColumns = databaseColumns.map((col) =>
      col.id === columnId ? { ...col, name: newName } : col
    );
    onUpdate({ databaseColumns: newColumns });
    setEditingColumnId(null);
  };

  const addRow = () => {
    const newRow = {
      id: crypto.randomUUID(),
      cells: databaseColumns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {}),
    };
    onUpdate({ databaseRows: [...databaseRows, newRow] });
  };

  const deleteRow = (rowIndex: number) => {
    const newRows = databaseRows.filter((_, i) => i !== rowIndex);
    onUpdate({ databaseRows: newRows });
  };

  const updateCell = (rowIndex: number, columnId: string, value: any) => {
    const newRows = [...databaseRows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      cells: { ...newRows[rowIndex].cells, [columnId]: value },
    };
    onUpdate({ databaseRows: newRows });
  };

  const handleCreateChart = () => {
    if (onCreateChart) {
      onCreateChart({
        columns: databaseColumns,
        rows: databaseRows,
      });
    }
  };

  return (
    <div className="py-3 space-y-3">
      {/* Column Management Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Columns</h3>
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add column
          </button>

          <AnimatePresence>
            {showColumnMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-10"
              >
                {columnTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => addColumn(type.value as any)}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Column Headers */}
      {databaseColumns.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-2 space-y-1">
          {databaseColumns.map((col) => (
            <div
              key={col.id}
              className="flex items-center gap-2 p-2 bg-background rounded border border-border group/col hover:border-primary/30 transition-colors"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
              {columnTypeIcons[col.type as keyof typeof columnTypeIcons]}

              {editingColumnId === col.id ? (
                <input
                  autoFocus
                  value={editingColumnName}
                  onChange={(e) => setEditingColumnName(e.target.value)}
                  onBlur={() => updateColumnName(col.id, editingColumnName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateColumnName(col.id, editingColumnName);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs font-medium bg-transparent outline-none border-b border-primary"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingColumnId(col.id);
                    setEditingColumnName(col.name);
                  }}
                  className="flex-1 text-left px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/50 rounded transition-colors"
                >
                  {col.name}
                </button>
              )}

              <span className="text-[10px] text-muted-foreground opacity-0 group-hover/col:opacity-100 transition-opacity">
                {col.type}
              </span>

              <button
                onClick={() => deleteColumn(col.id)}
                className="opacity-0 group-hover/col:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Database Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {databaseColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-sm font-semibold border-r border-border last:border-r-0"
                >
                  <div className="flex items-center gap-2">
                    {columnTypeIcons[col.type as keyof typeof columnTypeIcons]}
                    <span>{col.name}</span>
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {databaseRows.map((row, rowIndex) => (
              <tr key={row.id} className="border-t border-border group/dbrow hover:bg-muted/30 transition-colors">
                {databaseColumns.map((col) => (
                  <td key={col.id} className="px-3 py-2 border-r border-border last:border-r-0">
                    {col.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={row.cells[col.id] === "true"}
                        onChange={(e) =>
                          updateCell(rowIndex, col.id, e.target.checked.toString())
                        }
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    ) : col.type === "date" ? (
                      <input
                        type="date"
                        value={row.cells[col.id] || ""}
                        onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                        className="w-full text-sm bg-transparent outline-none focus:bg-muted rounded px-1"
                      />
                    ) : col.type === "select" ? (
                      <select
                        value={row.cells[col.id] || ""}
                        onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                        className="w-full text-sm bg-transparent outline-none focus:bg-muted rounded px-1"
                      >
                        <option value="">Select...</option>
                        <option value="Option 1">Option 1</option>
                        <option value="Option 2">Option 2</option>
                        <option value="Option 3">Option 3</option>
                      </select>
                    ) : (
                      <input
                        type={col.type === "number" ? "number" : "text"}
                        value={row.cells[col.id] || ""}
                        onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                        className="w-full text-sm bg-transparent outline-none focus:bg-muted rounded px-1"
                        placeholder="..."
                      />
                    )}
                  </td>
                ))}
                <td className="opacity-0 group-hover/dbrow:opacity-100">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="p-1 hover:bg-destructive/10 rounded transition-all"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add row
        </button>
        {databaseRows.length > 0 && databaseColumns.length > 0 && (
          <button
            onClick={handleCreateChart}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            <BarChart3 className="w-3 h-3" />
            Create chart
          </button>
        )}
      </div>
    </div>
  );
};

export default DatabaseBlock;
