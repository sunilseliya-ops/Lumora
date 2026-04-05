# 🌟 LUMORA — Your light, your rhythm.

> AI-powered personal wellness app. Food tracking, AI therapist, voice journal, friends circle, reminders.

---

## 🚀 Deploy in 4 Steps

### Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `lumora` · choose a region close to you
3. Wait for setup (~2 min)
4. Go to **SQL Editor** → paste entire contents of `supabase/schema.sql` → Run
5. Go to **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (it will fail on first try — that's expected, you need env vars next)

### Step 3 — Add Environment Variables

In Vercel → Your Project → **Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL     = https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
ANTHROPIC_API_KEY            = sk-ant-YOUR_KEY (optional — add later to unlock AI)
```

Then go to **Deployments → Redeploy** (or push a commit).

### Step 4 — Done ✓

Your app is live. Open the URL, sign up, and start your journey.

---

## 🤖 Activating AI Features

All AI features (LUMI therapist, photo calorie scan, daily insights) require an Anthropic API key.

1. Get one at [console.anthropic.com](https://console.anthropic.com)
2. Add `ANTHROPIC_API_KEY` to Vercel env vars
3. Redeploy

Without the key, the app works fully for manual food logging, journal, reminders, friends, and notes.

---

## ✨ Features

| Feature | Works without API key |
|---------|----------------------|
| Sign up / Login | ✅ |
| Manual food logging | ✅ |
| Diet dashboard | ✅ |
| Voice journal (Web Speech) | ✅ |
| Text journal | ✅ |
| Friends invite system | ✅ |
| Reminders + notes | ✅ |
| Browser notifications | ✅ |
| **Photo → calories (AI)** | ❌ needs key |
| **LUMI therapist** | ❌ needs key |
| **Daily AI insights** | ❌ needs key |

---

## 📱 Install as Mobile App (PWA)

On iPhone: Open in Safari → Share → **Add to Home Screen**  
On Android: Open in Chrome → ⋮ menu → **Add to Home Screen**

---

## 🗂️ Project Structure

```
lumora/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (auth)/
│   │   ├── login/            # Login
│   │   └── signup/           # Sign up
│   ├── (app)/
│   │   ├── dashboard/        # Home dashboard
│   │   ├── food/             # Food tracker + photo scan
│   │   ├── therapist/        # LUMI AI chat
│   │   ├── journal/          # Voice + text journal
│   │   ├── friends/          # Circle + invites
│   │   └── reminders/        # Reminders + notes
│   └── api/ai/
│       ├── chat/             # LUMI chat API
│       ├── food-scan/        # Photo calorie API
│       └── insight/          # Daily insight API
├── components/
│   └── nav.tsx               # Bottom navigation
├── lib/
│   ├── supabase.ts           # Browser client
│   ├── supabase-server.ts    # Server client
│   └── utils.ts              # Helpers
└── supabase/
    └── schema.sql            # Run this in Supabase
```

---

## 🔒 Privacy

- All user data is private by default (Row Level Security enabled)
- Journal entries are never shared
- Friends can only see: your name, streak count
- AI memory is stored in your own Supabase project

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic keys

# 3. Run dev server
npm run dev

# Open http://localhost:3000
```

---

Built with Next.js · Supabase · Anthropic Claude · Tailwind CSS
