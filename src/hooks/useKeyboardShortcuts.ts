// ============= Keyboard Shortcuts Hook =============
// Handles global keyboard shortcuts for the editor

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onEscape?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onDelete,
  onCopy,
  onPaste,
  onEscape,
  onNudge,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Check if user is typing in an input or contenteditable
    const target = e.target as HTMLElement;
    const isEditing = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + Z: Undo
    if (modifier && e.key === 'z' && !e.shiftKey) {
      if (!isEditing && onUndo) {
        e.preventDefault();
        onUndo();
      }
      return;
    }

    // Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y: Redo
    if ((modifier && e.key === 'z' && e.shiftKey) || (modifier && e.key === 'y')) {
      if (!isEditing && onRedo) {
        e.preventDefault();
        onRedo();
      }
      return;
    }

    // Ctrl/Cmd + S: Save
    if (modifier && e.key === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Delete/Backspace: Delete selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
      e.preventDefault();
      onDelete?.();
      return;
    }

    // Escape: Deselect/Cancel
    if (e.key === 'Escape') {
      onEscape?.();
      return;
    }

    // Arrow keys: Nudge
    if (!isEditing && onNudge) {
      const nudgeAmount = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onNudge(0, -nudgeAmount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          onNudge(0, nudgeAmount);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNudge(-nudgeAmount, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNudge(nudgeAmount, 0);
          break;
      }
    }

    // Ctrl/Cmd + C: Copy
    if (modifier && e.key === 'c' && !isEditing) {
      onCopy?.();
      return;
    }

    // Ctrl/Cmd + V: Paste
    if (modifier && e.key === 'v' && !isEditing) {
      onPaste?.();
      return;
    }
  }, [enabled, onUndo, onRedo, onSave, onDelete, onCopy, onPaste, onEscape, onNudge]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
