import React from 'react';
import { ArrowLeft, MessageSquare, Send, Bell, Moon, Sun, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

interface Props { onBack: () => void; }

const ChatSettings: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const { settings, updateSetting } = useUserSettings();

  const handleThemeChange = (isDark: boolean) => {
    const theme = isDark ? 'dark' : 'light';
    updateSetting({ theme });
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    toast({ title: isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h2 className="font-display font-bold text-xl text-foreground">Chat & Keyboard</h2>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Message Preferences</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Enter to Send</span>
              </div>
              <Switch checked={settings.enter_to_send} onCheckedChange={(v) => updateSetting({ enter_to_send: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Notifications</span>
              </div>
              <Switch checked={settings.notifications_enabled} onCheckedChange={(v) => updateSetting({ notifications_enabled: v })} />
            </div>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Font Size</p>
            <Select value={settings.font_size} onValueChange={(v) => { updateSetting({ font_size: v }); toast({ title: `Font size set to ${v}` }); }}>
              <SelectTrigger className="bg-muted border-border h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small"><Type className="w-3 h-3 inline mr-2" />Small</SelectItem>
                <SelectItem value="medium"><Type className="w-3.5 h-3.5 inline mr-2" />Medium</SelectItem>
                <SelectItem value="large"><Type className="w-4 h-4 inline mr-2" />Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Theme</p>
            <div className="flex gap-2">
              <Button variant={settings.theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => handleThemeChange(true)} className={settings.theme === 'dark' ? 'gradient-brand' : ''}>
                <Moon className="w-4 h-4 mr-1.5" />Dark
              </Button>
              <Button variant={settings.theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => handleThemeChange(false)} className={settings.theme === 'light' ? 'gradient-brand' : ''}>
                <Sun className="w-4 h-4 mr-1.5" />Light
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
