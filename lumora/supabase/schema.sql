-- ============================================
-- LUMORA — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ────────────────────────────────
CREATE TABLE profiles (
  id            UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email         TEXT,
  name          TEXT,
  avatar_url    TEXT,
  invite_code   TEXT UNIQUE DEFAULT encode(gen_random_bytes(5), 'hex'),
  calorie_goal  INTEGER DEFAULT 2000,
  ai_memory     JSONB DEFAULT '{"patterns":{},"mood_history":[],"topics":[],"personality":""}',
  streak        INTEGER DEFAULT 0,
  last_log_date DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── FOOD LOGS ────────────────────────────────
CREATE TABLE food_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  calories    INTEGER DEFAULT 0,
  meal_type   TEXT DEFAULT 'snack' CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  photo_url   TEXT,
  ai_analysis JSONB,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOURNAL ENTRIES ──────────────────────────
CREATE TABLE journal_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  mood        TEXT,
  ai_insight  TEXT,
  is_voice    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHAT MESSAGES (Therapist) ────────────────
CREATE TABLE chat_messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role             TEXT CHECK (role IN ('user','assistant')),
  content          TEXT NOT NULL,
  emotion_detected TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── REMINDERS ────────────────────────────────
CREATE TABLE reminders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  note        TEXT,
  remind_at   TIMESTAMPTZ,
  is_done     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTES ────────────────────────────────────
CREATE TABLE notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FRIENDSHIPS ──────────────────────────────
CREATE TABLE friendships (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'accepted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ── ROW LEVEL SECURITY ───────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships    ENABLE ROW LEVEL SECURITY;

-- Profiles: users own their profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Friends can view basic profile info
CREATE POLICY "Friends can view profile" ON profiles FOR SELECT
  USING (id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
  ));

-- Food logs: private to user
CREATE POLICY "food_logs_own" ON food_logs FOR ALL USING (auth.uid() = user_id);

-- Journal: private to user
CREATE POLICY "journal_own" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Chat: private to user
CREATE POLICY "chat_own" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- Reminders: private to user
CREATE POLICY "reminders_own" ON reminders FOR ALL USING (auth.uid() = user_id);

-- Notes: private to user
CREATE POLICY "notes_own" ON notes FOR ALL USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "friendships_own" ON friendships FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ── DAILY PLANS (workout + task) ─────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plans (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date    DATE DEFAULT CURRENT_DATE,
  workout      TEXT,
  workout_done BOOLEAN DEFAULT FALSE,
  important_task TEXT,
  task_done    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_plans_own" ON daily_plans FOR ALL USING (auth.uid() = user_id);
