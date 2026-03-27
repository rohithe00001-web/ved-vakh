import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-display text-xl">
          <Shield className="w-5 h-5 text-primary" />
          Ved-Vakh AI – Terms & Conditions
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-96 pr-4">
        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h3 className="text-foreground font-semibold mb-2">1. No Hate Speech or Abusive Content</h3>
            <p>Users are strictly prohibited from sending, sharing, or distributing content that promotes hate speech, discrimination, harassment, violence, or any form of abusive language targeting individuals or groups based on race, gender, religion, nationality, sexual orientation, or disability.</p>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">2. Respectful Communication Policy</h3>
            <p>All users must communicate respectfully. Disagreements are acceptable; personal attacks, threats, and intimidation are not. Ved-Vakh is built on the principle that everyone deserves to be treated with dignity and respect.</p>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">3. Violation Enforcement</h3>
            <p>Violations of our community standards are subject to progressive enforcement:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li><strong className="text-foreground">Level 1 (Mild):</strong> Warning notification + minor profile rating reduction (-0.1)</li>
              <li><strong className="text-foreground">Level 2 (Moderate):</strong> 24-hour account restriction + medium rating reduction (-0.3)</li>
              <li><strong className="text-foreground">Level 3 (Severe):</strong> Permanent account suspension + full rating reset</li>
            </ul>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">4. AI Moderation Consent</h3>
            <p>By creating an account, you consent to automated AI-powered moderation of your messages. The AI system analyzes text, voice, image, and video content in real-time. You will always be informed when content is flagged and given the choice to cancel or send a moderated version.</p>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">5. Profile Rating System</h3>
            <p>Your profile rating (0–5 stars) reflects your history of respectful communication. Ratings can only decrease through violations. A higher rating signals trustworthiness to other users on the platform.</p>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">6. Privacy & Data</h3>
            <p>Your personal data is processed securely. We do not sell your data to third parties. Message content is analyzed for moderation purposes only and handled in accordance with applicable privacy laws.</p>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-2">7. User Responsibility</h3>
            <p>You are solely responsible for all content you post. Ved-Vakh provides tools to help maintain a safe environment, but ultimate responsibility lies with you. By accepting these terms, you agree to uphold the safety and dignity of all users.</p>
          </section>
        </div>
      </ScrollArea>
      <Button onClick={onClose} className="gradient-brand shadow-brand">
        I Understand – Close
      </Button>
    </DialogContent>
  </Dialog>
);

export default TermsModal;
