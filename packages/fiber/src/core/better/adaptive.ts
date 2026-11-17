import type { Dpr, RootState } from '../store'
import { calculateDpr } from '../utils'

/** Options for the `adaptiveDpr` prop */
export interface AdaptiveDprOptions {
  /** Lowest pixel ratio it drops to. Default: the low end of `dpr`, 1 for the default `[1, 2]` */
  min?: number
  /** Highest pixel ratio. Default: what `dpr` resolves to on this display */
  max?: number
  /** Frame rate to hold. The ratio drops while frames run below 90% of it. Default: 60 */
  targetFps?: number
  /** How much the ratio changes per step. Default: 0.25 */
  step?: number
}

type ControllerOptions = AdaptiveDprOptions & { min: number; max: number }

/** Seconds of frames averaged into one sample */
const WINDOW = 0.25
/** One second of slow samples lowers the ratio */
const DECLINE_SAMPLES = 4
/** Two seconds of fast samples raise it */
const INCLINE_SAMPLES = 8
/** Seconds ignored after a change, while the canvas resizes and shaders warm up */
const SETTLE = 0.5
/** A drop this soon after a raise means the higher ratio can't hold... */
const FLIP_WINDOW = 3
/** ...so it isn't tried again for this many seconds, twice as long each time it fails again */
const RETRY_AFTER = 30
const RETRY_MAX = 240
/** A longer gap is a pause (offscreen, hidden tab, breakpoint), not a slow frame */
const MAX_DELTA = 0.25

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const round = (value: number) => Math.round(value * 100) / 100

/**
 * Picks the pixel ratio from measured frame times: a second below 90% of the target frame rate steps
 * it down, two seconds at the target step it back up. A ratio that fails right after a step up isn't
 * tried again for a while (30 seconds, then twice as long each time), so it doesn't flicker between
 * two resolutions.
 */
export class AdaptiveDprController {
  min = 1
  max = 2
  step = 0.25
  targetFps = 60
  current: number

  private time = 0
  private windowTime = 0
  private windowFrames = 0
  private samples: number[] = []
  // The first second is loading and shader compilation, not the scene's real frame rate
  private settleUntil = 1
  private raisedAt = -Infinity
  // the lowest ratio that failed right after a step up, and when it may be tried again
  private ceiling = Infinity
  private retryAt = 0
  private retryWait = RETRY_AFTER

  constructor(options: ControllerOptions) {
    this.current = Math.max(options.min, options.max)
    this.configure(options)
  }

  configure({ min, max, step = 0.25, targetFps = 60 }: ControllerOptions): void {
    this.min = min
    this.max = Math.max(min, max)
    this.step = step
    this.targetFps = targetFps
    this.current = round(clamp(this.current, this.min, this.max))
  }

  /** Takes one frame interval in seconds. Returns the new pixel ratio when it changes */
  sample(delta: number): number | undefined {
    if (!(delta > 0) || delta > MAX_DELTA) {
      this.windowTime = this.windowFrames = 0
      return undefined
    }

    this.time += delta
    if (this.time < this.settleUntil) return undefined

    this.windowTime += delta
    this.windowFrames++
    if (this.windowTime < WINDOW) return undefined

    const samples = this.samples
    samples.push(this.windowFrames / this.windowTime)
    if (samples.length > INCLINE_SAMPLES) samples.shift()
    this.windowTime = this.windowFrames = 0

    if (this.current > this.min && this.lastSamples(DECLINE_SAMPLES, 0, this.targetFps * 0.9)) {
      if (this.time - this.raisedAt < FLIP_WINDOW) {
        // the step up didn't hold: leave that ratio alone for a while
        this.ceiling = this.current
        this.retryAt = this.time + this.retryWait
        this.retryWait = Math.min(this.retryWait * 2, RETRY_MAX)
      }
      return this.change(this.current - this.step)
    }

    // a ratio that held this time: whatever stopped it before has gone
    if (this.current >= this.ceiling && this.time - this.raisedAt >= FLIP_WINDOW) {
      this.ceiling = Infinity
      this.retryWait = RETRY_AFTER
    }
    const next = round(this.current + this.step)
    const waiting = next >= this.ceiling - 1e-6 && this.time < this.retryAt
    if (this.current < this.max && !waiting && this.lastSamples(INCLINE_SAMPLES, this.targetFps * 0.97, Infinity)) {
      this.raisedAt = this.time
      return this.change(next)
    }

    return undefined
  }

  /** Whether there are `count` samples and the last `count` are all within [from, to) */
  private lastSamples(count: number, from: number, to: number): boolean {
    const samples = this.samples
    if (samples.length < count) return false
    for (let i = samples.length - count; i < samples.length; i++) {
      if (samples[i] < from || samples[i] >= to) return false
    }
    return true
  }

  private change(next: number): number | undefined {
    const value = round(clamp(next, this.min, this.max))
    this.samples.length = 0
    this.settleUntil = this.time + SETTLE
    if (value === this.current) return undefined
    this.current = value
    return value
  }
}

/**
 * The pixel ratio a root should use: what `dpr` resolves to on this display, or with `adaptiveDpr`
 * on, what the controller picked within that range. Creates, updates or removes the controller.
 */
export function resolveDpr(state: RootState, dpr: Dpr, adaptive: boolean | AdaptiveDprOptions | undefined): number {
  const device = calculateDpr(dpr)
  if (!adaptive) {
    state.internal.adaptiveDpr = null
    return device
  }

  const options = adaptive === true ? {} : adaptive
  const min = options.min ?? (Array.isArray(dpr) ? dpr[0] : Math.min(1, device))
  const max = options.max ?? device
  const controller = state.internal.adaptiveDpr
  if (controller) controller.configure({ ...options, min, max })
  else state.internal.adaptiveDpr = new AdaptiveDprController({ ...options, min, max })
  return state.internal.adaptiveDpr!.current
}
