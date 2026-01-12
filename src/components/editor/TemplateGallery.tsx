import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (html: string) => void;
  onImportFile: () => void;
}

const templates = [
  {
    id: 'retro-poster',
    name: 'Retro Poster',
    preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop',
    description: 'Bold retro-style poster with torn paper effects',
  },
  {
    id: 'neon-poster',
    name: 'Neon Glow',
    preview: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=300&h=400&fit=crop',
    description: 'Dark theme with neon glow effects',
  },
  {
    id: 'gradient-design',
    name: 'Gradient Wave',
    preview: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=400&fit=crop',
    description: 'Colorful gradient background design',
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
    description: 'Clean minimal design with typography focus',
  },
];

const templateHTML: Record<string, string> = {
  'retro-poster': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .poster-container {
            width: 100%;
            max-width: 600px;
            aspect-ratio: 4/5;
            background-color: #1e3a8a;
            position: relative;
            overflow: hidden;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        .content-area {
            position: absolute;
            top: 30%;
            left: 0;
            width: 100%;
            text-align: center;
            padding: 0 20px;
            box-sizing: border-box;
        }
        .headline {
            color: #ffffff;
            font-family: 'Anton', sans-serif;
            font-size: 3.5rem;
            text-transform: uppercase;
            margin: 0;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.3);
        }
        .subheadline {
            color: #fcd34d;
            font-size: 1.5rem;
            margin-top: 20px;
            font-weight: 700;
        }
        .cta-button {
            display: inline-block;
            margin-top: 40px;
            padding: 15px 40px;
            background: #e9458f;
            color: white;
            font-weight: 700;
            text-transform: uppercase;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="poster-container">
        <div class="content-area">
            <h1 class="headline">Create Something Amazing</h1>
            <p class="subheadline">Unleash Your Creativity</p>
            <button class="cta-button">Get Started</button>
        </div>
    </div>
</body>
</html>`,
  'neon-poster': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap');
        body { margin: 0; font-family: 'Oswald', sans-serif; }
        .poster-container {
            width: 100%;
            max-width: 600px;
            aspect-ratio: 2/3;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            position: relative;
            overflow: hidden;
        }
        .frame {
            position: absolute;
            top: 20px;
            bottom: 20px;
            left: 20px;
            right: 20px;
            border: 3px solid #00eaff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px #00eaff, inset 0 0 20px rgba(0,234,255,0.1);
        }
        .headline {
            color: #ffffff;
            font-size: 3rem;
            text-transform: uppercase;
            text-align: center;
            margin: 0;
            text-shadow: 0 0 20px #00eaff, 0 0 40px #00eaff;
        }
        .subheadline {
            color: #e0ffff;
            font-size: 1.2rem;
            margin-top: 20px;
            text-align: center;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="poster-container">
        <div class="frame">
            <h1 class="headline">Illuminate Your World</h1>
            <p class="subheadline">The Future is Bright</p>
        </div>
    </div>
</body>
</html>`,
  'gradient-design': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .poster-container {
            width: 100%;
            max-width: 600px;
            aspect-ratio: 4/5;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 40px;
            box-sizing: border-box;
        }
        .headline {
            color: #ffffff;
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin: 0;
        }
        .subheadline {
            color: rgba(255,255,255,0.9);
            font-size: 1.3rem;
            margin-top: 20px;
            text-align: center;
        }
        .circle {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
        }
        .circle-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            right: -100px;
        }
        .circle-2 {
            width: 200px;
            height: 200px;
            bottom: -50px;
            left: -50px;
        }
    </style>
</head>
<body>
    <div class="poster-container">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <h1 class="headline">Design with Passion</h1>
        <p class="subheadline">Create beautiful visuals that inspire</p>
    </div>
</body>
</html>`,
  'minimal': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .poster-container {
            width: 100%;
            max-width: 600px;
            aspect-ratio: 4/5;
            background: #fafafa;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 60px;
            box-sizing: border-box;
        }
        .headline {
            font-family: 'Playfair Display', serif;
            color: #1a1a1a;
            font-size: 4rem;
            text-align: center;
            margin: 0;
            line-height: 1.1;
        }
        .divider {
            width: 80px;
            height: 3px;
            background: #1a1a1a;
            margin: 30px 0;
        }
        .subheadline {
            color: #666666;
            font-size: 1.1rem;
            text-align: center;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="poster-container">
        <h1 class="headline">Less is More</h1>
        <div class="divider"></div>
        <p class="subheadline">Simplicity is the ultimate sophistication. Focus on what matters.</p>
    </div>
</body>
</html>`,
};

export function TemplateGallery({ open, onOpenChange, onSelectTemplate, onImportFile }: TemplateGalleryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a professionally designed template or import your own HTML file
          </DialogDescription>
        </DialogHeader>
        
        {/* Import button */}
        <div className="flex justify-center py-4 border-b border-border">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => {
              onOpenChange(false);
              setTimeout(onImportFile, 100);
            }}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import HTML File
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg overflow-hidden group"
                onClick={() => {
                  onSelectTemplate(templateHTML[template.id]);
                  onOpenChange(false);
                }}
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img 
                    src={template.preview} 
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
