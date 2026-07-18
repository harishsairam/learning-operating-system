import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your inbox to confirm the email address.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Learning OS</p>
          <h1 className="mt-2 text-3xl font-display font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-3 text-sm text-secondary">
            {mode === 'login'
              ? 'Sign in to continue with your personal study workspace.'
              : 'Sign up to start tracking projects, sessions, and revisions across devices.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-on-surface">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm font-medium text-on-surface">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {message ? <p className="text-sm text-secondary">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {isSubmitting ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-secondary">
          <button
            type="button"
            className="font-medium text-primary"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Create an account' : 'Back to login'}
          </button>
          <span>{location.state?.from?.pathname ? 'Protected route' : 'Secure access'}</span>
        </div>
      </div>
    </div>
  );
}
