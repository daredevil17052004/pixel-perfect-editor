import { useCallback, useRef, useState, useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { DesignCanvas } from './DesignCanvas';
import { LayersPanel } from './LayersPanel';
import { AddElementsPanel } from './AddElementsPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { TemplateGallery } from './TemplateGallery';
import { useEditorState } from '@/hooks/useEditorState';
import { parseHTML, findElementById, elementsToHTML } from '@/utils/htmlParser';
import { toast } from 'sonner';
import { ElementNode } from '@/types/editor';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useLocalAutoSave } from '@/hooks/useLocalAutoSave';
import { usePendingChangesLayer } from '@/hooks/usePendingChangesLayer';

export function DesignEditor() {
  const {
    state,
    setDocument,
    selectElement,
    setHoveredElement,
    setZoom,
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
  } = useEditorState();

  const [showTemplateGallery, setShowTemplateGallery] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Design ID for persistence hooks
  const designId = state.document?.id || 'default';

  // Initialize optimization hooks
  const pendingLayer = usePendingChangesLayer(designId);
  const autoSave = useLocalAutoSave(designId);

  // Undo/Redo with history tracking
  const undoRedo = useUndoRedo((snapshot, isUndo) => {
    if (!state.document) return;
    
    const updates = isUndo ? snapshot.before : snapshot.after;
    updateElement(snapshot.elementId, updates);
  });

  // Auto-save document changes
  useEffect(() => {
    if (state.document) {
      autoSave.saveDraft(state.document);
    }
  }, [state.document, autoSave]);

  // Update element with history tracking
  const updateElementWithHistory = useCallback((elementId: string, updates: Partial<ElementNode>) => {
    const element = findElementById(state.document?.elements || [], elementId);
    if (!element) return;

    // Push to undo stack with before/after state
    undoRedo.pushSnapshot({
      elementId,
      before: { ...element },
      after: { ...element, ...updates },
      action: 'update',
    });

    updateElement(elementId, updates);

    // Add to pending changes
    pendingLayer.addChange({
      elementId,
      content: JSON.stringify(updates),
      previousContent: JSON.stringify(element),
      type: 'attribute',
    });
  }, [state.document, updateElement, undoRedo, pendingLayer]);

  // Update style with history tracking
  const updateStyleWithHistory = useCallback((elementId: string, key: string, value: string) => {
    const element = findElementById(state.document?.elements || [], elementId);
    if (!element) return;

    // Push to undo stack
    undoRedo.pushSnapshot({
      elementId,
      before: { styles: { ...element.styles } },
      after: { styles: { ...element.styles, [key]: value } },
      action: 'update',
    });

    updateElementStyle(elementId, key, value);

    // Add to pending changes
    pendingLayer.addChange({
      elementId,
      content: value,
      previousContent: element.styles[key] || '',
      type: 'style',
    });
  }, [state.document, updateElementStyle, undoRedo, pendingLayer]);

  // Force save
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      // In a real implementation, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      pendingLayer.clearChanges();
      setSaveStatus('saved');
      toast.success('Changes saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      toast.error('Failed to save changes');
    }
  }, [pendingLayer]);

  // Delete selected element with history
  const handleDeleteSelected = useCallback(() => {
    if (state.selection.selectedIds.length !== 1) return;
    
    const elementId = state.selection.selectedIds[0];
    const element = findElementById(state.document?.elements || [], elementId);
    
    if (element) {
      undoRedo.pushSnapshot({
        elementId,
        before: element,
        after: {},
        action: 'delete',
      });
      deleteElement(elementId);
      toast.success('Element deleted');
    }
  }, [state.selection.selectedIds, state.document, deleteElement, undoRedo]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undoRedo.undo,
    onRedo: undoRedo.redo,
    onSave: handleSave,
    onDelete: handleDeleteSelected,
    onEscape: () => selectElement(null),
    onNudge: (dx, dy) => {
      if (!state.document || state.selection.selectedIds.length !== 1) return;
      const id = state.selection.selectedIds[0];
      const el = findElementById(state.document.elements, id);
      if (!el) return;

      const left = parseFloat(el.styles?.left || '0') || 0;
      const top = parseFloat(el.styles?.top || '0') || 0;

      updateStyleWithHistory(id, 'left', `${left + dx}px`);
      updateStyleWithHistory(id, 'top', `${top + dy}px`);
      updateElementStyle(id, 'position', el.styles?.position || 'absolute');
    },
    enabled: true,
  });

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const html = event.target?.result as string;
      if (html) {
        try {
          const doc = parseHTML(html);
          setDocument(doc);
          selectElement(null);
          undoRedo.clearHistory();
          toast.success('Design imported successfully');
        } catch (error) {
          toast.error('Failed to parse HTML file');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setDocument, selectElement, undoRedo]);

  const handleExport = useCallback(() => {
    if (!state.document) {
      toast.error('No design to export');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${state.document.name}</title>
    <style>
        ${state.document.fonts.join(';\n')}
        ${state.document.styles}
    </style>
</head>
<body>
    ${elementsToHTML(state.document.elements)}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.document.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Design exported successfully');
  }, [state.document]);

  const handleTemplateSelect = useCallback((html: string) => {
    try {
      const doc = parseHTML(html);
      setDocument(doc);
      selectElement(null);
      undoRedo.clearHistory();
      toast.success('Template loaded');
    } catch (error) {
      toast.error('Failed to load template');
    }
  }, [setDocument, selectElement, undoRedo]);

  const selectedElement = state.document && state.selection.selectedIds.length === 1
    ? findElementById(state.document.elements, state.selection.selectedIds[0])
    : null;

  const handleUpdateStyle = useCallback((key: string, value: string) => {
    if (state.selection.selectedIds.length === 1) {
      updateStyleWithHistory(state.selection.selectedIds[0], key, value);
    }
  }, [state.selection.selectedIds, updateStyleWithHistory]);

  const handleUpdateAttribute = useCallback((key: string, value: string) => {
    if (state.selection.selectedIds.length === 1) {
      const elementId = state.selection.selectedIds[0];
      const element = findElementById(state.document?.elements || [], elementId);
      if (element) {
        updateElementWithHistory(elementId, { 
          attributes: { ...element.attributes, [key]: value } 
        });
      }
    }
  }, [state.selection.selectedIds, state.document, updateElementWithHistory]);

  const handleBringToFront = useCallback(() => {
    if (state.selection.selectedIds.length === 1) {
      bringToFront(state.selection.selectedIds[0]);
    }
  }, [state.selection.selectedIds, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (state.selection.selectedIds.length === 1) {
      sendToBack(state.selection.selectedIds[0]);
    }
  }, [state.selection.selectedIds, sendToBack]);

  const handleNudge = useCallback((dx: number, dy: number) => {
    if (!state.document || state.selection.selectedIds.length !== 1) return;

    const id = state.selection.selectedIds[0];
    const el = findElementById(state.document.elements, id);
    if (!el) return;

    const left = parseFloat(el.styles?.left || '0') || 0;
    const top = parseFloat(el.styles?.top || '0') || 0;

    updateElementStyle(id, {
      left: `${left + dx}px`,
      top: `${top + dy}px`,
      position: el.styles?.position || 'absolute',
    });
  }, [state.document, state.selection.selectedIds, updateElementStyle]);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    undoRedo.clearHistory();
    toast.success('Canvas cleared');
  }, [clearCanvas, undoRedo]);

  const handleAddElement = useCallback((element: ElementNode) => {
    undoRedo.pushSnapshot({
      elementId: element.id,
      before: {},
      after: element,
      action: 'create',
    });
    addElement(element);
  }, [addElement, undoRedo]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <EditorToolbar
        zoom={state.zoom}
        onZoomIn={() => setZoom(state.zoom + 0.1)}
        onZoomOut={() => setZoom(state.zoom - 0.1)}
        onImport={handleImport}
        onExport={handleExport}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onNudge={handleNudge}
        onClearCanvas={handleClearCanvas}
        onUndo={undoRedo.undo}
        onRedo={undoRedo.redo}
        onSave={handleSave}
        canUndo={undoRedo.canUndo}
        canRedo={undoRedo.canRedo}
        saveStatus={saveStatus}
        hasSelection={state.selection.selectedIds.length > 0}
        hasDocument={!!state.document}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar with layers and add elements */}
        <div className="flex flex-col border-r border-border">
          <AddElementsPanel onAddElement={handleAddElement} />
        </div>

        <LayersPanel
          elements={state.document?.elements || []}
          selectedIds={state.selection.selectedIds}
          onSelectElement={selectElement}
        />

        <DesignCanvas
          document={state.document}
          selectedIds={state.selection.selectedIds}
          hoveredId={state.selection.hoveredId}
          zoom={state.zoom}
          panOffset={state.panOffset}
          isEditingText={state.isEditingText}
          editingElementId={state.editingElementId}
          onSelectElement={selectElement}
          onHoverElement={setHoveredElement}
          onStartTextEditing={startTextEditing}
          onStopTextEditing={stopTextEditing}
          onUpdateElement={updateElementWithHistory}
          onUpdateElementStyle={updateStyleWithHistory}
        />

        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateStyle={handleUpdateStyle}
          onUpdateAttribute={handleUpdateAttribute}
          onAddFont={addFont}
        />
      </div>

      <TemplateGallery
        open={showTemplateGallery && !state.document}
        onOpenChange={setShowTemplateGallery}
        onSelectTemplate={handleTemplateSelect}
        onImportFile={handleImport}
      />
    </div>
  );
}
