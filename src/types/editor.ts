export interface ElementNode {
  id: string;
  tagName: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  children: ElementNode[];
  textContent?: string;
  isTextNode?: boolean;
  parentId?: string;
}

export interface DesignDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: ElementNode[];
  styles: string;
  fonts: string[];
}

export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface EditorState {
  document: DesignDocument | null;
  selection: SelectionState;
  zoom: number;
  panOffset: { x: number; y: number };
  isEditingText: boolean;
  editingElementId: string | null;
}

export type ResizeHandle = 
  | 'top-left' 
  | 'top' 
  | 'top-right' 
  | 'right' 
  | 'bottom-right' 
  | 'bottom' 
  | 'bottom-left' 
  | 'left';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  elementId: string | null;
  handle: ResizeHandle | 'move' | null;
}
