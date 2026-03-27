import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { moderateMessage, applyModerationPenalty, ModerationResult } from '@/lib/moderation';
import { uploadChatMedia } from '@/lib/mediaUpload';
import ModerationPopup from '@/components/moderation/ModerationPopup';
import MediaMessage from '@/components/chat/MediaMessage';
import MediaPicker from '@/components/chat/MediaPicker';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import GroupSettings from '@/components/chat/GroupSettings';
import RatingFlag from '@/components/ui/RatingFlag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Shield, AlertTriangle, Loader2, X, Users, Settings, Check, CheckCheck, MoreVertical, Phone, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  masked_content: string | null;
  message_type: string;
  is_flagged: boolean;
  toxicity_score: number | null;
  severity_level: number | null;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  _optimistic?: boolean;
}

interface ConversationPartner {
  user_id: string;
  full_name: string;
  username: string;
  profile_rating: number;
  avatar_url: string | null;
}

interface ChatWindowProps {
  conversationId: string;
  partner: ConversationPartner | null;
  isGroup?: boolean;
  groupName?: string;
  groupCreatedBy?: string | null;
  onBack: () => void;
}

// Telegram-style avatar colors
const avatarColors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
  'bg-cyan-500', 'bg-blue-500', 'bg-violet-500', 'bg-pink-500',
];
const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId, partner, isGroup = false, groupName = 'Group Chat',
  groupCreatedBy = null, onBack
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [pendingModeration, setPendingModeration] = useState<{ result: ModerationResult; text: string } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; type: 'image' | 'video'; previewUrl: string } | null>(null);
  const [pendingMediaInfo, setPendingMediaInfo] = useState<{ url: string; type: string } | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [currentGroupName, setCurrentGroupName] = useState(groupName);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { full_name: string; profile_rating: number }>>({});
  const [memberCount, setMemberCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optimisticIdCounter = useRef(0);

  useEffect(() => { setCurrentGroupName(groupName); }, [groupName]);

  useEffect(() => {
    fetchMessages();
    if (isGroup) fetchGroupMembers();

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const n = payload.new as any;
        setMessages(prev => {
          const withoutOptimistic = prev.filter(m => !m._optimistic || m.sender_id !== n.sender_id || m.content !== n.content);
          if (withoutOptimistic.some(m => m.id === n.id)) return withoutOptimistic;
          return [...withoutOptimistic, n as Message];
        });
        if (isGroup && n.sender_id && !memberProfiles[n.sender_id]) loadMemberProfile(n.sender_id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [messages.length]);

  const fetchGroupMembers = async () => {
    const { data } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', conversationId);
    if (data) {
      setMemberCount(data.length);
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, profile_rating').in('user_id', data.map(m => m.user_id));
      if (profiles) {
        const map: Record<string, { full_name: string; profile_rating: number }> = {};
        profiles.forEach(p => { map[p.user_id] = { full_name: p.full_name, profile_rating: p.profile_rating ?? 5 }; });
        setMemberProfiles(map);
      }
    }
  };

  const loadMemberProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('user_id, full_name, profile_rating').eq('user_id', userId).single();
    if (data) setMemberProfiles(prev => ({ ...prev, [data.user_id]: { full_name: data.full_name, profile_rating: data.profile_rating ?? 5 } }));
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).eq('is_deleted', false).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const addOptimisticMessage = useCallback((content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) return;
    const tempId = `optimistic-${++optimisticIdCounter.current}`;
    setMessages(prev => [...prev, {
      id: tempId, conversation_id: conversationId, sender_id: user.id,
      content, masked_content: null, message_type: mediaType || 'text',
      is_flagged: false, toxicity_score: null, severity_level: null,
      created_at: new Date().toISOString(), media_url: mediaUrl, media_type: mediaType, _optimistic: true,
    }]);
  }, [user, conversationId]);

  const handleSend = async () => {
    if ((!inputText.trim() && !mediaPreview) || !user || sending || moderating) return;
    const text = inputText.trim();
    if (mediaPreview) { await handleMediaSend(mediaPreview.file, mediaPreview.type, text); return; }
    setInputText('');
    setModerating(true);
    try {
      const result = await moderateMessage(user.id, text, 'text');
      if (result.is_flagged && result.severity_level > 0) { setPendingModeration({ result, text }); setModerating(false); return; }
      addOptimisticMessage(text);
      await sendMessage(text, 'text', false, null, 0, null, null, null, null, null);
    } finally { setModerating(false); }
  };

  const handleMediaSend = async (file: File, mediaType: 'image' | 'video', caption: string) => {
    if (!user) return;
    setSending(true); setModerating(true);
    try {
      const uploaded = await uploadChatMedia(user.id, file, mediaType);
      if (!uploaded.url) { toast({ title: 'Upload failed', description: uploaded.error || 'Upload was blocked.', variant: 'destructive' }); return; }
      const result = await moderateMessage(user.id, caption || (mediaType === 'image' ? '[Image]' : '[Video]'), mediaType, uploaded.url);
      if (result.is_flagged && result.severity_level > 0) { setPendingModeration({ result, text: caption || (mediaType === 'image' ? '[Image]' : '[Video]') }); setPendingMediaInfo({ url: uploaded.url, type: mediaType }); return; }
      const label = mediaType === 'image' ? '[Image]' : '[Video]';
      addOptimisticMessage(caption || label, uploaded.url, mediaType);
      await sendMessage(caption || label, 'text', false, null, 0, null, null, null, uploaded.url, mediaType);
      setMediaPreview(null); setInputText('');
    } finally { setSending(false); setModerating(false); }
  };

  const handleVoiceRecorded = async (blob: Blob) => {
    if (!user) return;
    setSending(true); setModerating(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const uploaded = await uploadChatMedia(user.id, file, 'voice');
      if (!uploaded.url) { toast({ title: 'Upload failed', description: uploaded.error ?? 'Could not upload voice message.', variant: 'destructive' }); return; }
      const result = await moderateMessage(user.id, '[Voice Message]', 'voice', uploaded.url);
      if (result.is_flagged && result.severity_level > 0) { setPendingModeration({ result, text: '[Voice Message]' }); setPendingMediaInfo({ url: uploaded.url, type: 'voice' }); return; }
      addOptimisticMessage('[Voice Message]', uploaded.url, 'voice');
      await sendMessage('[Voice Message]', 'voice', false, null, 0, null, null, null, uploaded.url, 'voice');
    } finally { setSending(false); setModerating(false); }
  };

  const handleFilePicked = (file: File, type: 'image' | 'video') => {
    setMediaPreview({ file, type, previewUrl: URL.createObjectURL(file) });
  };

  const sendMessage = async (
    content: string, messageType: string, isFlagged: boolean, maskedContent: string | null,
    severityLevel: number, toxicityScore: number | null, moderationReason: string | null,
    flaggedTerms: string[] | null, mediaUrl: string | null = null, mediaType: string | null = null
  ) => {
    if (!user) return;
    setSending(true);
    try {
      const insertData: any = {
        conversation_id: conversationId, sender_id: user.id, content,
        masked_content: maskedContent, message_type: messageType, is_flagged: isFlagged,
        toxicity_score: toxicityScore, severity_level: severityLevel,
        moderation_reason: moderationReason, flagged_terms: flaggedTerms,
      };
      if (mediaUrl) insertData.media_url = mediaUrl;
      if (mediaType) insertData.media_type = mediaType;

      const { data: msg, error: insertError } = await supabase.from('messages').insert(insertData).select().single();
      if (insertError) { setMessages(prev => prev.filter(m => !m._optimistic)); toast({ title: 'Send failed', description: insertError.message, variant: 'destructive' }); return; }
      if (isFlagged && msg && severityLevel > 0) await applyModerationPenalty(user.id, msg.id, severityLevel);
      supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).then(() => {});
    } finally { setSending(false); }
  };

  const handleModerationContinue = async () => {
    if (!pendingModeration) return;
    const { result, text } = pendingModeration;
    const mediaInfo = pendingMediaInfo;
    setPendingModeration(null); setPendingMediaInfo(null); setMediaPreview(null); setInputText('');
    addOptimisticMessage(result.masked_text || text, mediaInfo?.url, mediaInfo?.type);
    if (mediaInfo) {
      await sendMessage(text, mediaInfo.type === 'voice' ? 'voice' : 'text', true, result.masked_text || text, result.severity_level, result.toxicity_score, result.explanation, result.flagged_terms, mediaInfo.url, mediaInfo.type);
    } else {
      await sendMessage(text, 'text', true, result.masked_text || text, result.severity_level, result.toxicity_score, result.explanation, result.flagged_terms);
    }
  };

  const handleModerationCancel = () => { setPendingModeration(null); setPendingMediaInfo(null); inputRef.current?.focus(); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const formatTime = (dateStr: string) => { try { return format(new Date(dateStr), 'HH:mm'); } catch { return ''; } };

  const groupedMessages = useMemo(() => {
    return messages.reduce((acc, msg) => {
      const date = format(new Date(msg.created_at), 'MMMM d');
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {} as Record<string, Message[]>);
  }, [messages]);

  const isBanned = profile?.is_banned;
  const isRestricted = profile?.is_restricted && profile?.restriction_until && new Date(profile.restriction_until) > new Date();
  const inputDisabled = sending || moderating || !!isBanned || !!isRestricted;

  if (showGroupSettings && isGroup) {
    return (
      <GroupSettings conversationId={conversationId} groupName={currentGroupName} createdBy={groupCreatedBy}
        onBack={() => setShowGroupSettings(false)}
        onGroupUpdated={() => { fetchGroupMembers(); supabase.from('conversations').select('name').eq('id', conversationId).single().then(({ data }) => { if (data?.name) setCurrentGroupName(data.name); }); }}
        onLeaveGroup={onBack} />
    );
  }

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You';
    return memberProfiles[senderId]?.full_name || partner?.full_name || 'User';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Telegram-style header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-card border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {isGroup ? (
          <button onClick={() => setShowGroupSettings(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                <Users className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate text-[15px]">{currentGroupName}</p>
              <p className="text-xs text-primary">{memberCount} members</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className={cn("text-white font-medium", getAvatarColor(partner?.full_name || 'U'))}>
                  {partner?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              {partner && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <RatingFlag rating={partner.profile_rating} size="sm" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate text-[15px]">{partner?.full_name || 'Chat'}</p>
              <p className="text-xs text-primary">{partner?.username}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">AI</span>
          </div>
          {isGroup && (
            <Button variant="ghost" size="icon" onClick={() => setShowGroupSettings(true)} className="h-9 w-9 text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages area with wallpaper */}
      <ScrollArea className="flex-1 chat-wallpaper">
        <div className="px-3 py-2 max-w-3xl mx-auto">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-foreground/70 bg-black/20 backdrop-blur-sm px-3 py-0.5 rounded-full font-medium">{date}</span>
              </div>
              {msgs.map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                const hasMedia = msg.media_url && msg.media_type;
                const senderName = isGroup && !isMine ? getSenderName(msg.sender_id) : null;
                const senderRating = isGroup && !isMine ? (memberProfiles[msg.sender_id]?.profile_rating ?? 5) : null;
                const isOptimistic = msg._optimistic;
                const showTail = idx === msgs.length - 1 || msgs[idx + 1]?.sender_id !== msg.sender_id;

                return (
                  <div key={msg.id} className={cn('flex mb-1 message-in', isMine ? 'justify-end' : 'justify-start', showTail && 'mb-2')}>
                    <div className={cn(
                      'relative max-w-[70%] px-3 py-1.5 text-[14px] leading-[1.35] shadow-sm',
                      isMine
                        ? cn('bg-chat-bubble-sent text-white rounded-xl rounded-br-sm', showTail && 'bubble-tail-right')
                        : cn('bg-chat-bubble-received text-foreground rounded-xl rounded-bl-sm', showTail && 'bubble-tail-left'),
                      isOptimistic && 'opacity-70'
                    )}>
                      {senderName && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={cn("text-xs font-medium", getAvatarColor(senderName).replace('bg-', 'text-'))}>{senderName}</span>
                          {senderRating !== null && <RatingFlag rating={senderRating} size="sm" />}
                        </div>
                      )}
                      {hasMedia ? (
                        <MediaMessage mediaUrl={msg.media_url!} mediaType={msg.media_type as 'image' | 'voice' | 'video'} content={msg.content} isFlagged={msg.is_flagged} maskedContent={msg.masked_content} />
                      ) : (
                        <span>{msg.masked_content || msg.content}</span>
                      )}
                      <span className={cn(
                        'inline-flex items-center gap-0.5 float-right ml-2 mt-1',
                        isMine ? 'text-white/60' : 'text-muted-foreground'
                      )}>
                        {msg.is_flagged && <AlertTriangle className="w-2.5 h-2.5 text-warning" />}
                        <span className="text-[11px]">{formatTime(msg.created_at)}</span>
                        {isMine && (
                          isOptimistic
                            ? <Check className="w-3.5 h-3.5" />
                            : <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/80" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-3 py-2 bg-card border-t border-border">
          <div className="relative inline-block">
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.previewUrl} className="h-20 rounded-lg object-cover" alt="preview" />
            ) : (
              <video src={mediaPreview.previewUrl} className="h-20 rounded-lg" />
            )}
            <Button size="icon" variant="destructive" className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
              onClick={() => { URL.revokeObjectURL(mediaPreview.previewUrl); setMediaPreview(null); }}>
              <X className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Telegram-style input area */}
      <div className="px-2 py-1.5 bg-card border-t border-border flex-shrink-0">
        {isBanned && (
          <div className="mx-1 mb-1.5 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
            <Shield className="w-3.5 h-3.5" /> Account permanently suspended.
          </div>
        )}
        {isRestricted && (
          <div className="mx-1 mb-1.5 flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Restricted for 24 hours.
          </div>
        )}
        <div className="flex items-center gap-1">
          <MediaPicker onFilePicked={handleFilePicked} disabled={inputDisabled} />
          <div className="flex-1 relative">
            <Input
              ref={inputRef} value={inputText}
              onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={mediaPreview ? 'Add a caption…' : 'Message'}
              disabled={inputDisabled}
              className="bg-muted border-0 focus:ring-0 h-10 rounded-full px-4 text-[14px] placeholder:text-muted-foreground/60"
            />
          </div>
          {inputText.trim() || mediaPreview ? (
            <Button onClick={handleSend}
              disabled={(!inputText.trim() && !mediaPreview) || sending || moderating || !!isBanned}
              size="icon" className="bg-primary hover:bg-primary/90 rounded-full w-10 h-10 flex-shrink-0 transition-all">
              {moderating || sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          ) : (
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={inputDisabled} />
          )}
        </div>
        {moderating && (
          <p className="text-[11px] text-muted-foreground mt-1 ml-2 flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary animate-pulse" /> Analyzing…
          </p>
        )}
      </div>

      {pendingModeration && (
        <ModerationPopup result={pendingModeration.result} originalMessage={pendingModeration.text}
          onContinue={handleModerationContinue} onCancel={handleModerationCancel} />
      )}
    </div>
  );
};

export default ChatWindow;
