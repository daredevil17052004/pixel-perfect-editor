import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Ubuntu',
  'Nunito',
  'PT Sans',
  'Source Sans Pro',
  'Rubik',
  'Work Sans',
  'Fira Sans',
  'Anton',
  'Shrikhand',
  'Bebas Neue',
  'Bangers',
  'Pacifico',
  'Lobster',
  'Dancing Script',
  'Satisfy',
  'Great Vibes',
  'Caveat',
  'Permanent Marker',
  'Abril Fatface',
  'Cinzel',
];

const SYSTEM_FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
];

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [search, setSearch] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const allFonts = [...GOOGLE_FONTS, ...SYSTEM_FONTS];
  const filteredFonts = allFonts.filter((font) =>
    font.toLowerCase().includes(search.toLowerCase())
  );

  const loadFont = (fontName: string) => {
    if (loadedFonts.has(fontName) || SYSTEM_FONTS.includes(fontName)) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set([...prev, fontName]));
  };

  const handleFontSelect = (font: string) => {
    loadFont(font);
    onChange(font);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="h-8 text-xs pl-7"
          placeholder="Search fonts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="h-48 border rounded-md">
        <div className="p-1">
          {filteredFonts.map((font) => {
            // Load font on hover for preview
            const handleHover = () => loadFont(font);
            
            return (
              <Button
                key={font}
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start h-8 text-xs font-normal',
                  value === font && 'bg-accent'
                )}
                style={{ fontFamily: font }}
                onClick={() => handleFontSelect(font)}
                onMouseEnter={handleHover}
              >
                {value === font && <Check className="w-3 h-3 mr-2" />}
                {font}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
