import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TermsModal from './TermsModal';

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Other'];

interface SignupFormProps {
  onSwitch: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitch }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    dob: '',
    phone: '',
    country: '',
    state: '',
    district: '',
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.terms_accepted) errs.terms = 'You must accept the terms & conditions';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            phone: form.phone,
            country: form.country,
            state: form.state,
            district: form.district,
            dob: form.dob,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: '🎉 Account Created!',
        description: 'Check your email to confirm your account, then login.',
      });
      onSwitch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toast({ title: 'Signup Failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-sm font-medium text-foreground/80">Full Name *</Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            className="bg-muted border-border focus:border-primary h-11"
          />
          {errors.full_name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="bg-muted border-border focus:border-primary h-11"
          />
          {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className="bg-muted border-border focus:border-primary h-11 pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
        </div>

        {/* DOB + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dob" className="text-sm font-medium text-foreground/80">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={e => set('dob', e.target.value)}
              className="bg-muted border-border focus:border-primary h-11"
            />
            {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="bg-muted border-border focus:border-primary h-11"
            />
          </div>
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground/80">Country</Label>
          <Select onValueChange={v => set('country', v)}>
            <SelectTrigger className="bg-muted border-border h-11">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* State + District */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground/80">State</Label>
            <Input placeholder="State / Province" value={form.state} onChange={e => set('state', e.target.value)}
              className="bg-muted border-border focus:border-primary h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground/80">District</Label>
            <Input placeholder="District / City" value={form.district} onChange={e => set('district', e.target.value)}
              className="bg-muted border-border focus:border-primary h-11" />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="terms"
            checked={form.terms_accepted}
            onCheckedChange={v => set('terms_accepted', Boolean(v))}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            I accept the{' '}
            <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline hover:text-primary/80">
              Terms & Conditions
            </button>
            {' '}including Ved-Vakh AI moderation policies
          </label>
        </div>
        {errors.terms && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.terms}</p>}

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold gradient-brand shadow-brand hover:opacity-90 transition-opacity">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Account...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Create Ved-Vakh Account
            </div>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-primary font-medium hover:underline">Sign in</button>
      </p>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
};

export default SignupForm;
