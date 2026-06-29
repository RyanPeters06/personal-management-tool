# Life Manager

A personal desktop app for keeping everything in one place — tasks, finances, calendar, goals, and more. Built with Electron + React, all data stored locally on your machine.

## Features

- **Dashboard** — at-a-glance view of today's events, overdue tasks, subscription renewals, and goal progress
- **To-Do Lists** — categorized task lists with due dates, priority levels, and done tracking
- **Finance** — subscription tracker with monthly cost totals, budget overview, and a money tracker for IOUs and expected payments
- **Calendar** — monthly grid and list view for events and reminders
- **Goals & Projects** — long-term goals with progress tracking, and projects with sub-tasks and notes
- **Tracking** — deadlines with countdowns, games watchlist, and shows/movies watchlist
- **AI Import** — paste any text or load a `.txt`/`.md` file and Claude AI will automatically categorize and organize the contents into the right sections
- **Dark mode** + accent color themes
- **100% local** — no accounts, no cloud, no subscriptions

## Tech Stack

| Layer | Tool |
|---|---|
| Desktop shell | Electron |
| UI | React + Vite |
| Styling | Tailwind CSS |
| Storage | electron-store (local JSON) |
| AI | Claude API (Anthropic) |

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

### Build (packaged `.exe`)

```bash
npm run build
```

Output is in the `/dist` folder.

## AI Import Setup

To use the AI Import feature, you need a Claude API key from [console.anthropic.com](https://console.anthropic.com).

Create a `.env` file in the project root:

```
VITE_CLAUDE_API_KEY=your-key-here
```

Or enter it manually in **Settings → Claude API Key** inside the app. The key is stored locally and never synced anywhere.

Typical cost per import: less than $0.01.

## Data Storage

All your data is saved to your local machine via `electron-store`. Nothing is sent to any server. The save file location:

- **Windows:** `%APPDATA%\life-manager\`
- **macOS:** `~/Library/Application Support/life-manager/`

The `.env` file and all data files are excluded from git.

## License

MIT
