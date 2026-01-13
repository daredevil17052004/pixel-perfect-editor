// ============= Local Auto-Save Hook =============
// Automatic localStorage backup to prevent data loss

import { useState, useCallback, useEffect, useRef } from 'react';
import { DesignDocument } from '@/types/editor';
import { LocalDraft, AutoSaveState, UseLocalAutoSaveReturn } from '@/types/editing';
import { toast } from 'sonner';

const DRAFT_PREFIX = 'draft_';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const DRAFT_EXPIRY_DAYS = 7;

const initialState: AutoSaveState = {
  isAutoSaving: false,
  lastAutoSaveAt: null,
  autoSaveInterval: AUTO_SAVE_INTERVAL,
  hasUnsavedChanges: false,
};

export function useLocalAutoSave(designId?: string): UseLocalAutoSaveReturn {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>(initialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const documentRef = useRef<DesignDocument | null>(null);
  const hasChangesRef = useRef<boolean>(false);

  // Save draft to localStorage
  const saveDraft = useCallback((document: DesignDocument) => {
    if (!designId) return;

    documentRef.current = document;
    hasChangesRef.current = true;

    setAutoSaveState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
    }));
  }, [designId]);

  // Perform the actual save
  const performSave = useCallback(() => {
    if (!designId || !documentRef.current || !hasChangesRef.current) return;

    try {
      setAutoSaveState(prev => ({ ...prev, isAutoSaving: true }));

      const draft: LocalDraft = {
        designId,
        document: documentRef.current,
        timestamp: Date.now(),
        expiresAt: Date.now() + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      };

      const key = `${DRAFT_PREFIX}${designId}`;
      localStorage.setItem(key, JSON.stringify(draft));
      
      hasChangesRef.current = false;

      setAutoSaveState(prev => ({
        ...prev,
        isAutoSaving: false,
        lastAutoSaveAt: Date.now(),
        hasUnsavedChanges: false,
      }));

      console.log('[LocalAutoSave] Draft saved for:', designId);
    } catch (error) {
      console.error('[LocalAutoSave] Failed to save draft:', error);
      
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error('Local storage full. Some drafts may be lost.');
        clearOldDrafts();
      }

      setAutoSaveState(prev => ({ ...prev, isAutoSaving: false }));
    }
  }, [designId]);

  // Load draft from localStorage
  const loadDraft = useCallback((id: string): LocalDraft | null => {
    try {
      const key = `${DRAFT_PREFIX}${id}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;

      const draft = JSON.parse(stored) as LocalDraft;
      
      // Check if expired
      if (draft.expiresAt < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }

      console.log('[LocalAutoSave] Loaded draft for:', id);
      return draft;
    } catch (error) {
      console.error('[LocalAutoSave] Failed to load draft:', error);
      return null;
    }
  }, []);

  // Clear specific draft
  const clearDraft = useCallback((id: string) => {
    try {
      const key = `${DRAFT_PREFIX}${id}`;
      localStorage.removeItem(key);
      console.log('[LocalAutoSave] Cleared draft for:', id);
    } catch (error) {
      console.error('[LocalAutoSave] Failed to clear draft:', error);
    }
  }, []);

  // Clear old expired drafts
  const clearOldDrafts = useCallback(() => {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const draft = JSON.parse(stored) as LocalDraft;
              if (draft.expiresAt < now) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid draft, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[LocalAutoSave] Cleared', keysToRemove.length, 'old drafts');
    } catch (error) {
      console.error('[LocalAutoSave] Failed to clear old drafts:', error);
    }
  }, []);

  // Setup auto-save interval
  useEffect(() => {
    if (!designId) return;

    // Clear old drafts on mount
    clearOldDrafts();

    // Setup interval
    intervalRef.current = setInterval(() => {
      if (hasChangesRef.current) {
        performSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save on unmount if there are unsaved changes
      if (hasChangesRef.current) {
        performSave();
      }
    };
  }, [designId, performSave, clearOldDrafts]);

  // Check for existing draft and offer recovery
  useEffect(() => {
    if (!designId) return;

    const existingDraft = loadDraft(designId);
    if (existingDraft) {
      // Compare with persisted version would happen here
      // For now, just log that a draft exists
      console.log('[LocalAutoSave] Found existing draft from:', new Date(existingDraft.timestamp));
    }
  }, [designId, loadDraft]);

  return {
    autoSaveState,
    saveDraft,
    loadDraft,
    clearDraft,
    clearOldDrafts,
  };
}
