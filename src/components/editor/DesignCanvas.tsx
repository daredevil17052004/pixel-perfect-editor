// import { useCallback, useEffect, useRef, useState } from 'react';
// import { DesignDocument, ElementNode, ResizeHandle, DragState } from '@/types/editor';
// import { elementsToHTML, findElementById } from '@/utils/htmlParser';
// import { SelectionOverlay } from './SelectionOverlay';

// interface DesignCanvasProps {
//   document: DesignDocument | null;
//   selectedIds: string[];
//   hoveredId: string | null;
//   zoom: number;
//   panOffset: { x: number; y: number };
//   isEditingText: boolean;
//   editingElementId: string | null;
//   onSelectElement: (id: string | null, addToSelection?: boolean) => void;
//   onHoverElement: (id: string | null) => void;
//   onStartTextEditing: (id: string) => void;
//   onStopTextEditing: () => void;
//   onUpdateElement: (id: string, updates: Partial<ElementNode>) => void;
//   onUpdateElementStyle: (id: string, key: string, value: string) => void;
// }

// export function DesignCanvas({
//   document,
//   selectedIds,
//   hoveredId,
//   zoom,
//   panOffset,
//   isEditingText,
//   editingElementId,
//   onSelectElement,
//   onHoverElement,
//   onStartTextEditing,
//   onStopTextEditing,
//   onUpdateElement,
//   onUpdateElementStyle,
// }: DesignCanvasProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [selectionRects, setSelectionRects] = useState<Map<string, DOMRect>>(new Map());
//   const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
//   const [dragState, setDragState] = useState<DragState>({
//     isDragging: false,
//     startX: 0,
//     startY: 0,
//     currentX: 0,
//     currentY: 0,
//     elementId: null,
//     handle: null,
//   });

//   // Optimized: Extracted updateRects to useCallback so it can be triggered by font loading
//   const updateRects = useCallback(() => {
//     if (!iframeRef.current || !containerRef.current) return;

//     const iframeDoc = iframeRef.current.contentDocument;
//     if (!iframeDoc) return;

//     const iframe = iframeRef.current;
//     const container = containerRef.current;
    
//     const containerRect = container.getBoundingClientRect();
//     const iframeRect = iframe.getBoundingClientRect();
//     const newRects = new Map<string, DOMRect>();

//     selectedIds.forEach((id) => {
//       const el = iframeDoc.querySelector(`[data-editor-id="${id}"]`);
//       if (el) {
//         const rect = el.getBoundingClientRect();
//         // rect is in iframe's coordinate space; scale to match the parent transform
//         const scaled = {
//           left: rect.left * zoom,
//           top: rect.top * zoom,
//           width: rect.width * zoom,
//           height: rect.height * zoom,
//         };

//         // Calculate position relative to scroll container
//         newRects.set(
//           id,
//           new DOMRect(
//             iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
//             iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
//             scaled.width,
//             scaled.height
//           )
//         );
//       }
//     });

//     setSelectionRects(newRects);

//     // Update hover rect
//     if (hoveredId && !selectedIds.includes(hoveredId)) {
//       const el = iframeDoc.querySelector(`[data-editor-id="${hoveredId}"]`);
//       if (el) {
//         const rect = el.getBoundingClientRect();
//         const scaled = {
//           left: rect.left * zoom,
//           top: rect.top * zoom,
//           width: rect.width * zoom,
//           height: rect.height * zoom,
//         };

//         setHoverRect(
//           new DOMRect(
//             iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
//             iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
//             scaled.width,
//             scaled.height
//           )
//         );
//       } else {
//         setHoverRect(null);
//       }
//     } else {
//       setHoverRect(null);
//     }
//   }, [selectedIds, hoveredId, zoom]); // Re-calculate when selection, hover, or zoom changes

//   // Render document HTML into iframe
//   useEffect(() => {
//     if (!document || !iframeRef.current) return;

//     const iframe = iframeRef.current;
//     const iframeDoc = iframe.contentDocument;
//     if (!iframeDoc) return;

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="UTF-8">
//           <style>
//             ${document.fonts.join(';\n')}
//             * { box-sizing: border-box; }
//             body { 
//               margin: 0; 
//               padding: 0; 
//               background: transparent;
//               min-height: 100vh;
//               position: relative;
//             }
//             [data-editor-id] {
//               cursor: pointer;
//               transition: outline 0.1s ease;
//             }
//             [data-editor-id]:hover {
//               outline: 1px dashed hsl(217, 91%, 60%);
//               outline-offset: 1px;
//             }
//             [data-editor-id][style*="position: absolute"] {
//               cursor: move;
//             }
//             ${document.styles}
//           </style>
//         </head>
//         <body>
//           ${elementsToHTML(document.elements, true)}
//         </body>
//       </html>
//     `;

//     iframeDoc.open();
//     iframeDoc.write(html);
//     iframeDoc.close();

//     // Setup event handlers after content is loaded
//     const handleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//       onSelectElement(editorId || null, e.shiftKey);
//     };

//     const handleDoubleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//       if (editorId) {
//         // Check if element has text content
//         const element = findElementById(document.elements, editorId);
//         if (element && (element.tagName === 'h1' || element.tagName === 'h2' || element.tagName === 'h3' || 
//             element.tagName === 'p' || element.tagName === 'span' || element.tagName === 'div')) {
//           target.setAttribute('contenteditable', 'true');
//           target.focus();
//           onStartTextEditing(editorId);
//         }
//       }
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//       onHoverElement(editorId || null);
//     };

