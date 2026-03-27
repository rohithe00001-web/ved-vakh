import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Shield, Loader2 } from 'lucide-react';

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = ['How does AI moderation work?', 'What happens if I get banned?', 'How is my profile rating calculated?', 'How do I add friends?'];

const ChatbotTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "👋 Hi! I'm Ved-Vakh AI Assistant. I can help you understand how the platform works, explain moderation policies, or assist with any issues. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('safespeak-chatbot', {
        body: { messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-border bg-card flex items-center gap-3">
        <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-brand">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-foreground">SafeSpeak Assistant</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <p className="text-xs text-muted-foreground">AI Powered · Always Available</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
          <Shield className="w-3 h-3 text-success" />
          <span className="text-xs text-success">Safe</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card space-y-3">
        <div className="flex gap-2 flex-wrap">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-colors text-muted-foreground">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask me anything about SafeSpeak…"
            className="bg-muted border-border focus:border-primary rounded-full px-4" />
          <Button onClick={() => send(input)} disabled={!input.trim() || loading}
            size="icon" className="gradient-brand shadow-brand rounded-full w-10 h-10 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTab;
