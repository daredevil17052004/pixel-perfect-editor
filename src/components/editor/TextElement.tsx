// ============= Text Element Component =============
// Optimized with refs, memoization, and uncontrolled editing

import React, { memo, useRef, useCallback, useEffect } from 'react';
import { ElementNode } from '@/types/editor';
import { startTiming, endTiming } from '@/lib/performanceMetrics';

interface TextElementProps {
  element: ElementNode;
  isSelected: boolean;
  isEditing: boolean;
  onContentChange: (content: string) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export const TextElement = memo(function TextElement({
  element,
  isSelected,
  isEditing,
  onContentChange,
  onBlur,
  onFocus,
}: TextElementProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef<string>('');

  // Get text content from element
  const textContent = element.children?.[0]?.textContent || element.textContent || '';

  // Focus element when editing starts
  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  // Handle input without state updates
  const handleInput = useCallback(() => {
    if (!contentRef.current) return;
    
    startTiming('keystroke_to_state');
    const content = contentRef.current.textContent || '';
    onContentChange(content);
    endTiming('keystroke_to_state');
  }, [onContentChange]);

  // Handle blur - finalize edit
  const handleBlur = useCallback(() => {
    if (!contentRef.current) return;
    
    const finalContent = contentRef.current.textContent || '';
    if (finalContent !== initialContentRef.current) {
      onContentChange(finalContent);
    }
    onBlur();
  }, [onBlur, onContentChange]);

  // Handle focus - store initial content
  const handleFocus = useCallback(() => {
    initialContentRef.current = contentRef.current?.textContent || '';
    onFocus();
  }, [onFocus]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      contentRef.current?.blur();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      if (contentRef.current) {
        contentRef.current.textContent = initialContentRef.current;
      }
      contentRef.current?.blur();
    }
  }, []);

  // Handle paste - sanitize content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    // Sanitize: remove excessive whitespace, limit length
    const sanitized = text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);
    
    document.execCommand('insertText', false, sanitized);
  }, []);

  return (
    <div
      ref={contentRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{
        ...element.styles,
        outline: isSelected ? '2px solid hsl(217, 91%, 60%)' : 'none',
        cursor: isEditing ? 'text' : 'pointer',
      }}
      data-editor-id={element.id}
    >
      {textContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.element.textContent === nextProps.element.textContent
  );
});