//     const handleInput = (e: Event) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.getAttribute('data-editor-id');
//       if (editorId && editingElementId === editorId) {
//         const element = findElementById(document.elements, editorId);
//         if (element && element.children.length > 0 && element.children[0].isTextNode) {
//           onUpdateElement(element.children[0].id, { textContent: target.textContent || '' });
//         }
//       }
//     };

//     const handleBlur = (e: FocusEvent) => {
//       const target = e.target as HTMLElement;
//       target.removeAttribute('contenteditable');
//       onStopTextEditing();
//     };

//     iframeDoc.body.addEventListener('click', handleClick);
//     iframeDoc.body.addEventListener('dblclick', handleDoubleClick);
//     iframeDoc.body.addEventListener('mousemove', handleMouseMove);
//     iframeDoc.body.addEventListener('input', handleInput);
//     iframeDoc.body.addEventListener('blur', handleBlur, true);

//     return () => {
//       iframeDoc.body.removeEventListener('click', handleClick);
//       iframeDoc.body.removeEventListener('dblclick', handleDoubleClick);
//       iframeDoc.body.removeEventListener('mousemove', handleMouseMove);
//       iframeDoc.body.removeEventListener('input', handleInput);
//       iframeDoc.body.removeEventListener('blur', handleBlur, true);
//     };
//   }, [document, onSelectElement, onHoverElement, onStartTextEditing, onStopTextEditing, onUpdateElement, editingElementId]);

//   // Optimization: Handle Active Font Loading and Measurement
//   useEffect(() => {
//     if (!document || !iframeRef.current?.contentDocument) return;

//     const iframeDoc = iframeRef.current.contentDocument;

//     const loadFontsAndMeasure = async () => {
//       // 1. Convert @import strings to <link> tags for faster parallel loading
//       const fontLinks = document.fonts.map(fontImport => {
//         const match = fontImport.match(/url\(['"]?(.*?)['"]?\)/);
//         return match ? match[1] : null;
//       }).filter(Boolean);

//       // Inject links into iframe head if they don't exist
//       fontLinks.forEach(url => {
//         if (!iframeDoc.querySelector(`link[href="${url}"]`)) {
//           const link = iframeDoc.createElement('link');
//           link.rel = 'stylesheet';
//           link.href = url!;
//           iframeDoc.head.appendChild(link);
//         }
//       });

//       // 2. Wait for fonts to be ready before calculating layout
//       try {
//         await iframeDoc.fonts.ready;
//       } catch (e) {
//         console.warn('Font loading timeout or error', e);
//       }
      
//       // 3. Trigger a re-calculation of selection rectangles
//       // This ensures selection boxes align with the final rendered text
//       updateRects(); 
//     };

//     loadFontsAndMeasure();
//   }, [document?.fonts, updateRects]);

//   // Update selection rectangles relative to container (Scroll/Resize observers)
//   useEffect(() => {
//     if (!iframeRef.current || !containerRef.current) return;

//     // Initial check
//     updateRects();

//     // Update on iframe resize (content changes)
//     const resizeObserver = new ResizeObserver(updateRects);
//     resizeObserver.observe(iframeRef.current);
    
//     // Update on container scroll
//     containerRef.current.addEventListener('scroll', updateRects);
//     const currentContainer = containerRef.current;

//     return () => {
//       resizeObserver.disconnect();
//       currentContainer?.removeEventListener('scroll', updateRects);
//     };
//   }, [updateRects]);

//   // Handle drag/resize
//   const handleMoveStart = useCallback((e: React.MouseEvent, elementId: string) => {
//     setDragState({
//       isDragging: true,
//       startX: e.clientX,
//       startY: e.clientY,
//       currentX: e.clientX,
//       currentY: e.clientY,
//       elementId,
//       handle: 'move',
//     });
//   }, []);

//   const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent, elementId: string) => {
//     setDragState({
//       isDragging: true,
//       startX: e.clientX,
//       startY: e.clientY,
//       currentX: e.clientX,
//       currentY: e.clientY,
//       elementId,
//       handle,
//     });
//   }, []);

//   useEffect(() => {
//     if (!dragState.isDragging) return;

//     const handleMouseMove = (e: MouseEvent) => {
//       setDragState((prev) => ({
//         ...prev,
//         currentX: e.clientX,
//         currentY: e.clientY,
//       }));

//       const deltaX = (e.clientX - dragState.startX) / zoom;
//       const deltaY = (e.clientY - dragState.startY) / zoom;

//       if (!iframeRef.current?.contentDocument || !dragState.elementId) return;
//       const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${dragState.elementId}"]`) as HTMLElement;
//       if (!el) return;

//       if (dragState.handle === 'move') {
//         // Check if element is absolutely positioned
//         const computedStyle = iframeRef.current.contentWindow?.getComputedStyle(el);
//         const position = computedStyle?.position;
        
//         if (position === 'absolute') {
//           // For absolute positioned elements, update left/top
//           const currentLeft = parseFloat(el.style.left) || 0;
//           const currentTop = parseFloat(el.style.top) || 0;
          
