import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield, LogOut, ChevronRight, User,
  MessageSquare, Globe, Mail, Info
} from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import ChatSettings from '@/components/settings/ChatSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import ContactSettings from '@/components/settings/ContactSettings';
import AboutSettings from '@/components/settings/AboutSettings';

type SettingsPage = 'menu' | 'profile' | 'privacy' | 'chat' | 'system' | 'contact' | 'about';

const menuItems: { key: SettingsPage; icon: React.ElementType; label: string; desc: string; iconColor: string }[] = [
  { key: 'profile', icon: User, label: 'Profile Settings', desc: 'Edit info, SAFE-ID & rating', iconColor: 'text-primary' },
  { key: 'privacy', icon: Shield, label: 'Privacy & Security', desc: 'Password, visibility & locks', iconColor: 'text-primary' },
  { key: 'chat', icon: MessageSquare, label: 'Chat & Keyboard', desc: 'Messages, font & theme', iconColor: 'text-accent' },
  { key: 'system', icon: Globe, label: 'System Settings', desc: 'Language & social links', iconColor: 'text-primary' },
  { key: 'contact', icon: Mail, label: 'Contact Us', desc: 'Support & feedback', iconColor: 'text-primary' },
  { key: 'about', icon: Info, label: 'About Ved-Vakh', desc: 'Version & AI info', iconColor: 'text-primary' },
];

const SettingsTab: React.FC = () => {
  const { signOut } = useAuth();
  const [page, setPage] = useState<SettingsPage>('menu');

  if (page === 'profile') return <ProfileSettings onBack={() => setPage('menu')} />;
  if (page === 'privacy') return <PrivacySettings onBack={() => setPage('menu')} />;
  if (page === 'chat') return <ChatSettings onBack={() => setPage('menu')} />;
  if (page === 'system') return <SystemSettings onBack={() => setPage('menu')} />;
  if (page === 'contact') return <ContactSettings onBack={() => setPage('menu')} />;
  if (page === 'about') return <AboutSettings onBack={() => setPage('menu')} />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-3 pb-24">
        <h2 className="font-display font-bold text-xl text-foreground mb-4">Settings</h2>

        <div className="glass rounded-2xl overflow-hidden divide-y divide-border">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="glass rounded-2xl overflow-hidden border-destructive/20">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-5 py-4 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
