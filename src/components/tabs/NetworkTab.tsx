import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProfileRating from '@/components/ui/ProfileRating';
import RatingFlag from '@/components/ui/RatingFlag';
import { Button } from '@/components/ui/button';
import { Trophy, Users, UserCheck, UserX, MessageSquare, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendProfile {
  user_id: string;
  full_name: string;
  username: string;
  country: string | null;
  profile_rating: number;
  avatar_url: string | null;
  request_id: string;
  status: string;
  is_sender: boolean;
}

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  username: string;
  country: string | null;
  profile_rating: number;
  avatar_url: string | null;
}

const NetworkTab: React.FC<{ onStartChat: (userId: string, name: string) => void }> = ({ onStartChat }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'friends' | 'pending' | 'leaderboard'>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchLeaderboard();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id, status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!data) { setLoading(false); return; }

    const enriched: FriendProfile[] = [];
    for (const r of data) {
      const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, country, profile_rating, avatar_url')
        .eq('user_id', otherId)
        .single();
      if (profile) {
        enriched.push({
          ...profile,
          request_id: r.id,
          status: r.status,
          is_sender: r.sender_id === user.id,
        });
      }
    }
    setFriends(enriched);
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, country, profile_rating, avatar_url')
      .eq('account_visibility', 'public')
      .order('profile_rating', { ascending: false })
      .limit(20);
    setLeaderboard((data as LeaderboardUser[]) || []);
  };

  const acceptRequest = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    toast({ title: '🤝 Friend Added!', description: 'You are now connected.' });
    fetchFriends();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    fetchFriends();
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingReceived = friends.filter(f => f.status === 'pending' && !f.is_sender);
  const pendingSent = friends.filter(f => f.status === 'pending' && f.is_sender);

  const rankColors = ['text-yellow-400', 'text-slate-400', 'text-orange-600'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="font-display font-bold text-xl text-foreground mb-3">My Network</h2>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {[
            { key: 'friends', label: 'Friends', icon: Users, count: acceptedFriends.length },
            { key: 'pending', label: 'Pending', icon: UserCheck, count: pendingReceived.length },
            { key: 'leaderboard', label: 'Top Users', icon: Trophy, count: null },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as typeof activeSection)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeSection === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSection === tab.key ? 'bg-white/20' : 'bg-primary/20 text-primary'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeSection === 'friends' && (
          <>
            {acceptedFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Search for people to connect</p>
              </div>
            ) : acceptedFriends.map(f => (
              <div key={f.user_id} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="gradient-brand text-primary-foreground font-bold">
                      {f.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <RatingFlag rating={f.profile_rating} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{f.full_name}</p>
                  <p className="text-xs text-primary font-mono">{f.username}</p>
                  {f.country && <p className="text-xs text-muted-foreground">{f.country}</p>}
                  <ProfileRating rating={f.profile_rating} size="sm" className="mt-1" />
                </div>
                <Button size="sm" onClick={() => onStartChat(f.user_id, f.full_name)}
                  className="gradient-brand shadow-brand">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </>
        )}

        {activeSection === 'pending' && (
          <>
            {pendingReceived.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Received</p>
                {pendingReceived.map(f => (
                  <div key={f.request_id} className="glass rounded-xl p-4 flex items-center gap-3 mb-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="gradient-brand text-primary-foreground font-bold">
                        {f.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{f.full_name}</p>
                      <p className="text-xs text-primary font-mono">{f.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptRequest(f.request_id)} className="gradient-brand h-8">
                        <UserCheck className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectRequest(f.request_id)} className="h-8">
                        <UserX className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingSent.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sent</p>
                {pendingSent.map(f => (
                  <div key={f.request_id} className="glass rounded-xl p-4 flex items-center gap-3 mb-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="gradient-brand text-primary-foreground font-bold">
                        {f.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{f.full_name}</p>
                      <p className="text-xs text-muted-foreground">Pending…</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            )}
          </>
        )}

        {activeSection === 'leaderboard' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="font-display font-bold text-foreground">Global Trust Leaderboard</h3>
            </div>
            {leaderboard.map((u, i) => (
              <div key={u.user_id} className={`glass rounded-xl p-3 flex items-center gap-3 ${i < 3 ? 'border-yellow-500/20' : ''}`}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{rankEmojis[i]}</span>
                  ) : (
                    <span className={`font-bold text-sm ${rankColors[i] || 'text-muted-foreground'}`}>#{i + 1}</span>
                  )}
                </div>
                <div className="relative">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="gradient-brand text-primary-foreground font-bold text-xs">
                      {u.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <RatingFlag rating={u.profile_rating} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{u.full_name}</p>
                  <p className="text-xs text-primary font-mono">{u.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.country && <span className="text-xs text-muted-foreground hidden sm:block">{u.country}</span>}
                  <ProfileRating rating={u.profile_rating} size="sm" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkTab;
