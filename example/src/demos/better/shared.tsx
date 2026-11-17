import * as React from 'react'
import * as THREE from 'three'
import { Link, useRoute } from 'wouter'
import { addAfterEffect, addEffect, setWarnings, useThree } from '@react-three/fiber'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './hud.css'

export type Mode = 'classic' | 'better'

// better-r3f's hints print in development builds only; these demos are about them, so they print here too
setWarnings(true)

export const params = new URLSearchParams(location.search)
/** `?record` keeps only the switch and the numbers, for GIF recording */
export const recording = params.has('record')

export const number = (key: string, fallback: number) => {
  const value = Number(params.get(key))
  return params.has(key) && Number.isFinite(value) ? value : fallback
}

export function useMode(fallback: Mode = 'better'): [Mode, (mode: Mode) => void] {
  return React.useState<Mode>(() => {
    const value = params.get('mode')
    return value === 'classic' || value === 'better' ? value : fallback
  })
}

/** the ground every demo stands on: kivz.dev's page colour */
export const GROUND = '#141414'

/** kivz.dev's illustration colours: the mascot's yellow, the doodles' blue and green, Home's pink */
export const KIVZ = {
  yellow: '#fdd900',
  orange: '#ff8a3d',
  pink: '#ff5fa8',
  violet: '#8a6bff',
  blue: '#007afd',
  green: '#55ff5e',
}
const STOPS = [KIVZ.yellow, KIVZ.orange, KIVZ.pink, KIVZ.violet, KIVZ.blue].map((c) => new THREE.Color(c))

/** a colour along yellow → orange → pink → violet → blue, for t in [0, 1] */
export function along(t: number, out = new THREE.Color()) {
  const x = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1)
  const i = Math.floor(x)
  return out.copy(STOPS[i]).lerp(STOPS[i + 1], x - i)
}

/** Numbers the scenes write and the panel reads. Mutable on purpose: the panel must not cause renders */
export const stats = {
  gl: null as THREE.WebGLRenderer | null,
  reactRenders: 0,
  allocationsPerFrame: 0,
  hint: '',
  /** every hint better-r3f printed since the page opened (each prints once) */
  hints: [] as string[],
}

/** Hands the renderer to the panel */
export function GlStats() {
  const gl = useThree((state) => state.gl)
  React.useEffect(() => {
    stats.gl = gl
    return () => {
      if (stats.gl === gl) stats.gl = null
    }
  }, [gl])
  return null
}

/** Shows the first line of better-r3f's console hints in the panel */
export function useHints() {
  React.useEffect(() => {
    stats.hint = ''
    const warn = console.warn
    console.warn = (...args: unknown[]) => {
      const message = String(args[0] ?? '')
      if (message.startsWith('[better-r3f]')) {
        const hint = message.replace('[better-r3f] ', '').split('\n')[0]
        stats.hints.push(hint)
        if (!stats.hint) stats.hint = hint
      }
      warn(...args)
    }
    return () => {
      console.warn = warn
      stats.hint = ''
    }
  }, [])
}

/** Turns a growing counter into a per-second rate over the last second */
export function rate(counter: () => number) {
  const samples: [time: number, count: number][] = []
  return () => {
    const time = performance.now()
    samples.push([time, counter()])
    while (samples.length > 2 && time - samples[0][0] > 1000) samples.shift()
    const [startTime, startCount] = samples[0]
    const elapsed = time - startTime
    return elapsed > 0 ? ((samples[samples.length - 1][1] - startCount) * 1000) / elapsed : 0
  }
}

// Main-thread time R3F spends on a frame: every useFrame callback plus issuing the draw calls
let frameStart = 0
let frameMs = 0
addEffect(() => void (frameStart = performance.now()))
addAfterEffect(() => {
  const ms = performance.now() - frameStart
  frameMs = frameMs ? frameMs * 0.85 + ms * 0.15 : ms
})
export const cpuPerFrame = () => frameMs

let hudFps = 0
export const fps = () => hudFps
export const heapMB = () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1048576

// Garbage: how fast the heap grows between collections, sampled every frame. Collections in
// between drop the heap, and those drops are left out
let lastHeap = 0
let grown = 0
let growthStart = 0
let garbageRate = 0
function sampleHeap(now: number) {
  const heap = (performance as any).memory?.usedJSHeapSize as number | undefined
  if (!heap) return
  if (lastHeap && heap > lastHeap) grown += heap - lastHeap
  lastHeap = heap
  if (!growthStart) growthStart = now
  if (now - growthStart >= 500) {
    garbageRate = grown / ((now - growthStart) / 1000) / 1048576
    grown = 0
    growthStart = now
  }
}
export const garbagePerSecond = () => garbageRate
export const drawCalls = () => stats.gl?.info.render.calls ?? 0
export const gpuGeometries = () => stats.gl?.info.memory.geometries ?? 0
export const gpuTextures = () => stats.gl?.info.memory.textures ?? 0
export const pixelRatio = () => stats.gl?.getPixelRatio() ?? 0
export const framesRendered = () => stats.gl?.info.render.frame ?? 0