//           // Get stored initial values or set them
//           if (!el.dataset.dragStartLeft) {
//             el.dataset.dragStartLeft = String(currentLeft);
//             el.dataset.dragStartTop = String(currentTop);
//           }
          
//           const startLeft = parseFloat(el.dataset.dragStartLeft);
//           const startTop = parseFloat(el.dataset.dragStartTop);
          
//           el.style.left = `${startLeft + deltaX}px`;
//           el.style.top = `${startTop + deltaY}px`;
//         } else {
//           // For other elements, use transform
//           el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
//         }
//       } else if (dragState.handle) {
//         // Resize logic
//         const currentWidth = el.offsetWidth;
//         const currentHeight = el.offsetHeight;
        
//         // Store initial dimensions
//         if (!el.dataset.dragStartWidth) {
//           el.dataset.dragStartWidth = String(currentWidth);
//           el.dataset.dragStartHeight = String(currentHeight);
//           el.dataset.dragStartLeft = el.style.left || '0';
//           el.dataset.dragStartTop = el.style.top || '0';
//         }
        
//         const startWidth = parseFloat(el.dataset.dragStartWidth);
//         const startHeight = parseFloat(el.dataset.dragStartHeight);
//         const startLeft = parseFloat(el.dataset.dragStartLeft) || 0;
//         const startTop = parseFloat(el.dataset.dragStartTop) || 0;
        
//         let newWidth = startWidth;
//         let newHeight = startHeight;
//         let newLeft = startLeft;
//         let newTop = startTop;
        
//         if (dragState.handle.includes('right')) {
//           newWidth = startWidth + deltaX;
//         }
//         if (dragState.handle.includes('bottom')) {
//           newHeight = startHeight + deltaY;
//         }
//         if (dragState.handle.includes('left')) {
//           newWidth = startWidth - deltaX;
//           newLeft = startLeft + deltaX;
//         }
//         if (dragState.handle.includes('top')) {
//           newHeight = startHeight - deltaY;
//           newTop = startTop + deltaY;
//         }
        
//         if (newWidth > 10) {
//           el.style.width = `${newWidth}px`;
//           if (dragState.handle.includes('left')) {
//             el.style.left = `${newLeft}px`;
//           }
//         }
//         if (newHeight > 10) {
//           el.style.height = `${newHeight}px`;
//           if (dragState.handle.includes('top')) {
//             el.style.top = `${newTop}px`;
//           }
//         }
//       }
//     };

//     const handleMouseUp = () => {
//       if (dragState.elementId && dragState.handle) {
//         if (!iframeRef.current?.contentDocument) return;
//         const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${dragState.elementId}"]`) as HTMLElement;
//         if (el) {
//           if (dragState.handle === 'move') {
//             const computedStyle = iframeRef.current.contentWindow?.getComputedStyle(el);
//             if (computedStyle?.position === 'absolute') {
//               onUpdateElementStyle(dragState.elementId, 'left', el.style.left);
//               onUpdateElementStyle(dragState.elementId, 'top', el.style.top);
//             } else {
//               onUpdateElementStyle(dragState.elementId, 'transform', el.style.transform);
//             }
//           } else {
//             if (el.style.width) onUpdateElementStyle(dragState.elementId, 'width', el.style.width);
//             if (el.style.height) onUpdateElementStyle(dragState.elementId, 'height', el.style.height);
//             if (el.style.left) onUpdateElementStyle(dragState.elementId, 'left', el.style.left);
//             if (el.style.top) onUpdateElementStyle(dragState.elementId, 'top', el.style.top);
//           }
          
//           // Clean up drag data attributes
//           delete el.dataset.dragStartLeft;
//           delete el.dataset.dragStartTop;
//           delete el.dataset.dragStartWidth;
//           delete el.dataset.dragStartHeight;
//         }
//       }
      
//       setDragState({
//         isDragging: false,
//         startX: 0,
//         startY: 0,
//         currentX: 0,
//         currentY: 0,
//         elementId: null,
//         handle: null,
//       });
//     };

//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('mouseup', handleMouseUp);

//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [dragState, zoom, onUpdateElementStyle]);

//   if (!document) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-muted/30">
//         <div className="text-center">
//           <h2 className="text-xl font-semibold mb-2">No Design Loaded</h2>
//           <p className="text-muted-foreground">Import an HTML file or select a template to start editing</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div 
//       ref={containerRef}
//       className="flex-1 overflow-auto bg-canvas relative"
//       onClick={(e) => {
//         if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-container')) {
//           onSelectElement(null);
//         }
//       }}
//     >
//       <div
//         className="canvas-container absolute"
//         style={{
//           left: '50%',
//           top: '50%',
//           transform: `translate(-50%, -50%) scale(${zoom})`,
//           transformOrigin: 'center center',
//         }}
//       >
//         {/* Design iframe */}
//         <iframe
//           ref={iframeRef}
//           title="Design Canvas"
//           className="shadow-2xl"
//           style={{
//             width: document.width,
//             height: document.height,
//             border: 'none',
//             background: 'white',
//           }}
//         />
//       </div>

//       {/* Selection overlays - rendered outside iframe */}
//       {Array.from(selectionRects.entries()).map(([id, rect]) => (
//         <SelectionOverlay
//           key={id}
//           targetRect={rect}
//           isSelected={true}
//           zoom={zoom}
//           onMoveStart={(e) => handleMoveStart(e, id)}
//           onResizeStart={(handle, e) => handleResizeStart(handle, e, id)}
//         />
//       ))}

