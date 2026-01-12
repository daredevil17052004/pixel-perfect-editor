import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Link, Loader2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
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

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('design-assets')
        .getPublicUrl(filePath);

      onImageSelect(publicUrl);
      toast.success('Image uploaded successfully');
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

    // Basic URL validation
    try {
      new URL(imageUrl);
      onImageSelect(imageUrl);
      setImageUrl('');
      toast.success('Image added');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <Link className="w-3 h-3 mr-1" />
            URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-2 mt-2">
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
            className="w-full h-20 border-dashed flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                <span className="text-xs">Click to upload image</span>
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Max size: 5MB
          </p>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-2 mt-2">
          <div className="space-y-1">
            <Label className="text-xs">Image URL</Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUrlSubmit}
          >
            Add Image
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
