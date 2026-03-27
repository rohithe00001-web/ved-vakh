import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RatingFlag from '@/components/ui/RatingFlag';
import CreateGroupDialog from '@/components/chat/CreateGroupDialog';
import { MessageSquarePlus, Users, Search, Plus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string; type: string; name: string | null; updated_at: string; created_by: string | null;
}

interface ConversationWithPartner extends Conversation {
  partner?: { user_id: string; full_name: string; username: string; profile_rating: number; avatar_url: string | null; };
  lastMessage?: string; memberCount?: number;
}

interface ChatListProps {
  activeConvId: string | null;
  onSelectConv: (id: string, partner: ConversationWithPartner['partner'] | null, conv?: ConversationWithPartner) => void;
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

const ChatList: React.FC<ChatListProps> = ({ activeConvId, onSelectConv }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithPartner[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    user_id: string; full_name: string; username: string; profile_rating: number; avatar_url: string | null;
  }>>([]);

  useEffect(() => { if (user) fetchConversations(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('conv-list-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: memberData } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    if (!memberData?.length) { setLoading(false); setConversations([]); return; }

    const convIds = memberData.map(m => m.conversation_id);
    const [convResult, allMembersResult] = await Promise.all([
      supabase.from('conversations').select('*').in('id', convIds).order('updated_at', { ascending: false }),
      supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds),
    ]);

    const convData = convResult.data;
    const allMembers = allMembersResult.data;
    if (!convData) { setLoading(false); return; }

    const partnerIds = new Set<string>();
    const memberCountMap: Record<string, number> = {};
    convData.forEach(conv => {
      const members = allMembers?.filter(m => m.conversation_id === conv.id) || [];
      memberCountMap[conv.id] = members.length;
      if (conv.type === 'direct') {
        const partner = members.find(m => m.user_id !== user.id);
        if (partner) partnerIds.add(partner.user_id);
      }
    });

    let profilesMap: Record<string, any> = {};
    const partnerIdsArray = Array.from(partnerIds);
    if (partnerIdsArray.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, username, profile_rating, avatar_url').in('user_id', partnerIdsArray);
      if (profiles) profiles.forEach(p => { profilesMap[p.user_id] = p; });
    }

    const lastMsgResults = await Promise.all(convData.map(conv =>
      supabase.from('messages').select('content, masked_content, conversation_id').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).single()
    ));
    const lastMsgMap: Record<string, string> = {};
    lastMsgResults.forEach(r => { if (r.data) lastMsgMap[r.data.conversation_id] = r.data.masked_content || r.data.content; });

    setConversations(convData.map(conv => {
      const members = allMembers?.filter(m => m.conversation_id === conv.id) || [];
      if (conv.type === 'direct') {
        const partnerMember = members.find(m => m.user_id !== user.id);
        return { ...conv, partner: partnerMember ? profilesMap[partnerMember.user_id] : undefined, lastMessage: lastMsgMap[conv.id] };
      }
      return { ...conv, memberCount: memberCountMap[conv.id] || 0, lastMessage: lastMsgMap[conv.id] };
    }));
    setLoading(false);
  }, [user]);

  const handleSearchUsers = async () => {
    if (!searchUser.trim()) return;
    const { data } = await supabase.from('profiles').select('user_id, full_name, username, profile_rating, avatar_url')
      .or(`username.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`).neq('user_id', user?.id || '').limit(8);
    setSearchResults(data || []);
  };

  const startDirectChat = async (targetUserId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    if (existing) {
      for (const m of existing) {
        const { data: other } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', m.conversation_id).eq('user_id', targetUserId).single();
        if (other) { const conv = conversations.find(c => c.id === m.conversation_id); onSelectConv(m.conversation_id, conv?.partner || null, conv); setShowNewChat(false); return; }
      }
    }
    const { data: conv } = await supabase.from('conversations').insert({ type: 'direct', created_by: user.id }).select().single();
    if (conv) {
      await supabase.from('conversation_members').insert([{ conversation_id: conv.id, user_id: user.id }, { conversation_id: conv.id, user_id: targetUserId }]);
      const partner = searchResults.find(r => r.user_id === targetUserId);
      setShowNewChat(false); setSearchResults([]); setSearchUser('');
      await fetchConversations();
      onSelectConv(conv.id, partner || null);
    }
  };

  const handleGroupCreated = async (conversationId: string) => {
    setShowCreateGroup(false); await fetchConversations();
    onSelectConv(conversationId, null, conversations.find(c => c.id === conversationId));
  };

  const filtered = conversations.filter(c => !search || (c.partner?.full_name || c.name || '').toLowerCase().includes(search.toLowerCase()));

  if (showCreateGroup) {
    return <div className="relative h-full"><CreateGroupDialog onClose={() => setShowCreateGroup(false)} onGroupCreated={handleGroupCreated} /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Telegram-style header */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-medium text-[17px] text-foreground">Chats</h2>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" onClick={() => setShowNewChat(!showNewChat)}
              className={cn("w-9 h-9 text-muted-foreground hover:text-foreground rounded-full", showNewChat && "text-primary")}>
              <Edit className="w-[18px] h-[18px]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(true)}
              className="w-9 h-9 text-muted-foreground hover:text-foreground rounded-full">
              <Users className="w-[18px] h-[18px]" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9 h-8 bg-muted/60 border-0 text-sm rounded-lg placeholder:text-muted-foreground/50" />
        </div>
      </div>

      {/* New chat search */}
      {showNewChat && (
        <div className="px-3 py-2.5 border-b border-border bg-card">
          <div className="flex gap-2">
            <Input value={searchUser} onChange={e => setSearchUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
              placeholder="Search by name or ID…"
              className="h-8 text-sm bg-muted/60 border-0 rounded-lg" />
            <Button onClick={handleSearchUsers} size="sm" className="bg-primary hover:bg-primary/90 h-8 px-3 rounded-lg">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {searchResults.map(r => (
                <div key={r.user_id} onClick={() => startDirectChat(r.user_id)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={cn("text-white font-medium text-sm", getAvatarColor(r.full_name))}>
                      {r.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.username}</p>
                  </div>
                  <RatingFlag rating={r.profile_rating ?? 5} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <MessageSquarePlus className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Tap the pencil icon to start chatting</p>
          </div>
        ) : (
          filtered.map(conv => {
            const isGroup = conv.type === 'group';
            const displayName = isGroup ? (conv.name || 'Group Chat') : (conv.partner?.full_name || conv.name || 'Chat');
            const isActive = activeConvId === conv.id;
            const timeAgo = formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false });

            return (
              <button key={conv.id} onClick={() => onSelectConv(conv.id, conv.partner || null, conv)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                  isActive ? 'bg-primary/15' : 'hover:bg-muted/40'
                )}>
                <Avatar className="w-[52px] h-[52px] flex-shrink-0">
                  <AvatarFallback className={cn(
                    'text-white font-medium text-lg',
                    isGroup ? 'bg-primary' : getAvatarColor(displayName)
                  )}>
                    {isGroup ? <Users className="w-6 h-6" /> : displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 border-b border-border/30 pb-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[15px] text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground/70 flex-shrink-0 ml-2">{timeAgo}</p>
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage || 'Start chatting'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