//       {hoverRect && (
//         <SelectionOverlay
//           targetRect={hoverRect}
//           isHovered={true}
//           zoom={zoom}
//         />
//       )}
//     </div>
//   );
// }

// import { useCallback, useEffect, useRef, useState } from 'react';
// import { DesignDocument, ElementNode, ResizeHandle } from '@/types/editor';
// import { elementsToHTML, findElementById } from '@/utils/htmlParser';
// import { SelectionOverlay } from './SelectionOverlay';

// interface DesignCanvasProps {
//   document: DesignDocument | null;
//   selectedIds: string[];
//   hoveredId: string | null;
//   zoom: number;
//   panOffset: { x: number; y: number };
//   isEditingText: boolean;
//   editingElementId: string | null;
//   onSelectElement: (id: string | null, addToSelection?: boolean) => void;
//   onHoverElement: (id: string | null) => void;
//   onStartTextEditing: (id: string) => void;
//   onStopTextEditing: () => void;
//   onUpdateElement: (id: string, updates: Partial<ElementNode>) => void;
//   onUpdateElementStyle: (id: string, key: string, value: string) => void;
// }

// export function DesignCanvas({
//   document,
//   selectedIds,
//   hoveredId,
//   zoom,
//   onSelectElement,
//   onHoverElement,
//   onStartTextEditing,
//   onStopTextEditing,
//   onUpdateElement,
//   onUpdateElementStyle,
// }: DesignCanvasProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [selectionRects, setSelectionRects] = useState<Map<string, DOMRect>>(new Map());
//   const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

//   // OPTIMIZATION 1: Use Refs for drag state to avoid re-renders during movement
//   const draggingRef = useRef<{
//     isDragging: boolean;
//     startX: number;
//     startY: number;
//     elementId: string | null;
//     handle: ResizeHandle | 'move' | null;
//     initialRect: { left: number; top: number; width: number; height: number };
//     initialStyle: { left: string; top: string; width: string; height: string };
//   }>({
//     isDragging: false,
//     startX: 0,
//     startY: 0,
//     elementId: null,
//     handle: null,
//     initialRect: { left: 0, top: 0, width: 0, height: 0 },
//     initialStyle: { left: '', top: '', width: '', height: '' }
//   });

//   // Helper to measure and update selection boxes
//   const updateRects = useCallback(() => {
//     if (!iframeRef.current || !containerRef.current) return;
//     const iframeDoc = iframeRef.current.contentDocument;
//     if (!iframeDoc) return;

//     const iframe = iframeRef.current;
//     const container = containerRef.current;
    
//     const containerRect = container.getBoundingClientRect();
//     const iframeRect = iframe.getBoundingClientRect();
//     const newRects = new Map<string, DOMRect>();

//     selectedIds.forEach((id) => {
//       const el = iframeDoc.querySelector(`[data-editor-id="${id}"]`);
//       if (el) {
//         const rect = el.getBoundingClientRect();
//         const scaled = {
//           left: rect.left * zoom,
//           top: rect.top * zoom,
//           width: rect.width * zoom,
//           height: rect.height * zoom,
//         };

//         newRects.set(id, new DOMRect(
//           iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
//           iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
//           scaled.width,
//           scaled.height
//         ));
//       }
//     });

//     setSelectionRects(newRects);

//     if (hoveredId && !selectedIds.includes(hoveredId)) {
//       const el = iframeDoc.querySelector(`[data-editor-id="${hoveredId}"]`);
//       if (el) {
//         const rect = el.getBoundingClientRect();
//         const scaled = {
//           left: rect.left * zoom,
//           top: rect.top * zoom,
//           width: rect.width * zoom,
//           height: rect.height * zoom,
//         };
//         setHoverRect(new DOMRect(
//           iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
//           iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
//           scaled.width,
//           scaled.height
//         ));
//       } else {
//         setHoverRect(null);
//       }
//     } else {
//       setHoverRect(null);
//     }
//   }, [selectedIds, hoveredId, zoom]);

//   // Main Iframe Rendering & Event Setup
//   useEffect(() => {
//     if (!document || !iframeRef.current) return;
//     const iframe = iframeRef.current;
//     const iframeDoc = iframe.contentDocument;
//     if (!iframeDoc) return;

//     // Only rewrite if content actually changed significantly or is empty
//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="UTF-8">
//           <style>
//             ${document.fonts.join(';\n')}
//             * { box-sizing: border-box; }
//             body { margin: 0; padding: 0; min-height: 100vh; position: relative; }
//             [data-editor-id] { cursor: pointer; transition: outline 0.1s ease; }
//             [data-editor-id]:hover { outline: 1px dashed hsl(217, 91%, 60%); outline-offset: 1px; }
//             ${document.styles}
//           </style>
//         </head>
//         <body>${elementsToHTML(document.elements, true)}</body>
//       </html>
//     `;

//     iframeDoc.open();
//     iframeDoc.write(html);
//     iframeDoc.close();

//     // --- OPTIMIZED EVENT HANDLERS ---

//     const handleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//       onSelectElement(editorId || null, e.shiftKey);
//     };

