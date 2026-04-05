'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, BellOff, Plus, Check, X, Loader2, StickyNote, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface Reminder { id: string; title: string; note?: string; remind_at?: string; is_done: boolean; created_at: string; }
interface Note { id: string; content: string; created_at: string; }

export default function RemindersPage() {
  const supabase = createClient();
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<'reminders' | 'notes'>('reminders');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');

  // Reminder form
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Notes form
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: rem }, { data: noteData }] = await Promise.all([
      supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at', { ascending: true, nullsFirst: false }),
      supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);

    if (rem) setReminders(rem as Reminder[]);
    if (noteData) setNotes(noteData as Note[]);
  }, [supabase]);

  useEffect(() => {
    loadData();
    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission);
    }
  }, [loadData]);

  // Schedule browser notifications
  useEffect(() => {
    if (notifPerm !== 'granted') return;

    // Clear old timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current.clear();

    reminders.forEach(r => {
      if (!r.remind_at || r.is_done) return;
      const ms = new Date(r.remind_at).getTime() - Date.now();
      if (ms <= 0) return;

      const timer = setTimeout(() => {
        new Notification('⏰ Lumora Reminder', {
          body: r.title,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      }, ms);

      timersRef.current.set(r.id, timer);
    });

    return () => { timersRef.current.forEach(t => clearTimeout(t)); };
  }, [reminders, notifPerm]);

  async function requestNotif() {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('reminders').insert({
      user_id: user.id,
      title: title.trim(),
      note: note.trim() || null,
      remind_at: remindAt || null,
    });

    setTitle(''); setRemindAt(''); setNote('');
    setShowForm(false);
    await loadData();
    setSaving(false);
  }

  async function toggleDone(id: string, done: boolean) {
    await supabase.from('reminders').update({ is_done: !done }).eq('id', id);
    await loadData();
  }

  async function deleteReminder(id: string) {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id)!);
      timersRef.current.delete(id);
    }
    await supabase.from('reminders').delete().eq('id', id);
    await loadData();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSavingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notes').insert({ user_id: user.id, content: noteContent.trim() });
    setNoteContent('');
    await loadData();
    setSavingNote(false);
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id);
    await loadData();
  }

  const upcoming = reminders.filter(r => !r.is_done && (!r.remind_at || !isPast(new Date(r.remind_at))));
  const done = reminders.filter(r => r.is_done || (r.remind_at && isPast(new Date(r.remind_at)) && !r.is_done));

  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', width: 350, height: 350, bottom: 100, right: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: '#EFF2F7' }}>
              Focus <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #60A5FA, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hub</em>
            </h1>
            <p style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>Reminders, notes & tasks</p>
          </div>

          {notifPerm !== 'granted' ? (
            <button
              onClick={requestNotif}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'rgba(96,165,250,0.1)',
                border: '1px solid rgba(96,165,250,0.25)',
                borderRadius: 10,
                color: '#60A5FA',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <BellOff size={13} />
              Enable Alerts
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(15,207,173,0.1)', border: '1px solid rgba(15,207,173,0.2)', borderRadius: 10 }}>
              <Bell size={12} color="#0FCFAD" />
              <span style={{ fontSize: 11, color: '#0FCFAD' }}>Alerts on</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['reminders', 'notes'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 12,
                border: '1px solid',
                borderColor: tab === t ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)',
                background: tab === t ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#60A5FA' : '#8892A4',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {t === 'reminders' ? <><Clock size={13} /> Reminders ({upcoming.length})</> : <><StickyNote size={13} /> Notes ({notes.length})</>}
            </button>
          ))}
        </div>

        {/* REMINDERS TAB */}
        {tab === 'reminders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Add button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Plus size={15} />
                New Reminder
              </button>
            )}

            {/* Add form */}
            {showForm && (
              <div className="glass" style={{ borderRadius: 20, padding: '18px' }}>
                <form onSubmit={addReminder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    className="input-dark"
                    placeholder="What do you need to remember?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                  <input
                    className="input-dark"
                    type="datetime-local"
                    value={remindAt}
                    onChange={e => setRemindAt(e.target.value)}
                    min={minDateTime}
                    style={{ colorScheme: 'dark' }}
                  />
                  <textarea
                    className="input-dark"
                    placeholder="Add a note (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowForm(false)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                      style={{ flex: 2 }}
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                      {saving ? 'Saving…' : 'Set Reminder'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Upcoming reminders */}
            {upcoming.length === 0 && !showForm ? (
              <div className="glass" style={{ borderRadius: 18, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
                <div style={{ fontSize: 14, color: '#8892A4' }}>No reminders set.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(r => (
                  <div
                    key={r.id}
                    className="glass"
                    style={{
                      borderRadius: 16,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <button
                      onClick={() => toggleDone(r.id, r.is_done)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        border: '2px solid rgba(96,165,250,0.4)',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                        transition: 'all 0.2s',
                      }}
                    >
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#EFF2F7', fontWeight: 500 }}>{r.title}</div>
                      {r.remind_at && (
                        <div style={{ fontSize: 11, color: '#60A5FA', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />
                          {format(new Date(r.remind_at), 'MMM d · h:mm a')}
                        </div>
                      )}
                      {r.note && (
                        <div style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>{r.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 4 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Done section */}
            {done.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#4A5568', letterSpacing: '0.06em', marginBottom: 8 }}>COMPLETED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {done.slice(0, 5).map(r => (
                    <div
                      key={r.id}
                      style={{
                        borderRadius: 12,
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#4A5568', textDecoration: 'line-through' }}>{r.title}</span>
                      <button
                        onClick={() => deleteReminder(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 4 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass" style={{ borderRadius: 20, padding: '16px' }}>
              <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  className="input-dark"
                  placeholder="Quick note — ideas, thoughts, anything…"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingNote || !noteContent.trim()}
                  style={{ alignSelf: 'flex-end', padding: '10px 20px' }}
                >
                  {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </form>
            </div>

            {notes.length === 0 ? (
              <div className="glass" style={{ borderRadius: 18, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 14, color: '#8892A4' }}>No notes yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(n => (
                  <div
                    key={n.id}
                    className="glass"
                    style={{ borderRadius: 16, padding: '14px 16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 13, color: '#EFF2F7', lineHeight: 1.6, whiteSpace: 'pre-wrap', flex: 1 }}>
                        {n.content}
                      </p>
                      <button
                        onClick={() => deleteNote(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: '0 0 0 8px', flexShrink: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: '#4A5568', marginTop: 8 }}>
                      {format(new Date(n.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
