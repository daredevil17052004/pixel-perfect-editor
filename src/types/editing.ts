// ============= Editing System Types =============

import { ElementNode, DesignDocument } from './editor';

// ============= Editing Layer Types =============

export interface EditingLayerState {
  activeElementId: string | null;
  localContent: string;
  cursorPosition: number;
  isEditing: boolean;
}

// ============= Pending Changes Types =============

export interface PendingChange {
  elementId: string;
  content: string;
  previousContent: string;
  timestamp: number;
  type: 'text' | 'style' | 'attribute' | 'position';
  metadata?: Record<string, unknown>;
}

export interface PendingChangesState {
  changes: Map<string, PendingChange>;
  isDirty: boolean;
  lastSyncedAt: number | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

// ============= History / Undo-Redo Types =============

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  elementId: string;
  before: Partial<ElementNode>;
  after: Partial<ElementNode>;
  action: 'update' | 'create' | 'delete' | 'batch';
  description?: string;
}

export interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  maxHistorySize: number;
}

// ============= Conflict Resolution Types =============

export interface ConflictInfo {
  elementId: string;
  localChange: PendingChange;
  remoteChange: PendingChange;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
}

// ============= Operational Transform Types =============

export type OperationType = 'insert' | 'delete' | 'retain';

export interface TextOperation {
  type: OperationType;
  position: number;
  text?: string;
  count?: number;
  userId?: string;
  timestamp: number;
}

export interface TransformResult {
  op1Prime: TextOperation;
  op2Prime: TextOperation;
}

// ============= Realtime Collaboration Types =============

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  editingElementId: string | null;
  cursorPosition: number | null;
  lastActiveAt: number;
}

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: ElementNode;
  oldRecord?: ElementNode;
  userId?: string;
  timestamp: number;
}

// ============= Performance Metrics Types =============

export interface PerformanceMetrics {
  keystrokeToStateMs: number;
  stateToRenderMs: number;
  renderToDisplayMs: number;
  saveToDbMs: number;
  totalLatencyMs: number;
  timestamp: number;
  elementId: string;
}

export interface PerformanceThresholds {
  keystrokeToDisplay: number;  // Target: 100ms
  keystrokeToPersisted: number; // Target: 500ms
  warningMultiplier: number;
}

// ============= Local Storage Types =============

export interface LocalDraft {
  designId: string;
  document: DesignDocument;
  timestamp: number;
  expiresAt: number;
}

export interface AutoSaveState {
  isAutoSaving: boolean;
  lastAutoSaveAt: number | null;
  autoSaveInterval: number;
  hasUnsavedChanges: boolean;
}

// ============= Validation Types =============

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============= Queue Types =============

export interface QueuedOperation {
  id: string;
  type: 'save' | 'delete' | 'batch';
  payload: unknown;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttemptAt?: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

export interface EditingQueueState {
  queue: QueuedOperation[];
  isProcessing: boolean;
  lastProcessedAt: number | null;
  errorCount: number;
}

// ============= Component Props Types =============

export interface TextElementProps {
  element: ElementNode;
  isSelected: boolean;
  onContentChange: (content: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export interface EditingStatusIndicatorProps {
  status: 'idle' | 'editing' | 'saving' | 'saved' | 'error';
  lastSavedAt?: number;
  errorMessage?: string;
}

// ============= Hook Return Types =============

export interface UseEditingLayerReturn {
  editingState: EditingLayerState;
  startEditing: (elementId: string, content: string) => void;
  updateLocalContent: (content: string) => void;
  stopEditing: () => void;
  getLocalContent: () => string;
  setCursorPosition: (position: number) => void;
}

export interface UsePendingChangesLayerReturn {
  pendingState: PendingChangesState;
  addChange: (change: Omit<PendingChange, 'timestamp'>) => void;
  getChanges: () => PendingChange[];
  clearChanges: () => void;
  hasChanges: () => boolean;
  getSyncStatus: () => PendingChangesState['syncStatus'];
}

export interface UsePersistedLayerReturn {
  document: DesignDocument | null;
  isLoading: boolean;
  error: Error | null;
  saveDocument: (doc: DesignDocument) => Promise<void>;
  updateElement: (elementId: string, updates: Partial<ElementNode>) => Promise<void>;
  refetch: () => void;
}

export interface UseEditingQueueReturn {
  queueState: EditingQueueState;
  enqueue: (operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'status'>) => void;
  flush: () => Promise<void>;
  clear: () => void;
  getQueueLength: () => number;
}

export interface UseLocalAutoSaveReturn {
  autoSaveState: AutoSaveState;
  saveDraft: (document: DesignDocument) => void;
  loadDraft: (designId: string) => LocalDraft | null;
  clearDraft: (designId: string) => void;
  clearOldDrafts: () => void;
}

export interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushSnapshot: (snapshot: Omit<HistorySnapshot, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export interface UseIncrementalUpdateReturn {
  updateSingleElement: (elementId: string, updates: Partial<ElementNode>) => void;
  batchUpdates: (updates: Array<{ elementId: string; updates: Partial<ElementNode> }>) => void;
}

export interface UseRealtimeEditingReturn {
  isConnected: boolean;
  activeUsers: UserPresence[];
  subscribe: () => void;
  unsubscribe: () => void;
  broadcastChange: (change: PendingChange) => void;
}

export interface UseOptimizedEditorReturn {
  // Combined state
  document: DesignDocument | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // Editing
  startEditing: (elementId: string, content: string) => void;
  stopEditing: () => void;
  updateContent: (content: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Persistence
  save: () => Promise<void>;
  forceSave: () => Promise<void>;
  
  // Status
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  
  // Collaboration
  activeUsers: UserPresence[];
  
  // Element operations
  updateElement: (elementId: string, updates: Partial<ElementNode>) => void;
  deleteElement: (elementId: string) => void;
  addElement: (element: ElementNode) => void;
}
