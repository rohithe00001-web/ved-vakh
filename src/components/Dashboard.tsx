import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import SearchTab from '@/components/tabs/SearchTab';
import NetworkTab from '@/components/tabs/NetworkTab';
import CommunityTab from '@/components/tabs/CommunityTab';
import ChatbotTab from '@/components/tabs/ChatbotTab';
import ProfileTab from '@/components/tabs/ProfileTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import RatingFlag from '@/components/ui/RatingFlag';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Search, Users, Globe, Bot, User, Settings } from 'lucide-react';
import vedvakhLogo from '@/assets/vedvakh-logo.png';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'search' | 'network' | 'community' | 'chatbot' | 'profile' | 'settings';

interface ConvPartner {
  user_id: string; full_name: string; username: string; profile_rating: number; avatar_url: string | null;
}

interface ConvInfo {
  id: string; type: string; name: string | null; created_by?: string | null;
}

const navItems: { key: Tab; icon: React.ElementType; label: string }[] = [
  { key: 'home', icon: MessageCircle, label: 'Chats' },
  { key: 'search', icon: Search, label: 'Search' },
  { key: 'network', icon: Users, label: 'Network' },
  { key: 'community', icon: Globe, label: 'Community' },
  { key: 'chatbot', icon: Bot, label: 'AI Bot' },
  { key: 'profile', icon: User, label: 'Profile' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<ConvPartner | null>(null);
  const [activeConvInfo, setActiveConvInfo] = useState<ConvInfo | null>(null);

  const handleSelectConv = (id: string, partner: ConvPartner | null, conv?: any) => {
    setActiveConvId(id);
    setActivePartner(partner);
    setActiveConvInfo(conv ? { id: conv.id, type: conv.type, name: conv.name, created_by: conv.created_by } : null);
  };

  const handleStartChat = async (userId: string, name: string) => {
    if (!user) return;
    const { data: myMemberships } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    if (myMemberships) {
      for (const m of myMemberships) {
        const { data: other } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', m.conversation_id).eq('user_id', userId).single();
        if (other) {
          const { data: partnerProfile } = await supabase.from('profiles').select('user_id, full_name, username, profile_rating, avatar_url').eq('user_id', userId).single();
          setActiveConvId(m.conversation_id);
          setActivePartner(partnerProfile ? { ...partnerProfile, profile_rating: partnerProfile.profile_rating ?? 5 } : null);
          setActiveConvInfo(null); setActiveTab('home'); return;
        }
      }
    }
    const { data: conv } = await supabase.from('conversations').insert({ type: 'direct', created_by: user.id }).select().single();
    if (conv) {
      await supabase.from('conversation_members').insert([{ conversation_id: conv.id, user_id: user.id }, { conversation_id: conv.id, user_id: userId }]);
      const { data: partnerProfile } = await supabase.from('profiles').select('user_id, full_name, username, profile_rating, avatar_url').eq('user_id', userId).single();
      setActiveConvId(conv.id);
      setActivePartner(partnerProfile ? { ...partnerProfile, profile_rating: partnerProfile.profile_rating ?? 5 } : null);
      setActiveConvInfo(null); setActiveTab('home');
    }
  };

  const isGroup = activeConvInfo?.type === 'group';

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Telegram-style sidebar */}
      <div className="w-[60px] flex flex-col bg-card border-r border-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center py-3 border-b border-border">
          <img src={vedvakhLogo} alt="Ved-Vakh" className="w-8 h-8" />
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center py-2 gap-0.5">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'w-11 h-11 flex items-center justify-center rounded-xl transition-all relative',
                activeTab === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              title={item.label}
            >
              <item.icon className="w-[20px] h-[20px]" />
            </button>
          ))}
        </nav>

        {/* Profile avatar at bottom */}
        {profile && (
          <div className="flex flex-col items-center py-3 border-t border-border">
            <div className="relative">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {profile.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5">
                <RatingFlag rating={profile.profile_rating ?? 5} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'home' ? (
          <>
            <div className={cn(
              'w-full md:w-[340px] flex-shrink-0 border-r border-border',
              activeConvId ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            )}>
              <ChatList activeConvId={activeConvId} onSelectConv={handleSelectConv} />
            </div>

            <div className={cn('flex-1', !activeConvId ? 'hidden md:flex' : 'flex')}>
              {activeConvId ? (
                <ChatWindow
                  conversationId={activeConvId} partner={activePartner} isGroup={isGroup}
                  groupName={activeConvInfo?.name || 'Group Chat'} groupCreatedBy={activeConvInfo?.created_by}
                  onBack={() => { setActiveConvId(null); setActiveConvInfo(null); }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 chat-wallpaper">
                  <img src={vedvakhLogo} alt="Ved-Vakh" className="w-24 h-24 mb-6 opacity-30" />
                  <h3 className="font-medium text-xl text-foreground/60 mb-2">Ved-Vakh Messenger</h3>
                  <p className="text-muted-foreground/50 max-w-xs text-sm">Select a chat to start messaging.<br />All conversations are AI-moderated.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            {activeTab === 'search' && <SearchTab />}
            {activeTab === 'network' && <NetworkTab onStartChat={handleStartChat} />}
            {activeTab === 'community' && <CommunityTab />}
            {activeTab === 'chatbot' && <ChatbotTab />}
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
