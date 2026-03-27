import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { ArrowLeft, Shield, Lock, Eye, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface Props { onBack: () => void; }

const PrivacySettings: React.FC<Props> = ({ onBack }) => {
  const { profile, user, refreshProfile } = useAuth();
  const { settings, updateSetting } = useUserSettings();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [visibility, setVisibility] = useState(profile?.account_visibility || 'public');

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      toast({ title: '🔒 Password Updated!' });
      setNewPassword('');
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setChangingPwd(false);
  };

  const handleVisibilityChange = async (val: string) => {
    setVisibility(val);
    if (!user) return;
    await supabase.from('profiles').update({ account_visibility: val }).eq('user_id', user.id);
    await refreshProfile();
    toast({ title: 'Privacy updated!' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">Privacy & Security</h2>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <Input type="password" placeholder="New password (min. 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-muted border-border h-10 text-sm" />
            <Button onClick={handleChangePassword} disabled={changingPwd} size="sm" className="gradient-brand">
              {changingPwd ? 'Updating…' : 'Update Password'}
            </Button>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Account Visibility</p>
            <Select value={visibility} onValueChange={handleVisibilityChange}>
              <SelectTrigger className="bg-muted border-border h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public"><Eye className="w-3.5 h-3.5 inline mr-2" />Public</SelectItem>
                <SelectItem value="private"><Lock className="w-3.5 h-3.5 inline mr-2" />Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Access Control</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">App Lock</span>
              </div>
              <Switch checked={settings.app_lock} onCheckedChange={(v) => { updateSetting({ app_lock: v }); toast({ title: v ? '🔒 App Lock enabled' : '🔓 App Lock disabled' }); }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Chat Lock</span>
              </div>
              <Switch checked={settings.chat_lock} onCheckedChange={(v) => { updateSetting({ chat_lock: v }); toast({ title: v ? '🔒 Chat Lock enabled' : '🔓 Chat Lock disabled' }); }} />
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm font-medium text-foreground">Hide Chats</p>
            <p className="text-sm text-muted-foreground mt-1">Long-press any chat to hide it. Hidden chats can be revealed with your lock.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
