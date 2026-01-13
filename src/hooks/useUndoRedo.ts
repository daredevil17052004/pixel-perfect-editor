// ============= Undo/Redo Hook =============
// History management with snapshots

import { useState, useCallback } from 'react';
import { HistorySnapshot, HistoryState, UseUndoRedoReturn } from '@/types/editing';

const MAX_HISTORY_SIZE = 50;

const initialState: HistoryState = {
  past: [],
  future: [],
  maxHistorySize: MAX_HISTORY_SIZE,
};

export function useUndoRedo(
  onApplySnapshot?: (snapshot: HistorySnapshot, isUndo: boolean) => void
): UseUndoRedoReturn {
  const [history, setHistory] = useState<HistoryState>(initialState);

  const pushSnapshot = useCallback((snapshot: Omit<HistorySnapshot, 'id' | 'timestamp'>) => {
    const fullSnapshot: HistorySnapshot = {
      ...snapshot,
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newPast = [...prev.past, fullSnapshot];
      // Keep only last N snapshots
      if (newPast.length > prev.maxHistorySize) {
        newPast.shift();
      }
      return {
        ...prev,
        past: newPast,
        future: [], // Clear redo stack on new action
      };
    });

    console.log('[UndoRedo] Pushed snapshot:', fullSnapshot.action);
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const snapshot = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      if (onApplySnapshot) {
        onApplySnapshot(snapshot, true);
      }

      console.log('[UndoRedo] Undo:', snapshot.action);

      return {
        ...prev,
        past: newPast,
        future: [snapshot, ...prev.future],
      };
    });
  }, [onApplySnapshot]);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const snapshot = prev.future[0];
      const newFuture = prev.future.slice(1);

      if (onApplySnapshot) {
        onApplySnapshot(snapshot, false);
      }

      console.log('[UndoRedo] Redo:', snapshot.action);

      return {
        ...prev,
        past: [...prev.past, snapshot],
        future: newFuture,
      };
    });
  }, [onApplySnapshot]);

  const clearHistory = useCallback(() => {
    setHistory(initialState);
    console.log('[UndoRedo] History cleared');
  }, []);

  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    pushSnapshot,
    clearHistory,
  };
}