export const integer = (value: number) => Math.round(value).toLocaleString('en-US')
export const fixed = (digits: number) => (value: number) => value.toFixed(digits)

export interface Metric {
  label: string
  read: () => number
  format?: (value: number) => string
  unit?: string
  /** A thin line of the last few seconds, scaled to [min, max] (or to the data) */
  graph?: { max?: number; min?: number }
  /** what the line plots, when it isn't the number itself */
  line?: () => number
  /** Show the highest value since the last update instead of the latest, for values that blink */
  peak?: boolean
}

/** The better-r3f demos, in the order the panel lists them */
export const DEMOS = [
  { name: 'BetterFluid', label: 'Fluid' },
  { name: 'BetterInstancing', label: 'Instancing' },
  { name: 'BetterRerenders', label: 'Re-renders' },
  { name: 'BetterPool', label: 'Frame pool' },
  { name: 'BetterOffscreen', label: 'Out of view' },
  { name: 'BetterAdaptiveDpr', label: 'Pixel ratio' },
  { name: 'BetterDispose', label: 'Dispose' },
]

/**
 * One highlight under a group of equal controls (kivz.dev's ui/pill.ts, in CSS): it rests under the active control and
 * glides to whichever one is hovered or focused, a few percent past and back; the control under it is lit, so the
 * colour follows the highlight rather than the pointer.
 */
