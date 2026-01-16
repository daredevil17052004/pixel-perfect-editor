// import { useCallback, useRef, useState } from 'react';
// import { EditorToolbar } from './EditorToolbar';
// import { DesignCanvas } from './DesignCanvas';
// import { LayersPanel } from './LayersPanel';
// import { AddElementsPanel } from './AddElementsPanel';
// import { PropertiesPanel } from './PropertiesPanel';
// import { TemplateGallery } from './TemplateGallery';
// import { useEditorState } from '@/hooks/useEditorState';
// import { parseHTML, findElementById, elementsToHTML } from '@/utils/htmlParser';
// import { toast } from 'sonner';
// import { ElementNode } from '@/types/editor';

// export function DesignEditor() {
//   const {
//     state,
//     setDocument,
//     selectElement,
//     setHoveredElement,
//     setZoom,
//     startTextEditing,
//     stopTextEditing,
//     updateElement,
//     updateElementStyle,
//     bringToFront,
//     sendToBack,
//     clearCanvas,
//     addFont,
//     addElement,
//     deleteElement,
//   } = useEditorState();

//   const [showTemplateGallery, setShowTemplateGallery] = useState(true);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImport = useCallback(() => {
//     fileInputRef.current?.click();
//   }, []);

//   const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const html = event.target?.result as string;
//       if (html) {
//         try {
//           const doc = parseHTML(html);
//           setDocument(doc);
//           selectElement(null);
//           toast.success('Design imported successfully');
//         } catch (error) {
//           toast.error('Failed to parse HTML file');
//         }
//       }
//     };
//     reader.readAsText(file);
//     e.target.value = '';
//   }, [setDocument, selectElement]);

//   const handleExport = useCallback(() => {
//     if (!state.document) {
//       toast.error('No design to export');
//       return;
//     }

//     const html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>${state.document.name}</title>
//     <style>
//         ${state.document.fonts.join(';\n')}
//         ${state.document.styles}
//     </style>
// </head>
// <body>
//     ${elementsToHTML(state.document.elements)}
// </body>
// </html>`;

//     const blob = new Blob([html], { type: 'text/html' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${state.document.name.replace(/\s+/g, '-').toLowerCase()}.html`;
//     a.click();
//     URL.revokeObjectURL(url);
//     toast.success('Design exported successfully');
//   }, [state.document]);

//   const handleTemplateSelect = useCallback((html: string) => {
//     try {
//       const doc = parseHTML(html);
//       setDocument(doc);
//       selectElement(null);
//       toast.success('Template loaded');
//     } catch (error) {
//       toast.error('Failed to load template');
//     }
//   }, [setDocument, selectElement]);

//   const selectedElement = state.document && state.selection.selectedIds.length === 1
//     ? findElementById(state.document.elements, state.selection.selectedIds[0])
//     : null;

//   const handleUpdateStyle = useCallback((key: string, value: string) => {
//     if (state.selection.selectedIds.length === 1) {
//       updateElementStyle(state.selection.selectedIds[0], key, value);
//     }
//   }, [state.selection.selectedIds, updateElementStyle]);

//   const handleUpdateAttribute = useCallback((key: string, value: string) => {
//     if (state.selection.selectedIds.length === 1) {
//       const elementId = state.selection.selectedIds[0];
//       const element = findElementById(state.document?.elements || [], elementId);
//       if (element) {
//         updateElement(elementId, { 
//           attributes: { ...element.attributes, [key]: value } 
//         });
//       }
//     }
//   }, [state.selection.selectedIds, state.document, updateElement]);

//   const handleBringToFront = useCallback(() => {
//     if (state.selection.selectedIds.length === 1) {
//       bringToFront(state.selection.selectedIds[0]);
//     }
//   }, [state.selection.selectedIds, bringToFront]);

//   const handleSendToBack = useCallback(() => {
//     if (state.selection.selectedIds.length === 1) {
//       sendToBack(state.selection.selectedIds[0]);
//     }
//   }, [state.selection.selectedIds, sendToBack]);

//   const handleNudge = useCallback((dx: number, dy: number) => {
//     if (!state.document || state.selection.selectedIds.length !== 1) return;

//     const id = state.selection.selectedIds[0];
//     const el = findElementById(state.document.elements, id);
//     if (!el) return;

//     const left = parseFloat(el.styles?.left || '0') || 0;
//     const top = parseFloat(el.styles?.top || '0') || 0;

//     updateElementStyle(id, {
//       left: `${left + dx}px`,
//       top: `${top + dy}px`,
//       position: el.styles?.position || 'absolute',
//     });
//   }, [state.document, state.selection.selectedIds, updateElementStyle]);

