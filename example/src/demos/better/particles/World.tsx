import * as React from 'react'
import * as THREE from 'three'
import { useLocation } from 'wouter'
import {
  Canvas,
  InstanceItem,
  Instances,
  useDisposable,
  useFrame,
  useThree,
  type InstanceProxy,
  type InstancesMesh,
} from '@react-three/fiber'
import {
  GROUND,
  GlStats,
  Hud,
  Stage,
  cpuPerFrame,
  drawCalls,
  fixed,
  fps,
  garbagePerSecond,
  integer,
  params,
  pixelRatio,
  rate,
  useHints,
  type Metric,
  type Mode,
} from '../shared'
import { FluidSim } from '../fluid/solver'
import { ParticleFlow } from '../fluid/particles'
import { morphGeometry, morphMaterial } from './material'
import {
  FLUID_HEIGHT,
  SQUARE,
  allocations,
  copyLayout,
  fluid,
  fluidColor,
  instancing,
  layout,
  pool,
  pose,
  rerenders,
  toWorld,
  type Context,
  type Formation,
  type FormationId,
  type Layout,
} from './formations'

/*
 * The particle demos — Fluid, Instancing, Re-renders, Frame pool — are one scene with one set of particles. Going from
 * one to the next doesn't swap pages: every particle travels from where it is to its place in the next formation,
 * turning from a square into a cube, a gem or a ball and taking its new colour on the way, while the camera moves to the
 * next view. Each formation still has its r3f and better-r3f versions, built the way the comparison needs.
 */

export const PARTICLE_DEMOS: Record<string, FormationId> = {
  BetterFluid: 'fluid',
  BetterInstancing: 'instancing',
  BetterRerenders: 'rerenders',
  BetterPool: 'pool',
}
const ORDER: FormationId[] = ['fluid', 'instancing', 'rerenders', 'pool']
const ROUTE: Record<FormationId, string> = {
  fluid: 'BetterFluid',
  instancing: 'BetterInstancing',
  rerenders: 'BetterRerenders',
  pool: 'BetterPool',
}

const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const N = coarse ? 2500 : 10000
const GEMS = coarse ? 700 : 1600
const FLUID_SIDE = coarse ? 256 : 1024

/** React renders, counted for the re-render demo */
export const renders = { count: 0 }

/* ── easing: a cubic Bézier read from a table (kivz.dev's curves) ─────────────────────────────────────────────── */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const table = new Float32Array(257)
  const at = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  let t = 0
  for (let i = 0; i <= 256; i++) {
    const x = i / 256
    while (t < 1 && at(t, x1, x2) < x) t += 1 / 4096
    table[i] = at(t, y1, y2)
  }
  return (x: number) => {
    const f = Math.min(Math.max(x, 0), 1) * 256
    const i = Math.floor(f)
    return i >= 256 ? table[256] : table[i] + (table[i + 1] - table[i]) * (f - i)
  }
}
/** from one place to another: a clear departure, a long soft arrival */
const travel = bezier(0.45, 0, 0.1, 1)
/** a move inside the shot: peak in the middle, long soft tail */
const house = bezier(0.65, 0, 0.1, 1)

/* ── the pointer, in page pixels ───────────────────────────────────────────────────────────────────────────── */
const pointer = { x: 0, y: 0, seen: false, at: 0, out: false }
function trackPointer() {
  const move = (e: PointerEvent) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.seen = true
    pointer.out = false
    pointer.at = performance.now()
  }
  const leave = (e: PointerEvent) => {
    if (!e.relatedTarget) pointer.out = true
  }
  addEventListener('pointermove', move, { passive: true })
  addEventListener('pointerdown', move, { passive: true })
  document.documentElement.addEventListener('pointerleave', leave)
  return () => {
    removeEventListener('pointermove', move)
    removeEventListener('pointerdown', move)
    document.documentElement.removeEventListener('pointerleave', leave)
  }
}

