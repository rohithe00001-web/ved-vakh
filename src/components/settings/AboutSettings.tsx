import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface Props { onBack: () => void; }

const AboutSettings: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">About Ved-Vakh</h2>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          <div className="p-5">
            <p className="text-sm font-medium text-foreground">Version</p>
            <p className="text-sm text-muted-foreground mt-1">Ved-Vakh AI v1.0.0 — Chat Smart, Stay Respectful Everywhere</p>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-foreground">AI Moderation</p>
            <p className="text-sm text-muted-foreground mt-1">Powered by Lovable AI Gateway (Gemini) — Real-time content analysis</p>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-foreground">Mission</p>
            <p className="text-sm text-muted-foreground mt-1">Building a safer internet through AI-powered communication that promotes respectful dialogue while maintaining user privacy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;
