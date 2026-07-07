# Life Manager

A personal life-management app for keeping everything in one place — tasks, projects, finances, calendar, journal, and more. Runs as a Windows desktop app (Electron) **and** as an installable mobile PWA, with the same codebase and the same data on both.

**Live demo / mobile app:** https://personal-management-tool.vercel.app

> Open that link on your phone and use **Add to Home Screen** to install it as an app.

## Features

- **Dashboard** — at-a-glance view of today's focus, events, overdue tasks, active projects, subscription renewals, and upcoming deadlines
- **Tasks** — standalone tasks and project subtasks in one place, with tags, priorities, due dates, and a "Plan Today" flow
- **Projects** — projects with subtasks, notes, per-task notes, tags, and progress bars
- **Finance** — subscription tracker (day-of-month renewals), budget overview, and a money tracker for IOUs and expected payments
- **Calendar** — monthly grid and list view for events, deadlines, and due tasks
- **Journal** — daily entries with a month calendar and full-text search
- **Library / Workouts / Want List / Ideas** — game & show watchlists, workout sessions with logging, a prioritized wish list, and a notes-style idea collection
- **AI Assistant** — chat with Claude about your data, or paste any text and have it categorized into the right sections automatically (add / edit / remove)
- **Cloud sync (optional)** — offline-first sync between devices via Supabase with email login, newest-wins conflict handling, and automatic local snapshots before any overwrite. A full local copy is always kept on every device.
- **Mobile PWA** — installable, works offline, pull-to-refresh, slide-in navigation, touch-friendly controls
- **Dark mode** + accent color themes

## Tech Stack

| Layer | Tool |
|---|---|
| Desktop shell | Electron |
| Mobile | PWA (vite-plugin-pwa / Workbox) |
| UI | React + Vite + Tailwind CSS |
| Local storage | electron-store (desktop) / localStorage (web) |
| Cloud sync | Supabase (Postgres + Auth + Realtime, free tier) |
| Hosting & API proxy | Vercel (free tier) |
| AI | Claude API (Anthropic) via serverless proxy |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [Git](https://git-scm.com)

### Install

```bash
git clone https://github.com/RyanPeters06/personal-management-tool.git
cd personal-management-tool
npm install
```

### Run (development)

```bash
npm run dev
```

This starts the Vite dev server and launches the Electron window automatically.

### Build

```bash
npm run build:web   # web/PWA build (what Vercel deploys)
npm run build       # packaged desktop .exe (see note below)
```

> **Known issue (Windows):** `npm run build` may fail with `Cannot create symbolic link : A required privilege is not held by the client.` This is electron-builder trying to extract bundled macOS code-signing tools, which requires either enabling **Developer Mode** (Settings → Privacy & Security → For developers) or running the build from an elevated (Administrator) terminal. It does not affect `npm run dev` or the deployed web/PWA build (`npm run build:web`).

## Configuration

All setup steps (Supabase project + SQL, Vercel deployment, phone install, desktop pairing) are documented click-by-click in **[SETUP.md](SETUP.md)**.

Environment variables (see `.env.example`):

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Vercel + local `.env` | Cloud sync (safe to expose; data is protected by Row Level Security) |
| `ANTHROPIC_API_KEY` | Vercel only (server-side) | AI Assistant — never shipped to the client |
| `PROXY_REQUIRE_AUTH` | Vercel | Set `true` so only your signed-in account can use the AI proxy |

The app works fully without any of these — it just runs local-only with no AI.

## Data & Privacy

- **A complete local copy always exists** on each device (electron-store on desktop, localStorage on mobile). Cloud sync is a mirror, never the only copy.
- **Offline-first:** everything works with no connection; changes queue and push automatically on reconnect.
- **Conflict safety:** newest edit wins, and the losing copy is auto-snapshotted locally (restorable from Settings → Local Snapshots).
- **Manual backup:** Settings → Export & Restore produces a portable JSON backup.
- The Claude API key is never committed, never bundled into the client, and never synced to the cloud.

## License

MIT
