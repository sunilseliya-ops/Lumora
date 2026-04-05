'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { getMealEmoji, formatTime } from '@/lib/utils';
import { Camera, Plus, Loader2, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface FoodLog { id: string; description: string; calories: number; meal_type: string; logged_at: string; ai_analysis?: any; }

const MEAL_TYPES = [
  { val: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { val: 'lunch', label: 'Lunch', emoji: '☀️' },
  { val: 'dinner', label: 'Dinner', emoji: '🌙' },
  { val: 'snack', label: 'Snack', emoji: '⚡' },
];

function getMealForTime(): string {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snack';
}

export default function FoodPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [todayCals, setTodayCals] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  // Manual entry
  const [desc, setDesc] = useState('');
  const [cals, setCals] = useState('');
  const [mealType, setMealType] = useState(getMealForTime());
  const [saving, setSaving] = useState(false);

  // Photo scan
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  const [tab, setTab] = useState<'manual' | 'camera'>('manual');

  const loadLogs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const [{ data: logsData }, { data: prof }] = await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_at', today).order('logged_at', { ascending: false }),
      supabase.from('profiles').select('calorie_goal').eq('id', user.id).single(),
    ]);
    if (logsData) { setLogs(logsData); setTodayCals(logsData.reduce((s: number, l: FoodLog) => s + (l.calories || 0), 0)); }
    if (prof) setCalorieGoal(prof.calorie_goal || 2000);
  }, [supabase]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('food_logs').insert({
      user_id: user.id,
      description: desc,
      calories: parseInt(cals) || 0,
      meal_type: mealType,
    });
    setDesc(''); setCals('');
    await loadLogs();
    setSaving(false);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 800;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round((h / w) * maxSize); w = maxSize; }
          else { w = Math.round((w / h) * maxSize); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.7));
        setScanResult(null); setScanError('');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function analyzePhoto() {
    if (!photoPreview) return;
    setScanning(true);
    setScanError('');
    try {
      const base64 = photoPreview.split(',')[1];
      const res = await fetch('/api/ai/food-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (data.error === 'api_key_missing') {
        setScanError('Add your ANTHROPIC_API_KEY in Vercel to enable photo scanning.');
      } else if (data.error) {
        setScanError(data.error);
      } else {
        setScanResult(data);
        setDesc(data.items?.map((i: any) => i.name).join(', ') || 'Mixed food');
        setCals(String(data.total_calories || 0));
      }
    } catch {
      setScanError('Failed to analyze. Please try again.');
    }
    setScanning(false);
  }

  async function saveScannedFood() {
    if (!scanResult) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('food_logs').insert({
      user_id: user.id,
      description: desc || 'Scanned food',
      calories: parseInt(cals) || scanResult.total_calories || 0,
      meal_type: mealType,
      ai_analysis: scanResult,
    });
    setPhotoPreview(null);
    setScanResult(null);
    setDesc(''); setCals('');
    await loadLogs();
    setSaving(false);
  }

  async function deleteLog(id: string) {
    await supabase.from('food_logs').delete().eq('id', id);
    await loadLogs();
  }

  const pct = Math.min(todayCals / calorieGoal, 1);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="blob-aqua" style={{ width: 400, height: 400, top: -150, right: -150, background: 'radial-gradient(circle, rgba(15,207,173,0.08), transparent 70%)', position: 'fixed', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: '#EFF2F7' }}>
            Nutrition <em className="grad-aqua" style={{ fontStyle: 'italic' }}>Tracker</em>
          </h1>
          <p style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>

        {/* Progress bar */}
        <div className="glass" style={{ borderRadius: 20, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#8892A4' }}>Daily Progress</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#EFF2F7' }}>{todayCals} / {calorieGoal} kcal</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct * 100}%`,
                background: pct > 0.9 ? '#F06678' : pct > 0.6 ? '#E8A020' : '#0FCFAD',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['manual', 'camera'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 12,
                border: '1px solid',
                borderColor: tab === t ? 'rgba(15,207,173,0.4)' : 'rgba(255,255,255,0.08)',
                background: tab === t ? 'rgba(15,207,173,0.1)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#0FCFAD' : '#8892A4',
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
              {t === 'camera' ? <Camera size={14} /> : <Plus size={14} />}
              {t === 'manual' ? 'Manual Entry' : 'Snap & Scan'}
            </button>
          ))}
        </div>

        {/* Manual entry */}
        {tab === 'manual' && (
          <div className="glass" style={{ borderRadius: 24, padding: '20px', marginBottom: 20 }}>
            <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input-dark"
                placeholder="What did you eat?"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input-dark"
                  type="number"
                  placeholder="Calories (kcal)"
                  value={cals}
                  onChange={e => setCals(e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    value={mealType}
                    onChange={e => setMealType(e.target.value)}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      padding: '12px 36px 12px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      color: '#EFF2F7',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {MEAL_TYPES.map(m => (
                      <option key={m.val} value={m.val} style={{ background: '#0D1224' }}>
                        {m.emoji} {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#8892A4', pointerEvents: 'none' }} />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ width: '100%' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Saving…' : 'Add Entry'}
              </button>
            </form>
          </div>
        )}

        {/* Camera tab */}
        {tab === 'camera' && (
          <div className="glass" style={{ borderRadius: 24, padding: '20px', marginBottom: 20 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />

            {!photoPreview ? (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '40px 20px',
                  background: 'rgba(15,207,173,0.06)',
                  border: '2px dashed rgba(15,207,173,0.3)',
                  borderRadius: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <Camera size={32} color="#0FCFAD" />
                <span style={{ fontSize: 14, color: '#0FCFAD', fontWeight: 500 }}>Tap to take photo</span>
                <span style={{ fontSize: 12, color: '#8892A4' }}>or select from gallery</span>
              </button>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <img
                    src={photoPreview}
                    alt="Food"
                    style={{ width: '100%', borderRadius: 16, maxHeight: 220, objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => { setPhotoPreview(null); setScanResult(null); }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {scanError && (
                  <div style={{ background: 'rgba(240,102,120,0.1)', border: '1px solid rgba(240,102,120,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F06678', marginBottom: 12 }}>
                    {scanError}
                  </div>
                )}

                {scanResult ? (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 8 }}>AI DETECTED</div>
                    {scanResult.items?.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                        <span style={{ color: '#EFF2F7' }}>{item.name}</span>
                        <span style={{ color: '#0FCFAD' }}>{item.calories} kcal</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, fontWeight: 600 }}>
                      <span style={{ color: '#EFF2F7' }}>Total</span>
                      <span style={{ color: '#E8A020' }}>{scanResult.total_calories} kcal</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <input className="input-dark" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Edit description" style={{ flex: 1 }} />
                      <input className="input-dark" type="number" value={cals} onChange={e => setCals(e.target.value)} placeholder="kcal" style={{ width: 80 }} />
                    </div>
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 10 }}>
                  {!scanResult ? (
                    <button className="btn-primary" onClick={analyzePhoto} disabled={scanning} style={{ flex: 1 }}>
                      {scanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {scanning ? 'Analyzing…' : 'Analyze with AI'}
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={saveScannedFood} disabled={saving} style={{ flex: 1 }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                      {saving ? 'Saving…' : 'Save to Log'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Today's log */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#8892A4', letterSpacing: '0.06em', marginBottom: 12 }}>
            TODAY&apos;S FOOD LOG
          </div>
          {logs.length === 0 ? (
            <div className="glass" style={{ borderRadius: 18, padding: '24px', textAlign: 'center', color: '#4A5568', fontSize: 13 }}>
              No entries yet today. Start logging!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  className="glass"
                  style={{
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{getMealEmoji(log.meal_type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#EFF2F7', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.description}
                    </div>
                    <div style={{ fontSize: 11, color: '#8892A4', marginTop: 2 }}>
                      {log.meal_type} · {formatTime(log.logged_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0FCFAD' }}>{log.calories} kcal</span>
                    <button
                      onClick={() => deleteLog(log.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkles({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" />
      <path d="M6 14L6.5 16.5L9 17L6.5 17.5L6 20L5.5 17.5L3 17L5.5 16.5L6 14Z" />
      <path d="M18 14L18.5 16.5L21 17L18.5 17.5L18 20L17.5 17.5L15 17L17.5 16.5L18 14Z" />
    </svg>
  );
}
