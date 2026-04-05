'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import LumiOnboarding from '@/components/lumi-onboarding';

interface Message { id: string; role: 'user' | 'assistant'; content: string; emotion_detected?: string; created_at: string; }

const EMOTION_COLORS: Record<string, string> = {
  happy: '#0FCFAD', calm: '#60A5FA', sad: '#7C6AEA',
  anxious: '#F06678', angry: '#F97316', grateful: '#E8A020',
  confused: '#8892A4', hopeful: '#34D399', neutral: '#8892A4',
};

export default function TherapistPage() {
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userMemory, setUserMemory] = useState<any>({});
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const loadHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: prof } = await supabase.from('profiles').select('name, ai_memory').eq('id', user.id).single();
    if (prof) {
      setUserName(prof.name || 'friend');
      const mem = prof.ai_memory || {};
      setUserMemory(mem);
      // Show onboarding if no questionnaire done yet
      if (!mem.onboarding_done) {
        setShowOnboarding(true);
      }
    }

    const { data } = await supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(40);
    if (data) setMessages(data as Message[]);
    setPageReady(true);
  }, [supabase]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function handleOnboardingComplete(answers: any) {
    if (!userId) return;
    const updatedMemory = {
      ...userMemory,
      onboarding_done: true,
      goals: answers.goals || [],
      challenges: answers.challenges || [],
      support_style: answers.style || '',
      fitness_level: answers.fitness_level || '',
    };
    setUserMemory(updatedMemory);
    await supabase.from('profiles').update({ ai_memory: updatedMemory }).eq('id', userId);
    setShowOnboarding(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !userId) return;
    setInput('');
    setLoading(true);
    setError('');

    const tempId = Date.now().toString();
    const userMsg: Message = { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content: text });

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userName,
          memory: userMemory,
          history: messages.slice(-14).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.error === 'api_key_missing') {
        setError('Add GROQ_API_KEY in Vercel to activate LUMI.');
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setLoading(false);
        return;
      }

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply || 'Something went wrong.',
        emotion_detected: data.emotion,
        created_at: new Date().toISOString(),
      };

      await supabase.from('chat_messages').insert({ user_id: userId, role: 'assistant', content: data.reply, emotion_detected: data.emotion });

      // Update memory
      const newMemory = { ...userMemory };
      const moodHistory = newMemory.mood_history || [];
      moodHistory.push({ emotion: data.emotion, date: new Date().toISOString().split('T')[0], snippet: text.slice(0, 60) });
      if (moodHistory.length > 30) moodHistory.shift();
      newMemory.mood_history = moodHistory;
      setUserMemory(newMemory);
      await supabase.from('profiles').update({ ai_memory: newMemory }).eq('id', userId);

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError('Failed to connect. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function clearHistory() {
    if (!userId) return;
    await supabase.from('chat_messages').delete().eq('user_id', userId);
    setMessages([]);
  }

  if (!pageReady) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {showOnboarding && <LumiOnboarding userName={userName} onComplete={handleOnboardingComplete} />}

      <div style={{ position: 'fixed', inset: 0, background: '#060912', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 400, height: 400, top: -100, right: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,234,0.1), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,9,18,0.8)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg, #1A1440, #241B5C)', border: '1px solid rgba(124,106,234,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,106,234,0.25)' }}>
            <Sparkles size={18} color="#7C6AEA" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#EFF2F7' }}>LUMI</div>
            <div style={{ fontSize: 11, color: '#7C6AEA' }}>● Your AI companion</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={() => setShowOnboarding(true)} title="Retake questionnaire" style={{ fontSize: 10, color: '#8892A4', width: 'auto', padding: '0 10px' }}>
            Preferences
          </button>
          <button className="btn-icon" onClick={clearHistory} title="Clear history"><RotateCcw size={14} /></button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10, maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {error && (
          <div style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', borderRadius: 16, padding: '14px 16px', fontSize: 13, color: '#E8A020', textAlign: 'center' }}>{error}</div>
        )}

        {messages.length === 0 && !error && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #1A1440, #241B5C)', border: '1px solid rgba(124,106,234,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={28} color="#7C6AEA" />
            </div>
            <div style={{ fontSize: 16, color: '#EFF2F7', fontWeight: 500, marginBottom: 8 }}>Hi {userName}! I&apos;m LUMI ✦</div>
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 24px' }}>
              I&apos;m here to support your mental wellbeing. Share what&apos;s on your mind.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {["How are you feeling today?", "I've been stressed lately", "Help me stay motivated", "I need someone to talk to"].map(prompt => (
                <button key={prompt} onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  style={{ background: 'rgba(124,106,234,0.08)', border: '1px solid rgba(124,106,234,0.18)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#A78BFA', cursor: 'pointer', textAlign: 'left' }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ maxWidth: '82%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #E8A020, #CC8A10)' : 'rgba(20,26,48,0.95)', border: msg.role === 'assistant' ? '1px solid rgba(124,106,234,0.2)' : 'none', color: msg.role === 'user' ? '#060912' : '#EFF2F7', fontSize: 14, lineHeight: 1.65 }}>
              {msg.content}
            </div>
            {msg.emotion_detected && (
              <div className="chip" style={{ marginTop: 4, background: `${EMOTION_COLORS[msg.emotion_detected] || '#8892A4'}18`, color: EMOTION_COLORS[msg.emotion_detected] || '#8892A4', fontSize: 10 }}>
                ● {msg.emotion_detected}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(20,26,48,0.95)', border: '1px solid rgba(124,106,234,0.2)', display: 'flex', gap: 5, alignItems: 'center' }}>
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C6AEA' }} />
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C6AEA' }} />
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C6AEA' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'relative', zIndex: 10, padding: '12px 16px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} className="input-dark" placeholder="Share what's on your mind…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1}
            style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120, overflowY: 'auto', paddingTop: 11, paddingBottom: 11 }} />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, background: input.trim() && !loading ? 'linear-gradient(135deg, #7C6AEA, #5B48D9)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: input.trim() && !loading ? 'rgba(124,106,234,0.5)' : 'rgba(255,255,255,0.08)', color: input.trim() && !loading ? '#fff' : '#4A5568', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#4A5568', marginTop: 8, maxWidth: 520, margin: '8px auto 0' }}>
          LUMI learns from every conversation to support you better
        </div>
      </div>
    </div>
  );
}
