import { useState, useCallback } from 'react';
import { EditorState, DesignDocument, ElementNode } from '@/types/editor';

const initialState: EditorState = {
  document: null,
  selection: {
    selectedIds: [],
    hoveredId: null,
  },
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isEditingText: false,
  editingElementId: null,
};

export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState);

  const setDocument = useCallback((document: DesignDocument | null) => {
    setState((prev) => ({ ...prev, document }));
  }, []);

  const selectElement = useCallback((elementId: string | null, addToSelection = false) => {
    setState((prev) => {
      if (!elementId) {
        return { ...prev, selection: { ...prev.selection, selectedIds: [] } };
      }
      
      if (addToSelection) {
        const isSelected = prev.selection.selectedIds.includes(elementId);
        return {
          ...prev,
          selection: {
            ...prev.selection,
            selectedIds: isSelected
              ? prev.selection.selectedIds.filter((id) => id !== elementId)
              : [...prev.selection.selectedIds, elementId],
          },
        };
      }
      
      return {
        ...prev,
        selection: { ...prev.selection, selectedIds: [elementId] },
      };
    });
  }, []);

  const setHoveredElement = useCallback((elementId: string | null) => {
    setState((prev) => ({
      ...prev,
      selection: { ...prev.selection, hoveredId: elementId },
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(0.1, Math.min(3, zoom)) }));
  }, []);

  const setPanOffset = useCallback((offset: { x: number; y: number }) => {
    setState((prev) => ({ ...prev, panOffset: offset }));
  }, []);

  const startTextEditing = useCallback((elementId: string) => {
    setState((prev) => ({
      ...prev,
      isEditingText: true,
      editingElementId: elementId,
    }));
  }, []);

  const stopTextEditing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditingText: false,
      editingElementId: null,
    }));
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<ElementNode>) => {
    setState((prev) => {
      if (!prev.document) return prev;

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

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: updateNode(prev.document.elements),
        },
      };
    });
  }, []);

  const updateElementStyle = useCallback((elementId: string, styleKey: string, value: string) => {
    setState((prev) => {
      if (!prev.document) return prev;

      const updateNode = (nodes: ElementNode[]): ElementNode[] => {
        return nodes.map((node) => {
          if (node.id === elementId) {
            return {
              ...node,
              styles: { ...node.styles, [styleKey]: value },
            };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: updateNode(prev.document.elements),
        },
      };
    });
  }, []);

  return {
    state,
    setDocument,
    selectElement,
    setHoveredElement,
    setZoom,
    setPanOffset,
    startTextEditing,
    stopTextEditing,
    updateElement,
    updateElementStyle,
  };
}
