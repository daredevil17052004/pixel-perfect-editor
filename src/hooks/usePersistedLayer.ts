// ============= Persisted Layer Hook =============
// Manages Supabase persistence with React Query

import { useState, useCallback } from 'react';
import { DesignDocument, ElementNode } from '@/types/editor';
import { UsePersistedLayerReturn } from '@/types/editing';
import { startTiming, endTiming } from '@/lib/performanceMetrics';
import { toast } from 'sonner';

// Note: This is a local-first implementation
// Full Supabase integration can be added when database tables are created
export function usePersistedLayer(documentId?: string): UsePersistedLayerReturn {
  const [document, setDocument] = useState<DesignDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveDocument = useCallback(async (doc: DesignDocument): Promise<void> => {
    startTiming('save_to_db');
    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay for now
      // In production, this would be a Supabase upsert
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDocument(doc);
      console.log('[PersistedLayer] Document saved:', doc.id);
      
      endTiming('save_to_db');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save document');
      setError(error);
      console.error('[PersistedLayer] Save failed:', error);
      toast.error('Failed to save changes');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateElement = useCallback(async (elementId: string, updates: Partial<ElementNode>): Promise<void> => {
    startTiming('update_element_db');
    
    if (!document) {
      console.warn('[PersistedLayer] No document to update');
      return;
    }

    try {
      // Optimistic update
      const updateNode = (nodes: ElementNode[]): ElementNode[] => {
        return nodes.map((node) => {
          if (node.id === elementId) {
            return { ...node, ...updates };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };

      const updatedDoc = {
        ...document,
        elements: updateNode(document.elements),
      };

      setDocument(updatedDoc);
      
      // In production, this would be a Supabase update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('[PersistedLayer] Element updated:', elementId);
      endTiming('update_element_db');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update element');
      setError(error);
      console.error('[PersistedLayer] Update failed:', error);
      throw error;
    }
  }, [document]);

  const refetch = useCallback(() => {
    // In production, this would refetch from Supabase
    console.log('[PersistedLayer] Refetch triggered');
  }, []);

  return {
    document,
    isLoading,
    error,
    saveDocument,
    updateElement,
    refetch,
  };
}
