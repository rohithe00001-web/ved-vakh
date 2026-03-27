import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  app_lock: boolean;
  chat_lock: boolean;
  enter_to_send: boolean;
  notifications_enabled: boolean;
  font_size: string;
  theme: string;
  language: string;
  social_twitter: string;
  social_instagram: string;
  social_linkedin: string;
}

const defaults: UserSettings = {
  app_lock: false,
  chat_lock: false,
  enter_to_send: true,
  notifications_enabled: true,
  font_size: 'medium',
  theme: 'dark',
  language: 'en',
  social_twitter: '',
  social_instagram: '',
  social_linkedin: '',
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('user_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          app_lock: (data as any).app_lock ?? false,
          chat_lock: (data as any).chat_lock ?? false,
          enter_to_send: (data as any).enter_to_send ?? true,
          notifications_enabled: (data as any).notifications_enabled ?? true,
          font_size: (data as any).font_size ?? 'medium',
          theme: (data as any).theme ?? 'dark',
          language: (data as any).language ?? 'en',
          social_twitter: (data as any).social_twitter ?? '',
          social_instagram: (data as any).social_instagram ?? '',
          social_linkedin: (data as any).social_linkedin ?? '',
        });
      } else {
        // Create default settings row
        await supabase.from('user_settings' as any).insert({ user_id: user.id } as any);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateSetting = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;
    setSettings(prev => ({ ...prev, ...updates }));
    await supabase
      .from('user_settings' as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('user_id', user.id);
  }, [user]);

  return { settings, loading, updateSetting };
}
