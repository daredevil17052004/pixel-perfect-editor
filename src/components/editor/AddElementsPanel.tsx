import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Type, 
  Square, 
  Circle, 
  Image, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft,
  Link,
  Loader2,
  Upload
} from 'lucide-react';
import { ElementNode } from '@/types/editor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddElementsPanelProps {
  onAddElement: (element: ElementNode) => void;
}

let elementIdCounter = 1000;
let elementPositionOffset = 0;

function generateElementId(): string {
  return `new-el-${++elementIdCounter}`;
}

function getNextPosition(): { left: string; top: string } {
  const offset = (elementPositionOffset % 10) * 20; // Stagger elements
  elementPositionOffset++;
  return {
    left: `${50 + offset}px`,
    top: `${50 + offset}px`,
  };
}

const TEXT_ELEMENTS = [
  { 
    icon: Heading1, 
    label: 'Heading 1', 
    tagName: 'h1',
    defaultStyles: { 'font-size': '48px', 'font-weight': '700', 'color': '#000000', 'margin': '0' },
    defaultText: 'Heading 1'
  },
  { 
    icon: Heading2, 
    label: 'Heading 2', 
    tagName: 'h2',
    defaultStyles: { 'font-size': '36px', 'font-weight': '600', 'color': '#000000', 'margin': '0' },
    defaultText: 'Heading 2'
  },
  { 
    icon: Heading3, 
    label: 'Heading 3', 
    tagName: 'h3',
    defaultStyles: { 'font-size': '24px', 'font-weight': '600', 'color': '#000000', 'margin': '0' },
    defaultText: 'Heading 3'
  },
  { 
    icon: AlignLeft, 
    label: 'Paragraph', 
    tagName: 'p',
    defaultStyles: { 'font-size': '16px', 'font-weight': '400', 'color': '#333333', 'margin': '0', 'line-height': '1.5' },
    defaultText: 'Add your text here. Double-click to edit.'
  },
  { 
    icon: Type, 
    label: 'Text Span', 
    tagName: 'span',
    defaultStyles: { 'font-size': '16px', 'color': '#333333', 'display': 'inline-block' },
    defaultText: 'Text'
  },
];

const SHAPE_ELEMENTS = [
  { 
    icon: Square, 
    label: 'Rectangle', 
    defaultStyles: { 
      'width': '200px', 
      'height': '100px', 
      'background-color': '#3b82f6', 
      'border-radius': '4px' 
    }
  },
  { 
    icon: Square, 
    label: 'Rounded Rectangle', 
    defaultStyles: { 
      'width': '200px', 
      'height': '100px', 
      'background-color': '#8b5cf6', 
      'border-radius': '16px' 
    }
  },
  { 
    icon: Circle, 
    label: 'Circle', 
    defaultStyles: { 
      'width': '100px', 
      'height': '100px', 
      'background-color': '#10b981', 
      'border-radius': '50%' 
    }
  },
  { 
    icon: Square, 
    label: 'Square', 
    defaultStyles: { 
      'width': '100px', 
      'height': '100px', 
      'background-color': '#f59e0b' 
    }
  },
  { 
    icon: Square, 
    label: 'Card', 
    defaultStyles: { 
      'width': '300px', 
      'height': '200px', 
      'background-color': '#ffffff', 
      'border-radius': '8px',
      'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'padding': '16px'
    }
  },
  { 
    icon: Square, 
    label: 'Border Box', 
    defaultStyles: { 
      'width': '200px', 
      'height': '100px', 
      'background-color': 'transparent', 
      'border': '2px solid #000000',
      'border-radius': '4px'
    }
  },
];

