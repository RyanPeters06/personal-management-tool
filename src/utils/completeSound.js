export function playCompleteSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const note = (freq, startAt, duration, vol = 0.28) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt)
      gain.gain.setValueAtTime(0, ctx.currentTime + startAt)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startAt + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
      osc.start(ctx.currentTime + startAt)
      osc.stop(ctx.currentTime + startAt + duration)
    }

    // Ascending C major arpeggio — C5 → E5 → G5, quick and light
    note(523.25, 0,    0.22)   // C5
    note(659.25, 0.07, 0.22)   // E5
    note(783.99, 0.14, 0.32)   // G5
  } catch (_) {}
}
