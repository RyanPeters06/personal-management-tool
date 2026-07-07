import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 70
const MAX_PULL = 110
const MIN_SPIN_MS = 500 // avoid an imperceptible flash when the sync is instant/local-only

// Wraps scrollable content with a native-feeling pull-to-refresh gesture.
// Only engages when the wrapped area is scrolled all the way to the top —
// normal scrolling elsewhere is untouched. Calling onRefresh triggers a
// cloud sync pull (reconcile), so an edit made on another device shows up
// here without waiting for the automatic reconcile triggers.
export default function PullToRefresh({ onRefresh, children }) {
  const containerRef = useRef(null)
  const startY = useRef(null)
  const isPulling = useRef(false)
  // Touch handlers read pullRef (always current) rather than the `pull` state
  // directly — touchmove/touchend can fire in the same tick before React has
  // re-rendered and rebound the effect, so a state-only check can see a stale
  // value and miss a fast drag-and-release.
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e) => {
      if (refreshingRef.current) return
      if (el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      } else {
        isPulling.current = false
      }
    }

    const onTouchMove = (e) => {
      if (!isPulling.current || startY.current == null) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        isPulling.current = false
        setDragging(false)
        pullRef.current = 0
        setPull(0)
        return
      }
      // Resist the pull so it doesn't feel like 1:1 finger tracking
      e.preventDefault()
      setDragging(true)
      const next = Math.min(delta * 0.45, MAX_PULL)
      pullRef.current = next
      setPull(next)
    }

    const onTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false
      startY.current = null
      setDragging(false)

      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true
        setRefreshing(true)
        setPull(THRESHOLD)
        const start = Date.now()
        try {
          await onRefresh?.()
        } finally {
          const elapsed = Date.now() - start
          if (elapsed < MIN_SPIN_MS) await new Promise((r) => setTimeout(r, MIN_SPIN_MS - elapsed))
          refreshingRef.current = false
          setRefreshing(false)
          pullRef.current = 0
          setPull(0)
        }
      } else {
        pullRef.current = 0
        setPull(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [onRefresh])

  const indicatorProgress = Math.min(pull / THRESHOLD, 1)

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative overscroll-y-contain">
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{
          top: 0,
          height: 0,
          transform: `translateY(${Math.max(pull - 28, -28)}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
          opacity: pull > 4 || refreshing ? 1 : 0,
        }}
      >
        <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center">
          <RefreshCw
            size={14}
            className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`}
            style={!refreshing ? { transform: `rotate(${indicatorProgress * 220}deg)` } : undefined}
          />
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${refreshing ? THRESHOLD * 0.6 : pull}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
