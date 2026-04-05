'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, Brain, BookOpen, Users, Bell, Zap, Camera } from 'lucide-react';

const features = [
  { icon: Camera, title: 'Snap & Track', desc: 'Photo-to-calories in seconds', color: '#0FCFAD' },
  { icon: Brain, title: 'LUMI Therapist', desc: 'Your AI mental wellness guide', color: '#7C6AEA' },
  { icon: BookOpen, title: 'Voice Journal', desc: 'Speak your thoughts freely', color: '#E8A020' },
  { icon: Users, title: 'Your Circle', desc: 'Invite-only close friends', color: '#F06678' },
  { icon: Bell, title: 'Smart Reminders', desc: 'Never miss a moment', color: '#60A5FA' },
  { icon: Zap, title: 'Pattern Learning', desc: 'AI that grows with you', color: '#F472B6' },
];

export default function LandingPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const s = (delay: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  return (
    <div style={{ background: '#060912', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Ambient blobs */}
      <div className="blob-gold" style={{ width: 600, height: 600, top: -200, left: '30%' }} />
      <div className="blob-violet" style={{ width: 500, height: 500, bottom: 100, right: -100 }} />
      <div
        className="blob-gold"
        style={{
          width: 300,
          height: 300,
          bottom: 200,
          left: -50,
          background: 'radial-gradient(circle, rgba(15,207,173,0.07), transparent 70%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Nav */}
        <nav
          style={{
            width: '100%',
            maxWidth: 960,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 24px',
            ...s(0),
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: '0.28em',
              background: 'linear-gradient(135deg, #E8A020, #F4CC6A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LUMORA
          </span>
          <Link href="/login">
            <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sign In
            </button>
          </Link>
        </nav>

        {/* Hero */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '60px 24px 80px',
            maxWidth: 680,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 100,
              background: 'rgba(232,160,32,0.1)',
              border: '1px solid rgba(232,160,32,0.22)',
              color: '#E8A020',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              marginBottom: 32,
              ...s(0.1),
            }}
          >
            <Sparkles size={11} />
            AI-POWERED PERSONAL WELLNESS
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(3.2rem, 9vw, 5.8rem)',
              fontWeight: 300,
              lineHeight: 1.08,
              color: '#EFF2F7',
              letterSpacing: '-0.02em',
              ...s(0.2),
            }}
          >
            Your light,
            <br />
            <em
              style={{
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, #E8A020, #F4CC6A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              your rhythm.
            </em>
          </h1>

          <p
            style={{
              marginTop: 24,
              fontSize: 15,
              lineHeight: 1.75,
              color: '#8892A4',
              maxWidth: 380,
              ...s(0.3),
            }}
          >
            Track your body. Heal your mind. Share your journey with the people who matter most.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 40,
              width: '100%',
              maxWidth: 340,
              ...s(0.4),
            }}
          >
            <Link href="/signup" style={{ display: 'block' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '15px 24px', fontSize: 15 }}>
                Begin Your Journey
              </button>
            </Link>
            <Link href="/login" style={{ display: 'block' }}>
              <button className="btn-secondary" style={{ width: '100%', padding: '15px 24px', fontSize: 15 }}>
                Continue Journey
              </button>
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            padding: '0 20px 80px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass"
              style={{
                borderRadius: 20,
                padding: '20px',
                ...s(0.5 + i * 0.07),
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${f.color}14`,
                  border: `1px solid ${f.color}28`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <f.icon size={18} color={f.color} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#EFF2F7', marginBottom: 4 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12, color: '#8892A4', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            paddingBottom: 32,
            fontSize: 12,
            color: '#4A5568',
            ...s(0.9),
          }}
        >
          Built with love for your wellbeing ✦
        </div>
      </div>
    </div>
  );
}