function usePill(group: React.RefObject<HTMLElement | null>, active: number) {
  React.useLayoutEffect(() => {
    const el = group.current
    if (!el) return
    const pill = el.querySelector<HTMLElement>('.kz-pill')!
    const items = [...el.querySelectorAll<HTMLElement>('[data-pill]')]
    let at = -1
    const go = (i: number, glide = true) => {
      const b = items[i]
      items.forEach((item, j) => item.toggleAttribute('data-on', j === i))
      if (!b) {
        pill.style.opacity = '0'
        at = -1
        return
      }
      pill.style.transition =
        glide && at >= 0
          ? 'transform .5s var(--ease-spring), width .5s var(--ease-spring), height .5s var(--ease-spring), opacity .25s'
          : 'opacity .25s'
      pill.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`
      pill.style.width = `${b.offsetWidth}px`
      pill.style.height = `${b.offsetHeight}px`
      pill.style.opacity = '1'
      at = i
    }
    go(active, false)
    const enter = (e: Event) => go(items.indexOf(e.currentTarget as HTMLElement))
    const leave = () => go(active)
    const blur = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node)) leave()
    }
    for (const item of items) {
      item.addEventListener('pointerenter', enter)
      item.addEventListener('focus', enter)
    }
    el.addEventListener('pointerleave', leave)
    el.addEventListener('focusout', blur)
    // fonts arrive late: keep the highlight on its control
    const ro = new ResizeObserver(() => go(at >= 0 ? at : active, false))
    ro.observe(el)
    return () => {
      for (const item of items) {
        item.removeEventListener('pointerenter', enter)
        item.removeEventListener('focus', enter)
      }
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('focusout', blur)
      ro.disconnect()
    }
  }, [group, active])
}

/** the demos, as kivz.dev's rail lists its sections */
function DemoNav() {
  const [, params] = useRoute('/demo/:name')
  const group = React.useRef<HTMLElement>(null)
  const active = DEMOS.findIndex((demo) => demo.name === params?.name)
  usePill(group, active)
  return (
    <nav ref={group} className="kz-nav kz-pills" aria-label="Demos">
      <span className="kz-pill" aria-hidden />
      {DEMOS.map((demo, i) => (
        <Link
          key={demo.name}
          href={`/demo/${demo.name}`}
          className="kz-btn kz-in"
          data-pill=""
          aria-current={i === active ? 'page' : undefined}
          style={{ '--i': i + 1 } as React.CSSProperties}>
          {demo.label}
        </Link>
      ))}
    </nav>
  )
}

/** r3f or better-r3f: two equal boxes and one highlight, like kivz.dev's language switch */
function Switch({ mode, setMode }: { mode: Mode; setMode?: (mode: Mode) => void }) {
  const group = React.useRef<HTMLDivElement>(null)
  const modes: Mode[] = ['classic', 'better']
  usePill(group, modes.indexOf(mode))
  return (
    <div
      ref={group}
      className="kz-pills kz-switch kz-in"
      role="group"
      aria-label="Version"
      style={{ '--i': 9 } as React.CSSProperties}>
      <span className="kz-pill" aria-hidden />
      {modes.map((option) => (
        <button
          key={option}
          type="button"
          className="kz-btn"
          data-pill=""
          aria-pressed={option === mode}
          tabIndex={setMode ? 0 : -1}
          onClick={() => setMode?.(option)}>
          {option === 'classic' ? 'r3f' : 'better-r3f'}
        </button>
      ))}
    </div>
  )
}

interface HudProps {
  /** the version on screen and how to change it; without them the panel has no switch */
  mode?: Mode
  setMode?: (mode: Mode) => void
  /** what each version does, in code: shown under the switch */
  labels?: Record<Mode, string>
  title: string
  description?: React.ReactNode
  metrics: Metric[]
  /** Show better-r3f console hints: the first one, or the first that matches */
  hints?: boolean | RegExp
}

const GRAPH_POINTS = 64
const GRAPH_EVERY = 100
const TEXT_EVERY = 250

export function Hud({ mode, setMode, labels, title, description, metrics, hints }: HudProps) {
  const values = React.useRef<(HTMLSpanElement | null)[]>([])
  const graphs = React.useRef<(HTMLCanvasElement | null)[]>([])
  const hintBox = React.useRef<HTMLPreElement>(null)
  const hintText = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const histories = metrics.map(() => [] as number[])
    // the lines plot the peak of each sample window, so one-frame dips and spikes still show
    const peaks = metrics.map(() => -Infinity)
    const textPeaks = metrics.map(() => -Infinity)
    let frame = 0
    let windowStart = performance.now()
    let windowFrames = 0
    let lastGraph = 0
    let lastText = 0

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      sampleHeap(now)
      windowFrames++
      if (now - windowStart >= 500) {
        hudFps = (windowFrames * 1000) / (now - windowStart)
        windowStart = now
        windowFrames = 0
      }

      const sampleGraph = now - lastGraph >= GRAPH_EVERY
      const writeText = now - lastText >= TEXT_EVERY
      if (sampleGraph) lastGraph = now
      if (writeText) lastText = now

      metrics.forEach((metric, i) => {
        const value = metric.read()
        peaks[i] = Math.max(peaks[i], metric.line ? metric.line() : value)
        textPeaks[i] = Math.max(textPeaks[i], value)
        if (writeText) {
          const element = values.current[i]
          if (element) element.textContent = (metric.format ?? integer)(metric.peak ? textPeaks[i] : value)
          textPeaks[i] = -Infinity
        }
        if (sampleGraph && metric.graph) {
          const history = histories[i]
          history.push(peaks[i])
          peaks[i] = -Infinity
          if (history.length > GRAPH_POINTS) history.shift()
          drawGraph(graphs.current[i], history, metric.graph)
        }
      })

      if (writeText && hintBox.current && hintText.current) {
        const hint = hints instanceof RegExp ? stats.hints.find((h) => hints.test(h)) ?? '' : stats.hint
        hintText.current.textContent = hint
        hintBox.current.style.display = hint ? 'block' : 'none'
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [metrics, hints])

  return (
    <>
      <aside className={`kz-rail${recording ? ' recording' : ''}`}>
        {!recording && (
          <a className="kz-head kz-in" href="https://github.com/kivzdev/better-r3f" aria-label="better-r3f on GitHub">
            better-r3f
          </a>
        )}
        {!recording && <DemoNav />}
        {mode && (
          <div className="kz-block">
            <Switch mode={mode} setMode={recording ? undefined : setMode} />
            {labels && (
              <div className="kz-code kz-in" style={{ '--i': 10 } as React.CSSProperties}>
                {labels[mode]}
              </div>
            )}
          </div>
        )}
        <div className="kz-metrics">
          {metrics.map((metric, i) => (
            <div className="kz-metric kz-in" key={metric.label} style={{ '--i': 11 + i } as React.CSSProperties}>
              <span>{metric.label}</span>
              {metric.graph ? (
                <canvas ref={(element) => void (graphs.current[i] = element)} width={240} height={28} />
              ) : (
                <i />
              )}
              <span className="kz-value">
                <span ref={(element) => void (values.current[i] = element)}>–</span>
                {metric.unit && <small> {metric.unit}</small>}
              </span>
            </div>
          ))}
        </div>
        {hints && (
          <pre className="kz-hint" ref={hintBox} style={{ display: 'none' }}>
            <b>better-r3f</b>
            {'\n'}
            <span ref={hintText} />
          </pre>
        )}
      </aside>
      {!recording && (
        <header className="kz-caption kz-in" style={{ '--i': 16 } as React.CSSProperties}>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </header>
      )}
    </>
  )
}

/** a thin white line of the last few seconds: no fill, no colour (two text colours only, and this is data) */
function drawGraph(canvas: HTMLCanvasElement | null, history: number[], range: { max?: number; min?: number }) {
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return
  const { width, height } = canvas
  const min = range.min ?? 0
  const max = Math.max(range.max ?? 0, ...history, min + 1e-6)
  context.clearRect(0, 0, width, height)
  const x = (i: number) => (i / (GRAPH_POINTS - 1)) * width
  const y = (value: number) => height - 3 - ((value - min) / (max - min)) * (height - 6)
  const offset = GRAPH_POINTS - history.length
  context.beginPath()
  history.forEach((value, i) => (i ? context.lineTo(x(i + offset), y(value)) : context.moveTo(x(i + offset), y(value))))
  context.lineWidth = 2
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.strokeStyle = 'rgba(234, 234, 233, 0.9)'
  context.stroke()
}

/** A full-screen stage for the demos, on kivz.dev's ground */
export function Stage({ children }: { children: React.ReactNode }) {
  return <div className="BetterStage">{children}</div>
}
