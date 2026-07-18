# nexus-chat (Phase 1)

Real-time chat for friends. React + Vite + Supabase (anonymous auth, Postgres, Realtime).

## What's included
- Anonymous sign-in with a chosen display name (no email/password)
- Multiple rooms/channels (seeded: `general`, `random`)
- Live message sync via Supabase Realtime
- Dark, monospace "terminal" look (IBM Plex Mono, CSS-only ambient grid background — no GPU shader cost)

## 1. Supabase setup
1. Create a project at https://supabase.com (or reuse an existing one).
2. In the Dashboard, go to **Authentication > Providers** and enable **Anonymous Sign-Ins**.
3. Go to **SQL Editor > New query**, paste the contents of `supabase/schema.sql`, and run it.
   This creates the `profiles`, `rooms`, and `messages` tables, sets up Row Level Security
   policies, seeds two starter rooms, and enables Realtime on `messages`.
4. Go to **Project Settings > API** and copy your **Project URL** and **anon public key**.

## 2. Local setup
```bash
npm install
cp .env.example .env
# paste your Project URL and anon key into .env
npm run dev
```

## 3. Deploy (Cloudflare Pages)
Since this uses npm packages, it needs a build step — unlike your flat HTML sites, you don't
drag-and-drop files. Push this folder to a GitHub repo, then in Cloudflare Pages:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
  **Settings > Environment variables** (same values as your local `.env`)

## Adding more rooms
For now, add rooms directly in Supabase: **Table Editor > rooms > Insert row**.
We can add an in-app "create room" UI in a later phase if you want it.

## Next phases (not built yet)
- Visual polish pass / your custom background style
- EvilEye component as a small persistent accent
- TextType for empty-state / welcome copy
- Presence ("who's online"), typing indicators, message reactions
