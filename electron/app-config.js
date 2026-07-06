// Where the packaged desktop app loads its UI from.
//
// Set DEPLOYED_URL to your Vercel URL (e.g. 'https://life-manager.vercel.app')
// so the desktop app always runs the exact same deployed build as the phone —
// deploy once and both are identical. The preload script still injects
// window.electronAPI over the remote page, so the local electron-store copy
// keeps working. If the URL is empty or unreachable, the app falls back to the
// bundled ./dist build so it always opens offline.
//
// Can also be overridden at runtime with the LM_APP_URL env var.
module.exports = {
  DEPLOYED_URL: process.env.LM_APP_URL || '',
}
