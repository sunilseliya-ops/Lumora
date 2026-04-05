'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { getGreeting, formatDate, getMealEmoji, calorieColor } from '@/lib/utils';
import { Sparkles, TrendingUp, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Profile { id: string; name: string; calorie_goal: number; streak: number; ai_memory: any; }
interface FoodLog { id: string; description: string; calories: number; meal_type: string; logged_at: string; }

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = calorieColor(consumed, goal);

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={70}
          cy={70}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 600, color: '#EFF2F7' }}>{consumed}</span>
        <span style={{ fontSize: 11, color: '#8892A4' }}>/ {goal} kcal</span>
      </div>
    </div>
  );
}

const MOODS = [
  { emoji: '😊', label: 'Happy', val: 'happy' },
  { emoji: '😌', label: 'Calm', val: 'calm' },
  { emoji: '😔', label: 'Sad', val: 'sad' },
  { emoji: '😤', label: 'Anxious', val: 'anxious' },
  { emoji: '⚡', label: 'Energetic', val: 'energetic' },
  { emoji: '😴', label: 'Tired', val: 'tired' },
];

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [todayCals, setTodayCals] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: prof }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', new Date().toISOString().split('T')[0])
        .order('logged_at', { ascending: false }),
    ]);

    if (prof) setProfile(prof);
    if (logs) {
      setTodayLogs(logs);
      setTodayCals(logs.reduce((s: number, l: FoodLog) => s + (l.calories || 0), 0));
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function fetchInsight() {
    setInsightLoading(true);
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile?.id }),
      });
      const data = await res.json();
      if (data.error === 'api_key_missing') { setHasKey(false); }
      else { setAiInsight(data.insight); setHasKey(true); }
    } catch { setHasKey(false); }
    setInsightLoading(false);
  }

  async function saveMood(mood: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSelectedMood(mood);
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      content: `Mood check-in: ${mood}`,
      mood,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const greeting = getGreeting();
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="blob-gold" style={{ width: 400, height: 400, top: -150, right: -100 }} />
      <div className="blob-violet" style={{ width: 300, height: 300, bottom: 200, left: -100 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 520,
          margin: '0 auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            animation: 'slideUp 0.4s ease-out forwards',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#8892A4', letterSpacing: '0.08em', marginBottom: 2 }}>
              {today}
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 400,
                color: '#EFF2F7',
                lineHeight: 1.2,
              }}
            >
              {greeting},
              <br />
              <em
                className="grad-gold"
                style={{ fontStyle: 'italic' }}
              >
                {profile?.name || 'friend'}
              </em>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Link href="/friends">
              <button className="btn-icon">
                <Settings size={16} />
              </button>
            </Link>
            <button className="btn-icon" onClick={signOut}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Calorie card */}
        <div
          className="glass"
          style={{
            borderRadius: 24,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            animation: 'slideUp 0.4s ease-out 0.05s forwards',
            opacity: 0,
          }}
        >
          <CalorieRing consumed={todayCals} goal={profile?.calorie_goal || 2000} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 12 }}>TODAY'S NUTRITION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#8892A4' }}>Consumed</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#EFF2F7' }}>{todayCals} kcal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#8892A4' }}>Remaining</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0FCFAD' }}>
                  {Math.max(0, (profile?.calorie_goal || 2000) - todayCals)} kcal
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#8892A4' }}>Streak</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E8A020' }}>
                  🔥 {profile?.streak || 0} days
                </span>
              </div>
            </div>
            <Link href="/food">
              <button
                className="btn-primary"
                style={{ marginTop: 14, width: '100%', padding: '10px', fontSize: 13 }}
              >
                Log Food
              </button>
            </Link>
          </div>
        </div>

        {/* Mood check-in */}
        <div
          className="glass"
          style={{
            borderRadius: 24,
            padding: '20px',
            animation: 'slideUp 0.4s ease-out 0.1s forwards',
            opacity: 0,
          }}
        >
          <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 14, letterSpacing: '0.06em' }}>
            HOW ARE YOU FEELING?
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <button
                key={m.val}
                onClick={() => saveMood(m.val)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: selectedMood === m.val
                    ? '1px solid rgba(232,160,32,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  background: selectedMood === m.val ? 'rgba(232,160,32,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: 46,
                }}
              >
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 10, color: selectedMood === m.val ? '#E8A020' : '#8892A4' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div
          className="glass"
          style={{
            borderRadius: 24,
            padding: '20px',
            animation: 'slideUp 0.4s ease-out 0.15s forwards',
            opacity: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                color: '#8892A4',
                letterSpacing: '0.06em',
              }}
            >
              <Sparkles size={13} color="#7C6AEA" />
              LUMI&apos;S DAILY INSIGHT
            </div>
            {!aiInsight && hasKey !== false && (
              <button
                onClick={fetchInsight}
                disabled={insightLoading}
                style={{
                  fontSize: 11,
                  color: '#7C6AEA',
                  background: 'rgba(124,106,234,0.1)',
                  border: '1px solid rgba(124,106,234,0.2)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: insightLoading ? 'wait' : 'pointer',
                }}
              >
                {insightLoading ? 'Thinking…' : 'Ask LUMI'}
              </button>
            )}
          </div>

          {hasKey === false ? (
            <div
              style={{
                background: 'rgba(232,160,32,0.07)',
                border: '1px solid rgba(232,160,32,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 13, color: '#E8A020', fontWeight: 500, marginBottom: 4 }}>
                Activate AI Features
              </div>
              <div style={{ fontSize: 12, color: '#8892A4', lineHeight: 1.6 }}>
                Add your Anthropic API key in Vercel → Settings → Environment Variables as{' '}
                <code
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  ANTHROPIC_API_KEY
                </code>
              </div>
            </div>
          ) : aiInsight ? (
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7 }}>{aiInsight}</p>
          ) : (
            <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7 }}>
              Tap &ldquo;Ask LUMI&rdquo; for your personalized daily insight based on your patterns and mood.
            </p>
          )}
        </div>

        {/* Recent food logs */}
        {todayLogs.length > 0 && (
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: '20px',
              animation: 'slideUp 0.4s ease-out 0.2s forwards',
              opacity: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 12, color: '#8892A4', letterSpacing: '0.06em' }}>TODAY&apos;S LOG</div>
              <Link href="/food" style={{ fontSize: 11, color: '#E8A020', textDecoration: 'none' }}>
                See all →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayLogs.slice(0, 4).map(log => (
                <div
                  key={log.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{getMealEmoji(log.meal_type)}</span>
                    <span style={{ fontSize: 13, color: '#EFF2F7' }}>{log.description}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#8892A4' }}>{log.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            animation: 'slideUp 0.4s ease-out 0.25s forwards',
            opacity: 0,
          }}
        >
          {[
            { href: '/therapist', label: 'Talk to LUMI', emoji: '🧠', color: '#7C6AEA' },
            { href: '/journal', label: 'Write Journal', emoji: '📔', color: '#E8A020' },
            { href: '/reminders', label: 'Reminders', emoji: '⏰', color: '#0FCFAD' },
            { href: '/friends', label: 'My Circle', emoji: '👥', color: '#F06678' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div
                className="glass"
                style={{
                  borderRadius: 18,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  border: `1px solid rgba(255,255,255,0.07)`,
                }}
              >
                <span style={{ fontSize: 24 }}>{item.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: item.color }}>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
