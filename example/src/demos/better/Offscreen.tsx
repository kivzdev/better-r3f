import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { COLORS, integer, params, rate, recording } from './shared'

function Knot({ color }: { color: string }) {
  const ref = React.useRef<THREE.Mesh>(null!)
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.4
    ref.current.rotation.y += delta * 0.6
  })
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.32, 220, 32]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
    </mesh>
  )
}

function Scene({ color }: { color: string }) {
  return (
    <>
      <color attach="background" args={['#14171f']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.8} />
      <Knot color={color} />
    </>
  )
}

type Renderers = { upstream?: THREE.WebGLRenderer; better?: THREE.WebGLRenderer }

function Counter({ renderers, which, label }: { renderers: Renderers; which: keyof Renderers; label: string }) {
  const count = React.useRef<HTMLSpanElement>(null)
  const perSecond = React.useRef<HTMLSpanElement>(null)
  const status = React.useRef<HTMLSpanElement>(null)
  const color = which === 'better' ? COLORS.better : COLORS.classic

  React.useEffect(() => {
    const frames = () => renderers[which]?.info.render.frame ?? 0
    const fps = rate(frames)
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const current = fps()
      if (now - last < 200) return
      last = now
      count.current!.textContent = integer(frames())
      perSecond.current!.textContent = `${integer(current)} fps`
      const rendering = current > 1
      status.current!.textContent = rendering ? 'rendering' : 'paused'
      status.current!.style.color = rendering ? color : '#8a93a3'
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [renderers, which, color])

  return (
    <div className="BetterHud-metric">
      <div className="BetterHud-label" style={{ color }}>
        {label}
      </div>
      <div className="BetterHud-value">
        <span ref={count}>0</span>
        <small ref={perSecond} />
      </div>
      <div className="BetterHud-label">
        <span ref={status} />
      </div>
    </div>
  )
}

const panel: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  height: '100%',
  borderRadius: 14,
  overflow: 'hidden',
}
const tag: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  top: 10,
  zIndex: 1,
  font: '700 13px/1.2 ui-monospace, Menlo, monospace',
}

export default function Offscreen() {
  const scroller = React.useRef<HTMLDivElement>(null!)
  const [renderers] = React.useState<Renderers>({})

  // ?autoplay scrolls the canvases away and back, for the recording
  React.useEffect(() => {
    if (!params.has('autoplay')) return
    const element = scroller.current
    const timers = [
      setTimeout(() => element.scrollTo({ top: element.clientHeight, behavior: 'smooth' }), 2500),
      setTimeout(() => element.scrollTo({ top: 0, behavior: 'smooth' }), 6500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="BetterStage">
      <div ref={scroller} style={{ position: 'absolute', inset: 0, overflowY: 'auto', color: '#e9edf3' }}>
        <div style={{ display: 'flex', gap: 14, height: '62vh', padding: '0 14px', marginTop: recording ? 150 : 170 }}>
          <div style={panel}>
            <span style={{ ...tag, color: COLORS.classic }}>react-three-fiber</span>
            <Canvas pauseWhenOffscreen={false} onCreated={({ gl }) => void (renderers.upstream = gl)}>
              <Scene color={COLORS.classic} />
            </Canvas>
          </div>
          <div style={panel}>
            <span style={{ ...tag, color: COLORS.better }}>better-r3f</span>
            <Canvas onCreated={({ gl }) => void (renderers.better = gl)}>
              <Scene color={COLORS.better} />
            </Canvas>
          </div>
        </div>
        <div style={{ height: '160vh', padding: '40vh 28px 0', fontSize: 22, color: '#8a93a3', textAlign: 'center' }}>
          The canvases are out of view.
          <br />
          Only one of them stopped drawing.
        </div>
      </div>

      <div className="BetterHud" style={{ width: 'auto', right: 14, display: 'flex', gap: 28, padding: '10px 16px' }}>
        <Counter renderers={renderers} which="upstream" label="react-three-fiber frames" />
        <Counter renderers={renderers} which="better" label="better-r3f frames" />
      </div>
    </div>
  )
}
