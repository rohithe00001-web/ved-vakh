import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import SignupForm from '@/components/auth/SignupForm';
import LoginForm from '@/components/auth/LoginForm';
import vedvakhLogo from '@/assets/vedvakh-logo.png';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={vedvakhLogo} alt="Ved-Vakh Logo" className="w-28 h-28 mb-5 mx-auto" />
          <h1 className="font-medium text-2xl text-foreground">Ved-Vakh</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">Chat Smart, Stay Respectful Everywhere</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <div className="flex gap-0 bg-muted rounded-lg p-0.5 mb-5">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                  mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <LoginForm onSwitch={() => setMode('signup')} />
          ) : (
            <SignupForm onSwitch={() => setMode('login')} />
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
          🛡️ Protected by Ved-Vakh AI · All messages moderated in real-time
        </p>
      </div>
    </div>
  );
};

// Need to import cn
import { cn } from '@/lib/utils';

const AppInner: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={vedvakhLogo} alt="Ved-Vakh" className="w-16 h-16 animate-pulse" />
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

const Index: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default Index;
