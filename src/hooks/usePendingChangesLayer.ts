// ============= Pending Changes Layer Hook =============
// Manages queued changes waiting to sync with debouncing

import { useState, useCallback, useRef, useEffect } from 'react';
import { PendingChange, PendingChangesState, UsePendingChangesLayerReturn } from '@/types/editing';
import { startTiming, endTiming } from '@/lib/performanceMetrics';

const DEBOUNCE_DELAY = 1500; // 1.5 seconds of inactivity before batching
const LOCAL_STORAGE_PREFIX = 'pending_changes_';

const initialState: PendingChangesState = {
  changes: new Map(),
  isDirty: false,
  lastSyncedAt: null,
  syncStatus: 'idle',
};

export function usePendingChangesLayer(designId?: string): UsePendingChangesLayerReturn {
  const [pendingState, setPendingState] = useState<PendingChangesState>(initialState);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const changesMapRef = useRef<Map<string, PendingChange>>(new Map());

  // Backup to localStorage on changes
  useEffect(() => {
    if (!designId || changesMapRef.current.size === 0) return;

    try {
      const serialized = JSON.stringify(Array.from(changesMapRef.current.entries()));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${designId}`, serialized);
    } catch (error) {
      console.warn('[PendingChanges] Failed to backup to localStorage:', error);
    }
  }, [pendingState.changes, designId]);

  // Restore from localStorage on mount
  useEffect(() => {
    if (!designId) return;

    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${designId}`);
      if (stored) {
        const entries = JSON.parse(stored) as Array<[string, PendingChange]>;
        const restoredMap = new Map(entries);
        
        if (restoredMap.size > 0) {
          changesMapRef.current = restoredMap;
          setPendingState(prev => ({
            ...prev,
            changes: new Map(restoredMap),
            isDirty: true,
          }));
          console.log('[PendingChanges] Restored', restoredMap.size, 'pending changes from localStorage');
        }
      }
    } catch (error) {
      console.warn('[PendingChanges] Failed to restore from localStorage:', error);
    }
  }, [designId]);

  const addChange = useCallback((change: Omit<PendingChange, 'timestamp'>) => {
    startTiming('pending_changes_add');
    
    const fullChange: PendingChange = {
      ...change,
      timestamp: Date.now(),
    };

    // Update ref immediately
    changesMapRef.current.set(change.elementId, fullChange);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      // Trigger state update after debounce
      setPendingState(prev => ({
        ...prev,
        changes: new Map(changesMapRef.current),
        isDirty: changesMapRef.current.size > 0,
      }));
      console.log('[PendingChanges] Debounce complete, ready to sync', changesMapRef.current.size, 'changes');
    }, DEBOUNCE_DELAY);

    // Update dirty status immediately
    setPendingState(prev => ({
      ...prev,
      isDirty: true,
    }));

    endTiming('pending_changes_add');
    console.log('[PendingChanges] Added change for element:', change.elementId);
  }, []);

  const getChanges = useCallback((): PendingChange[] => {
    return Array.from(changesMapRef.current.values());
  }, []);

  const clearChanges = useCallback(() => {
    changesMapRef.current.clear();
    
    // Clear localStorage backup
    if (designId) {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${designId}`);
      } catch (error) {
        console.warn('[PendingChanges] Failed to clear localStorage:', error);
      }
    }

    setPendingState({
      changes: new Map(),
      isDirty: false,
      lastSyncedAt: Date.now(),
      syncStatus: 'success',
    });

    console.log('[PendingChanges] Cleared all pending changes');
  }, [designId]);

  const hasChanges = useCallback((): boolean => {
    return changesMapRef.current.size > 0;
  }, []);

  const getSyncStatus = useCallback(() => {
    return pendingState.syncStatus;
  }, [pendingState.syncStatus]);

  const setSyncStatus = useCallback((status: PendingChangesState['syncStatus']) => {
    setPendingState(prev => ({
      ...prev,
      syncStatus: status,
      lastSyncedAt: status === 'success' ? Date.now() : prev.lastSyncedAt,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    pendingState,
    addChange,
    getChanges,
    clearChanges,
    hasChanges,
    getSyncStatus,
  };
}
