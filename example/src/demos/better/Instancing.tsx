import * as React from 'react'
import * as THREE from 'three'
import { Canvas, InstanceItem, Instances, setWarnings, useFrame } from '@react-three/fiber'
import { GlStats, Hud, Stage, cpuPerFrame, drawCalls, fixed, fps, integer, number, useHints, useMode } from './shared'

// A square grid of cubes that ripples outwards from the middle
const SIDE = Math.round(Math.sqrt(number('count', 10000)))
const SPACING = 1.3
const cells = Array.from({ length: SIDE * SIDE }, (_, i) => {
  const x = ((i % SIDE) - (SIDE - 1) / 2) * SPACING
  const z = (Math.floor(i / SIDE) - (SIDE - 1) / 2) * SPACING
  const distance = Math.hypot(x, z)
  const color = new THREE.Color().setHSL(0.55 + distance * 0.004, 0.85, 0.5)
  return { x, z, distance, color: `#${color.getHexString()}` }
})

function Ripple({ objects }: { objects: React.RefObject<(THREE.Object3D | null)[]> }) {
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < cells.length; i++) {
      const object = objects.current[i]
      if (!object) continue
      const height = Math.sin(cells[i].distance * 0.32 - t * 2.4)
      object.position.y = height * 1.3
      object.scale.y = 1.6 + height
    }
    camera.position.set(Math.sin(t * 0.1) * 70, 46, Math.cos(t * 0.1) * 70)
    camera.lookAt(0, -4, 0)
    // Turn a little to the left, so the middle of the ripple sits right of the HUD
    camera.rotateY(0.13)
  })
  return null
}

/** What most scenes start as: one <mesh> per cube */
function MeshGrid() {
  const objects = React.useRef<(THREE.Object3D | null)[]>([])
  return (
    <>
      {cells.map((cell, i) => (
        <mesh key={i} ref={(object) => void (objects.current[i] = object)} position={[cell.x, 0, cell.z]}>
          <boxGeometry />
          <meshStandardMaterial color={cell.color} />
        </mesh>
      ))}
      <Ripple objects={objects} />
    </>
  )
}

/** The same cubes as one instanced mesh: same props, one draw call */
function InstancedGrid() {
  const objects = React.useRef<(THREE.Object3D | null)[]>([])
  return (
    <Instances limit={cells.length}>
      <boxGeometry />
      <meshStandardMaterial />
      {cells.map((cell, i) => (
        <InstanceItem
          key={i}
          ref={(object) => void (objects.current[i] = object)}
          position={[cell.x, 0, cell.z]}
          color={cell.color}
        />
      ))}
      <Ripple objects={objects} />
    </Instances>
  )
}

const metrics = [
  { label: 'Frames per second', read: fps, graph: { max: 60 } },
  { label: 'CPU time per frame', read: cpuPerFrame, format: fixed(1), unit: 'ms', graph: { max: 16 } },
  { label: 'Draw calls', read: drawCalls },
]

export default function Instancing() {
  const [mode, setMode] = useMode()
  useHints()
  React.useEffect(() => setWarnings({ instancing: true }), [])

  return (
    <Stage>
      <Canvas key={mode} camera={{ position: [70, 46, 70], fov: 35, far: 400 }}>
        <color attach="background" args={['#0d0f14']} />
        <fog attach="fog" args={['#0d0f14', 70, 190]} />
        <hemisphereLight args={['#cfe0ff', '#20142a', 1.3]} />
        <directionalLight position={[20, 40, 10]} intensity={2.6} />
        {mode === 'classic' ? <MeshGrid /> : <InstancedGrid />}
        <GlStats />
      </Canvas>
      <Hud
        mode={mode}
        setMode={setMode}
        labels={{ classic: `<mesh> ×${integer(cells.length)}`, better: '<Instances>' }}
        title={`Instancing: ${integer(cells.length)} cubes`}
        description={
          <>
            One <code>&lt;mesh&gt;</code> per cube is one draw call per cube. <code>&lt;Instances&gt;</code> draws them
            all in one, and uploads only the instances that moved.
          </>
        }
        metrics={metrics}
        hints
      />
    </Stage>
  )
}
