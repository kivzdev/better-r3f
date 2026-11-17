import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Hud, KIVZ, Stage, params, rate, recording, type Metric } from './shared'

function Knot() {
  const ref = React.useRef<THREE.Mesh>(null!)
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.4
    ref.current.rotation.y += delta * 0.6
  })
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.32, 220, 32]} />
      <meshStandardMaterial color={KIVZ.yellow} roughness={0.35} metalness={0.2} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#191918']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.8} />
      <Knot />
    </>
  )
}

type Renderers = { upstream?: THREE.WebGLRenderer; better?: THREE.WebGLRenderer }

// a plate on kivz.dev's figures: one quiet step up from the ground, rounded, its name in its corner
const plate: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#191918',
}
const tag: React.CSSProperties = { position: 'absolute', left: 16, top: 12, zIndex: 1, color: '#9b9a97', fontSize: 13 }

export default function Offscreen() {
  const scroller = React.useRef<HTMLDivElement>(null!)
  const [renderers] = React.useState<Renderers>({})

  const metrics = React.useMemo<Metric[]>(() => {
    const frames = (which: keyof Renderers) => () => renderers[which]?.info.render.frame ?? 0
    const upstreamFps = rate(frames('upstream'))
    const betterFps = rate(frames('better'))
    // the number is every frame drawn so far; the line, how many a second
    return [
      { label: 'r3f frames', read: frames('upstream'), line: upstreamFps, graph: { max: 60 } },
      { label: 'better-r3f frames', read: frames('better'), line: betterFps, graph: { max: 60 } },
    ]
  }, [renderers])

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
    <Stage>
      <div ref={scroller} className="kz-scroller" style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            height: '62vh',
            margin: recording ? '150px 16px 0' : '120px var(--edge) 0 calc(var(--edge) + 280px + 48px)',
          }}>
          <div style={plate}>
            <span style={tag}>r3f</span>
            <Canvas pauseWhenOffscreen={false} onCreated={({ gl }) => void (renderers.upstream = gl)}>
              <Scene />
            </Canvas>
          </div>
          <div style={plate}>
            <span style={tag}>better-r3f</span>
            <Canvas onCreated={({ gl }) => void (renderers.better = gl)}>
              <Scene />
            </Canvas>
          </div>
        </div>
        <p style={{ height: '160vh', padding: '40vh 28px 0', color: '#565656', textAlign: 'center' }}>
          The canvases are out of view. Only one of them stopped drawing.
        </p>
      </div>
      <Hud
        title="Out of view"
        description="Two canvases with the same knot. r3f draws its canvas on every frame, wherever it is; better-r3f stops while its canvas is scrolled away or its tab is hidden. Scroll down and watch the counts."
        metrics={metrics}
      />
    </Stage>
  )
}
