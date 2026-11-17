import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { GlStats, Hud, Stage, fixed, fps, garbagePerSecond, integer, number, stats, useMode } from './shared'

const COUNT = number('count', 12000)
const MAX_FORCE = 0.004

// Three swarms, each chasing its own point along a looping path
const GROUPS = [
  { color: '#ff9a62', phase: 0 },
  { color: '#5ee0c1', phase: 2.1 },
  { color: '#b98bff', phase: 4.2 },
]
const targetX = (t: number, g: number) => 2.4 + Math.sin(t * 0.55 + GROUPS[g].phase) * 4.4
const targetY = (t: number, g: number) => Math.sin(t * 0.8 + GROUPS[g].phase * 1.7) * 2.3
const targetZ = (t: number, g: number) => Math.cos(t * 0.55 + GROUPS[g].phase) * 3.4

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  /** Where in the swarm this particle wants to be, relative to the swarm's point */
  offset: THREE.Vector3
  speed: number
  group: number
}

function useParticles() {
  return React.useMemo<Particle[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        position: new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 6),
        velocity: new THREE.Vector3(),
        offset: new THREE.Vector3().randomDirection().multiplyScalar(0.4 + Math.random() * 1.6),
        speed: 0.05 + Math.random() * 0.07,
        group: i % GROUPS.length,
      })),
    [],
  )
}

function Swarm({ particles, mesh }: { particles: Particle[]; mesh: React.RefObject<THREE.InstancedMesh> }) {
  React.useLayoutEffect(() => {
    const color = new THREE.Color()
    particles.forEach((particle, i) => mesh.current.setColorAt(i, color.set(GROUPS[particle.group].color)))
    mesh.current.instanceColor!.needsUpdate = true
  }, [particles, mesh])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.055, 8, 6]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.85} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  )
}

function useWriteMatrices(mesh: React.RefObject<THREE.InstancedMesh>) {
  const dummy = React.useMemo(() => new THREE.Object3D(), [])
  return (particles: Particle[]) => {
    for (let i = 0; i < particles.length; i++) {
      dummy.position.copy(particles[i].position)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }
}

/** Steering math with a `new THREE.Vector3()` for every intermediate value */
function AllocatingSwarm() {
  const particles = useParticles()
  const mesh = React.useRef<THREE.InstancedMesh>(null!)
  const write = useWriteMatrices(mesh)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < particles.length; i++) {
      const { position, velocity, offset, speed, group } = particles[i]
      const target = new THREE.Vector3(targetX(t, group), targetY(t, group), targetZ(t, group)).add(offset)
      const desired = new THREE.Vector3().subVectors(target, position).setLength(speed)
      const steer = new THREE.Vector3().subVectors(desired, velocity).clampLength(0, MAX_FORCE)
      const swirl = new THREE.Vector3(-offset.z, 0, offset.x).setLength(MAX_FORCE * 0.5)
      velocity.add(steer).add(swirl).clampLength(0, speed)
      position.add(velocity)
    }
    stats.allocationsPerFrame = particles.length * 4
    write(particles)
  })
  return <Swarm particles={particles} mesh={mesh} />
}

/** The same math with vectors from the frame pool */
function PooledSwarm() {
  const particles = useParticles()
  const mesh = React.useRef<THREE.InstancedMesh>(null!)
  const write = useWriteMatrices(mesh)
  useFrame(({ clock, pool }) => {
    const t = clock.elapsedTime
    const created = pool.stats.created
    for (let i = 0; i < particles.length; i++) {
      const { position, velocity, offset, speed, group } = particles[i]
      const target = pool.vector3(targetX(t, group), targetY(t, group), targetZ(t, group)).add(offset)
      const desired = pool.vector3().subVectors(target, position).setLength(speed)
      const steer = pool.vector3().subVectors(desired, velocity).clampLength(0, MAX_FORCE)
      const swirl = pool.vector3(-offset.z, 0, offset.x).setLength(MAX_FORCE * 0.5)
      velocity.add(steer).add(swirl).clampLength(0, speed)
      position.add(velocity)
    }
    stats.allocationsPerFrame = pool.stats.created - created
    write(particles)
  })
  return <Swarm particles={particles} mesh={mesh} />
}

const metrics = [
  { label: 'Frames per second', read: fps, graph: { max: 60 } },
  { label: 'New Vector3s per frame', read: () => stats.allocationsPerFrame },
  { label: 'Garbage per second', read: garbagePerSecond, format: fixed(1), unit: 'MB', graph: {} },
]

export default function Pool() {
  const [mode, setMode] = useMode()
  return (
    <Stage>
      <Canvas key={mode} camera={{ position: [0, 2.5, 15], fov: 50 }}>
        <color attach="background" args={['#0d0f14']} />
        {mode === 'classic' ? <AllocatingSwarm /> : <PooledSwarm />}
        <GlStats />
      </Canvas>
      <Hud
        mode={mode}
        setMode={setMode}
        labels={{ classic: 'new Vector3()', better: 'pool.vector3()' }}
        title={`Frame pool: ${integer(COUNT)} steering particles`}
        description={
          <>
            Four temporary vectors per particle per frame. With <code>new</code> they are garbage the moment the frame
            ends; <code>state.pool</code> hands the same ones out again next frame.
          </>
        }
        metrics={metrics}
      />
    </Stage>
  )
}