//   const handleClearCanvas = useCallback(() => {
//     clearCanvas();
//     toast.success('Canvas cleared');
//   }, [clearCanvas]);

//   const handleAddElement = useCallback((element: ElementNode) => {
//     addElement(element);
//   }, [addElement]);

//   return (
//     <div className="h-screen flex flex-col bg-background overflow-hidden">
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept=".html,.htm"
//         onChange={handleFileChange}
//         className="hidden"
//       />
      
//       <EditorToolbar
//         zoom={state.zoom}
//         onZoomIn={() => setZoom(state.zoom + 0.1)}
//         onZoomOut={() => setZoom(state.zoom - 0.1)}
//         onImport={handleImport}
//         onExport={handleExport}
//         onBringToFront={handleBringToFront}
//         onSendToBack={handleSendToBack}
//         onNudge={handleNudge}
//         onClearCanvas={handleClearCanvas}
//         hasSelection={state.selection.selectedIds.length > 0}
//         hasDocument={!!state.document}
//       />

//       <div className="flex-1 flex overflow-hidden">
//         {/* Left sidebar with layers and add elements */}
//         <div className="flex flex-col border-r border-border">
//           <AddElementsPanel onAddElement={handleAddElement} />
//         </div>

//         <LayersPanel
//           elements={state.document?.elements || []}
//           selectedIds={state.selection.selectedIds}
//           onSelectElement={selectElement}
//         />

//         <DesignCanvas
//           document={state.document}
//           selectedIds={state.selection.selectedIds}
//           hoveredId={state.selection.hoveredId}
//           zoom={state.zoom}
//           panOffset={state.panOffset}
//           isEditingText={state.isEditingText}
//           editingElementId={state.editingElementId}
//           onSelectElement={selectElement}
//           onHoverElement={setHoveredElement}
//           onStartTextEditing={startTextEditing}
//           onStopTextEditing={stopTextEditing}
//           onUpdateElement={updateElement}
//           onUpdateElementStyle={updateElementStyle}
//         />

//         <PropertiesPanel
//           selectedElement={selectedElement}
//           onUpdateStyle={handleUpdateStyle}
//           onUpdateAttribute={handleUpdateAttribute}
//           onAddFont={addFont}
//         />
//       </div>

//       <TemplateGallery
//         open={showTemplateGallery && !state.document}
//         onOpenChange={setShowTemplateGallery}
//         onSelectTemplate={handleTemplateSelect}
//         onImportFile={handleImport}
//       />
//     </div>
//   );
// }



import { useCallback, useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          toast.success('Design imported successfully');
        } catch (error) {
          toast.error('Failed to parse HTML file');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setDocument, selectElement]);

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
        /* 1. Font Imports (Must be at the top) */
        ${state.document.fonts.join(';\n')}

        /* 2. Critical CSS Resets & Canvas Dimensions */
        * { 
            box-sizing: border-box; 
        }
        body {
            margin: 0;
            padding: 0;
            position: relative;
            /* Match the canvas size exactly */
            width: ${state.document.width}px;
            height: ${state.document.height}px;
            /* Default background to match editor */
            background-color: #ffffff;
            /* Optional: ensure no scrollbars if content is exact */
            overflow: hidden; 
        }

        /* 3. Document Specific Styles */
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
      toast.success('Template loaded');
    } catch (error) {
      toast.error('Failed to load template');
    }
  }, [setDocument, selectElement]);

  const selectedElement = state.document && state.selection.selectedIds.length === 1
    ? findElementById(state.document.elements, state.selection.selectedIds[0])
    : null;

  const handleUpdateStyle = useCallback((key: string, value: string) => {
    if (state.selection.selectedIds.length === 1) {
      updateElementStyle(state.selection.selectedIds[0], key, value);
    }
  }, [state.selection.selectedIds, updateElementStyle]);

  const handleUpdateAttribute = useCallback((key: string, value: string) => {
    if (state.selection.selectedIds.length === 1) {
      const elementId = state.selection.selectedIds[0];
      const element = findElementById(state.document?.elements || [], elementId);
      if (element) {
        updateElement(elementId, { 
          attributes: { ...element.attributes, [key]: value } 
        });
      }
    }
  }, [state.selection.selectedIds, state.document, updateElement]);

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
    toast.success('Canvas cleared');
  }, [clearCanvas]);

  const handleAddElement = useCallback((element: ElementNode) => {
    addElement(element);
  }, [addElement]);

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
          onUpdateElement={updateElement}
          onUpdateElementStyle={updateElementStyle}
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