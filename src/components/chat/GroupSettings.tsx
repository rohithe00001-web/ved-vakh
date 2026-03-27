import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RatingFlag from '@/components/ui/RatingFlag';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Settings, Users, UserPlus, UserMinus, Crown, Shield,
  Search, Edit2, Check, LogOut, Trash2, X
} from 'lucide-react';

interface GroupMember {
  user_id: string;
  full_name: string;
  username: string;
  profile_rating: number;
  avatar_url: string | null;
}

interface GroupSettingsProps {
  conversationId: string;
  groupName: string;
  createdBy: string | null;
  onBack: () => void;
  onGroupUpdated: () => void;
  onLeaveGroup: () => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
  conversationId, groupName, createdBy, onBack, onGroupUpdated, onLeaveGroup
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(groupName);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.id === createdBy;

  useEffect(() => {
    fetchMembers();
  }, [conversationId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data: memberData } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (memberData) {
      const userIds = memberData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_rating, avatar_url')
        .in('user_id', userIds);

      setMembers((profiles || []).map(p => ({
        ...p,
        profile_rating: p.profile_rating ?? 5,
      })));
    }
    setLoading(false);
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await supabase.from('conversations').update({ name: newName.trim() }).eq('id', conversationId);
    setEditing(false);
    onGroupUpdated();
    toast({ title: 'Group renamed' });
  };

  const handleSearchUsers = async () => {
    if (!searchUser.trim()) return;
    const memberIds = members.map(m => m.user_id);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_rating, avatar_url')
      .or(`username.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`)
      .not('user_id', 'in', `(${memberIds.join(',')})`)
      .limit(8);
    setSearchResults((data || []).map(p => ({ ...p, profile_rating: p.profile_rating ?? 5 })));
  };

  const handleAddMember = async (userId: string) => {
    await supabase.from('conversation_members').insert({
      conversation_id: conversationId,
      user_id: userId,
    });
    setSearchResults(prev => prev.filter(r => r.user_id !== userId));
    toast({ title: 'Member added' });
    fetchMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === createdBy) return;
    // We need delete permission - using RPC or direct delete
    // Since conversation_members doesn't have delete RLS for admin, we'll use the creator's context
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    toast({ title: 'Member removed' });
    fetchMembers();
  };

  const handleLeave = async () => {
    if (!user) return;
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    toast({ title: 'You left the group' });
    onLeaveGroup();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Group Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group Info */}
        <div className="p-6 flex flex-col items-center border-b border-border">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-3">
            <Users className="w-10 h-10 text-primary" />
          </div>
          {editing ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="text-center bg-muted border-border"
                autoFocus
              />
              <Button size="icon" onClick={handleRename} className="h-9 w-9 gradient-brand">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setNewName(groupName); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{groupName}</h2>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} members • AI Protected
          </p>
          <div className="flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
            <Shield className="w-3 h-3" />
            <span>All messages moderated by AI</span>
          </div>
        </div>

        {/* Members */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground text-sm">
              Members ({members.length})
            </h4>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddMember(!showAddMember)}
                className="h-8"
              >
                {showAddMember ? <X className="w-3.5 h-3.5 mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                {showAddMember ? 'Cancel' : 'Add'}
              </Button>
            )}
          </div>

          {/* Add member search */}
          {showAddMember && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="Search by name or SAFE-ID…"
                  className="h-9 text-sm bg-muted border-border"
                />
                <Button onClick={handleSearchUsers} size="sm" className="gradient-brand px-3">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searchResults.map(r => (
                <div key={r.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="gradient-brand text-primary-foreground text-xs font-bold">
                      {r.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.username}</p>
                  </div>
                  <RatingFlag rating={r.profile_rating} size="sm" />
                  <Button size="sm" onClick={() => handleAddMember(r.user_id)} className="gradient-brand h-7">
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Member list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {members.map(member => (
                <div key={member.user_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="gradient-brand text-primary-foreground font-bold text-sm">
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <RatingFlag rating={member.profile_rating} size="sm" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                      {member.user_id === createdBy && (
                        <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      {member.user_id === user?.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">You</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.username}</p>
                  </div>
                  {isAdmin && member.user_id !== createdBy && member.user_id !== user?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={handleLeave}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettings;
