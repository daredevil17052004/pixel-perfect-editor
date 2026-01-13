// ============= Editing Status Indicator =============
// Visual feedback for save status

import React, { memo } from 'react';
import { Check, Loader2, AlertCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditingStatusIndicatorProps {
  status: 'idle' | 'editing' | 'saving' | 'saved' | 'error';
  lastSavedAt?: number | null;
  errorMessage?: string;
  className?: string;
}

export const EditingStatusIndicator = memo(function EditingStatusIndicator({
  status,
  lastSavedAt,
  errorMessage,
  className,
}: EditingStatusIndicatorProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'editing':
        return {
          icon: <Edit3 className="w-3 h-3" />,
          text: 'Editing...',
          color: 'text-muted-foreground',
        };
      case 'saving':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Saving...',
          color: 'text-primary',
        };
      case 'saved':
        return {
          icon: <Check className="w-3 h-3" />,
          text: lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : 'Saved',
          color: 'text-green-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: errorMessage || 'Save failed',
          color: 'text-destructive',
        };
      default:
        return {
          icon: null,
          text: '',
          color: 'text-muted-foreground',
        };
    }
  };

  const { icon, text, color } = getStatusDisplay();

  if (status === 'idle' && !lastSavedAt) return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', color, className)}>
      {icon}
      <span>{text}</span>
    </div>
  );
});