/* ── the fluid on the graphics card: the solver and its million squares ───────────────────────────────────── */
class FluidField {
  readonly sim = new FluidSim({
    resolution: coarse ? 112 : 160,
    curl: 30,
    force: 4800,
    radius: 0.07,
    dissipation: 0.8,
    iterations: 20,
  })
  readonly flow: ParticleFlow
  time = 0
  readonly at = new THREE.Vector2(-1, -1) // the pointer, in screen heights
  // the point the stream follows: the pointer, eased (a fifth of the way each frame at 60 fps, as in The Spirit)
  private readonly follow = new THREE.Vector2(-1, -1)
  private readonly last = new THREE.Vector2()
  private readonly uv = new THREE.Vector2()
  private readonly push = new THREE.Vector2()
  private readonly speed = new THREE.Vector2()

  constructor(gl: THREE.WebGLRenderer, side: number) {
    this.flow = new ParticleFlow(gl, side, 1.6)
  }

  /** the fluid's push follows the pointer's speed, smoothed, and dies away when it stops */
  step(gl: THREE.WebGLRenderer, dt: number, aspect: number, cssHeight: number, center: THREE.Vector2, merge: number) {
    this.sim.setSize(aspect)
    if (this.at.x < 0) this.last.copy(center)
    this.at.copy(center)
    this.speed.lerp(this.push.subVectors(this.at, this.last).divideScalar(Math.max(dt, 1e-4)), 0.35)
    this.speed.multiplyScalar(Math.exp(-6 * dt))
    this.last.copy(this.at)
    this.uv.set(this.at.x / aspect, this.at.y)
    // the push in uv per second (x across the width)
    this.push.set(this.speed.x / aspect, this.speed.y)
    this.sim.step(gl, this.uv, merge > 0 ? this.push.set(0, 0) : this.push)
    if (this.follow.x < 0) this.follow.copy(center)
    this.follow.lerp(center, 1 - Math.exp(-dt * 13))
    // just handed over: every particle still wears its representative's colour, and takes its own over 0.8 s
    const settled = Math.min(this.time / 0.8, 1)
    this.flow.step({
      dt,
      time: this.time,
      aspect,
      follow: this.follow,
      fluid: this.sim.texture,
      fluidScale: 1 / this.sim.height,
      size: SQUARE * gl.getPixelRatio(),
      merge,
      handoff: Math.max(merge, 1 - settled * settled * (3 - 2 * settled)),
    })
    this.time += dt
    void cssHeight
  }

  dispose() {
    this.sim.dispose()
    this.flow.dispose()
  }
}

/** a gem that spins by setting state every frame: the r3f version of the re-render demo */
function StateGem({
  index,
  speed,
  proxies,
}: {
  index: number
  speed: number
  proxies: React.RefObject<(InstanceProxy | null)[]>
}) {
  renders.count++
  const [angle, setAngle] = React.useState(0)
  useFrame((_, delta) => setAngle((a) => a + delta * speed))
  return <InstanceItem ref={(p) => void (proxies.current[index] = p)} rotation={[angle, angle * 0.7, 0]} />
}
StateGem.displayName = 'StateGem'

