import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProfileRating from '@/components/ui/ProfileRating';
import RatingFlag from '@/components/ui/RatingFlag';
import { Search, UserPlus, MapPin, Check, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserResult {
  user_id: string;
  full_name: string;
  username: string;
  country: string | null;
  profile_rating: number;
  avatar_url: string | null;
  about_me: string | null;
}

const SearchTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id, status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const fSet = new Set<string>();
    const sSet = new Set<string>();
    data?.forEach(r => {
      if (r.status === 'accepted') {
        fSet.add(r.sender_id === user.id ? r.receiver_id : r.sender_id);
      } else if (r.status === 'pending' && r.sender_id === user.id) {
        sSet.add(r.receiver_id);
      }
    });
    setFriends(fSet);
    setSentRequests(sSet);
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, country, profile_rating, avatar_url, about_me')
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .eq('account_visibility', 'public')
      .neq('user_id', user?.id || '')
      .limit(20)
      .abortSignal(abortRef.current.signal);
    setResults((data as UserResult[]) || []);
    setLoading(false);
  }, [user]);

  // Debounced live search – fires 300ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  const sendFriendRequest = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: targetId,
      status: 'pending',
    });
    if (!error) {
      setSentRequests(prev => new Set([...prev, targetId]));
      toast({ title: '👋 Friend Request Sent!', description: 'They will be notified.' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="font-display font-bold text-xl text-foreground mb-3">Find People</h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or SAFE-ID…"
              className="pl-9 pr-10 bg-muted border-border focus:border-primary h-11"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
          </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Search for users by name or SAFE-ID</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Connect with people worldwide</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(u => (
            <div key={u.user_id} className="glass rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="gradient-brand text-primary-foreground font-bold text-lg">
                      {u.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <RatingFlag rating={u.profile_rating} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{u.full_name}</p>
                  <p className="text-xs text-primary font-mono">{u.username}</p>
                  {u.country && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{u.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ProfileRating rating={u.profile_rating} size="sm" />
                <RatingFlag rating={u.profile_rating} size="md" showPercent />
              </div>

              {u.about_me && (
                <p className="text-xs text-muted-foreground line-clamp-2">{u.about_me}</p>
              )}

              <Button
                onClick={() => sendFriendRequest(u.user_id)}
                disabled={friends.has(u.user_id) || sentRequests.has(u.user_id)}
                variant={friends.has(u.user_id) ? 'outline' : 'default'}
                className={cn(
                  'w-full h-9 text-sm',
                  !friends.has(u.user_id) && !sentRequests.has(u.user_id) && 'gradient-brand shadow-brand'
                )}
                size="sm"
              >
                {friends.has(u.user_id) ? (
                  <><Check className="w-3.5 h-3.5 mr-1.5" />Friends</>
                ) : sentRequests.has(u.user_id) ? (
                  <><Clock className="w-3.5 h-3.5 mr-1.5" />Request Sent</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Add Friend</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchTab;
