// ============= Operational Transformation for Collaborative Editing =============

import { TextOperation, TransformResult, OperationType } from '@/types/editing';

/**
 * Operational Transformation (OT) implementation for text editing
 * Handles concurrent edits by multiple users
 */

// Create an insert operation
export function createInsertOp(position: number, text: string, userId?: string): TextOperation {
  return {
    type: 'insert',
    position,
    text,
    userId,
    timestamp: Date.now(),
  };
}

// Create a delete operation
export function createDeleteOp(position: number, count: number, userId?: string): TextOperation {
  return {
    type: 'delete',
    position,
    count,
    userId,
    timestamp: Date.now(),
  };
}

// Create a retain operation (no-op for position tracking)
export function createRetainOp(position: number, count: number): TextOperation {
  return {
    type: 'retain',
    position,
    count,
    timestamp: Date.now(),
  };
}

/**
 * Transform two concurrent operations so they can be applied in any order
 * and produce the same result (convergence property)
 */
export function transform(op1: TextOperation, op2: TextOperation): TransformResult {
  // If same user, no transformation needed
  if (op1.userId && op2.userId && op1.userId === op2.userId) {
    return { op1Prime: op1, op2Prime: op2 };
  }

  let op1Prime: TextOperation = { ...op1 };
  let op2Prime: TextOperation = { ...op2 };

  if (op1.type === 'insert' && op2.type === 'insert') {
    // Both insertions
    if (op1.position <= op2.position) {
      // op1 comes first, shift op2
      op2Prime = {
        ...op2,
        position: op2.position + (op1.text?.length || 0),
      };
    } else {
      // op2 comes first, shift op1
      op1Prime = {
        ...op1,
        position: op1.position + (op2.text?.length || 0),
      };
    }
  } else if (op1.type === 'delete' && op2.type === 'delete') {
    // Both deletions
    const op1End = op1.position + (op1.count || 0);
    const op2End = op2.position + (op2.count || 0);

    if (op1End <= op2.position) {
      // op1 completely before op2
      op2Prime = {
        ...op2,
        position: op2.position - (op1.count || 0),
      };
    } else if (op2End <= op1.position) {
      // op2 completely before op1
      op1Prime = {
        ...op1,
        position: op1.position - (op2.count || 0),
      };
    } else {
      // Overlapping deletions - more complex case
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);
      const overlapLength = overlapEnd - overlapStart;

      if (op1.position <= op2.position) {
        op1Prime = {
          ...op1,
          count: (op1.count || 0) - Math.min(overlapLength, op2End - op1.position),
        };
        op2Prime = {
          ...op2,
          position: op1.position,
          count: Math.max(0, (op2.count || 0) - overlapLength),
        };
      } else {
        op1Prime = {
          ...op1,
          position: op2.position,
          count: Math.max(0, (op1.count || 0) - overlapLength),
        };
        op2Prime = {
          ...op2,
          count: (op2.count || 0) - Math.min(overlapLength, op1End - op2.position),
        };
      }
    }
  } else if (op1.type === 'insert' && op2.type === 'delete') {
    // op1 is insert, op2 is delete
    const deleteEnd = op2.position + (op2.count || 0);

    if (op1.position <= op2.position) {
      // Insert before delete region
      op2Prime = {
        ...op2,
        position: op2.position + (op1.text?.length || 0),
      };
    } else if (op1.position >= deleteEnd) {
      // Insert after delete region
      op1Prime = {
        ...op1,
        position: op1.position - (op2.count || 0),
      };
    } else {
      // Insert inside delete region - insert survives, delete splits
      op1Prime = {
        ...op1,
        position: op2.position,
      };
      op2Prime = {
        ...op2,
        count: (op2.count || 0) + (op1.text?.length || 0),
      };
    }
  } else if (op1.type === 'delete' && op2.type === 'insert') {
    // op1 is delete, op2 is insert - mirror of above
    const result = transform(op2, op1);
    op1Prime = result.op2Prime;
    op2Prime = result.op1Prime;
  }

  return { op1Prime, op2Prime };
}

/**
 * Apply an operation to a string
 */
export function applyOperation(text: string, op: TextOperation): string {
  switch (op.type) {
    case 'insert':
      if (op.text === undefined) return text;
      if (op.position < 0 || op.position > text.length) {
        console.warn('Insert position out of bounds:', op.position, text.length);
        return text;
      }
      return text.slice(0, op.position) + op.text + text.slice(op.position);

    case 'delete':
      if (op.count === undefined || op.count <= 0) return text;
      if (op.position < 0 || op.position >= text.length) {
        console.warn('Delete position out of bounds:', op.position, text.length);
        return text;
      }
      const deleteEnd = Math.min(op.position + op.count, text.length);
      return text.slice(0, op.position) + text.slice(deleteEnd);

    case 'retain':
      // No-op
      return text;

    default:
      return text;
  }
}

/**
 * Compose multiple operations into a single sequence
 */
export function composeOperations(ops: TextOperation[]): TextOperation[] {
  if (ops.length === 0) return [];
  if (ops.length === 1) return ops;

  const result: TextOperation[] = [];
  let offset = 0;

  for (const op of ops) {
    const adjustedOp = { ...op };

    // Adjust position based on previous operations
    if (op.type === 'insert') {
      adjustedOp.position = op.position + offset;
      offset += op.text?.length || 0;
    } else if (op.type === 'delete') {
      adjustedOp.position = op.position + offset;
      offset -= op.count || 0;
    }

    result.push(adjustedOp);
  }

  return result;
}

/**
 * Calculate the diff between two strings and return operations
 */
export function calculateDiff(oldText: string, newText: string, userId?: string): TextOperation[] {
  const ops: TextOperation[] = [];

  // Simple diff algorithm for single edits
  // Find common prefix
  let prefixLen = 0;
  while (prefixLen < oldText.length && prefixLen < newText.length && 
         oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix
  let oldSuffixStart = oldText.length;
  let newSuffixStart = newText.length;
  while (oldSuffixStart > prefixLen && newSuffixStart > prefixLen &&
         oldText[oldSuffixStart - 1] === newText[newSuffixStart - 1]) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  // Calculate deletions and insertions
  const deletedLength = oldSuffixStart - prefixLen;
  const insertedText = newText.slice(prefixLen, newSuffixStart);

  if (deletedLength > 0) {
    ops.push(createDeleteOp(prefixLen, deletedLength, userId));
  }

  if (insertedText.length > 0) {
    ops.push(createInsertOp(prefixLen, insertedText, userId));
  }

  return ops;
}

/**
 * Last-Write-Wins conflict resolution
 */
export function resolveConflictLWW<T extends { timestamp: number }>(
  local: T,
  remote: T
): { winner: T; isLocal: boolean } {
  const isLocal = local.timestamp >= remote.timestamp;
  return {
    winner: isLocal ? local : remote,
    isLocal,
  };
}
