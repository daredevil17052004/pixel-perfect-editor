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

  const bringToFront = useCallback((elementId: string) => {
    setState((prev) => {
      if (!prev.document) return prev;

      const reorderNode = (nodes: ElementNode[]): ElementNode[] => {
        const index = nodes.findIndex((n) => n.id === elementId);
        if (index !== -1) {
          const node = nodes[index];
          return [...nodes.slice(0, index), ...nodes.slice(index + 1), node];
        }
        return nodes.map((node) => ({
          ...node,
          children: reorderNode(node.children),
        }));
      };

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: reorderNode(prev.document.elements),
        },
      };
    });
  }, []);

  const sendToBack = useCallback((elementId: string) => {
    setState((prev) => {
      if (!prev.document) return prev;

      const reorderNode = (nodes: ElementNode[]): ElementNode[] => {
        const index = nodes.findIndex((n) => n.id === elementId);
        if (index !== -1) {
          const node = nodes[index];
          return [node, ...nodes.slice(0, index), ...nodes.slice(index + 1)];
        }
        return nodes.map((node) => ({
          ...node,
          children: reorderNode(node.children),
        }));
      };

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: reorderNode(prev.document.elements),
        },
      };
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      document: null,
      selection: { selectedIds: [], hoveredId: null },
    }));
  }, []);

  const addFont = useCallback((fontUrl: string) => {
    setState((prev) => {
      if (!prev.document) return prev;
      
      const fontImport = `@import url('${fontUrl}')`;
      if (prev.document.fonts.some(f => f.includes(fontUrl))) {
        return prev;
      }

      return {
        ...prev,
        document: {
          ...prev.document,
          fonts: [...prev.document.fonts, fontImport],
        },
      };
    });
  }, []);

  const addElement = useCallback((element: ElementNode) => {
    setState((prev) => {
      // If no document exists, create a blank one
      if (!prev.document) {
        return {
          ...prev,
          document: {
            id: 'new-doc',
            name: 'Untitled Design',
            width: 800,
            height: 600,
            elements: [element],
            styles: '',
            fonts: [],
          },
          selection: { selectedIds: [element.id], hoveredId: null },
        };
      }

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: [...prev.document.elements, element],
        },
        selection: { selectedIds: [element.id], hoveredId: null },
      };
    });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setState((prev) => {
      if (!prev.document) return prev;

      const removeNode = (nodes: ElementNode[]): ElementNode[] => {
        return nodes
          .filter((node) => node.id !== elementId)
          .map((node) => ({
            ...node,
            children: removeNode(node.children),
          }));
      };

      return {
        ...prev,
        document: {
          ...prev.document,
          elements: removeNode(prev.document.elements),
        },
        selection: {
          ...prev.selection,
          selectedIds: prev.selection.selectedIds.filter((id) => id !== elementId),
        },
      };
    });
  }, []);

  const updateElementStyle = useCallback((elementId: string, updates: Record<string, string> | string, value?: string) => {
    setState((prev) => {
      if (!prev.document) return prev;
      
      // Support both single key-value and object updates
      const styleUpdates: Record<string, string> = typeof updates === 'string' 
        ? { [updates]: value! } 
        : updates;

      const updateNode = (nodes: ElementNode[]): ElementNode[] => {
        return nodes.map((node) => {
          if (node.id === elementId) {
            return {
              ...node,
              styles: { ...node.styles, ...styleUpdates },
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
    bringToFront,
    sendToBack,
    clearCanvas,
    addFont,
    addElement,
    deleteElement,
  };
}
