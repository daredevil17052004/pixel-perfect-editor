import { useCallback, useEffect, useRef, useState } from 'react';
import { DesignDocument, ElementNode, ResizeHandle, DragState } from '@/types/editor';
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
  panOffset,
  isEditingText,
  editingElementId,
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    elementId: null,
    handle: null,
  });

  // Render document HTML into iframe
  useEffect(() => {
    if (!document || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${document.fonts.join(';\n')}
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0; 
              background: transparent;
              min-height: 100vh;
              position: relative;
            }
            [data-editor-id] {
              cursor: pointer;
              transition: outline 0.1s ease;
            }
            [data-editor-id]:hover {
              outline: 1px dashed hsl(217, 91%, 60%);
              outline-offset: 1px;
            }
            [data-editor-id][style*="position: absolute"] {
              cursor: move;
            }
            ${document.styles}
          </style>
        </head>
        <body>
          ${elementsToHTML(document.elements, true)}
        </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Setup event handlers after content is loaded
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
      onSelectElement(editorId || null, e.shiftKey);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
      if (editorId) {
        // Check if element has text content
        const element = findElementById(document.elements, editorId);
        if (element && (element.tagName === 'h1' || element.tagName === 'h2' || element.tagName === 'h3' || 
            element.tagName === 'p' || element.tagName === 'span' || element.tagName === 'div')) {
          target.setAttribute('contenteditable', 'true');
          target.focus();
          onStartTextEditing(editorId);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorId = target.closest('[data-editor-id]')?.getAttribute('data-editor-id');
      onHoverElement(editorId || null);
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      const editorId = target.getAttribute('data-editor-id');
      if (editorId && editingElementId === editorId) {
        const element = findElementById(document.elements, editorId);
        if (element && element.children.length > 0 && element.children[0].isTextNode) {
          onUpdateElement(element.children[0].id, { textContent: target.textContent || '' });
        }
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      target.removeAttribute('contenteditable');
      onStopTextEditing();
    };

    iframeDoc.body.addEventListener('click', handleClick);
    iframeDoc.body.addEventListener('dblclick', handleDoubleClick);
    iframeDoc.body.addEventListener('mousemove', handleMouseMove);
    iframeDoc.body.addEventListener('input', handleInput);
    iframeDoc.body.addEventListener('blur', handleBlur, true);

    return () => {
      iframeDoc.body.removeEventListener('click', handleClick);
      iframeDoc.body.removeEventListener('dblclick', handleDoubleClick);
      iframeDoc.body.removeEventListener('mousemove', handleMouseMove);
      iframeDoc.body.removeEventListener('input', handleInput);
      iframeDoc.body.removeEventListener('blur', handleBlur, true);
    };
  }, [document, onSelectElement, onHoverElement, onStartTextEditing, onStopTextEditing, onUpdateElement, editingElementId]);

  // Update selection rectangles
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    const updateRects = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeRect = iframe.getBoundingClientRect();
      const newRects = new Map<string, DOMRect>();

      selectedIds.forEach((id) => {
        const el = iframeDoc.querySelector(`[data-editor-id="${id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          newRects.set(id, new DOMRect(
            rect.left + iframeRect.left,
            rect.top + iframeRect.top,
            rect.width,
            rect.height
          ));
        }
      });

      setSelectionRects(newRects);

      // Update hover rect
      if (hoveredId && !selectedIds.includes(hoveredId)) {
        const el = iframeDoc.querySelector(`[data-editor-id="${hoveredId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          setHoverRect(new DOMRect(
            rect.left + iframeRect.left,
            rect.top + iframeRect.top,
            rect.width,
            rect.height
          ));
        } else {
          setHoverRect(null);
        }
      } else {
        setHoverRect(null);
      }
    };

    updateRects();

    // Update on scroll/resize
    const resizeObserver = new ResizeObserver(updateRects);
    resizeObserver.observe(iframeRef.current);

    return () => resizeObserver.disconnect();
  }, [selectedIds, hoveredId, document]);

  // Handle drag/resize
  const handleMoveStart = useCallback((e: React.MouseEvent, elementId: string) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      elementId,
      handle: 'move',
    });
  }, []);

  const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent, elementId: string) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      elementId,
      handle,
    });
  }, []);

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));

      const deltaX = (e.clientX - dragState.startX) / zoom;
      const deltaY = (e.clientY - dragState.startY) / zoom;

      if (!iframeRef.current?.contentDocument || !dragState.elementId) return;
      const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${dragState.elementId}"]`) as HTMLElement;
      if (!el) return;

      if (dragState.handle === 'move') {
        // Check if element is absolutely positioned
        const computedStyle = iframeRef.current.contentWindow?.getComputedStyle(el);
        const position = computedStyle?.position;
        
        if (position === 'absolute') {
          // For absolute positioned elements, update left/top
          const currentLeft = parseFloat(el.style.left) || 0;
          const currentTop = parseFloat(el.style.top) || 0;
          
          // Get stored initial values or set them
          if (!el.dataset.dragStartLeft) {
            el.dataset.dragStartLeft = String(currentLeft);
            el.dataset.dragStartTop = String(currentTop);
          }
          
          const startLeft = parseFloat(el.dataset.dragStartLeft);
          const startTop = parseFloat(el.dataset.dragStartTop);
          
          el.style.left = `${startLeft + deltaX}px`;
          el.style.top = `${startTop + deltaY}px`;
        } else {
          // For other elements, use transform
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
      } else if (dragState.handle) {
        // Resize logic
        const currentWidth = el.offsetWidth;
        const currentHeight = el.offsetHeight;
        
        // Store initial dimensions
        if (!el.dataset.dragStartWidth) {
          el.dataset.dragStartWidth = String(currentWidth);
          el.dataset.dragStartHeight = String(currentHeight);
          el.dataset.dragStartLeft = el.style.left || '0';
          el.dataset.dragStartTop = el.style.top || '0';
        }
        
        const startWidth = parseFloat(el.dataset.dragStartWidth);
        const startHeight = parseFloat(el.dataset.dragStartHeight);
        const startLeft = parseFloat(el.dataset.dragStartLeft) || 0;
        const startTop = parseFloat(el.dataset.dragStartTop) || 0;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        if (dragState.handle.includes('right')) {
          newWidth = startWidth + deltaX;
        }
        if (dragState.handle.includes('bottom')) {
          newHeight = startHeight + deltaY;
        }
        if (dragState.handle.includes('left')) {
          newWidth = startWidth - deltaX;
          newLeft = startLeft + deltaX;
        }
        if (dragState.handle.includes('top')) {
          newHeight = startHeight - deltaY;
          newTop = startTop + deltaY;
        }
        
        if (newWidth > 10) {
          el.style.width = `${newWidth}px`;
          if (dragState.handle.includes('left')) {
            el.style.left = `${newLeft}px`;
          }
        }
        if (newHeight > 10) {
          el.style.height = `${newHeight}px`;
          if (dragState.handle.includes('top')) {
            el.style.top = `${newTop}px`;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState.elementId && dragState.handle) {
        if (!iframeRef.current?.contentDocument) return;
        const el = iframeRef.current.contentDocument.querySelector(`[data-editor-id="${dragState.elementId}"]`) as HTMLElement;
        if (el) {
          if (dragState.handle === 'move') {
            const computedStyle = iframeRef.current.contentWindow?.getComputedStyle(el);
            if (computedStyle?.position === 'absolute') {
              onUpdateElementStyle(dragState.elementId, 'left', el.style.left);
              onUpdateElementStyle(dragState.elementId, 'top', el.style.top);
            } else {
              onUpdateElementStyle(dragState.elementId, 'transform', el.style.transform);
            }
          } else {
            if (el.style.width) onUpdateElementStyle(dragState.elementId, 'width', el.style.width);
            if (el.style.height) onUpdateElementStyle(dragState.elementId, 'height', el.style.height);
            if (el.style.left) onUpdateElementStyle(dragState.elementId, 'left', el.style.left);
            if (el.style.top) onUpdateElementStyle(dragState.elementId, 'top', el.style.top);
          }
          
          // Clean up drag data attributes
          delete el.dataset.dragStartLeft;
          delete el.dataset.dragStartTop;
          delete el.dataset.dragStartWidth;
          delete el.dataset.dragStartHeight;
        }
      }
      
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        elementId: null,
        handle: null,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, onUpdateElementStyle]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Design Loaded</h2>
          <p className="text-muted-foreground">Import an HTML file or select a template to start editing</p>
        </div>
      </div>
    );
  }

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
        {/* Design iframe */}
        <iframe
          ref={iframeRef}
          title="Design Canvas"
          className="shadow-2xl"
          style={{
            width: document.width,
            height: document.height,
            border: 'none',
            background: 'white',
          }}
        />
      </div>

      {/* Selection overlays - rendered outside iframe */}
      {Array.from(selectionRects.entries()).map(([id, rect]) => (
        <SelectionOverlay
          key={id}
          targetRect={rect}
          isSelected={true}
          zoom={zoom}
          onMoveStart={(e) => handleMoveStart(e, id)}
          onResizeStart={(handle, e) => handleResizeStart(handle, e, id)}
        />
      ))}

      {hoverRect && (
        <SelectionOverlay
          targetRect={hoverRect}
          isHovered={true}
          zoom={zoom}
        />
      )}
    </div>
  );
}
