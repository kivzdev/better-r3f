import * as React from 'react'
import type * as THREE from 'three'
import { addAfterEffect, addEffect, useThree } from '@react-three/fiber'

export type Mode = 'classic' | 'better'

export const params = new URLSearchParams(location.search)
/** `?record` drops the interactive bits, for GIF recording */
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

/** Numbers the scenes write and the HUD reads. Mutable on purpose: the HUD must not cause renders */
export const stats = {
  gl: null as THREE.WebGLRenderer | null,
  reactRenders: 0,
  allocationsPerFrame: 0,
  hint: '',
}

/** Hands the renderer to the HUD */
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

/** Shows the first line of better-r3f's console hints in the HUD */
export function useHints() {
  React.useEffect(() => {
    stats.hint = ''
    const warn = console.warn
    console.warn = (...args: unknown[]) => {
      const message = String(args[0] ?? '')
      if (message.startsWith('[better-r3f]') && !stats.hint) {
        stats.hint = message.replace('[better-r3f] ', '').split('\n')[0]
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
  /** Sparkline of the last few seconds, scaled to [0, max] (or to the data) */
  graph?: { max?: number; min?: number }
  /** Show the highest value since the last update instead of the latest, for values that blink */
  peak?: boolean
}

export const COLORS = { classic: '#ff8f4a', better: '#3fdc95' }

interface HudProps {
  mode: Mode
  setMode?: (mode: Mode) => void
  labels: Record<Mode, string>
  title: string
  description?: React.ReactNode
  metrics: Metric[]
  /** Show better-r3f console hints */
  hints?: boolean
}

const GRAPH_POINTS = 64
const GRAPH_EVERY = 100
const TEXT_EVERY = 250

export function Hud({ mode, setMode, labels, title, description, metrics, hints }: HudProps) {
  const values = React.useRef<(HTMLSpanElement | null)[]>([])
  const graphs = React.useRef<(HTMLCanvasElement | null)[]>([])
  const hint = React.useRef<HTMLDivElement>(null)
  const color = COLORS[mode]

  React.useEffect(() => {
    const histories = metrics.map(() => [] as number[])
    // Graphs plot the peak of each sample window, so one-frame dips and spikes still show
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
        peaks[i] = Math.max(peaks[i], value)
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
          drawGraph(graphs.current[i], history, metric.graph, color)
        }
      })

      if (writeText && hint.current) {
        hint.current.textContent = stats.hint
        hint.current.style.display = stats.hint ? 'block' : 'none'
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [metrics, color])

  return (
    <>
      <div className={`BetterHud ${recording ? 'recording' : ''}`}>
        <div className="BetterHud-mode">
          {recording || !setMode ? (
            <span className="BetterHud-badge" style={{ color }}>
              <i style={{ background: color }} />
              {labels[mode]}
            </span>
          ) : (
            (['classic', 'better'] as Mode[]).map((option) => (
              <button
                key={option}
                className={option === mode ? 'active' : ''}
                style={option === mode ? { background: COLORS[option] } : undefined}
                onClick={() => setMode(option)}>
                {labels[option]}
              </button>
            ))
          )}
        </div>
        {metrics.map((metric, i) => (
          <div className="BetterHud-metric" key={metric.label}>
            <div className="BetterHud-label">{metric.label}</div>
            <div className="BetterHud-value">
              <span ref={(element) => void (values.current[i] = element)}>–</span>
              {metric.unit && <small>{metric.unit}</small>}
            </div>
            {metric.graph && <canvas ref={(element) => void (graphs.current[i] = element)} width={360} height={52} />}
          </div>
        ))}
        {hints && <div className="BetterHud-hint" ref={hint} style={{ display: 'none' }} />}
      </div>
      {!recording && (
        <div className="BetterHud-caption">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      )}
    </>
  )
}

function drawGraph(
  canvas: HTMLCanvasElement | null,
  history: number[],
  range: { max?: number; min?: number },
  color: string,
) {
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
  context.lineWidth = 3
  context.strokeStyle = color
  context.stroke()
  context.lineTo(x(GRAPH_POINTS - 1), height)
  context.lineTo(x(offset), height)
  context.closePath()
  context.globalAlpha = 0.18
  context.fillStyle = color
  context.fill()
  context.globalAlpha = 1
}

/** A full-screen dark stage for the demos */
export function Stage({ children }: { children: React.ReactNode }) {
  return <div className="BetterStage">{children}</div>
}
