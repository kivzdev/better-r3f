import * as React from 'react'
import * as THREE from 'three'
import { Canvas, setWarnings, useFrame } from '@react-three/fiber'
import { GlStats, Hud, Stage, fps, integer, number, rate, stats, useHints, useMode } from './shared'

// Gems spread evenly over a globe (a Fibonacci sphere)
const COUNT = number('count', 1600)
const RADIUS = 9.5
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const gems = Array.from({ length: COUNT }, (_, i) => {
  const y = 1 - (i / (COUNT - 1)) * 2
  const ring = Math.sqrt(1 - y * y)
  const angle = GOLDEN_ANGLE * i
  return {
    position: [Math.cos(angle) * ring * RADIUS, y * RADIUS, Math.sin(angle) * ring * RADIUS] as const,
    color: `#${new THREE.Color().setHSL(0.8 - y * 0.16, 0.75, 0.6).getHexString()}`,
    speed: 0.6 + ((i * 7919) % 100) / 100,
  }
})

/** Turns the globe. One object, written in useFrame, in both modes */
function Globe({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<THREE.Group>(null!)
  useFrame((_, delta) => void (ref.current.rotation.y += delta * 0.15))
  return (
    <group ref={ref} position={[4.6, 0, 0]} rotation={[0.35, 0, 0.12]}>
      {children}
    </group>
  )
}

type GemProps = (typeof gems)[number]

/** Spins by setting state every frame: every frame re-renders the component */
function StateGem({ position, color, speed }: GemProps) {
  stats.reactRenders++
  const [angle, setAngle] = React.useState(0)
  useFrame((_, delta) => setAngle((angle) => angle + delta * speed))
  return (
    <mesh position={position} rotation={[angle, angle * 0.7, 0]}>
      <icosahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

StateGem.displayName = 'StateGem'

/** Spins by writing to the object in useFrame: React renders it once */
function RefGem({ position, color, speed }: GemProps) {
  stats.reactRenders++
  const ref = React.useRef<THREE.Mesh>(null!)
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * speed
    ref.current.rotation.y += delta * speed * 0.7
  })
  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

RefGem.displayName = 'RefGem'

const metrics = [
  { label: 'Frames per second', read: fps, graph: { max: 60 } },
  { label: 'React renders per second', read: rate(() => stats.reactRenders) },
]

export default function Rerenders() {
  const [mode, setMode] = useMode()
  useHints()
  // This demo is about re-renders, not the meshes that could be instanced
  React.useEffect(() => setWarnings({ hotProps: true, instancing: false }), [])

  const Gem = mode === 'classic' ? StateGem : RefGem
  return (
    <Stage>
      <Canvas key={mode} camera={{ position: [0, 0, 29], fov: 50 }}>
        <color attach="background" args={['#0d0f14']} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 10, 12]} intensity={2.6} />
        <Globe>
          {gems.map((gem, i) => (
            <Gem key={i} {...gem} />
          ))}
        </Globe>
        <GlStats />
      </Canvas>
      <Hud
        mode={mode}
        setMode={setMode}
        labels={{ classic: 'useState', better: 'useRef' }}
        title={`Re-renders: ${integer(gems.length)} spinning gems`}
        description={
          <>
            Setting state in <code>useFrame</code> re-renders the component 60 times a second. Writing to a ref
            doesn&apos;t render at all. better-r3f spots the first pattern and says how to fix it.
          </>
        }
        metrics={metrics}
        hints
      />
    </Stage>
  )
}
