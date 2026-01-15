import {
  MousePointer2,
  Type,
  Square,
  Image,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Upload,
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EditorToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onImport: () => void;
  onExport: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onClearCanvas?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  hasSelection?: boolean;
  hasDocument?: boolean;
}

export function EditorToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onImport,
  onExport,
  onBringToFront,
  onSendToBack,
  onClearCanvas,
  onNudge,
  hasSelection = false,
  hasDocument = false,
}: EditorToolbarProps) {
  const tools = [
    { icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { icon: Type, label: 'Text', shortcut: 'T' },
    { icon: Square, label: 'Shape', shortcut: 'R' },
    { icon: Image, label: 'Image', shortcut: 'I' },
  ];

  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-4">
        <div className="w-8 h-8 bg-primary flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm hidden sm:block">DesignFlow</span>
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Tools */}
      <div className="flex items-center gap-0.5 px-2">
        {tools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label} <span className="text-muted-foreground ml-1">{tool.shortcut}</span></p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Layer ordering */}
      <div className="flex items-center gap-0.5 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection}
              onClick={onBringToFront}
            >
              <ArrowUpToLine className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection}
              onClick={onSendToBack}
            >
              <ArrowDownToLine className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Nudge */}
      <div className="flex items-center gap-0.5 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection || !onNudge}
              onClick={() => onNudge?.(0, -10)}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move Up</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection || !onNudge}
              onClick={() => onNudge?.(0, 10)}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move Down</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection || !onNudge}
              onClick={() => onNudge?.(-10, 0)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move Left</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              disabled={!hasSelection || !onNudge}
              onClick={() => onNudge?.(10, 0)}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* History */}
      <div className="flex items-center gap-0.5 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" disabled>
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo <span className="text-muted-foreground ml-1">⌘Z</span></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" disabled>
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo <span className="text-muted-foreground ml-1">⌘⇧Z</span></TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* Clear Canvas */}
      {hasDocument && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-9 h-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                onClick={onClearCanvas}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Canvas</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6 bg-border" />
        </>
      )}

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={onZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={onZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 bg-border" />

      {/* Import/Export */}
      <div className="flex items-center gap-0.5 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={onImport}>
              <Upload className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import HTML</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={onExport}>
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export HTML</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
