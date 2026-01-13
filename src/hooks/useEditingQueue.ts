// ============= Editing Queue Hook =============
// Handles debouncing, batching, and retry logic for saves

import { useState, useCallback, useRef, useEffect } from 'react';
import { QueuedOperation, EditingQueueState, UseEditingQueueReturn, PendingChange } from '@/types/editing';
import { ElementNode } from '@/types/editor';
import { startTiming, endTiming } from '@/lib/performanceMetrics';
import { toast } from 'sonner';

const DEBOUNCE_MS = 1500; // 1.5 seconds
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000; // 1 second

const initialState: EditingQueueState = {
  queue: [],
  isProcessing: false,
  lastProcessedAt: null,
  errorCount: 0,
};

interface UseEditingQueueOptions {
  onSave?: (changes: PendingChange[]) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useEditingQueue(options: UseEditingQueueOptions = {}): UseEditingQueueReturn {
  const [queueState, setQueueState] = useState<EditingQueueState>(initialState);
  const queueRef = useRef<QueuedOperation[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Generate unique ID for operations
  const generateId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate exponential backoff delay
  const getBackoffDelay = (retryCount: number): number => {
    return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), 30000); // Max 30 seconds
  };

  const enqueue = useCallback((operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'status'>) => {
    const fullOperation: QueuedOperation = {
      ...operation,
      id: generateId(),
      createdAt: Date.now(),
      status: 'pending',
    };

    queueRef.current.push(fullOperation);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      processQueue();
    }, DEBOUNCE_MS);

    setQueueState(prev => ({
      ...prev,
      queue: [...queueRef.current],
    }));

    console.log('[EditingQueue] Enqueued operation:', fullOperation.type);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    setQueueState(prev => ({ ...prev, isProcessing: true }));

    startTiming('queue_processing');

    try {
      // Get all pending operations
      const pendingOps = queueRef.current.filter(op => op.status === 'pending');
      
      if (pendingOps.length === 0) {
        isProcessingRef.current = false;
        setQueueState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Batch all pending changes together
      const changes: PendingChange[] = pendingOps
        .filter(op => op.type === 'save')
        .map(op => op.payload as PendingChange);

      if (options.onSave && changes.length > 0) {
        // Mark operations as processing
        pendingOps.forEach(op => {
          op.status = 'processing';
          op.lastAttemptAt = Date.now();
        });

        await options.onSave(changes);

        // Mark as completed
        pendingOps.forEach(op => {
          op.status = 'completed';
        });

        // Remove completed operations from queue
        queueRef.current = queueRef.current.filter(op => op.status !== 'completed');

        console.log('[EditingQueue] Processed', changes.length, 'changes successfully');
      }

      setQueueState(prev => ({
        ...prev,
        queue: [...queueRef.current],
        isProcessing: false,
        lastProcessedAt: Date.now(),
        errorCount: 0,
      }));

    } catch (error) {
      console.error('[EditingQueue] Processing failed:', error);

      // Handle retry logic
      queueRef.current.forEach(op => {
        if (op.status === 'processing') {
          op.retryCount++;
          if (op.retryCount >= MAX_RETRIES) {
            op.status = 'failed';
            toast.error('Failed to save changes after multiple attempts');
          } else {
            op.status = 'pending';
            // Schedule retry with exponential backoff
            const delay = getBackoffDelay(op.retryCount);
            console.log('[EditingQueue] Scheduling retry in', delay, 'ms for operation:', op.id);
            setTimeout(() => processQueue(), delay);
          }
        }
      });

      setQueueState(prev => ({
        ...prev,
        queue: [...queueRef.current],
        isProcessing: false,
        errorCount: prev.errorCount + 1,
      }));

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      isProcessingRef.current = false;
      endTiming('queue_processing');
    }
  }, [options]);

  const flush = useCallback(async () => {
    // Clear debounce timer and process immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    console.log('[EditingQueue] Flushing queue immediately');
    await processQueue();
  }, [processQueue]);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    queueRef.current = [];
    setQueueState(initialState);
    console.log('[EditingQueue] Queue cleared');
  }, []);

  const getQueueLength = useCallback(() => {
    return queueRef.current.length;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    queueState,
    enqueue,
    flush,
    clear,
    getQueueLength,
  };
}
