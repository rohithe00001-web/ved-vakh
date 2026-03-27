import React from 'react';
import { ArrowLeft, Globe, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

interface Props { onBack: () => void; }

const SystemSettings: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const { settings, updateSetting } = useUserSettings();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">System Settings</h2>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Language</p>
            <Select value={settings.language} onValueChange={(v) => { updateSetting({ language: v }); toast({ title: `Language set to ${v === 'en' ? 'English' : v === 'hi' ? 'Hindi' : v === 'ml' ? 'Malayalam' : v === 'ta' ? 'Tamil' : 'Telugu'}` }); }}>
              <SelectTrigger className="bg-muted border-border h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                <SelectItem value="ml">🇮🇳 Malayalam</SelectItem>
                <SelectItem value="ta">🇮🇳 Tamil</SelectItem>
                <SelectItem value="te">🇮🇳 Telugu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Social Media Links</p>
            {([
              { key: 'social_twitter' as const, placeholder: 'Twitter / X handle', icon: '𝕏' },
              { key: 'social_instagram' as const, placeholder: 'Instagram username', icon: '📷' },
              { key: 'social_linkedin' as const, placeholder: 'LinkedIn profile URL', icon: '💼' },
            ]).map(({ key, placeholder, icon }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center">{icon}</span>
                <Input
                  value={settings[key]}
                  onChange={e => updateSetting({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="bg-muted border-border h-9 text-sm flex-1"
                />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => toast({ title: '🔗 Links saved!' })}>
              <Link2 className="w-3.5 h-3.5 mr-1.5" />Save Links
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
