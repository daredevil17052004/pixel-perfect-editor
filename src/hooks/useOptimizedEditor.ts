// ============= Optimized Editor Hook =============
// Master hook combining all optimization layers

import { useCallback, useEffect } from 'react';
import { DesignDocument, ElementNode } from '@/types/editor';
import { UseOptimizedEditorReturn, PendingChange, HistorySnapshot } from '@/types/editing';
import { useEditingLayer } from './useEditingLayer';
import { usePendingChangesLayer } from './usePendingChangesLayer';
import { useEditingQueue } from './useEditingQueue';
import { useLocalAutoSave } from './useLocalAutoSave';
import { useUndoRedo } from './useUndoRedo';
import { useIncrementalUpdate } from './useIncrementalUpdate';
import { toast } from 'sonner';

interface UseOptimizedEditorOptions {
  document: DesignDocument | null;
  onDocumentChange: (document: DesignDocument) => void;
  designId?: string;
}

export function useOptimizedEditor({
  document,
  onDocumentChange,
  designId = 'default',
}: UseOptimizedEditorOptions): UseOptimizedEditorReturn {
  // Layer 1: Editing layer (instant, local)
  const editingLayer = useEditingLayer();
  
  // Layer 2: Pending changes (queued, batched)
  const pendingLayer = usePendingChangesLayer(designId);
  
  // Incremental updates
  const { updateSingleElement, batchUpdates } = useIncrementalUpdate({
    document,
    onDocumentChange,
  });

  // Editing queue with debouncing
  const editingQueue = useEditingQueue({
    onSave: async (changes) => {
      // Apply all pending changes
      const updates = changes.map(c => ({
        elementId: c.elementId,
        updates: { textContent: c.content } as Partial<ElementNode>,
      }));
      batchUpdates(updates);
      pendingLayer.clearChanges();
      toast.success('Changes saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  // Local auto-save
  const autoSave = useLocalAutoSave(designId);

  // Undo/Redo with history
  const undoRedo = useUndoRedo((snapshot, isUndo) => {
    const updates = isUndo ? snapshot.before : snapshot.after;
    updateSingleElement(snapshot.elementId, updates);
  });

  // Auto-save document changes
  useEffect(() => {
    if (document) {
      autoSave.saveDraft(document);
    }
  }, [document, autoSave]);

  // Start editing an element
  const startEditing = useCallback((elementId: string, content: string) => {
    editingLayer.startEditing(elementId, content);
  }, [editingLayer]);

  // Stop editing and queue changes
  const stopEditing = useCallback(() => {
    const content = editingLayer.getLocalContent();
    const elementId = editingLayer.editingState.activeElementId;
    
    if (elementId && content) {
      // Add to pending changes
      pendingLayer.addChange({
        elementId,
        content,
        previousContent: '',
        type: 'text',
      });

      // Queue for save
      editingQueue.enqueue({
        type: 'save',
        payload: { elementId, content } as PendingChange,
        retryCount: 0,
        maxRetries: 5,
      });

      // Push to undo stack
      undoRedo.pushSnapshot({
        elementId,
        before: {},
        after: { textContent: content },
        action: 'update',
      });
    }

    editingLayer.stopEditing();
  }, [editingLayer, pendingLayer, editingQueue, undoRedo]);

  // Update content while editing
  const updateContent = useCallback((content: string) => {
    editingLayer.updateLocalContent(content);
  }, [editingLayer]);

  // Force immediate save
  const forceSave = useCallback(async () => {
    await editingQueue.flush();
  }, [editingQueue]);

  // Update element with history tracking
  const updateElement = useCallback((elementId: string, updates: Partial<ElementNode>) => {
    undoRedo.pushSnapshot({
      elementId,
      before: {},
      after: updates,
      action: 'update',
    });
    updateSingleElement(elementId, updates);
  }, [undoRedo, updateSingleElement]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    if (!document) return;
    
    const removeNode = (nodes: ElementNode[]): ElementNode[] => {
      return nodes
        .filter(node => node.id !== elementId)
        .map(node => ({ ...node, children: removeNode(node.children) }));
    };

    onDocumentChange({
      ...document,
      elements: removeNode(document.elements),
    });
  }, [document, onDocumentChange]);

  // Add element
  const addElement = useCallback((element: ElementNode) => {
    if (!document) return;
    
    onDocumentChange({
      ...document,
      elements: [...document.elements, element],
    });
  }, [document, onDocumentChange]);

  return {
    document,
    isLoading: false,
    isSaving: editingQueue.queueState.isProcessing,
    error: null,
    startEditing,
    stopEditing,
    updateContent,
    undo: undoRedo.undo,
    redo: undoRedo.redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    save: forceSave,
    forceSave,
    saveStatus: editingQueue.queueState.isProcessing ? 'saving' : 
                pendingLayer.hasChanges() ? 'idle' : 'saved',
    lastSavedAt: pendingLayer.pendingState.lastSyncedAt,
    activeUsers: [],
    updateElement,
    deleteElement,
    addElement,
  };
}
