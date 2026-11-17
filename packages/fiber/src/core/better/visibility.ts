import type { RootStore } from '../store'
import { now } from './env'

/**
 * Marks a root offscreen or back on screen. The loop skips offscreen roots. Coming back, the paused
 * time is skipped, so the next frame doesn't see one huge delta, and a fresh frame is requested.
 */
export function setOffscreen(store: RootStore, offscreen: boolean): void {
  const state = store.getState()
  if (state.internal.offscreen === offscreen) return
  state.internal.offscreen = offscreen
  if (offscreen) return

  if (state.clock.running) state.clock.oldTime = now()
  state.invalidate()
}

/**
 * Pauses a root while its canvas is scrolled out of view or its tab is hidden. Returns the function
 * that stops watching, or nothing where the canvas can't be watched (workers, native, tests).
 */
export function pauseWhenOffscreen(store: RootStore, canvas: unknown): (() => void) | undefined {
  if (
    typeof IntersectionObserver === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof document === 'undefined' ||
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return undefined
  }

  let intersecting = true
  let hidden = document.hidden === true
  const update = () => setOffscreen(store, !intersecting || hidden)

  const observer = new IntersectionObserver((entries) => {
    intersecting = entries[entries.length - 1].isIntersecting
    update()
  })
  const onVisibilityChange = () => {
    hidden = document.hidden === true
    update()
  }

  observer.observe(canvas)
  document.addEventListener('visibilitychange', onVisibilityChange)
  update()

  return () => {
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    setOffscreen(store, false)
  }
}
