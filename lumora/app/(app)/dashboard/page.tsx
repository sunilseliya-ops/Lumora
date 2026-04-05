'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { getGreeting, formatDate, getMealEmoji, calorieColor } from '@/lib/utils';
import { Sparkles, LogOut, Dumbbell, CheckSquare, Edit3, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import PlantStreak from '@/components/plant-streak';

const QUOTES = [
  { text: "Small steps every day lead to massive change over time.", author: "— Lumora" },
  { text: "The body achieves what the mind believes.", author: "— Napoleon Hill" },
  { text: "Your health is an investment, not an expense.", author: "— Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "— Jim Rohn" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "— Augusta F. Kantra" },
  { text: "Every day is a chance to be better than yesterday.", author: "— Lumora" },
  { text: "The groundwork for all happiness is good health.", author: "— Leigh Hunt" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "— Jim Ryun" },
  { text: "Your future self is watching you right now through memories.", author: "— Aubrey de Grey" },
  { text: "Progress, not perfection, is the goal.", author: "— Lumora" },
  { text: "Rest when you must, but never quit.", author: "— Unknown" },
  { text: "What you eat in private, you wear in public.", author: "— Unknown" },
  { text: "A healthy outside starts from the inside.", author: "— Robert Urich" },
  { text: "The secret to getting ahead is getting started.", author: "— Mark Twain" },
];

function getDailyQuote() {
  const day = new Date().getDate() + new Date().getMonth() * 31;
  return QUOTES[day % QUOTES.length];
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const r = 52, circ = 2 * Math.PI * r;
  const color = calorieColor(consumed, goal);
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: '#EFF2F7' }}>{consumed}</span>
        <span style={{ fontSize: 11, color: '#8892A4' }}>/ {goal} kcal</span>
      </div>
    </div>
  );
}

