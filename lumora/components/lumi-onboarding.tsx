'use client';

import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  userName: string;
  onComplete: (data: any) => void;
}

const STEPS = [
  {
    question: "What brings you to Lumora?",
    key: 'goals',
    multi: true,
    options: [
      { emoji: '💪', label: 'Fitness journey' },
      { emoji: '🧠', label: 'Mental wellness' },
      { emoji: '⚖️', label: 'Weight management' },
      { emoji: '😌', label: 'Stress & anxiety' },
      { emoji: '😴', label: 'Better sleep' },
      { emoji: '🌱', label: 'General health' },
    ],
  },
  {
    question: "What's your biggest challenge right now?",
    key: 'challenges',
    multi: true,
    options: [
      { emoji: '🔄', label: 'Staying consistent' },
      { emoji: '😤', label: 'Managing stress' },
      { emoji: '🍽️', label: 'Eating better' },
      { emoji: '⚡', label: 'Getting motivated' },
      { emoji: '😴', label: 'Sleep issues' },
      { emoji: '⚖️', label: 'Work-life balance' },
    ],
  },
  {
    question: "How would you like LUMI to support you?",
    key: 'style',
    multi: false,
    options: [
      { emoji: '🤗', label: 'Gentle & nurturing' },
      { emoji: '🎯', label: 'Direct & honest' },
      { emoji: '🔥', label: 'Motivational pushes' },
      { emoji: '👂', label: 'Just listen & reflect' },
    ],
  },
  {
    question: "How active are you currently?",
    key: 'fitness_level',
    multi: false,
    options: [
      { emoji: '🐣', label: 'Just starting out' },
      { emoji: '🚶', label: 'Lightly active' },
      { emoji: '🏃', label: 'Moderately active' },
      { emoji: '🏋️', label: 'Very active' },
    ],
  },
];

export default function LumiOnboarding({ userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const current = STEPS[step];

  function toggleOption(option: string) {
    const key = current.key;
    if (current.multi) {
      const existing = answers[key] || [];
      const updated = existing.includes(option)
        ? existing.filter((o: string) => o !== option)
        : [...existing, option];
      setAnswers({ ...answers, [key]: updated });
    } else {
      setAnswers({ ...answers, [key]: option });
    }
  }

  function isSelected(option: string): boolean {
    const val = answers[current.key];
    if (current.multi) return (val || []).includes(option);
    return val === option;
  }

  function canProceed(): boolean {
    const val = answers[current.key];
    if (current.multi) return (val || []).length > 0;
    return !!val;
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,9,18,0.97)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Purple glow */}
      <div style={{ position: 'fixed', width: 400, height: 400, top: -100, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,234,0.15), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400, animation: 'slideUp 0.4s ease-out forwards' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #1A1440, #241B5C)', border: '1px solid rgba(124,106,234,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(124,106,234,0.3)' }}>
            <Sparkles size={24} color="#7C6AEA" />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#EFF2F7', fontWeight: 400, marginBottom: 6 }}>
            Hi {userName}! I&apos;m LUMI ✦
          </div>
          <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.6 }}>
            Let me learn about you so I can support you better
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i <= step ? '#7C6AEA' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Question */}
        <div className="glass" style={{ borderRadius: 24, padding: '24px' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#EFF2F7', marginBottom: 20, lineHeight: 1.4 }}>
            {current.question}
          </div>
          {current.multi && (
            <div style={{ fontSize: 11, color: '#8892A4', marginBottom: 14 }}>Select all that apply</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {current.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => toggleOption(opt.label)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 14,
                  border: '1px solid',
                  borderColor: isSelected(opt.label) ? 'rgba(124,106,234,0.6)' : 'rgba(255,255,255,0.08)',
                  background: isSelected(opt.label) ? 'rgba(124,106,234,0.15)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                <span style={{ fontSize: 11, color: isSelected(opt.label) ? '#A78BFA' : '#8892A4', textAlign: 'center', fontWeight: isSelected(opt.label) ? 600 : 400 }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={next}
            disabled={!canProceed()}
            className="btn-primary"
            style={{ width: '100%', marginTop: 20, background: canProceed() ? 'linear-gradient(135deg, #7C6AEA, #5B48D9)' : 'rgba(255,255,255,0.05)', color: canProceed() ? '#fff' : '#4A5568' }}
          >
            {step === STEPS.length - 1 ? 'Start talking to LUMI ✦' : 'Continue'}
            <ChevronRight size={16} />
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#4A5568', marginTop: 16 }}>
          Your answers help LUMI understand and support you better
        </p>
      </div>
    </div>
  );
}
