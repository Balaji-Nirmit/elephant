import { useState, useCallback, useRef } from "react";
import { NoteBlock } from "@/contexts/NotesContext";

interface HistoryState {
  blocks: NoteBlock[];
  timestamp: number;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export const useUndoRedo = (
  initialBlocks: NoteBlock[],
  options: UseUndoRedoOptions = {}
) => {
  const { maxHistorySize = 50, debounceMs = 500 } = options;
  
  // History stacks
  const [history, setHistory] = useState<HistoryState[]>([
    { blocks: initialBlocks, timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotRef = useRef<string>(JSON.stringify(initialBlocks));
  
  // Check if we can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Push a new state to history (with debouncing for rapid changes)
  const pushState = useCallback((blocks: NoteBlock[], immediate = false) => {
    const blocksString = JSON.stringify(blocks);
    
    // Skip if blocks haven't actually changed
    if (blocksString === lastSnapshotRef.current) {
      return;
    }
    
    const addToHistory = () => {
      lastSnapshotRef.current = blocksString;
      
      setHistory((prev) => {
        // Remove any redo states (everything after current index)
        const newHistory = prev.slice(0, historyIndex + 1);
        
        // Add new state
        newHistory.push({
          blocks: JSON.parse(blocksString),
          timestamp: Date.now()
        });
        
        // Trim history if it exceeds max size
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }
        
        return newHistory;
      });
      
      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    };
    
    if (immediate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      addToHistory();
    } else {
      // Debounce rapid changes
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        addToHistory();
        debounceRef.current = null;
      }, debounceMs);
    }
  }, [historyIndex, maxHistorySize, debounceMs]);
  
  // Undo action
  const undo = useCallback((): NoteBlock[] | null => {
    if (!canUndo) return null;
    
    // Clear any pending debounced pushes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    const state = history[newIndex];
    lastSnapshotRef.current = JSON.stringify(state.blocks);
    
    return state.blocks;
  }, [canUndo, historyIndex, history]);
  
  // Redo action
  const redo = useCallback((): NoteBlock[] | null => {
    if (!canRedo) return null;
    
    // Clear any pending debounced pushes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    const state = history[newIndex];
    lastSnapshotRef.current = JSON.stringify(state.blocks);
    
    return state.blocks;
  }, [canRedo, historyIndex, history]);
  
  // Reset history (e.g., when switching notes)
  const resetHistory = useCallback((blocks: NoteBlock[]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    const blocksString = JSON.stringify(blocks);
    lastSnapshotRef.current = blocksString;
    
    setHistory([{ blocks: JSON.parse(blocksString), timestamp: Date.now() }]);
    setHistoryIndex(0);
  }, []);
  
  // Get current state
  const getCurrentBlocks = useCallback((): NoteBlock[] => {
    return history[historyIndex]?.blocks || [];
  }, [history, historyIndex]);
  
  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    getCurrentBlocks,
    historyLength: history.length,
    currentIndex: historyIndex
  };
};