const MOODS = [
  { emoji: '😊', label: 'Happy', val: 'happy' }, { emoji: '😌', label: 'Calm', val: 'calm' },
  { emoji: '😔', label: 'Sad', val: 'sad' }, { emoji: '😤', label: 'Anxious', val: 'anxious' },
  { emoji: '⚡', label: 'Energetic', val: 'energetic' }, { emoji: '😴', label: 'Tired', val: 'tired' },
];

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [todayCals, setTodayCals] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // Workout + task
  const [workout, setWorkout] = useState('');
  const [task, setTask] = useState('');
  const [editingWorkout, setEditingWorkout] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [workoutInput, setWorkoutInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [workoutDone, setWorkoutDone] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  const quote = getDailyQuote();

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];

      // Load profile
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) setProfile(prof);
      } catch {}

      // Load food logs
      try {
        const { data: logs } = await supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_at', today).order('logged_at', { ascending: false });
        if (logs) { setTodayLogs(logs); setTodayCals(logs.reduce((s: number, l: any) => s + (l.calories || 0), 0)); }
      } catch {}

      // Load daily plan (safe - table may not exist)
      try {
        const { data: plan } = await supabase.from('daily_plans').select('*').eq('user_id', user.id).eq('plan_date', today).maybeSingle();
        if (plan) {
          setWorkout(plan.workout || '');
          setTask(plan.important_task || '');
          setWorkoutDone(plan.workout_done || false);
          setTaskDone(plan.task_done || false);
        }
      } catch {}
    } catch {}
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function savePlan(field: string, value: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_plans').upsert({
      user_id: user.id, plan_date: today, [field]: value,
    }, { onConflict: 'user_id,plan_date' });
  }

  async function saveWorkout() {
    setWorkout(workoutInput);
    setEditingWorkout(false);
    await savePlan('workout', workoutInput);
  }

  async function saveTask() {
    setTask(taskInput);
    setEditingTask(false);
    await savePlan('important_task', taskInput);
  }

  async function toggleWorkoutDone() {
    const newVal = !workoutDone;
    setWorkoutDone(newVal);
    await savePlan('workout_done', newVal);
  }

  async function toggleTaskDone() {
    const newVal = !taskDone;
    setTaskDone(newVal);
    await savePlan('task_done', newVal);
  }

  async function saveMood(mood: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSelectedMood(mood);
    await supabase.from('journal_entries').insert({ user_id: user.id, content: `Mood check-in: ${mood}`, mood });
  }

  async function fetchInsight() {
    setInsightLoading(true);
    try {
      const res = await fetch('/api/ai/insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: profile?.id }) });
      const data = await res.json();
      if (data.error === 'api_key_missing') setHasKey(false);
      else { setAiInsight(data.insight); setHasKey(true); }
    } catch { setHasKey(false); }
    setInsightLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="blob-gold" style={{ width: 400, height: 400, top: -150, right: -100 }} />
      <div className="blob-violet" style={{ width: 300, height: 300, bottom: 200, left: -100 }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', animation: 'slideUp 0.4s ease-out forwards' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8892A4', letterSpacing: '0.08em', marginBottom: 2 }}>{today}</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: '#EFF2F7', lineHeight: 1.2 }}>
              {getGreeting()},<br />
              <em className="grad-gold" style={{ fontStyle: 'italic' }}>{profile?.name || 'friend'}</em>
            </h1>
          </div>
          <button className="btn-icon" onClick={signOut}><LogOut size={16} /></button>
        </div>

        {/* Quote card */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px', animation: 'slideUp 0.4s ease-out 0.05s forwards', opacity: 0, borderLeft: '3px solid rgba(232,160,32,0.5)' }}>
          <p style={{ fontSize: 13, color: '#EFF2F7', lineHeight: 1.6, fontStyle: 'italic' }}>
            &ldquo;{quote.text}&rdquo;
          </p>
          <p style={{ fontSize: 11, color: '#8892A4', marginTop: 6 }}>{quote.author}</p>
        </div>

        {/* Streak + Calories row */}
        <div className="glass" style={{ borderRadius: 24, padding: '20px', animation: 'slideUp 0.4s ease-out 0.1s forwards', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Plant */}
            <PlantStreak streak={profile?.streak || 0} />
            {/* Divider */}
            <div style={{ width: 1, height: 100, background: 'rgba(255,255,255,0.07)' }} />
            {/* Calories */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CalorieRing consumed={todayCals} goal={profile?.calorie_goal || 2000} />
              <Link href="/food">
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>Log Food</button>
              </Link>
            </div>
          </div>
        </div>

        {/* Workout + Task cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'slideUp 0.4s ease-out 0.15s forwards', opacity: 0 }}>
          {/* Workout */}
          <div className="glass" style={{ borderRadius: 20, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8892A4' }}>
                <Dumbbell size={12} color="#0FCFAD" />
                WORKOUT
              </div>
              <button onClick={() => { setWorkoutInput(workout); setEditingWorkout(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568' }}>
                <Edit3 size={12} />
              </button>
            </div>
            {editingWorkout ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input-dark" value={workoutInput} onChange={e => setWorkoutInput(e.target.value)} placeholder="e.g. 30 min run" style={{ fontSize: 12, padding: '8px 10px' }} autoFocus onKeyDown={e => e.key === 'Enter' && saveWorkout()} />
                <button onClick={saveWorkout} className="btn-primary" style={{ padding: '6px', fontSize: 11 }}>Save</button>
              </div>
            ) : workout ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <button onClick={toggleWorkoutDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: workoutDone ? '#0FCFAD' : '#4A5568', flexShrink: 0, marginTop: 1 }}>
                  <Check size={16} />
                </button>
                <span style={{ fontSize: 13, color: workoutDone ? '#4A5568' : '#EFF2F7', textDecoration: workoutDone ? 'line-through' : 'none', lineHeight: 1.4 }}>{workout}</span>
              </div>
            ) : (
              <button onClick={() => setEditingWorkout(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', fontSize: 12, textAlign: 'left', padding: 0 }}>
                + Set today&apos;s workout
              </button>
            )}
          </div>

          {/* Important task */}
          <div className="glass" style={{ borderRadius: 20, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8892A4' }}>
                <CheckSquare size={12} color="#E8A020" />
                TOP TASK
              </div>
              <button onClick={() => { setTaskInput(task); setEditingTask(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568' }}>
                <Edit3 size={12} />
              </button>
            </div>
            {editingTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input-dark" value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="Most important thing today" style={{ fontSize: 12, padding: '8px 10px' }} autoFocus onKeyDown={e => e.key === 'Enter' && saveTask()} />
                <button onClick={saveTask} className="btn-primary" style={{ padding: '6px', fontSize: 11 }}>Save</button>
              </div>
            ) : task ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <button onClick={toggleTaskDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: taskDone ? '#E8A020' : '#4A5568', flexShrink: 0, marginTop: 1 }}>
                  <Check size={16} />
                </button>
                <span style={{ fontSize: 13, color: taskDone ? '#4A5568' : '#EFF2F7', textDecoration: taskDone ? 'line-through' : 'none', lineHeight: 1.4 }}>{task}</span>
              </div>
            ) : (
              <button onClick={() => setEditingTask(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', fontSize: 12, textAlign: 'left', padding: 0 }}>
                + Set top priority
              </button>
            )}
          </div>
        </div>

        {/* Mood */}
        <div className="glass" style={{ borderRadius: 24, padding: '20px', animation: 'slideUp 0.4s ease-out 0.2s forwards', opacity: 0 }}>
          <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 14, letterSpacing: '0.06em' }}>HOW ARE YOU FEELING?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <button key={m.val} onClick={() => saveMood(m.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 12, border: '1px solid', borderColor: selectedMood === m.val ? 'rgba(232,160,32,0.4)' : 'rgba(255,255,255,0.07)', background: selectedMood === m.val ? 'rgba(232,160,32,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s', minWidth: 46 }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 10, color: selectedMood === m.val ? '#E8A020' : '#8892A4' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LUMI Insight */}
        <div className="glass" style={{ borderRadius: 24, padding: '20px', animation: 'slideUp 0.4s ease-out 0.25s forwards', opacity: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#8892A4', letterSpacing: '0.06em' }}>
              <Sparkles size={13} color="#7C6AEA" />
              LUMI&apos;S DAILY INSIGHT
            </div>
            {!aiInsight && hasKey !== false && (
              <button onClick={fetchInsight} disabled={insightLoading} style={{ fontSize: 11, color: '#7C6AEA', background: 'rgba(124,106,234,0.1)', border: '1px solid rgba(124,106,234,0.2)', borderRadius: 8, padding: '4px 10px', cursor: insightLoading ? 'wait' : 'pointer' }}>
                {insightLoading ? 'Thinking…' : 'Ask LUMI'}
              </button>
            )}
          </div>
          {aiInsight ? (
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7 }}>{aiInsight}</p>
          ) : (
            <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7 }}>
              Tap &ldquo;Ask LUMI&rdquo; for your personalized daily insight.
            </p>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'slideUp 0.4s ease-out 0.3s forwards', opacity: 0 }}>
          {[
            { href: '/therapist', label: 'Talk to LUMI', emoji: '🧠', color: '#7C6AEA' },
            { href: '/journal', label: 'Write Journal', emoji: '📔', color: '#E8A020' },
            { href: '/reminders', label: 'Reminders', emoji: '⏰', color: '#0FCFAD' },
            { href: '/friends', label: 'My Circle', emoji: '👥', color: '#F06678' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="glass" style={{ borderRadius: 18, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
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