export function AddElementsPanel({ onAddElement }: AddElementsPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = (textConfig: typeof TEXT_ELEMENTS[0]) => {
    const textNodeId = generateElementId();
    const elementId = generateElementId();
    const pos = getNextPosition();
    
    const element: ElementNode = {
      id: elementId,
      tagName: textConfig.tagName,
      attributes: {},
      styles: { 
        ...textConfig.defaultStyles, 
        'position': 'absolute',
        'left': pos.left,
        'top': pos.top,
        'cursor': 'move',
        'user-select': 'none',
      },
      children: [
        {
          id: textNodeId,
          tagName: '#text',
          attributes: {},
          styles: {},
          children: [],
          textContent: textConfig.defaultText,
          isTextNode: true,
          parentId: elementId,
        }
      ],
    };
    
    onAddElement(element);
    toast.success(`${textConfig.label} added`);
  };

  const handleAddShape = (shapeConfig: typeof SHAPE_ELEMENTS[0]) => {
    const pos = getNextPosition();
    const element: ElementNode = {
      id: generateElementId(),
      tagName: 'div',
      attributes: {},
      styles: { 
        ...shapeConfig.defaultStyles, 
        'position': 'absolute',
        'left': pos.left,
        'top': pos.top,
        'cursor': 'move',
      },
      children: [],
    };
    
    onAddElement(element);
    toast.success(`${shapeConfig.label} added`);
  };

  const handleAddImage = (url: string) => {
    const pos = getNextPosition();
    const element: ElementNode = {
      id: generateElementId(),
      tagName: 'img',
      attributes: { 
        src: url, 
        alt: 'Uploaded image',
        draggable: 'false',
      },
      styles: { 
        'max-width': '300px', 
        'height': 'auto',
        'position': 'absolute',
        'left': pos.left,
        'top': pos.top,
        'cursor': 'move',
        'display': 'block',
      },
      children: [],
    };
    
    onAddElement(element);
    toast.success('Image added');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('design-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('design-assets')
        .getPublicUrl(filePath);

      handleAddImage(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      new URL(imageUrl);
      handleAddImage(imageUrl);
      setImageUrl('');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="h-10 px-3 flex items-center border-b border-border">
        <h3 className="text-sm font-medium">Add Elements</h3>
      </div>
      
      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="text" className="text-xs">
            <Type className="w-3.5 h-3.5 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="shapes" className="text-xs">
            <Square className="w-3.5 h-3.5 mr-1" />
            Shapes
          </TabsTrigger>
          <TabsTrigger value="images" className="text-xs">
            <Image className="w-3.5 h-3.5 mr-1" />
            Images
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="text" className="m-0 p-2">
            <div className="space-y-1">
              {TEXT_ELEMENTS.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-10 text-xs"
                  onClick={() => handleAddText(item)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="shapes" className="m-0 p-2">
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_ELEMENTS.map((item, index) => (
                <Button
                  key={`${item.label}-${index}`}
                  variant="outline"
                  size="sm"
                  className="h-20 flex-col gap-1 text-xs"
                  onClick={() => handleAddShape(item)}
                >
                  <div 
                    className="w-8 h-8"
                    style={{
                      backgroundColor: item.defaultStyles['background-color'] !== 'transparent' 
                        ? item.defaultStyles['background-color'] 
                        : undefined,
                      border: item.defaultStyles['border'],
                      borderRadius: item.defaultStyles['border-radius'],
                    }}
                  />
                  {item.label}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="m-0 p-2">
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                size="sm"
                className="w-full h-24 border-dashed flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Upload Image</span>
                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                  </>
                )}
              </Button>
              
              <div className="space-y-2">
                <Label className="text-xs">Or add from URL</Label>
                <div className="flex gap-1">
                  <Input
                    className="h-8 text-xs flex-1"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={handleUrlSubmit}
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Placeholder images */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Add</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Placeholder', url: 'https://placehold.co/300x200/3b82f6/white?text=Image' },
                    { label: 'Avatar', url: 'https://placehold.co/100x100/8b5cf6/white?text=A' },
                  ].map((img) => (
                    <Button
                      key={img.label}
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col gap-1 text-xs p-1"
                      onClick={() => handleAddImage(img.url)}
                    >
                      <img 
                        src={img.url} 
                        alt={img.label} 
                        className="w-full h-8 object-cover rounded"
                      />
                      {img.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