/** the r3f version of the instancing demo: a <mesh> per cube, following the same layout */
function MeshGrid({ layout }: { layout: Layout }) {
  const meshes = React.useRef<(THREE.Mesh | null)[]>([])
  const colors = React.useMemo(
    () => Array.from({ length: N }, (_, i) => `#${new THREE.Color().fromArray(layout.color, i * 3).getHexString()}`),
    [layout],
  )
  useFrame(() => {
    for (let i = 0; i < N; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      mesh.position.fromArray(layout.pos, i * 3)
      mesh.scale.fromArray(layout.scale, i * 3)
    }
  })
  return (
    <>
      {colors.map((color, i) => (
        <mesh key={i} ref={(m) => void (meshes.current[i] = m)}>
          <boxGeometry />
          <meshStandardMaterial color={color} flatShading roughness={0.6} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

function World({ target, modes }: { target: FormationId; modes: Record<FormationId, Mode> }) {
  const gl = useThree((state) => state.gl)
  const formations = React.useMemo<Record<FormationId, Formation>>(
    () => ({ fluid: fluid(N), instancing: instancing(N), rerenders: rerenders(N, GEMS), pool: pool(N) }),
    [],
  )
  // made by hand, disposed with the scene: the shared geometry and material, and the fluid's buffers
  const geometry = useDisposable(() => morphGeometry(coarse ? 1 : 2), [])
  const material = useDisposable(() => morphMaterial(), [])
  const field = useDisposable(() => new FluidField(gl, FLUID_SIDE), [gl])
  const proxies = React.useRef<(InstanceProxy | null)[]>(new Array(N).fill(null))
  const instances = React.useRef<InstancesMesh>(null)
  const [landed, setLanded] = React.useState<FormationId | null>(null)
  const targetRef = React.useRef(target)
  targetRef.current = target
  const modesRef = React.useRef(modes)
  modesRef.current = modes

  const s = React.useMemo(
    () => ({
      cur: layout(N),
      from: layout(N),
      to: layout(N),
      delay: new Float32Array(N),
      arc: new Float32Array(N),
      xy: new Float32Array(N * 2),
      phase: 'start' as 'start' | 'run' | 'merge' | 'morph',
      formation: null as Formation | null,
      next: null as Formation | null,
      t: 0,
      phaseAt: 0,
      camFrom: pose(),
      camTo: pose(),
      cam: pose(),
      shapeFrom: new THREE.Vector4(),
      shapeTo: new THREE.Vector4(),
      flatFrom: 0,
      flatTo: 0,
      fluidOn: false,
      center: new THREE.Vector2(),
      probe: new THREE.PerspectiveCamera(),
    }),
    [],
  )
  const ctx = React.useMemo<Context>(
    () => ({
      n: N,
      aspect: 1,
      height: 1,
      mode: 'better',
      pool: null!,
      center: s.center,
      fluidCount: FLUID_SIDE ** 2,
      fluidSide: FLUID_SIDE,
    }),
    [s],
  )

  React.useEffect(() => trackPointer(), [])

  const statefulGems = landed === 'rerenders' && modes.rerenders === 'classic'
  const meshGrid = landed === 'instancing' && modes.instancing === 'classic'
  const items = React.useMemo(() => {
    const speedOf = (i: number) => 0.6 + ((i * 7919) % 100) / 100
    return Array.from({ length: N }, (_, i) =>
      statefulGems && i < GEMS ? (
        <StateGem key={`gem${i}`} index={i} speed={speedOf(i)} proxies={proxies} />
      ) : (
        <InstanceItem key={i} ref={(p) => void (proxies.current[i] = p)} />
      ),
    )
  }, [statefulGems])

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime
    const dt = Math.min(delta, 1 / 30)
    const { size, camera, pool } = state
    ctx.aspect = size.width / size.height
    ctx.height = size.height
    ctx.pool = pool

    // where the fluid's cloud sits: the pointer, or a slow wander when nobody's pointing (a phone between touches)
    const rect = gl.domElement.getBoundingClientRect()
    const pointing = pointer.seen && !pointer.out && performance.now() - pointer.at < (coarse ? 2600 : 1e9)
    if (pointing) s.center.set((pointer.x - rect.left) / rect.height, 1 - (pointer.y - rect.top) / rect.height)
    else
      s.center.set(ctx.aspect * 0.6 + Math.sin(now * 0.37) * 0.22 * ctx.aspect * 0.4, 0.5 + Math.sin(now * 0.51) * 0.18)

    const want = formations[targetRef.current]
    const mode = (id: FormationId) => modesRef.current[id]

    const beginMorph = (next: Formation) => {
      copyLayout(s.cur, s.from)
      ctx.mode = 'better'
      next.start(s.to, ctx)
      next.camera(0, ctx, s.camTo)
      s.camFrom.position.copy(camera.position)
      s.camFrom.quaternion.copy(camera.quaternion)
      s.camFrom.fov = (camera as THREE.PerspectiveCamera).fov
      // the particles leave one after another, sweeping left to right across where they'll land
      const probe = s.probe
      probe.fov = s.camTo.fov
      probe.aspect = ctx.aspect
      probe.position.copy(s.camTo.position)
      probe.quaternion.copy(s.camTo.quaternion)
      probe.updateMatrixWorld()
      probe.updateProjectionMatrix()
      const v = pool.vector3()
      for (let i = 0; i < N; i++) {
        v.fromArray(s.to.pos, i * 3).project(probe)
        const jitter = ((i * 2654435761) >>> 0) / 4294967296
        s.delay[i] = 0.5 * THREE.MathUtils.clamp((v.x + 1) / 2, 0, 1) + 0.1 * jitter
        const distance = v.fromArray(s.to.pos, i * 3).distanceTo(pool.vector3().fromArray(s.from.pos, i * 3))
        s.arc[i] = Math.min(distance * 0.16, 3) * (0.5 + jitter)
      }
      s.shapeFrom.copy(material.morph.shape)
      s.flatFrom = material.morph.flat.value
      s.shapeTo.copy(next.shape)
      s.flatTo = next.flat
      s.next = next
      s.phase = 'morph'
      s.phaseAt = now
      setLanded(null)
    }

    const land = (next: Formation) => {
      s.formation = next
      s.phase = 'run'
      s.t = 0
      material.morph.shape.copy(next.shape)
      material.morph.flat.value = next.flat
      if (next.id === 'fluid') {
        // hand over to the graphics card: every fluid particle starts on one of the representatives
        for (let i = 0; i < N; i++) {
          s.xy[i * 2] = s.cur.pos[i * 3] / FLUID_HEIGHT + ctx.aspect / 2
          s.xy[i * 2 + 1] = s.cur.pos[i * 3 + 1] / FLUID_HEIGHT + 0.5
        }
        field.flow.seed(s.xy, N)
        field.time = 0
        s.fluidOn = true
      }
      setLanded(next.id)
    }

    if (s.phase === 'start') {
      want.start(s.cur, ctx)
      want.camera(0, ctx, s.cam)
      land(want)
    } else if (s.phase === 'run' && want !== s.formation) {
      if (s.formation!.id === 'fluid') {
        s.phase = 'merge'
        s.phaseAt = now
      } else beginMorph(want)
    }

    if (s.phase === 'merge') {
      // the million gather onto their representatives, then the page reads those back and carries on with them
      const k = Math.min((now - s.phaseAt) / 0.45, 1)
      field.step(gl, dt, ctx.aspect, ctx.height, s.center, k * k * (3 - 2 * k))
      if (k >= 1) {
        field.flow.read(gl, N, s.xy)
        const square = (SQUARE / ctx.height) * FLUID_HEIGHT
        const color = new THREE.Color()
        const v = new THREE.Vector3()
        for (let i = 0; i < N; i++) {
          toWorld(s.xy[i * 2], s.xy[i * 2 + 1], ctx.aspect, v).toArray(s.cur.pos, i * 3)
          s.cur.scale.fill(square, i * 3, i * 3 + 3)
          s.cur.rot.fill(0, i * 4, i * 4 + 3)
          s.cur.rot[i * 4 + 3] = 1
          fluidColor(i, FLUID_SIDE, color).toArray(s.cur.color, i * 3)
        }
        s.fluidOn = false
        beginMorph(want)
      }
    }

    let rotating = false
    if (s.phase === 'morph') {
      if (want !== s.next) beginMorph(want) // a change of mind on the way: from wherever everything is now
      const p = now - s.phaseAt
      const D = 1.15
      const total = 0.6 + D
      const { from, to, cur } = s
      for (let i = 0; i < N; i++) {
        const e = travel((p - s.delay[i]) / D)
        const lift = Math.sin(Math.PI * e) * s.arc[i]
        for (let c = 0; c < 3; c++) {
          const j = i * 3 + c
          cur.pos[j] = from.pos[j] + (to.pos[j] - from.pos[j]) * e
          cur.scale[j] = from.scale[j] + (to.scale[j] - from.scale[j]) * e
          cur.color[j] = from.color[j] + (to.color[j] - from.color[j]) * e
        }
        cur.pos[i * 3 + 1] += lift
        THREE.Quaternion.slerpFlat(
          cur.rot as unknown as number[],
          i * 4,
          from.rot as unknown as number[],
          i * 4,
          to.rot as unknown as number[],
          i * 4,
          e,
        )
      }
      rotating = true
      const g = house(p / total)
      s.cam.position.lerpVectors(s.camFrom.position, s.camTo.position, g)
      s.cam.quaternion.slerpQuaternions(s.camFrom.quaternion, s.camTo.quaternion, g)
      s.cam.fov = s.camFrom.fov + (s.camTo.fov - s.camFrom.fov) * g
      const k = THREE.MathUtils.smoothstep(g, 0.15, 0.85)
      material.morph.shape.lerpVectors(s.shapeFrom, s.shapeTo, k)
      material.morph.flat.value = s.flatFrom + (s.flatTo - s.flatFrom) * k
      if (p >= total) land(s.next!)
    }

    if (s.phase === 'run') {
      const f = s.formation!
      ctx.mode = mode(f.id)
      if (f.id === 'fluid') field.step(gl, dt, ctx.aspect, ctx.height, s.center, 0)
      else f.update(s.cur, s.t, dt, ctx)
      rotating = f.id === 'rerenders'
      f.camera(s.t, ctx, s.cam)
      s.t += dt
    }

    // the camera
    const cam = camera as THREE.PerspectiveCamera
    cam.position.copy(s.cam.position)
    cam.quaternion.copy(s.cam.quaternion)
    if (cam.fov !== s.cam.fov || cam.aspect !== ctx.aspect) {
      cam.fov = s.cam.fov
      cam.aspect = ctx.aspect
      cam.updateProjectionMatrix()
    }

    // the particles: what's drawn by the instanced mesh follows the layout
    field.flow.points.visible = s.fluidOn
    if (instances.current) instances.current.visible = !s.fluidOn && !(meshGrid && s.phase === 'run')
    if (!s.fluidOn) {
      const skip = statefulGems && s.phase === 'run' ? GEMS : 0
      const { pos, rot, scale, color } = s.cur
      const list = proxies.current
      for (let i = 0; i < N; i++) {
        const proxy = list[i]
        if (!proxy) continue
        proxy.position.fromArray(pos, i * 3)
        proxy.scale.fromArray(scale, i * 3)
        proxy.color.fromArray(color, i * 3)
        if (rotating && i >= skip) proxy.quaternion.fromArray(rot, i * 4)
      }
    }
  })

  return (
    <>
      <hemisphereLight args={['#fff6e0', '#1d1d24', 1.6]} />
      <directionalLight position={[20, 40, 10]} intensity={2.2} />
      <Instances ref={instances} limit={N} geometry={geometry} material={material} frustumCulled={false}>
        {items}
      </Instances>
      {meshGrid && <MeshGrid layout={s.cur} />}
      <primitive object={field.flow.points} />
    </>
  )
}

/* ── the panels ─────────────────────────────────────────────────────────────────────────────────────────────── */
const rendersPerSecond = rate(() => renders.count)
const PANELS: Record<
  FormationId,
  { title: string; description: React.ReactNode; labels: Record<Mode, string>; metrics: Metric[]; hints?: RegExp }
> = {
  fluid: {
    title: `Fluid: ${integer(FLUID_SIDE ** 2)} particles`,
    description: (
      <>
        A million squares stream from the pointer on a drifting curl current, as in Edan Kwan’s The Spirit: born yellow,
        orange-red as they age, and swept into eddies by the fluid the pointer stirs. Every square is the same; only its
        colour moves.
      </>
    ),
    labels: { classic: 'dpr={[1, 2]}', better: 'adaptiveDpr' },
    metrics: [
      { label: 'Frames a second', read: fps, graph: { max: 60 } },
      { label: 'Pixel ratio', read: pixelRatio, format: fixed(2), graph: { min: 0.5, max: 2 } },
      { label: 'Time a frame', read: cpuPerFrame, format: fixed(1), unit: 'ms' },
      { label: 'Particles', read: () => FLUID_SIDE ** 2 },
    ],
  },
  instancing: {
    title: `Instancing: ${integer(N)} cubes`,
    description: (
      <>
        One <code>&lt;mesh&gt;</code> per cube is a draw call per cube. <code>&lt;Instances&gt;</code> draws them all in
        one, and uploads only the cubes that moved.
      </>
    ),
    labels: { classic: `<mesh> ×${integer(N)}`, better: '<Instances>' },
    metrics: [
      { label: 'Frames a second', read: fps, graph: { max: 60 } },
      { label: 'Time a frame', read: cpuPerFrame, format: fixed(1), unit: 'ms', graph: { max: 16 } },
      { label: 'Draw calls', read: drawCalls },
    ],
    hints: /meshes use the same BoxGeometry/,
  },
  rerenders: {
    title: `Re-renders: ${integer(GEMS)} spinning gems`,
    description: (
      <>
        Setting state in <code>useFrame</code> renders the component again 60 times a second; writing to a ref doesn’t
        render at all. better-r3f spots the first and says how to fix it.
      </>
    ),
    labels: { classic: 'useState', better: 'useRef' },
    metrics: [
      { label: 'Frames a second', read: fps, graph: { max: 60 } },
      { label: 'Renders a second', read: rendersPerSecond },
    ],
    hints: /got new rotation from React/,
  },
  pool: {
    title: `Frame pool: ${integer(N)} steering particles`,
    description: (
      <>
        Four temporary vectors per particle per frame. Made with <code>new</code>, they’re garbage the moment the frame
        ends; <code>state.pool</code> hands the same ones out again on the next.
      </>
    ),
    labels: { classic: 'new Vector3()', better: 'pool.vector3()' },
    metrics: [
      { label: 'Frames a second', read: fps, graph: { max: 60 } },
      { label: 'New vectors', read: () => allocations.perFrame, unit: 'a frame' },
      { label: 'Garbage', read: garbagePerSecond, format: fixed(1), unit: 'MB/s', graph: {} },
    ],
  },
}

export default function ParticleDemos({ name }: { name: string }) {
  const id = PARTICLE_DEMOS[name] ?? 'fluid'
  const [, setLocation] = useLocation()
  const [modes, setModes] = React.useState<Record<FormationId, Mode>>(() => {
    const value = params.get('mode')
    const initial: Mode = value === 'classic' ? 'classic' : 'better'
    return { fluid: 'better', instancing: 'better', rerenders: 'better', pool: 'better', [id]: initial }
  })
  useHints()

  // ?tour walks through the four, a few seconds each (the README's first GIF)
  React.useEffect(() => {
    if (!params.has('tour')) return
    const next = ORDER[(ORDER.indexOf(id) + 1) % ORDER.length]
    const timer = setTimeout(
      () => setLocation(`/demo/${ROUTE[next]}${location.search}`),
      Number(params.get('tour')) || 3400,
    )
    return () => clearTimeout(timer)
  }, [id, setLocation])

  const panel = PANELS[id]
  return (
    <Stage>
      <Canvas
        dpr={[1, 2]}
        adaptiveDpr={id === 'fluid' && modes.fluid === 'better' ? { min: 0.75 } : false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 50, position: [0, 0, 15], near: 0.1, far: 600 }}>
        <color attach="background" args={[GROUND]} />
        <World target={id} modes={modes} />
        <GlStats />
      </Canvas>
      <Hud
        mode={modes[id]}
        setMode={(mode) => setModes((m) => ({ ...m, [id]: mode }))}
        labels={panel.labels}
        title={panel.title}
        description={panel.description}
        metrics={panel.metrics}
        hints={panel.hints}
      />
    </Stage>
  )
}
