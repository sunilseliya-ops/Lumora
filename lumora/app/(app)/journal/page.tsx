'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Mic, MicOff, Save, Plus, Loader2, X } from 'lucide-react';
import { formatDate, formatTime, getMoodColor } from '@/lib/utils';

interface JournalEntry { id: string; content: string; mood?: string; is_voice: boolean; created_at: string; }

const MOODS = [
  { emoji: '😊', val: 'happy' }, { emoji: '😌', val: 'calm' }, { emoji: '😔', val: 'sad' },
  { emoji: '😤', val: 'anxious' }, { emoji: '⚡', val: 'energetic' }, { emoji: '😴', val: 'tired' },
  { emoji: '🙏', val: 'grateful' }, { emoji: '💭', val: 'reflective' },
];

export default function JournalPage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [tab, setTab] = useState<'write' | 'history'>('write');

  const loadEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setEntries(data as JournalEntry[]);
  }, [supabase]);

  useEffect(() => {
    loadEntries();
    // Check Web Speech API support
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setVoiceSupported(true);
    }
  }, [loadEntries]);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim = t;
        }
      }
      setContent(prev => {
        const base = finalTranscript || prev;
        return base + (interim ? `[${interim}]` : '');
      });
    };

    rec.onend = () => {
      setIsRecording(false);
      // Clean up interim markers
      setContent(prev => prev.replace(/\[.*?\]/g, '').trim());
    };

    rec.onerror = () => {
      setIsRecording(false);
    };

    setRecognition(rec);
    rec.start();
    setIsRecording(true);
  }

  function stopVoice() {
    recognition?.stop();
    setIsRecording(false);
  }

  async function saveEntry() {
    if (!content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('journal_entries').insert({
      user_id: user.id,
      content: content.trim(),
      mood: mood || null,
      is_voice: false,
    });

    setContent('');
    setMood('');
    await loadEntries();
    setSaving(false);
    setTab('history');
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id);
    await loadEntries();
  }

  const groupedEntries = entries.reduce((acc, entry) => {
    const date = formatDate(entry.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', width: 350, height: 350, top: -100, left: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,32,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: '#EFF2F7' }}>
            My <em className="grad-gold" style={{ fontStyle: 'italic' }}>Journal</em>
          </h1>
          <p style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>
            Speak or write — capture your thoughts freely
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['write', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 12,
                border: '1px solid',
                borderColor: tab === t ? 'rgba(232,160,32,0.4)' : 'rgba(255,255,255,0.08)',
                background: tab === t ? 'rgba(232,160,32,0.08)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#E8A020' : '#8892A4',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t === 'write' ? '✍️ Write' : `📚 History (${entries.length})`}
            </button>
          ))}
        </div>

        {tab === 'write' && (
          <div className="glass" style={{ borderRadius: 24, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Voice button */}
            {voiceSupported && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={isRecording ? stopVoice : startVoice}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording
                      ? 'linear-gradient(135deg, #F06678, #E54559)'
                      : 'linear-gradient(135deg, #E8A020, #CC8A10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    ...(isRecording ? { animation: 'recordPulse 1.5s ease-out infinite' } : {}),
                  }}
                  className={isRecording ? 'recording-pulse' : ''}
                >
                  {isRecording ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#060912" />}
                </button>
                <div>
                  <div style={{ fontSize: 13, color: '#EFF2F7', fontWeight: 500 }}>
                    {isRecording ? '● Recording…' : 'Voice Entry'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8892A4' }}>
                    {isRecording ? 'Tap to stop' : 'Tap mic to speak your thoughts'}
                  </div>
                </div>
              </div>
            )}

            {/* Text area */}
            <textarea
              className="input-dark"
              placeholder="What's on your mind today? Write freely — no judgment here…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
            />

            {/* Mood selector */}
            <div>
              <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 10 }}>HOW ARE YOU FEELING?</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MOODS.map(m => (
                  <button
                    key={m.val}
                    onClick={() => setMood(mood === m.val ? '' : m.val)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: mood === m.val ? 'rgba(232,160,32,0.5)' : 'rgba(255,255,255,0.08)',
                      background: mood === m.val ? 'rgba(232,160,32,0.12)' : 'rgba(255,255,255,0.03)',
                      fontSize: 20,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={saveEntry}
              disabled={saving || !content.trim()}
              style={{ width: '100%' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {entries.length === 0 ? (
              <div className="glass" style={{ borderRadius: 18, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📔</div>
                <div style={{ fontSize: 14, color: '#8892A4' }}>No journal entries yet.</div>
                <div style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>
                  Start writing to track your journey.
                </div>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#8892A4', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 500 }}>
                    {date.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dayEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="glass"
                        style={{ borderRadius: 18, padding: '16px', position: 'relative' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {entry.mood && (
                              <span
                                className="chip"
                                style={{
                                  background: `${getMoodColor(entry.mood)}18`,
                                  color: getMoodColor(entry.mood),
                                }}
                              >
                                {MOODS.find(m => m.val === entry.mood)?.emoji} {entry.mood}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#4A5568' }}>
                              {formatTime(entry.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#4A5568',
                              padding: 4,
                              flexShrink: 0,
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <p style={{ fontSize: 13, color: '#EFF2F7', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