//     const handleDoubleClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//       if (editorId) {
//         const element = findElementById(document.elements, editorId);
//         // Allow text editing for specific elements
//         if (element && ['h1', 'h2', 'h3', 'p', 'span', 'div'].includes(element.tagName)) {
//           target.contentEditable = 'true';
//           target.focus();
//           onStartTextEditing(editorId);
//           // Trap click to prevent immediate blur
//           target.onclick = (evt) => evt.stopPropagation();
//         }
//       }
//     };

//     // OPTIMIZATION 3: Save text on Blur, not Input
//     const handleBlur = (e: FocusEvent) => {
//       const target = e.target as HTMLElement;
//       const editorId = target.getAttribute('data-editor-id');
//       target.removeAttribute('contenteditable');
//       onStopTextEditing();

//       if (editorId) {
//         const element = findElementById(document.elements, editorId);
//         // Robust check for text node ID
//         const targetId = element?.children?.[0]?.isTextNode ? element.children[0].id : editorId;
        
//         // Only update if content changed
//         if (element && target.innerText !== (element.children?.[0]?.textContent || element.textContent)) {
//            onUpdateElement(targetId, { textContent: target.innerText });
//         }
//       }
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//         // Only hover if we aren't dragging
//         if (draggingRef.current.isDragging) return; 
//         const target = e.target as HTMLElement;
//         const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
//         onHoverElement(editorId || null);
//     };

//     iframeDoc.body.addEventListener('click', handleClick);
//     iframeDoc.body.addEventListener('dblclick', handleDoubleClick);
//     iframeDoc.body.addEventListener('mousemove', handleMouseMove);
//     iframeDoc.body.addEventListener('blur', handleBlur, true);

//     return () => {
//       iframeDoc.body.removeEventListener('click', handleClick);
//       iframeDoc.body.removeEventListener('dblclick', handleDoubleClick);
//       iframeDoc.body.removeEventListener('mousemove', handleMouseMove);
//       iframeDoc.body.removeEventListener('blur', handleBlur, true);
//     };
//   }, [document, onSelectElement, onHoverElement, onStartTextEditing, onStopTextEditing, onUpdateElement]);

//   // Handle Font Loading (Kept from your previous version)
//   useEffect(() => {
//     if (!document || !iframeRef.current?.contentDocument) return;
//     const iframeDoc = iframeRef.current.contentDocument;

//     const loadFontsAndMeasure = async () => {
//       const fontLinks = document.fonts.map(fontImport => {
//         const match = fontImport.match(/url\(['"]?(.*?)['"]?\)/);
//         return match ? match[1] : null;
//       }).filter(Boolean);

//       fontLinks.forEach(url => {
//         if (!iframeDoc.querySelector(`link[href="${url}"]`)) {
//           const link = iframeDoc.createElement('link');
//           link.rel = 'stylesheet';
//           link.href = url!;
//           iframeDoc.head.appendChild(link);
//         }
//       });

//       try { await iframeDoc.fonts.ready; } catch (e) { console.warn(e); }
//       updateRects(); 
//     };
//     loadFontsAndMeasure();
//   }, [document?.fonts, updateRects]);

//   // Observers for layout changes
//   useEffect(() => {
//     if (!iframeRef.current || !containerRef.current) return;
//     updateRects();
//     const resizeObserver = new ResizeObserver(updateRects);
//     resizeObserver.observe(iframeRef.current);
//     containerRef.current.addEventListener('scroll', updateRects);
//     const currentContainer = containerRef.current;
//     return () => {
//       resizeObserver.disconnect();
//       currentContainer?.removeEventListener('scroll', updateRects);
//     };
//   }, [updateRects]);

//   // OPTIMIZATION 2: Drag Logic using Refs + requestAnimationFrame
//   const handleMoveStart = useCallback((e: React.MouseEvent, elementId: string) => {
//     e.preventDefault(); // Prevent text selection
//     if (!iframeRef.current?.contentDocument) return;
//     const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
//     if (!el) return;

//     const rect = el.getBoundingClientRect();
    
//     // Initialize Ref state
//     draggingRef.current = {
//       isDragging: true,
//       startX: e.clientX,
//       startY: e.clientY,
//       elementId,
//       handle: 'move',
//       initialRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
//       initialStyle: {
//         left: el.style.left,
//         top: el.style.top,
//         width: el.style.width,
//         height: el.style.height
//       }
//     };
//   }, []);

//   const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent, elementId: string) => {
//     e.preventDefault();
//     if (!iframeRef.current?.contentDocument) return;
//     const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
//     if (!el) return;

//     const rect = el.getBoundingClientRect();
    
