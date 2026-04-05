'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060912',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="blob-gold" style={{ width: 500, height: 500, top: -200, right: -100 }} />
      <div className="blob-violet" style={{ width: 400, height: 400, bottom: -100, left: -100 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 400,
          animation: 'slideUp 0.4s ease-out forwards',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/">
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 300,
                letterSpacing: '0.3em',
                background: 'linear-gradient(135deg, #E8A020, #F4CC6A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              LUMORA
            </span>
          </Link>
          <p style={{ color: '#8892A4', fontSize: 13, marginTop: 8 }}>Welcome back</p>
        </div>

        {/* Card */}
        <div
          className="glass"
          style={{ borderRadius: 24, padding: '32px 28px' }}
        >
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#8892A4', marginBottom: 8, display: 'block' }}>
                Email
              </label>
              <input
                className="input-dark"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#8892A4', marginBottom: 8, display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-dark"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8892A4',
                    padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(240,102,120,0.1)',
                  border: '1px solid rgba(240,102,120,0.25)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#F06678',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8, width: '100%', padding: '14px' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8892A4' }}>
          New to Lumora?{' '}
          <Link href="/signup" style={{ color: '#E8A020', textDecoration: 'none' }}>
            Begin your journey
          </Link>
        </p>
      </div>
    </div>
  );
}
