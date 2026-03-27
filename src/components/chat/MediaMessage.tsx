import React from 'react';
import { Play, Volume2 } from 'lucide-react';

interface MediaMessageProps {
  mediaUrl: string;
  mediaType: 'image' | 'voice' | 'video';
  content?: string;
  isFlagged?: boolean;
  maskedContent?: string | null;
}

const MediaMessage: React.FC<MediaMessageProps> = ({ mediaUrl, mediaType, content, isFlagged, maskedContent }) => {
  if (isFlagged) {
    return (
      <div className="flex items-center gap-2 text-sm italic opacity-70">
        ⚠️ {maskedContent || 'Media content moderated'}
      </div>
    );
  }

  switch (mediaType) {
    case 'image':
      return (
        <div className="space-y-1">
          <img
            src={mediaUrl}
            alt="Shared image"
            className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
          {content && content !== '[Image]' && (
            <p className="text-sm">{content}</p>
          )}
        </div>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <video
            src={mediaUrl}
            controls
            className="rounded-xl max-w-full max-h-64"
            preload="metadata"
          />
          {content && content !== '[Video]' && (
            <p className="text-sm">{content}</p>
          )}
        </div>
      );
    case 'voice':
      return (
        <div className="flex items-center gap-2 min-w-[180px]">
          <Volume2 className="w-4 h-4 flex-shrink-0 opacity-70" />
          <audio src={mediaUrl} controls className="h-8 w-full" preload="metadata" />
        </div>
      );
    default:
      return <p className="text-sm">{content}</p>;
  }
};

export default MediaMessage;
