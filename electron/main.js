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

ipcMain.handle('load-data', () => {
  return store.get('lifeManagerData', null)
})

ipcMain.handle('save-data', (_, data) => {
  store.set('lifeManagerData', data)
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
