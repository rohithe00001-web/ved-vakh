import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  country: string | null;
  state: string | null;
  district: string | null;
  about_me: string | null;
  avatar_url: string | null;
  profile_rating: number | null;
  violation_count: number | null;
  is_banned: boolean | null;
  is_restricted: boolean | null;
  restriction_until: string | null;
  account_visibility: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const asOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildGeneratedUsername = (userId: string) => `SAFE-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile', error);
      return null;
    }

    return (data as Profile | null) ?? null;
  };

  const createMissingProfile = async (currentUser: User): Promise<Profile | null> => {
    const metadata = currentUser.user_metadata ?? {};

    const profilePayload = {
      user_id: currentUser.id,
      full_name: asOptionalString(metadata.full_name) ?? 'User',
      username: asOptionalString(metadata.username) ?? buildGeneratedUsername(currentUser.id),
      email: currentUser.email ?? '',
      phone: asOptionalString(metadata.phone),
      country: asOptionalString(metadata.country),
      state: asOptionalString(metadata.state),
      district: asOptionalString(metadata.district),
      about_me: asOptionalString(metadata.about_me) ?? '',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profilePayload)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create missing profile', error);
      return fetchProfile(currentUser.id);
    }

    return (data as Profile | null) ?? null;
  };

  const ensureProfile = async (currentUser: User): Promise<Profile | null> => {
    const existingProfile = await fetchProfile(currentUser.id);
    if (existingProfile) return existingProfile;
    return createMissingProfile(currentUser);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const nextProfile = await ensureProfile(user);
    setProfile(nextProfile);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        const nextProfile = await ensureProfile(session.user);
        if (!isMounted) return;
        setProfile(nextProfile);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      void ensureProfile(session.user)
        .then((nextProfile) => {
          if (!isMounted) return;
          setProfile(nextProfile);
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
