import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, Type, Square, Image, Box } from 'lucide-react';
import { useState } from 'react';
import { ElementNode } from '@/types/editor';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayersPanelProps {
  elements: ElementNode[];
  selectedIds: string[];
  onSelectElement: (id: string, addToSelection?: boolean) => void;
}

function getElementIcon(tagName: string) {
  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
    case 'p':
    case 'span':
      return Type;
    case 'img':
      return Image;
    case 'div':
    case 'section':
    case 'article':
    case 'header':
    case 'footer':
      return Box;
    default:
      return Square;
  }
}

function getElementName(element: ElementNode): string {
  if (element.isTextNode) {
    return element.textContent?.slice(0, 20) + (element.textContent && element.textContent.length > 20 ? '...' : '') || 'Text';
  }
  
  const className = element.attributes.class?.split(' ')[0];
  if (className) return className;
  
  if (element.attributes.id) return `#${element.attributes.id}`;
  
  return element.tagName;
}

interface LayerItemProps {
  element: ElementNode;
  depth: number;
  selectedIds: string[];
  onSelectElement: (id: string, addToSelection?: boolean) => void;
}

function LayerItem({ element, depth, selectedIds, onSelectElement }: LayerItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = element.children.filter(c => !c.isTextNode).length > 0;
  const isSelected = selectedIds.includes(element.id);
  const Icon = getElementIcon(element.tagName);

  if (element.isTextNode) return null;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-accent/50 transition-colors text-sm',
          isSelected && 'bg-primary/20 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => onSelectElement(element.id, e.shiftKey)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-4 h-4 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="flex-1 truncate">{getElementName(element)}</span>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {element.children
            .filter(c => !c.isTextNode)
            .map((child) => (
              <LayerItem
                key={child.id}
                element={child}
                depth={depth + 1}
                selectedIds={selectedIds}
                onSelectElement={onSelectElement}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function LayersPanel({ elements, selectedIds, onSelectElement }: LayersPanelProps) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="h-10 px-3 flex items-center border-b border-border">
        <h3 className="text-sm font-medium">Layers</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {elements.map((element) => (
            <LayerItem
              key={element.id}
              element={element}
              depth={0}
              selectedIds={selectedIds}
              onSelectElement={onSelectElement}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
