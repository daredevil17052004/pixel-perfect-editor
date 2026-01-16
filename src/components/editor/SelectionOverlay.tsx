// import { useCallback, useEffect, useState } from 'react';
// import { ResizeHandle } from '@/types/editor';

// interface SelectionOverlayProps {
//   targetRect: DOMRect | null;
//   isHovered?: boolean;
//   isSelected?: boolean;
//   onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
//   onMoveStart?: (e: React.MouseEvent) => void;
//   zoom?: number;
// }

// export function SelectionOverlay({ 
//   targetRect, 
//   isHovered, 
//   isSelected,
//   onResizeStart,
//   onMoveStart,
//   zoom = 1 
// }: SelectionOverlayProps) {
//   if (!targetRect) return null;

//   const handles: { position: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
//     { position: 'top-left', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
//     { position: 'top', cursor: 'ns-resize', style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
//     { position: 'top-right', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
//     { position: 'right', cursor: 'ew-resize', style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
//     { position: 'bottom-right', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
//     { position: 'bottom', cursor: 'ns-resize', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
//     { position: 'bottom-left', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
//     { position: 'left', cursor: 'ew-resize', style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
//   ];

//   return (
//     <div
//       className="absolute pointer-events-none"
//       style={{
//         left: targetRect.left,
//         top: targetRect.top,
//         width: targetRect.width,
//         height: targetRect.height,
//       }}
//     >
//       {/* Selection/Hover outline */}
//       <div
//         className={`absolute inset-0 border-2 ${
//           isSelected ? 'border-primary' : 'border-primary/50'
//         }`}
//         style={{ 
//           pointerEvents: isSelected ? 'auto' : 'none',
//           cursor: isSelected ? 'move' : 'default',
//         }}
//         onMouseDown={(e) => {
//           if (isSelected && onMoveStart) {
//             e.stopPropagation();
//             onMoveStart(e);
//           }
//         }}
//       />

//       {/* Resize handles */}
//       {isSelected && handles.map((handle) => (
//         <div
//           key={handle.position}
//           className="absolute w-2.5 h-2.5 bg-background border-2 border-primary pointer-events-auto"
//           style={{
//             ...handle.style,
//             cursor: handle.cursor,
//           }}
//           onMouseDown={(e) => {
//             e.stopPropagation();
//             onResizeStart?.(handle.position, e);
//           }}
//         />
//       ))}
//     </div>
//   );
// }


import { ResizeHandle } from '@/types/editor';

interface SelectionOverlayProps {
  elementId?: string;
  targetRect: DOMRect | null;
  isHovered?: boolean;
  isSelected?: boolean;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  onMoveStart?: (e: React.MouseEvent) => void;
  zoom?: number;
}

export function SelectionOverlay({ 
  elementId,
  targetRect, 
  isHovered, 
  isSelected,
  onResizeStart,
  onMoveStart,
  zoom = 1 
}: SelectionOverlayProps) {
  if (!targetRect) return null;

  const handles: { position: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
    { position: 'top-left', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
    { position: 'top', cursor: 'ns-resize', style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'top-right', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
    { position: 'right', cursor: 'ew-resize', style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { position: 'bottom-right', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
    { position: 'bottom', cursor: 'ns-resize', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'bottom-left', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
    { position: 'left', cursor: 'ew-resize', style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      data-overlay-id={elementId}
      className="absolute pointer-events-none"
      style={{
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        willChange: isSelected ? 'left, top, width, height, transform' : 'auto' 
      }}
    >
      {/* Selection/Hover outline */}
      <div
        className={`absolute inset-0 border-2 ${
          isSelected ? 'border-primary' : 'border-primary/50'
        }`}
        style={{ 
          pointerEvents: isSelected ? 'auto' : 'none',
          cursor: isSelected ? 'move' : 'default',
        }}
        onMouseDown={(e) => {
          if (isSelected && onMoveStart) {
            e.stopPropagation();
            onMoveStart(e);
          }
        }}
      />

      {/* Resize handles */}
      {isSelected && handles.map((handle) => (
        <div
          key={handle.position}
          className="absolute w-2.5 h-2.5 bg-background border-2 border-primary pointer-events-auto"
          style={{
            ...handle.style,
            cursor: handle.cursor,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart?.(handle.position, e);
          }}
        />
      ))}
    </div>
  );
}