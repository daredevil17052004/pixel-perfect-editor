// ============= Editing Layer Hook =============
// Manages local-only editing state with refs for instant updates

import { useRef, useCallback, useState } from 'react';
import { EditingLayerState, UseEditingLayerReturn } from '@/types/editing';
import { startTiming, endTiming } from '@/lib/performanceMetrics';

const initialState: EditingLayerState = {
  activeElementId: null,
  localContent: '',
  cursorPosition: 0,
  isEditing: false,
};

export function useEditingLayer(): UseEditingLayerReturn {
  // Use refs for instant updates without re-renders
  const contentRef = useRef<string>('');
  const cursorRef = useRef<number>(0);
  const elementIdRef = useRef<string | null>(null);
  const isEditingRef = useRef<boolean>(false);

  // State for components that need to react to editing status changes
  const [editingState, setEditingState] = useState<EditingLayerState>(initialState);

  const startEditing = useCallback((elementId: string, content: string) => {
    startTiming('editing_layer_start');
    
    elementIdRef.current = elementId;
    contentRef.current = content;
    cursorRef.current = content.length; // Default cursor to end
    isEditingRef.current = true;

    setEditingState({
      activeElementId: elementId,
      localContent: content,
      cursorPosition: content.length,
      isEditing: true,
    });

    endTiming('editing_layer_start');
    console.log('[EditingLayer] Started editing:', elementId);
  }, []);

  const updateLocalContent = useCallback((content: string) => {
    // Update ref immediately - no re-render
    startTiming('keystroke_to_state');
    contentRef.current = content;
    endTiming('keystroke_to_state');
    
    // Optionally update state for UI that needs it (debounced in parent)
    // We don't update state here to avoid re-renders on every keystroke
  }, []);

  const stopEditing = useCallback(() => {
    startTiming('editing_layer_stop');
    
    const finalContent = contentRef.current;
    const finalElementId = elementIdRef.current;

    elementIdRef.current = null;
    contentRef.current = '';
    cursorRef.current = 0;
    isEditingRef.current = false;

    setEditingState({
      activeElementId: null,
      localContent: '',
      cursorPosition: 0,
      isEditing: false,
    });

    endTiming('editing_layer_stop');
    console.log('[EditingLayer] Stopped editing:', finalElementId, 'Final content:', finalContent.slice(0, 50));
    
    return { elementId: finalElementId, content: finalContent };
  }, []);

  const getLocalContent = useCallback(() => {
    return contentRef.current;
  }, []);

  const setCursorPosition = useCallback((position: number) => {
    cursorRef.current = position;
  }, []);

  return {
    editingState,
    startEditing,
    updateLocalContent,
    stopEditing,
    getLocalContent,
    setCursorPosition,
  };
}
