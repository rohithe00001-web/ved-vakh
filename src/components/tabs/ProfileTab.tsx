import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProfileRating from '@/components/ui/ProfileRating';
import RatingFlag, { getRatingPercent, getRatingFlagColor } from '@/components/ui/RatingFlag';
import { Copy, Edit2, Save, X, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileTab: React.FC = () => {
  const { user, profile, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    country: '',
    state: '',
    district: '',
    about_me: '',
  });
  const [modLogs, setModLogs] = useState<Array<{ severity_level: number; action_taken: string; rating_penalty: number; created_at: string }>>([]);

  useEffect(() => {
    if (!profile) return;

    setForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      country: profile.country || '',
      state: profile.state || '',
      district: profile.district || '',
      about_me: profile.about_me || '',
    });
  }, [profile]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('moderation_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setModLogs(data || []);
    };

    void fetchLogs();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase.from('profiles').update(form).eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Could not update profile',
        description: error.message,
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    await refreshProfile();
    setEditing(false);
    setSaving(false);
    toast({ title: 'Profile updated' });
  };

  const copyUserId = async () => {
    await navigator.clipboard.writeText(profile?.username || '');
    toast({ title: 'Copied', description: 'Your SAFE-ID has been copied.' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl gradient-brand animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-6 text-center max-w-md space-y-3">
          <h2 className="font-display font-bold text-xl text-foreground">Profile unavailable</h2>
          <p className="text-sm text-muted-foreground">
            We couldn’t load your profile details yet. Try refreshing your account data.
          </p>
          <Button onClick={refreshProfile} className="gradient-brand">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const rating = profile.profile_rating ?? 5;
  const violations = profile.violation_count ?? 0;
  const banned = profile.is_banned ?? false;
  const ratingPercent = getRatingPercent(rating);
  const flagColor = getRatingFlagColor(rating);
  const ratingColor = flagColor === 'green' ? 'bg-emerald-500' : flagColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="glass rounded-2xl p-6 text-center space-y-4">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 mx-auto">
              <AvatarFallback className="gradient-brand text-primary-foreground font-bold text-3xl">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {banned && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">{profile.full_name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-sm font-mono text-primary">{profile.username}</span>
              <button onClick={copyUserId} className="text-muted-foreground hover:text-foreground">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <ProfileRating rating={rating} size="lg" />
              <RatingFlag rating={rating} size="lg" showPercent />
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${ratingColor}`} style={{ width: `${ratingPercent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Trust Score: {ratingPercent}% · {violations} violations
              {ratingPercent <= 50 && ratingPercent >= 10 && ' · ⚠️ Warning zone'}
              {ratingPercent < 10 && ' · 🚫 Ban threshold'}
            </p>
          </div>

          {banned && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Shield className="w-4 h-4" />
              Account suspended due to policy violations.
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Profile Info</h3>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gradient-brand">
                  <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {[
            { label: 'Full Name', key: 'full_name' },
            { label: 'Phone', key: 'phone' },
            { label: 'Country', key: 'country' },
            { label: 'State', key: 'state' },
            { label: 'District', key: 'district' },
          ].map(({ label, key }) => (
            <div key={key} className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-muted-foreground text-sm">{label}</Label>
              {editing ? (
                <Input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="col-span-2 bg-muted border-border h-9 text-sm"
                />
              ) : (
                <p className="col-span-2 text-sm text-foreground">{(profile[key as keyof typeof profile] as string) || '—'}</p>
              )}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">About Me</Label>
            {editing ? (
              <Textarea
                value={form.about_me}
                onChange={(e) => setForm((f) => ({ ...f, about_me: e.target.value }))}
                rows={3}
                className="bg-muted border-border text-sm resize-none"
                placeholder="Tell people about yourself…"
              />
            ) : (
              <p className="text-sm text-foreground">{profile.about_me || '—'}</p>
            )}
          </div>
        </div>

        {modLogs.length > 0 && (
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />Moderation History
            </h3>
            {modLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    log.severity_level >= 3
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-primary/15 text-primary'
                  }`}
                >
                  L{log.severity_level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="capitalize text-foreground/80">{log.action_taken.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs text-destructive font-mono">-{log.rating_penalty}⭐</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