//     draggingRef.current = {
//       isDragging: true,
//       startX: e.clientX,
//       startY: e.clientY,
//       elementId,
//       handle,
//       initialRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
//       initialStyle: {
//         left: el.style.left,
//         top: el.style.top,
//         width: el.style.width,
//         height: el.style.height
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const handleWindowMove = (e: MouseEvent) => {
//       if (!draggingRef.current.isDragging || !iframeRef.current?.contentDocument) return;

//       const { startX, startY, elementId, handle, initialRect } = draggingRef.current;
//       const deltaX = (e.clientX - startX) / zoom;
//       const deltaY = (e.clientY - startY) / zoom;

//       const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
//       if (!el) return;

//       // Use requestAnimationFrame for smooth visual updates
//       requestAnimationFrame(() => {
//         if (handle === 'move') {
//            // Assume absolute positioning for simplicity/performance in editor
//            // You might need a check here if you support relative dragging
//            el.style.left = `${initialRect.left + deltaX}px`;
//            el.style.top = `${initialRect.top + deltaY}px`;
//         } else if (handle) {
//            // Resize Logic
//            const { width, height, left, top } = initialRect;
//            if (handle.includes('right')) el.style.width = `${width + deltaX}px`;
//            if (handle.includes('bottom')) el.style.height = `${height + deltaY}px`;
//            if (handle.includes('left')) {
//              el.style.width = `${width - deltaX}px`;
//              el.style.left = `${left + deltaX}px`;
//            }
//            if (handle.includes('top')) {
//              el.style.height = `${height - deltaY}px`;
//              el.style.top = `${top + deltaY}px`;
//            }
//         }
//         // Sync the selection box immediately so it follows the mouse
//         updateRects();
//       });
//     };

//     const handleWindowUp = () => {
//       if (!draggingRef.current.isDragging) return;
      
//       const { elementId, handle } = draggingRef.current;
//       const el = iframeRef.current?.contentDocument?.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;

//       if (el && elementId) {
//         // COMMIT to React State only when drag ends
//         if (handle === 'move') {
//           // Check position type to decide how to save
//           const computed = window.getComputedStyle(el);
//           if (computed.position === 'absolute') {
//               onUpdateElementStyle(elementId, 'left', el.style.left);
//               onUpdateElementStyle(elementId, 'top', el.style.top);
//           } else {
//               // Fallback for static/relative elements (optional)
//               onUpdateElementStyle(elementId, 'transform', `translate(${parseFloat(el.style.left) - parseFloat(draggingRef.current.initialRect.left.toString())}px, ${parseFloat(el.style.top) - parseFloat(draggingRef.current.initialRect.top.toString())}px)`);
//           }
//         } else {
//            if (el.style.width) onUpdateElementStyle(elementId, 'width', el.style.width);
//            if (el.style.height) onUpdateElementStyle(elementId, 'height', el.style.height);
//            if (el.style.left) onUpdateElementStyle(elementId, 'left', el.style.left);
//            if (el.style.top) onUpdateElementStyle(elementId, 'top', el.style.top);
//         }
//       }

//       // Reset
//       draggingRef.current.isDragging = false;
//       draggingRef.current.elementId = null;
//     };

//     window.addEventListener('mousemove', handleWindowMove);
//     window.addEventListener('mouseup', handleWindowUp);
//     return () => {
//       window.removeEventListener('mousemove', handleWindowMove);
//       window.removeEventListener('mouseup', handleWindowUp);
//     };
//   }, [zoom, onUpdateElementStyle, updateRects]);

//   if (!document) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-muted/30">
//         <div className="text-center">
//           <h2 className="text-xl font-semibold mb-2">No Design Loaded</h2>
//           <p className="text-muted-foreground">Import an HTML file or select a template to start editing</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div 
//       ref={containerRef}
//       className="flex-1 overflow-auto bg-canvas relative"
//       onClick={(e) => {
//         if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-container')) {
//           onSelectElement(null);
//         }
//       }}
//     >
//       <div
//         className="canvas-container absolute"
//         style={{
//           left: '50%',
//           top: '50%',
//           transform: `translate(-50%, -50%) scale(${zoom})`,
//           transformOrigin: 'center center',
//         }}
//       >
//         <iframe
//           ref={iframeRef}
//           title="Design Canvas"
//           className="shadow-2xl"
//           style={{
//             width: document.width,
//             height: document.height,
//             border: 'none',
//             background: 'white',
//           }}
//         />
//       </div>

//       {Array.from(selectionRects.entries()).map(([id, rect]) => (
//         <SelectionOverlay
//           key={id}
//           targetRect={rect}
//           isSelected={true}
//           zoom={zoom}
//           onMoveStart={(e) => handleMoveStart(e, id)}
//           onResizeStart={(handle, e) => handleResizeStart(handle, e, id)}
//         />
//       ))}

//       {hoverRect && (
//         <SelectionOverlay
//           targetRect={hoverRect}
//           isHovered={true}
//           zoom={zoom}
//         />
//       )}
//     </div>
//   );
// }


import { useCallback, useEffect, useRef, useState } from 'react';
import { DesignDocument, ElementNode, ResizeHandle } from '@/types/editor';
import { elementsToHTML, findElementById } from '@/utils/htmlParser';
import { SelectionOverlay } from './SelectionOverlay';

interface DesignCanvasProps {
  document: DesignDocument | null;
  selectedIds: string[];
  hoveredId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  isEditingText: boolean;
  editingElementId: string | null;
  onSelectElement: (id: string | null, addToSelection?: boolean) => void;
  onHoverElement: (id: string | null) => void;
  onStartTextEditing: (id: string) => void;
  onStopTextEditing: () => void;
  onUpdateElement: (id: string, updates: Partial<ElementNode>) => void;
  onUpdateElementStyle: (id: string, key: string, value: string) => void;
}

export function DesignCanvas({
  document,
  selectedIds,
  hoveredId,
  zoom,
  onSelectElement,
  onHoverElement,
  onStartTextEditing,
  onStopTextEditing,
  onUpdateElement,
  onUpdateElementStyle,
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectionRects, setSelectionRects] = useState<Map<string, DOMRect>>(new Map());
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  // Optimized Ref for Dragging
  const draggingRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    elementId: string | null;
    handle: ResizeHandle | 'move' | null;
    initialRect: { left: number; top: number; width: number; height: number };
    initialOverlayRect: { left: number; top: number; width: number; height: number };
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    elementId: null,
    handle: null,
    initialRect: { left: 0, top: 0, width: 0, height: 0 },
    initialOverlayRect: { left: 0, top: 0, width: 0, height: 0 },
  });

  const updateRects = useCallback(() => {
    if (!iframeRef.current || !containerRef.current) return;
    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    const iframe = iframeRef.current;
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const newRects = new Map<string, DOMRect>();

    selectedIds.forEach((id) => {
      const el = iframeDoc.querySelector(`[data-editor-id="${id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scaled = {
          left: rect.left * zoom,
          top: rect.top * zoom,
          width: rect.width * zoom,
          height: rect.height * zoom,
        };

        newRects.set(id, new DOMRect(
          iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
          iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
          scaled.width,
          scaled.height
        ));
      }
    });

    setSelectionRects(newRects);

    if (hoveredId && !selectedIds.includes(hoveredId)) {
      const el = iframeDoc.querySelector(`[data-editor-id="${hoveredId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scaled = {
          left: rect.left * zoom,
          top: rect.top * zoom,
          width: rect.width * zoom,
          height: rect.height * zoom,
        };
        setHoverRect(new DOMRect(
          iframeRect.left - containerRect.left + scaled.left + container.scrollLeft,
          iframeRect.top - containerRect.top + scaled.top + container.scrollTop,
          scaled.width,
          scaled.height
        ));
      } else {
        setHoverRect(null);
      }
    } else {
      setHoverRect(null);
    }
  }, [selectedIds, hoveredId, zoom]);

  // Initial Iframe Setup
  useEffect(() => {
    if (!document || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return;

    if (iframeDoc.body.innerHTML === '') {
        const html = `
        <!DOCTYPE html>
        <html>
            <head>
            <meta charset="UTF-8">
            <style>
                ${document.fonts.join(';\n')}
                body { margin: 0; padding: 0; min-height: 100vh; position: relative; }
                [data-editor-id] { cursor: pointer; transition: outline 0.1s ease; }
                [data-editor-id]:hover { outline: 1px dashed hsl(217, 91%, 60%); outline-offset: 1px; }
                ${document.styles}
            </style>
            </head>
            <body>${elementsToHTML(document.elements, true)}</body>
        </html>
        `;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
      onSelectElement(editorId || null, e.shiftKey);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
      if (editorId && ['h1', 'h2', 'h3', 'p', 'span', 'div'].includes(target.tagName.toLowerCase())) {
        target.contentEditable = 'true';
        target.focus();
        onStartTextEditing(editorId);
        target.onclick = (evt) => evt.stopPropagation();
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.getAttribute('data-editor-id');
      target.removeAttribute('contenteditable');
      onStopTextEditing();
      if (editorId) {
         const element = findElementById(document.elements, editorId);
         const targetId = element?.children?.[0]?.isTextNode ? element.children[0].id : editorId;
         if (element && target.innerText !== element.children?.[0]?.textContent) {
            onUpdateElement(targetId, { textContent: target.innerText });
         }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (draggingRef.current.isDragging) return;
        const target = e.target as HTMLElement;
        const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
        onHoverElement(editorId || null);
    };

    iframeDoc.body.addEventListener('click', handleClick);
    iframeDoc.body.addEventListener('dblclick', handleDoubleClick);
    iframeDoc.body.addEventListener('mousemove', handleMouseMove);
    iframeDoc.body.addEventListener('blur', handleBlur, true);
    
    // Initial Load
    iframeDoc.fonts.ready.then(updateRects);

    return () => {
      iframeDoc.body.removeEventListener('click', handleClick);
      iframeDoc.body.removeEventListener('dblclick', handleDoubleClick);
      iframeDoc.body.removeEventListener('mousemove', handleMouseMove);
      iframeDoc.body.removeEventListener('blur', handleBlur, true);
    };
  }, [document, onSelectElement, onHoverElement, onStartTextEditing, onStopTextEditing, onUpdateElement, updateRects]);

  // Layout Observers
  useEffect(() => {
    if (!iframeRef.current || !containerRef.current) return;
    updateRects();
    const resizeObserver = new ResizeObserver(updateRects);
    resizeObserver.observe(iframeRef.current);
    containerRef.current.addEventListener('scroll', updateRects);
    return () => {
      resizeObserver.disconnect();
      containerRef.current?.removeEventListener('scroll', updateRects);
    };
  }, [updateRects]);


  // --------------------------------------------------------
  // OPTIMIZED DRAG LOGIC
  // --------------------------------------------------------
  
  const handleMoveStart = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    if (!iframeRef.current?.contentDocument) return;
    const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
    const overlayEl = containerRef.current?.querySelector(`[data-overlay-id="${elementId}"]`) as HTMLElement;
    
    if (!el || !overlayEl) return;

    const rect = el.getBoundingClientRect();
    const computedOverlay = window.getComputedStyle(overlayEl);

    draggingRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      elementId,
      handle: 'move',
      initialRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      initialOverlayRect: { 
        left: parseFloat(computedOverlay.left), 
        top: parseFloat(computedOverlay.top), 
        width: parseFloat(computedOverlay.width), 
        height: parseFloat(computedOverlay.height) 
      }
    };
  }, []);

  const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!iframeRef.current?.contentDocument) return;
    const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
    const overlayEl = containerRef.current?.querySelector(`[data-overlay-id="${elementId}"]`) as HTMLElement;

    if (!el || !overlayEl) return;

    const rect = el.getBoundingClientRect();
    const computedOverlay = window.getComputedStyle(overlayEl);

    draggingRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      elementId,
      handle,
      initialRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      initialOverlayRect: { 
        left: parseFloat(computedOverlay.left), 
        top: parseFloat(computedOverlay.top), 
        width: parseFloat(computedOverlay.width), 
        height: parseFloat(computedOverlay.height) 
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowMove = (e: MouseEvent) => {
      if (!draggingRef.current.isDragging || !iframeRef.current?.contentDocument) return;

      const { startX, startY, elementId, handle, initialRect, initialOverlayRect } = draggingRef.current;
      
      const rawDeltaX = e.clientX - startX;
      const rawDeltaY = e.clientY - startY;
      const zoomedDeltaX = rawDeltaX / zoom;
      const zoomedDeltaY = rawDeltaY / zoom;

      const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
      const overlayEl = containerRef.current?.querySelector(`[data-overlay-id="${elementId}"]`) as HTMLElement;
      
      if (!el || !overlayEl) return;

      requestAnimationFrame(() => {
        if (handle === 'move') {
           el.style.left = `${initialRect.left + zoomedDeltaX}px`;
           el.style.top = `${initialRect.top + zoomedDeltaY}px`;
           overlayEl.style.transform = `translate(${rawDeltaX}px, ${rawDeltaY}px)`;
        } 
        else if (handle) {
           const { width, height, left, top } = initialRect;
           const { width: oW, height: oH, left: oL, top: oT } = initialOverlayRect;

           if (handle.includes('right')) el.style.width = `${width + zoomedDeltaX}px`;
           if (handle.includes('bottom')) el.style.height = `${height + zoomedDeltaY}px`;
           if (handle.includes('left')) {
             el.style.width = `${width - zoomedDeltaX}px`;
             el.style.left = `${left + zoomedDeltaX}px`;
           }
           if (handle.includes('top')) {
             el.style.height = `${height - zoomedDeltaY}px`;
             el.style.top = `${top + zoomedDeltaY}px`;
           }

           if (handle.includes('right')) overlayEl.style.width = `${oW + rawDeltaX}px`;
           if (handle.includes('bottom')) overlayEl.style.height = `${oH + rawDeltaY}px`;
           if (handle.includes('left')) {
             overlayEl.style.width = `${oW - rawDeltaX}px`;
             overlayEl.style.left = `${oL + rawDeltaX}px`;
           }
           if (handle.includes('top')) {
             overlayEl.style.height = `${oH - rawDeltaY}px`;
             overlayEl.style.top = `${oT + rawDeltaY}px`;
           }
        }
      });
    };

    const handleWindowUp = () => {
      if (!draggingRef.current.isDragging) return;
      
      const { elementId, handle } = draggingRef.current;
      const el = iframeRef.current?.contentDocument?.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement;
      const overlayEl = containerRef.current?.querySelector(`[data-overlay-id="${elementId}"]`) as HTMLElement;

      if (el && elementId) {
        if (handle === 'move') {
          if (window.getComputedStyle(el).position === 'absolute') {
              onUpdateElementStyle(elementId, 'left', el.style.left);
              onUpdateElementStyle(elementId, 'top', el.style.top);
          }
        } else {
           if (el.style.width) onUpdateElementStyle(elementId, 'width', el.style.width);
           if (el.style.height) onUpdateElementStyle(elementId, 'height', el.style.height);
           if (el.style.left) onUpdateElementStyle(elementId, 'left', el.style.left);
           if (el.style.top) onUpdateElementStyle(elementId, 'top', el.style.top);
        }
      }

      if (overlayEl) {
        overlayEl.style.transform = '';
        overlayEl.style.width = '';
        overlayEl.style.height = '';
        overlayEl.style.left = '';
        overlayEl.style.top = '';
      }

      draggingRef.current.isDragging = false;
      draggingRef.current.elementId = null;
      updateRects();
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };
  }, [zoom, onUpdateElementStyle, updateRects]);

  if (!document) return <div className="flex-1 bg-muted/30" />;

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-canvas relative"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-container')) {
          onSelectElement(null);
        }
      }}
    >
      <div
        className="canvas-container absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <iframe
          ref={iframeRef}
          className="shadow-2xl"
          style={{ width: document.width, height: document.height, border: 'none', background: 'white' }}
        />
      </div>

      {Array.from(selectionRects.entries()).map(([id, rect]) => (
        <SelectionOverlay
          key={id}
          elementId={id} 
          targetRect={rect}
          isSelected={true}
          zoom={zoom}
          onMoveStart={(e) => handleMoveStart(e, id)}
          onResizeStart={(handle, e) => handleResizeStart(handle, e, id)}
        />
      ))}

      {hoverRect && <SelectionOverlay targetRect={hoverRect} isHovered={true} zoom={zoom} />}
    </div>
  );
}