import { ElementNode } from '@/types/editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface PropertiesPanelProps {
  selectedElement: ElementNode | null;
  onUpdateStyle: (key: string, value: string) => void;
}

export function PropertiesPanel({ selectedElement, onUpdateStyle }: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="w-72 bg-card border-l border-border flex flex-col">
        <div className="h-10 px-3 flex items-center border-b border-border">
          <h3 className="text-sm font-medium">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select an element to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  const styles = selectedElement.styles;
  const isTextElement = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(selectedElement.tagName);

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col">
      <div className="h-10 px-3 flex items-center border-b border-border">
        <h3 className="text-sm font-medium">Properties</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Element info */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Element</Label>
            <p className="text-sm font-medium mt-1">{selectedElement.tagName}</p>
          </div>

          <Separator />

          {/* Typography */}
          {isTextElement && (
            <>
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Typography</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs">Font Family</Label>
                  <Select
                    value={styles['font-family']?.replace(/['"]/g, '') || 'Inter'}
                    onValueChange={(value) => onUpdateStyle('font-family', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Oswald">Oswald</SelectItem>
                      <SelectItem value="Anton">Anton</SelectItem>
                      <SelectItem value="Shrikhand">Shrikhand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Input 
                      className="h-8 text-xs"
                      value={styles['font-size'] || '16px'}
                      onChange={(e) => onUpdateStyle('font-size', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Weight</Label>
                    <Select
                      value={styles['font-weight'] || '400'}
                      onValueChange={(value) => onUpdateStyle('font-weight', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light</SelectItem>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-10 h-8 p-1 cursor-pointer"
                      value={styles['color'] || '#000000'}
                      onChange={(e) => onUpdateStyle('color', e.target.value)}
                    />
                    <Input 
                      className="h-8 text-xs flex-1"
                      value={styles['color'] || '#000000'}
                      onChange={(e) => onUpdateStyle('color', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Alignment</Label>
                  <ToggleGroup 
                    type="single" 
                    value={styles['text-align'] || 'left'}
                    onValueChange={(value) => value && onUpdateStyle('text-align', value)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="left" size="sm">
                      <AlignLeft className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" size="sm">
                      <AlignCenter className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" size="sm">
                      <AlignRight className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="justify" size="sm">
                      <AlignJustify className="w-4 h-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Fill & Background */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fill</Label>
            
            <div className="space-y-1">
              <Label className="text-xs">Background Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-10 h-8 p-1 cursor-pointer"
                  value={styles['background-color'] || '#ffffff'}
                  onChange={(e) => onUpdateStyle('background-color', e.target.value)}
                />
                <Input 
                  className="h-8 text-xs flex-1"
                  value={styles['background-color'] || 'transparent'}
                  onChange={(e) => onUpdateStyle('background-color', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Opacity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[parseFloat(styles['opacity'] || '1') * 100]}
                  onValueChange={([value]) => onUpdateStyle('opacity', String(value / 100))}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">
                  {Math.round(parseFloat(styles['opacity'] || '1') * 100)}%
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Layout */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Layout</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Width</Label>
                <Input 
                  className="h-8 text-xs"
                  value={styles['width'] || 'auto'}
                  onChange={(e) => onUpdateStyle('width', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Input 
                  className="h-8 text-xs"
                  value={styles['height'] || 'auto'}
                  onChange={(e) => onUpdateStyle('height', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Padding</Label>
              <Input 
                className="h-8 text-xs"
                value={styles['padding'] || '0'}
                onChange={(e) => onUpdateStyle('padding', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Margin</Label>
              <Input 
                className="h-8 text-xs"
                value={styles['margin'] || '0'}
                onChange={(e) => onUpdateStyle('margin', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Border */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Border</Label>
            
            <div className="space-y-1">
              <Label className="text-xs">Border</Label>
              <Input 
                className="h-8 text-xs"
                placeholder="1px solid #000"
                value={styles['border'] || ''}
                onChange={(e) => onUpdateStyle('border', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Border Radius</Label>
              <Input 
                className="h-8 text-xs"
                value={styles['border-radius'] || '0'}
                onChange={(e) => onUpdateStyle('border-radius', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Effects */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Effects</Label>
            
            <div className="space-y-1">
              <Label className="text-xs">Box Shadow</Label>
              <Input 
                className="h-8 text-xs"
                placeholder="0 4px 6px rgba(0,0,0,0.1)"
                value={styles['box-shadow'] || ''}
                onChange={(e) => onUpdateStyle('box-shadow', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Transform</Label>
              <Input 
                className="h-8 text-xs"
                placeholder="rotate(0deg) scale(1)"
                value={styles['transform'] || ''}
                onChange={(e) => onUpdateStyle('transform', e.target.value)}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
