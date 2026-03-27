import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RatingFlag from '@/components/ui/RatingFlag';
import { useToast } from '@/hooks/use-toast';
import { X, Search, Users, Check, ArrowLeft } from 'lucide-react';

interface SelectedUser {
  user_id: string;
  full_name: string;
  username: string;
  profile_rating: number;
}

interface CreateGroupDialogProps {
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'members' | 'name'>('members');
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [selected, setSelected] = useState<SelectedUser[]>([]);
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_rating')
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .neq('user_id', user.id)
      .limit(10);
    setSearchResults((data || []).map(p => ({ ...p, profile_rating: p.profile_rating ?? 5 })));
  };

  const toggleUser = (u: SelectedUser) => {
    setSelected(prev =>
      prev.some(s => s.user_id === u.user_id)
        ? prev.filter(s => s.user_id !== u.user_id)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!user || !groupName.trim() || selected.length === 0) return;
    setCreating(true);

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ type: 'group', name: groupName.trim(), created_by: user.id })
      .select()
      .single();

    if (!conv) {
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
      setCreating(false);
      return;
    }

    const memberInserts = [
      { conversation_id: conv.id, user_id: user.id },
      ...selected.map(s => ({ conversation_id: conv.id, user_id: s.user_id })),
    ];
    await supabase.from('conversation_members').insert(memberInserts);

    toast({ title: '🎉 Group Created!', description: `${groupName} is ready.` });
    setCreating(false);
    onGroupCreated(conv.id);
  };

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={step === 'name' ? () => setStep('members') : onClose} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {step === 'members' ? 'Select Members' : 'Group Name'}
        </h3>
      </div>

      {step === 'members' ? (
        <>
          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="px-4 py-2 border-b border-border flex flex-wrap gap-1.5">
              {selected.map(s => (
                <span key={s.user_id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                  {s.full_name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleUser(s)} />
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or SAFE-ID…"
                className="h-9 text-sm bg-muted border-border"
              />
              <Button onClick={handleSearch} size="sm" className="gradient-brand px-3">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {searchResults.map(r => {
              const isSelected = selected.some(s => s.user_id === r.user_id);
              return (
                <div
                  key={r.user_id}
                  onClick={() => toggleUser(r)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="gradient-brand text-primary-foreground font-bold text-sm">
                      {r.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.username}</p>
                  </div>
                  <RatingFlag rating={r.profile_rating} size="sm" />
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </div>
              );
            })}
            {searchResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Search for users to add to the group
              </div>
            )}
          </div>

          {/* Next button */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={() => setStep('name')}
              disabled={selected.length === 0}
              className="w-full gradient-brand shadow-brand"
            >
              Next — {selected.length} selected
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <Input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name…"
              className="text-center text-lg bg-muted border-border max-w-xs"
              autoFocus
            />
            <p className="text-sm text-muted-foreground text-center">
              {selected.length + 1} members (including you)
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
              {selected.map(s => (
                <span key={s.user_id} className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {s.full_name}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleCreate}
              disabled={!groupName.trim() || creating}
              className="w-full gradient-brand shadow-brand"
            >
              {creating ? 'Creating…' : 'Create Group'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateGroupDialog;
