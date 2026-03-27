import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { moderateMessage, applyModerationPenalty, ModerationResult } from '@/lib/moderation';
import { uploadChatMedia } from '@/lib/mediaUpload';
import ModerationPopup from '@/components/moderation/ModerationPopup';
import MediaMessage from '@/components/chat/MediaMessage';
import MediaPicker from '@/components/chat/MediaPicker';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import { ArrowLeft, Send, Users, Shield, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CommunityInfo {
  id: string;
  name: string;
  icon: string | null;
  community_code: string;
  member_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_flagged: boolean;
  masked_content: string | null;
  media_url?: string | null;
  media_type?: string | null;
  message_type?: string;
}

interface Props {
  community: CommunityInfo;
  onBack: () => void;
}

const CommunityChat: React.FC<Props> = ({ community, onBack }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [pendingModeration, setPendingModeration] = useState<{ content: string; result: ModerationResult } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; type: 'image' | 'video'; previewUrl: string } | null>(null);
  const [pendingMediaInfo, setPendingMediaInfo] = useState<{ url: string; type: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`community-${community.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `community_id=eq.${community.id}`,
      }, (payload) => {
        const n = payload.new as any;
        setMessages(prev => {
          if (prev.some(m => m.id === n.id)) return prev;
          return [...prev, {
            id: n.id, content: n.content, sender_id: n.sender_id,
            created_at: n.created_at, is_flagged: n.is_flagged ?? false,
            masked_content: n.masked_content, media_url: n.media_url,
            media_type: n.media_type, message_type: n.message_type,
          }];
        });
        loadProfileName(n.sender_id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [community.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('community_messages' as any)
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) {
      setMessages((data as any[]).map(m => ({
        id: m.id, content: m.content, sender_id: m.sender_id,
        created_at: m.created_at, is_flagged: m.is_flagged ?? false,
        masked_content: m.masked_content, media_url: m.media_url,
        media_type: m.media_type, message_type: m.message_type,
      })));
      const senderIds = [...new Set((data as any[]).map(m => m.sender_id))];
      for (const sid of senderIds) loadProfileName(sid);
    }
  };

  const loadProfileName = async (userId: string) => {
    if (profilesRef.current[userId]) return;
    const { data } = await supabase.from('profiles').select('full_name').eq('user_id', userId).single();
    if (data) {
      profilesRef.current[userId] = data.full_name;
      setProfiles(prev => ({ ...prev, [userId]: data.full_name }));
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !mediaPreview) || !user || sending || moderating) return;
    const content = input.trim();

    if (mediaPreview) {
      await handleMediaSend(mediaPreview.file, mediaPreview.type, content);
      return;
    }

    setModerating(true);
    const result = await moderateMessage(user.id, content);
    setModerating(false);

    if (result.is_flagged && result.severity_level >= 1) {
      setPendingModeration({ content, result });
      return;
    }

    setInput('');
    await sendCommunityMessage(content, false, null, null, null, 'text');
  };

  const handleMediaSend = async (file: File, mediaType: 'image' | 'video', caption: string) => {
    if (!user) return;
    setSending(true);
    setModerating(true);

    try {
      const uploaded = await uploadChatMedia(user.id, file, mediaType);
      if (!uploaded.url) {
        console.error('Media upload failed result:', uploaded);
        toast({
          title: 'Upload failed',
          description: uploaded.error || 'Upload was blocked before the file could be saved.',
          variant: 'destructive'
        });
        return;
      }

      const result = await moderateMessage(user.id, caption || (mediaType === 'image' ? '[Image]' : '[Video]'), mediaType, uploaded.url);
      
      if (result.is_flagged && result.severity_level > 0) {
        setPendingModeration({ content: caption || (mediaType === 'image' ? '[Image]' : '[Video]'), result });
        setPendingMediaInfo({ url: uploaded.url, type: mediaType });
        return;
      }

      const label = mediaType === 'image' ? '[Image]' : '[Video]';
      await sendCommunityMessage(caption || label, false, null, uploaded.url, mediaType, mediaType);
      setMediaPreview(null);
      setInput('');
    } finally {
      setSending(false);
      setModerating(false);
    }
  };

  const handleVoiceRecorded = async (blob: Blob) => {
    if (!user) return;
    setSending(true);
    setModerating(true);

    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const uploaded = await uploadChatMedia(user.id, file, 'voice');
      if (!uploaded.url) {
        toast({
          title: 'Upload failed',
          description: uploaded.error ?? 'Could not upload voice message.',
          variant: 'destructive'
        });
        return;
      }

      const result = await moderateMessage(user.id, '[Voice Message]', 'voice', uploaded.url);
      if (result.is_flagged && result.severity_level > 0) {
        setPendingModeration({ content: '[Voice Message]', result });
        setPendingMediaInfo({ url: uploaded.url, type: 'voice' });
        return;
      }

      await sendCommunityMessage('[Voice Message]', false, null, uploaded.url, 'voice', 'voice');
    } finally {
      setSending(false);
      setModerating(false);
    }
  };

  const sendCommunityMessage = async (
    content: string, isFlagged: boolean, maskedContent: string | null,
    mediaUrl: string | null, mediaType: string | null, messageType: string
  ) => {
    if (!user) return;
    const insertData: any = {
      community_id: community.id,
      sender_id: user.id,
      content,
      is_flagged: isFlagged,
      masked_content: maskedContent,
      message_type: messageType,
    };
    if (mediaUrl) insertData.media_url = mediaUrl;
    if (mediaType) insertData.media_type = mediaType;

    const { error } = await supabase.from('community_messages' as any).insert(insertData);
    if (error) {
      console.error('Community message insert failed:', error);
      toast({ title: 'Send failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (isFlagged) {
      await applyModerationPenalty(user.id, null, 1);
    }
  };

  const handleFilePicked = (file: File, type: 'image' | 'video') => {
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview({ file, type, previewUrl });
  };

  const handleModerationContinue = async () => {
    if (!pendingModeration || !user) return;
    const { content, result } = pendingModeration;
    const mediaInfo = pendingMediaInfo;
    setPendingModeration(null);
    setPendingMediaInfo(null);
    setMediaPreview(null);
    setInput('');

    if (mediaInfo) {
      await sendCommunityMessage(content, true, result.masked_text, mediaInfo.url, mediaInfo.type, mediaInfo.type === 'voice' ? 'voice' : mediaInfo.type);
    } else {
      await sendCommunityMessage(content, true, result.masked_text, null, null, 'text');
    }
    toast({ title: '⚠️ Message sent with moderation' });
  };

  const handleModerationCancel = () => {
    setPendingModeration(null);
    setPendingMediaInfo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isBanned = profile?.is_banned;
  const isRestricted = profile?.is_restricted && profile?.restriction_until && new Date(profile.restriction_until) > new Date();
  const inputDisabled = sending || moderating || !!isBanned || !!isRestricted;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-muted">{community.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{community.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{community.community_code}</span>
            <span>•</span>
            <Users className="w-3 h-3" />
            <span>{community.member_count} members</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
          <Shield className="w-3 h-3" />
          <span>AI Protected</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">{community.icon}</div>
            <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === user?.id;
          const name = profiles[msg.sender_id] || 'User';
          const hasMedia = msg.media_url && msg.media_type;

          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-muted-foreground">{name}</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {hasMedia ? (
                    <MediaMessage
                      mediaUrl={msg.media_url!}
                      mediaType={msg.media_type as 'image' | 'voice' | 'video'}
                      content={msg.content}
                      isFlagged={msg.is_flagged}
                      maskedContent={msg.masked_content}
                    />
                  ) : msg.is_flagged ? (
                    <span className="italic opacity-70">⚠️ {msg.masked_content || 'Message moderated'}</span>
                  ) : msg.content}
                </div>
                <p className={`text-[10px] mt-1 text-muted-foreground ${isOwn ? 'text-right' : ''}`}>
                  {format(new Date(msg.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-card border-t border-border">
          <div className="relative inline-block">
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.previewUrl} className="h-24 rounded-xl object-cover" alt="preview" />
            ) : (
              <video src={mediaPreview.previewUrl} className="h-24 rounded-xl" />
            )}
            <Button
              size="icon" variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => { URL.revokeObjectURL(mediaPreview.previewUrl); setMediaPreview(null); }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        {isBanned ? (
          <p className="text-center text-sm text-destructive py-2">🚫 Your account is banned.</p>
        ) : isRestricted ? (
          <p className="text-center text-sm text-muted-foreground py-2">⏳ You are temporarily restricted.</p>
        ) : (
          <div className="flex items-center gap-2">
            <MediaPicker onFilePicked={handleFilePicked} disabled={inputDisabled} />
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={inputDisabled} />
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mediaPreview ? 'Add a caption…' : 'Type a message…'}
              className="flex-1 bg-background border-border"
              disabled={inputDisabled}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!input.trim() && !mediaPreview) || inputDisabled}
              className="gradient-brand shadow-brand h-10 w-10"
            >
              {moderating || sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
        {moderating && (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary animate-pulse" />
            AI is analyzing your message…
          </p>
        )}
      </div>

      {pendingModeration && (
        <ModerationPopup
          result={pendingModeration.result}
          originalMessage={pendingModeration.content}
          onContinue={handleModerationContinue}
          onCancel={handleModerationCancel}
        />
      )}
    </div>
  );
};

export default CommunityChat;
