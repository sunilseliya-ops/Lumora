'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Copy, Check, UserPlus, Loader2, X } from 'lucide-react';

interface Friend { id: string; name: string; email: string; streak: number; invite_code: string; }

export default function FriendsPage() {
  const supabase = createClient();
  const [myCode, setMyCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('invite_code')
      .eq('id', user.id)
      .single();
    if (prof) setMyCode(prof.invite_code);

    // Get friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id, user_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!friendships?.length) return;

    const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id);

    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('id, name, email, streak, invite_code')
      .in('id', friendIds);

    if (friendProfiles) setFriends(friendProfiles as Friend[]);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function copyCode() {
    await navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!friendCode.trim()) return;
    setAdding(true);
    setAddError('');
    setAddSuccess('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find profile with that invite code
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('invite_code', friendCode.trim())
      .single();

    if (!targetProfile) {
      setAddError('No user found with that invite code.');
      setAdding(false);
      return;
    }

    if (targetProfile.id === user.id) {
      setAddError("That's your own code!");
      setAdding(false);
      return;
    }

    // Check if already friends
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${user.id})`)
      .single();

    if (existing) {
      setAddError('You are already connected with this person.');
      setAdding(false);
      return;
    }

    // Create friendship both ways
    await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: targetProfile.id, status: 'accepted' },
      { user_id: targetProfile.id, friend_id: user.id, status: 'accepted' },
    ]);

    setAddSuccess(`${targetProfile.name} joined your circle! 🎉`);
    setFriendCode('');
    await load();
    setAdding(false);
  }

  async function removeFriend(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
    await load();
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <div
        style={{
          position: 'fixed', width: 350, height: 350, top: -80, right: -80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,102,120,0.08), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: '#EFF2F7' }}>
            My <em className="grad-rose" style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#F06678,#F9A8B4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Circle</em>
          </h1>
          <p style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>
            Invite-only — share your journey with people who matter
          </p>
        </div>

        {/* My invite code */}
        <div
          className="glass"
          style={{ borderRadius: 24, padding: '20px', marginBottom: 16 }}
        >
          <div style={{ fontSize: 12, color: '#8892A4', letterSpacing: '0.06em', marginBottom: 14 }}>
            YOUR INVITE CODE
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              background: 'rgba(240,102,120,0.08)',
              border: '1px solid rgba(240,102,120,0.2)',
              borderRadius: 16,
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: '#F06678',
                fontFamily: 'monospace',
              }}
            >
              {myCode || '——————'}
            </code>
            <button
              onClick={copyCode}
              style={{
                background: copied ? 'rgba(15,207,173,0.15)' : 'rgba(240,102,120,0.15)',
                border: `1px solid ${copied ? 'rgba(15,207,173,0.3)' : 'rgba(240,102,120,0.3)'}`,
                borderRadius: 10,
                padding: '8px 14px',
                cursor: 'pointer',
                color: copied ? '#0FCFAD' : '#F06678',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#4A5568', marginTop: 10, lineHeight: 1.5 }}>
            Share this code with close friends. Only people you invite can join your journey.
          </p>
        </div>

        {/* Add friend */}
        <div className="glass" style={{ borderRadius: 24, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#8892A4', letterSpacing: '0.06em', marginBottom: 14 }}>
            ADD SOMEONE TO YOUR CIRCLE
          </div>
          <form onSubmit={addFriend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input-dark"
              placeholder="Enter their invite code"
              value={friendCode}
              onChange={e => setFriendCode(e.target.value)}
            />
            {addError && (
              <div style={{ fontSize: 12, color: '#F06678', padding: '8px 12px', background: 'rgba(240,102,120,0.1)', borderRadius: 10, border: '1px solid rgba(240,102,120,0.2)' }}>
                {addError}
              </div>
            )}
            {addSuccess && (
              <div style={{ fontSize: 12, color: '#0FCFAD', padding: '8px 12px', background: 'rgba(15,207,173,0.1)', borderRadius: 10, border: '1px solid rgba(15,207,173,0.2)' }}>
                {addSuccess}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={adding || !friendCode.trim()}
              style={{ width: '100%' }}
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {adding ? 'Connecting…' : 'Add to Circle'}
            </button>
          </form>
        </div>

        {/* Friends list */}
        <div>
          <div style={{ fontSize: 12, color: '#8892A4', letterSpacing: '0.06em', marginBottom: 12 }}>
            YOUR CIRCLE ({friends.length})
          </div>

          {friends.length === 0 ? (
            <div className="glass" style={{ borderRadius: 18, padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 14, color: '#8892A4' }}>Your circle is empty.</div>
              <div style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>
                Share your invite code to bring people in.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="glass"
                  style={{
                    borderRadius: 18,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(240,102,120,0.3), rgba(124,106,234,0.3))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#EFF2F7',
                      flexShrink: 0,
                    }}
                  >
                    {(friend.name || friend.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#EFF2F7' }}>
                      {friend.name || friend.email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: '#8892A4', marginTop: 2 }}>
                      🔥 {friend.streak || 0} day streak
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#4A5568',
                      padding: 6,
                      borderRadius: 8,
                      transition: 'color 0.2s',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
