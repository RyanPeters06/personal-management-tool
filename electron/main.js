const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store')
const { DEPLOYED_URL } = require('./app-config')

const store = new Store()
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Unique Windows AppUserModelID so the taskbar treats this as its own app
// (not lumped in with any other Electron app running under the default id).
const APP_ID = 'com.peter.lifemanager'
if (process.platform === 'win32') app.setAppUserModelId(APP_ID)

// Only allow one instance; focus the existing window instead of opening another.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Life Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 32,
    },
    backgroundColor: '#0f172a',
  })

  const loadBundled = () => win.loadFile(path.join(__dirname, '../dist/index.html'))

  if (isDev) {
    win.loadURL('http://localhost:5273')
  } else if (DEPLOYED_URL) {
    // Load the same deployed build the phone uses so versions never drift.
    // If it can't be reached (offline / server down), fall back to the bundled
    // build so the app always opens. The service worker caches the shell after
    // the first successful load, so subsequent offline opens work from the URL.
    win.webContents.once('did-fail-load', (_e, errorCode, _desc, validatedURL, isMainFrame) => {
      // -3 is ERR_ABORTED (e.g. normal redirect) — ignore; only fall back for the top frame
      if (isMainFrame && errorCode !== -3 && validatedURL.startsWith(DEPLOYED_URL)) {
        loadBundled()
      }
    })
    win.loadURL(DEPLOYED_URL)
  } else {
    loadBundled()
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── Always-on local file backups ─────────────────────────────────────────────
// Every save also writes rolling backup files under userData/backups, fully
// independent of the renderer, localStorage, and cloud sync:
//   latest.json     — updated on every save (mirror of the live data)
//   last-good.json  — updated only when the data has real content, so an
//                     accidental wipe/empty sync can never overwrite it
//   backup-<timestamp>.json — a history point at most every 10 minutes
//                     (only when meaningful), pruned to the newest 100
const fs = require('fs')

function hasRealContent(d) {
  if (!d) return false
  const counts = [
    d.tasks?.length, d.projects?.length, d.ideas?.length, d.wantList?.length,
    d.deadlines?.length, d.goals?.length, d.journal?.entries?.length,
    d.calendar?.events?.length, d.finance?.subscriptions?.length,
    d.finance?.expenses?.length, d.finance?.moneyTracker?.owed?.length,
    d.finance?.moneyTracker?.incoming?.length, d.watchlist?.games?.length,
    d.watchlist?.shows?.length, d.workouts?.sessions?.length, d.workouts?.logs?.length,
  ]
  if ((d.todos?.categories || []).some((c) => (c.tasks?.length || 0) > 0)) return true
  return counts.some((n) => (n || 0) > 0)
}

let lastHistoryWrite = 0
function writeBackups(data) {
  try {
    const dir = path.join(app.getPath('userData'), 'backups')
    fs.mkdirSync(dir, { recursive: true })
    const json = JSON.stringify(data, null, 2)

    fs.writeFileSync(path.join(dir, 'latest.json'), json)

    if (hasRealContent(data)) {
      fs.writeFileSync(path.join(dir, 'last-good.json'), json)

      const now = Date.now()
      if (now - lastHistoryWrite >= 10 * 60 * 1000) {
        lastHistoryWrite = now
        const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)
        fs.writeFileSync(path.join(dir, `backup-${stamp}.json`), json)
        // prune history to the newest 100 files
        const history = fs.readdirSync(dir)
          .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
          .sort()
        history.slice(0, Math.max(0, history.length - 100)).forEach((f) => {
          try { fs.unlinkSync(path.join(dir, f)) } catch {}
        })
      }
    }
  } catch (e) {
    // Backups must never break saving itself
    console.error('Backup write failed:', e)
  }
}

ipcMain.handle('load-data', () => {
  return store.get('lifeManagerData', null)
})

ipcMain.handle('save-data', (_, data) => {
  store.set('lifeManagerData', data)
  writeBackups(data)
  return true
})

ipcMain.handle('open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }],
  })
  if (canceled || filePaths.length === 0) return null
  const fs = require('fs')
  return fs.readFileSync(filePaths[0], 'utf-8')
})
