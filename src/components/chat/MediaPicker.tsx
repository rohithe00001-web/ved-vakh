import React, { useRef } from 'react';
import { Image, Video, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaPickerProps {
  onFilePicked: (file: File, type: 'image' | 'video') => void;
  disabled?: boolean;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ onFilePicked, disabled }) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      onFilePicked(file, type);
      e.target.value = '';
    }
  };

  return (
    <>
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'image')} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileChange(e, 'video')} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground flex-shrink-0" disabled={disabled}>
            <Paperclip className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => imageRef.current?.click()} className="gap-2">
            <Image className="w-4 h-4" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoRef.current?.click()} className="gap-2">
            <Video className="w-4 h-4" /> Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MediaPicker;
