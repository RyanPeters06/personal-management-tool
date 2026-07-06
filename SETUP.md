# Life Manager — Phone + Sync Setup

This gets Life Manager onto your phone as an installable app, with your data
synced between your laptop and phone, working offline, and your Claude API key
kept safe on the server. **Total cost: $0** (Supabase + Vercel free tiers).

Do the steps in order. You only do this once.

---

## Part 1 — Supabase (data + login)

1. Go to **https://supabase.com** → sign up (free) → **New project**.
   - Name it anything (e.g. `life-manager`). Pick a strong database password
     (you won't need it day-to-day). Choose the region closest to you.
   - Wait ~2 minutes for it to provision.

2. **Create the data table.** In the left sidebar open **SQL Editor** → **New query**,
   paste this, and click **Run**:

   ```sql
   create table if not exists public.app_data (
     user_id uuid primary key references auth.users on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now(),
     device_id text
   );

   alter table public.app_data enable row level security;

   create policy "own rows - select" on public.app_data
     for select using (auth.uid() = user_id);
   create policy "own rows - insert" on public.app_data
     for insert with check (auth.uid() = user_id);
   create policy "own rows - update" on public.app_data
     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```

3. **Turn on email login (and turn OFF confirmation so you can sign in immediately).**
   - Left sidebar → **Authentication** → **Sign In / Providers** → make sure
     **Email** is enabled.
   - **Authentication** → **Providers → Email** (or **Configuration**): turn
     **Confirm email** / "Enable email confirmations" **OFF**. (You're the only
     user; no inbox needed. You can leave it on if you have email set up, but
     then you'll have to click a confirmation link before your first sign-in.)

4. **Copy your keys.** Left sidebar → **Project Settings** → **API**:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **Project API keys → anon / public** → this is `VITE_SUPABASE_ANON_KEY`
   - Keep this tab open for Part 2.

---

## Part 2 — Vercel (hosting + secure API key)

1. Push is already done — the repo is on GitHub. Go to **https://vercel.com** →
   sign up with your **GitHub** account (free "Hobby" plan).

2. **New Project** → **Import** your `Personal-Management-Tool` repo.

3. **Configure before deploying:**
   - **Framework Preset:** Vite (should auto-detect).
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
   - (Leave install command default.)

4. **Environment Variables** (expand that section and add each one):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Project URL from Part 1 |
   | `VITE_SUPABASE_ANON_KEY` | your anon/public key from Part 1 |
   | `ANTHROPIC_API_KEY` | your Claude key (`sk-ant-...`) |
   | `PROXY_REQUIRE_AUTH` | `true` |

   > `PROXY_REQUIRE_AUTH=true` locks AI to your signed-in account so nobody who
   > finds the URL can spend your Anthropic budget. The `ANTHROPIC_API_KEY` lives
   > only here on Vercel — it is never shipped to your phone or laptop.

5. Click **Deploy**. After ~1 minute you'll get a URL like
   `https://personal-management-tool.vercel.app`. **Copy it.**

---

## Part 3 — Install on your phone

1. Open the Vercel URL in your phone's browser (**Safari** on iPhone, **Chrome**
   on Android).
2. **Add to Home Screen:**
   - iPhone: tap **Share** → **Add to Home Screen**.
   - Android: tap the **⋮** menu → **Install app** / **Add to Home Screen**.
3. Open it from the new home-screen icon. Go to **Settings → Cloud Sync** and
   **Create an account** (email + password). You're now signed in and syncing.

---

## Part 4 — Point your laptop at the same build (version parity)

So the desktop app always runs the exact same version as the phone:

1. Open `electron/app-config.js` and set your URL:
   ```js
   module.exports = {
     DEPLOYED_URL: process.env.LM_APP_URL || 'https://YOUR-APP.vercel.app',
   }
   ```
   (Tell me your Vercel URL and I'll set this for you and rebuild the desktop app.)
2. Rebuild the desktop app once (`npm run build`). From then on, every time you
   deploy to Vercel, **both phone and laptop show the new version automatically**
   — no desktop rebuild needed for feature changes.
3. In the desktop app, go to **Settings → Cloud Sync** and **sign in** with the
   same account. Your existing local data seeds the cloud on first sync.

---

## How your data is protected

- **Local copy always kept.** Your laptop's `electron-store` file and your
  phone's local storage each hold a full copy. Supabase is a synced *mirror*,
  never the only copy.
- **Offline:** the app works fully offline; edits queue and push automatically
  when you reconnect.
- **Conflicts:** if you edit both devices offline, the newest change wins for the
  whole dataset, and the app auto-saves a **local snapshot** of the other copy
  first — restore it any time from **Settings → Local Snapshots**.
- **Manual backup:** **Settings → Export & Restore** still gives you a portable
  JSON backup on top of everything else.

---

## Verifying it works

1. On the phone (signed in): add a task. Within a few seconds it appears on the
   laptop (also signed in), and vice-versa.
2. Put the phone in airplane mode, add a few things, turn airplane mode off —
   they sync up automatically.
3. **Settings → About** shows the version + build time; after a deploy, both
   devices show the same build once reloaded.
