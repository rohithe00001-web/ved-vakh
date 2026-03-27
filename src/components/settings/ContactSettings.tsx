import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Props { onBack: () => void; }

const ContactSettings: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const handleContactSubmit = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast({ title: 'Error', description: 'Please fill in both subject and message', variant: 'destructive' });
      return;
    }
    if (!user) return;
    setSendingContact(true);
    const { error } = await supabase
      .from('contact_messages' as any)
      .insert({ user_id: user.id, subject: contactSubject.trim(), message: contactMessage.trim() } as any);
    if (!error) {
      toast({ title: '✉️ Message Sent!', description: "We'll get back to you soon." });
      setContactSubject('');
      setContactMessage('');
    } else {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
    }
    setSendingContact(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">Contact Us</h2>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          <div className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Email Support</p>
            <Input value={contactSubject} onChange={e => setContactSubject(e.target.value)} placeholder="Subject" className="bg-muted border-border h-10 text-sm" maxLength={100} />
            <Textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="Describe your issue or feedback…" rows={4} className="bg-muted border-border text-sm resize-none" maxLength={1000} />
            <Button onClick={handleContactSubmit} disabled={sendingContact} size="sm" className="gradient-brand">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {sendingContact ? 'Sending…' : 'Send Message'}
            </Button>
          </div>

          <div className="p-5">
            <p className="text-sm font-medium text-foreground">Quick Feedback</p>
            <p className="text-sm text-muted-foreground mt-1">Have a suggestion? Send us feedback and help improve Ved-Vakh for everyone.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSettings;
