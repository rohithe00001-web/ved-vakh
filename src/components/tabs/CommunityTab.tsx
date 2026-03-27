import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, TrendingUp, BookOpen, ShoppingBag, MessageCircle, Newspaper, UserPlus, Plus, X, Search, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CommunityChat from '@/components/community/CommunityChat';

interface Community {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  member_count: number;
  community_code: string;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; emoji: string }> = {
  news: { icon: <Newspaper className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', emoji: '📰' },
  sports: { icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', emoji: '⚽' },
  education: { icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', emoji: '📚' },
  ecommerce: { icon: <ShoppingBag className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', emoji: '🛒' },
  discussions: { icon: <MessageCircle className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', emoji: '💬' },
};

const CommunityTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('discussions');
  const [newIcon, setNewIcon] = useState('💬');
  const [searchCode, setSearchCode] = useState('');
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);

  useEffect(() => {
    fetchCommunities();
    fetchMemberships();
  }, [user]);

  const fetchCommunities = async () => {
    const { data } = await supabase.from('communities').select('*').order('member_count', { ascending: false });
    setCommunities((data as any[] || []).map(c => ({ ...c, community_code: c.community_code || '', member_count: c.member_count ?? 0 })));
  };

  const fetchMemberships = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('community_members' as any)
      .select('community_id')
      .eq('user_id', user.id);
    if (data) {
      setJoined(new Set((data as any[]).map(d => d.community_id)));
    }
  };

  const categories = ['all', 'news', 'sports', 'education', 'ecommerce', 'discussions'];

  const filtered = (() => {
    let list = activeCategory === 'all' ? communities : communities.filter(c => c.category === activeCategory);
    if (searchCode.trim()) {
      const q = searchCode.trim().toUpperCase();
      list = list.filter(c =>
        (c.community_code || '').toUpperCase().includes(q) ||
        c.name.toUpperCase().includes(q)
      );
    }
    return list;
  })();

  const handleJoin = async (community: Community) => {
    if (!user) return;
    const isJoined = joined.has(community.id);

    if (isJoined) {
      // Leave
      await supabase
        .from('community_members' as any)
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', user.id);
      // Decrement member count
      await supabase.from('communities').update({ member_count: Math.max(0, (community.member_count || 1) - 1) }).eq('id', community.id);
      setJoined(prev => { const n = new Set(prev); n.delete(community.id); return n; });
      toast({ title: `Left ${community.name}` });
    } else {
      // Join
      await supabase.from('community_members' as any).insert({
        community_id: community.id,
        user_id: user.id,
      } as any);
      await supabase.from('communities').update({ member_count: (community.member_count || 0) + 1 }).eq('id', community.id);
      setJoined(prev => new Set(prev).add(community.id));
      toast({ title: `🎉 Joined ${community.name}!`, description: 'Tap to open the chat.' });
    }
    fetchCommunities();
  };

  const handleOpenChat = (community: Community) => {
    if (!joined.has(community.id)) {
      toast({ title: 'Join first', description: 'You need to join this community before chatting.', variant: 'destructive' });
      return;
    }
    setActiveCommunity(community);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data: newComm, error } = await supabase.from('communities').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      category: newCategory,
      icon: newIcon,
      member_count: 1,
      created_by: user.id,
    } as any).select().single();
    setCreating(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    // Auto-join creator
    if (newComm) {
      await supabase.from('community_members' as any).insert({
        community_id: (newComm as any).id,
        user_id: user.id,
      } as any);
    }
    toast({ title: '🎉 Community Created!', description: `${newName} is now live.` });
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
    setNewCategory('discussions');
    setNewIcon('💬');
    fetchCommunities();
    fetchMemberships();
  };

  // If a community chat is active, show the chat
  if (activeCommunity) {
    return <CommunityChat community={activeCommunity} onBack={() => { setActiveCommunity(null); fetchCommunities(); }} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-foreground">Community</h2>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gradient-brand shadow-brand h-8">
            {showCreate ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showCreate ? 'Cancel' : 'Create'}
          </Button>
        </div>

        {/* Search by code or name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchCode}
            onChange={e => setSearchCode(e.target.value)}
            placeholder="Search by name or code (COM-XXXXXX)…"
            className="pl-9 bg-background border-border h-9 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat === 'all' ? '🌍 All' : `${categoryConfig[cat]?.emoji || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Create Community Form */}
      {showCreate && (
        <div className="p-4 border-b border-border bg-muted/30 space-y-3">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Community name…" className="bg-background border-border" />
          <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)…" rows={2} className="bg-background border-border resize-none" />
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={(v) => { setNewCategory(v); setNewIcon(categoryConfig[v]?.emoji || '💬'); }}>
              <SelectTrigger className="flex-1 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating} className="gradient-brand shadow-brand">
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(community => {
            const config = categoryConfig[community.category] || categoryConfig.discussions;
            const isJoined = joined.has(community.id);

            return (
              <div
                key={community.id}
                className={`glass rounded-xl p-5 space-y-3 border hover:border-primary/30 transition-all group cursor-pointer ${config.bg}`}
                onClick={() => isJoined ? handleOpenChat(community) : undefined}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-card">
                      {community.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{community.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-card capitalize ${config.color}`}>
                          {community.category}
                        </span>
                        {community.community_code && (
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                            <Hash className="w-2.5 h-2.5" />{community.community_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{community.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{(community.member_count ?? 0).toLocaleString()} members</span>
                  </div>
                  <div className="flex gap-2">
                    {isJoined && (
                      <Button size="sm" variant="outline" className="h-8 border-primary text-primary" onClick={(e) => { e.stopPropagation(); handleOpenChat(community); }}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />Chat
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleJoin(community); }}
                      variant={isJoined ? 'outline' : 'default'}
                      className={isJoined ? 'border-destructive text-destructive h-8' : 'gradient-brand h-8 shadow-brand'}
                    >
                      {isJoined ? 'Leave' : <><UserPlus className="w-3.5 h-3.5 mr-1" />Join</>}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No communities found</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Try a different search or create one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityTab;
