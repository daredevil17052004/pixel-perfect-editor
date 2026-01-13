// ============= Incremental Update Hook =============
// Updates only changed elements instead of full document

import { useCallback } from 'react';
import { ElementNode, DesignDocument } from '@/types/editor';
import { UseIncrementalUpdateReturn } from '@/types/editing';
import { startTiming, endTiming } from '@/lib/performanceMetrics';

interface UseIncrementalUpdateOptions {
  document: DesignDocument | null;
  onDocumentChange: (document: DesignDocument) => void;
}

export function useIncrementalUpdate({ 
  document, 
  onDocumentChange 
}: UseIncrementalUpdateOptions): UseIncrementalUpdateReturn {
  
  // Update a single element efficiently
  const updateSingleElement = useCallback((
    elementId: string, 
    updates: Partial<ElementNode>
  ) => {
    if (!document) {
      console.warn('[IncrementalUpdate] No document to update');
      return;
    }

    startTiming('incremental_update');

    // Use map to update only the target element
    const updateNode = (nodes: ElementNode[]): ElementNode[] => {
      return nodes.map((node) => {
        if (node.id === elementId) {
          // Merge updates into existing node
          return { 
            ...node, 
            ...updates,
            // Preserve and merge nested objects
            styles: { ...node.styles, ...(updates.styles || {}) },
            attributes: { ...node.attributes, ...(updates.attributes || {}) },
          };
        }
        // Recursively check children
        if (node.children.length > 0) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    const updatedElements = updateNode(document.elements);

    // Only trigger update if something actually changed
    if (updatedElements !== document.elements) {
      const updatedDocument: DesignDocument = {
        ...document,
        elements: updatedElements,
      };

      onDocumentChange(updatedDocument);
      console.log('[IncrementalUpdate] Updated element:', elementId);
    }

    endTiming('incremental_update');
  }, [document, onDocumentChange]);

  // Batch update multiple elements in a single operation
  const batchUpdates = useCallback((
    updates: Array<{ elementId: string; updates: Partial<ElementNode> }>
  ) => {
    if (!document || updates.length === 0) {
      console.warn('[IncrementalUpdate] No document or updates');
      return;
    }

    startTiming('batch_incremental_update');

    // Create a map of updates for O(1) lookup
    const updatesMap = new Map(
      updates.map(u => [u.elementId, u.updates])
    );

    // Update all matching elements in a single pass
    const updateNodes = (nodes: ElementNode[]): ElementNode[] => {
      return nodes.map((node) => {
        const nodeUpdates = updatesMap.get(node.id);
        
        let updatedNode = node;
        
        if (nodeUpdates) {
          updatedNode = {
            ...node,
            ...nodeUpdates,
            styles: { ...node.styles, ...(nodeUpdates.styles || {}) },
            attributes: { ...node.attributes, ...(nodeUpdates.attributes || {}) },
          };
        }

        // Recursively process children
        if (updatedNode.children.length > 0) {
          const updatedChildren = updateNodes(updatedNode.children);
          if (updatedChildren !== updatedNode.children) {
            updatedNode = { ...updatedNode, children: updatedChildren };
          }
        }

        return updatedNode;
      });
    };

    const updatedElements = updateNodes(document.elements);

    const updatedDocument: DesignDocument = {
      ...document,
      elements: updatedElements,
    };

    onDocumentChange(updatedDocument);
    console.log('[IncrementalUpdate] Batch updated', updates.length, 'elements');

    endTiming('batch_incremental_update');
  }, [document, onDocumentChange]);

  return {
    updateSingleElement,
    batchUpdates,
  };
}
