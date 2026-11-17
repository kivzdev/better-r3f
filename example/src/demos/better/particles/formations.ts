import * as THREE from 'three'
import type { FramePool } from '@react-three/fiber'
import { KIVZ, along } from '../shared'
import { REST, SPIN } from '../fluid/particles'
import { rand3, sequence } from './hash'

/**
 * The four particle scenes as formations of the same particles. Each says where every particle is (position, turn,
 * size, colour) at its start and on each frame after, what shape the particles take, and where the camera stands; the
 * page moves the particles from one formation into the next.
 */

export type FormationId = 'fluid' | 'instancing' | 'rerenders' | 'pool'
export type Mode = 'classic' | 'better'

/** every particle's transform and colour, in flat arrays */
export interface Layout {
  n: number
  pos: Float32Array
  rot: Float32Array
  scale: Float32Array
  color: Float32Array
}

export function layout(n: number): Layout {
  const rot = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) rot[i * 4 + 3] = 1
  return {
    n,
    pos: new Float32Array(n * 3),
    rot,
    scale: new Float32Array(n * 3).fill(1),
    color: new Float32Array(n * 3).fill(1),
  }
}

export function copyLayout(from: Layout, to: Layout) {
  to.pos.set(from.pos)
  to.rot.set(from.rot)
  to.scale.set(from.scale)
  to.color.set(from.color)
}

export interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  fov: number
}

export const pose = (): Pose => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fov: 50 })

export interface Context {
  /** how many particles the page has */
  n: number
  aspect: number
  /** the canvas's height in CSS pixels */
  height: number
  mode: Mode
  pool: FramePool
  /** the fluid cloud's middle, in screen heights */
  center: THREE.Vector2
  /** how many particles the fluid has on the graphics card, and its texture's side */
  fluidCount: number
  fluidSide: number
}

export interface Formation {
  id: FormationId
  /** cube, gem, sphere, tile */
  shape: THREE.Vector4
  /** 0 lit, 1 plain colour */
  flat: number
  camera(t: number, ctx: Context, out: Pose): Pose
  /** where everything is at time 0: a move into the formation lands here */
  start(out: Layout, ctx: Context): void
  /** a frame of the formation (t: seconds since it started) */
  update(out: Layout, t: number, dt: number, ctx: Context): void
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _v = new THREE.Vector3()
const _c = new THREE.Color()
const UP = new THREE.Vector3(0, 1, 0)

function look(out: Pose, x: number, y: number, z: number, tx: number, ty: number, tz: number, fov: number) {
  out.position.set(x, y, z)
  _m.lookAt(out.position, _v.set(tx, ty, tz), UP)
  out.quaternion.setFromRotationMatrix(_m)
  out.fov = fov
  return out
}

const setColor = (out: Layout, i: number, color: THREE.Color) => {
  out.color[i * 3] = color.r
  out.color[i * 3 + 1] = color.g
  out.color[i * 3 + 2] = color.b
}

/* ── instancing: a square of cubes rippling out from its middle ──────────────────────────────────────────────── */
export function instancing(n: number): Formation {
  const side = Math.round(Math.sqrt(n))
  const spacing = 1.3
  const cells = Array.from({ length: n }, (_, i) => {
    const x = ((i % side) - (side - 1) / 2) * spacing
    const z = (Math.floor(i / side) - (side - 1) / 2) * spacing
    const distance = Math.hypot(x, z)
    return { x, z, distance, color: along(distance / (side * spacing * 0.7)).clone() }
  })
  const update = (out: Layout, t: number) => {
    for (let i = 0; i < n; i++) {
      const cell = cells[i]
      const height = Math.sin(cell.distance * 0.32 - t * 2.4)
      out.pos[i * 3] = cell.x
      out.pos[i * 3 + 1] = height * 1.3
      out.pos[i * 3 + 2] = cell.z
      out.scale[i * 3] = 1
      out.scale[i * 3 + 1] = 1.6 + height
      out.scale[i * 3 + 2] = 1
      out.rot.fill(0, i * 4, i * 4 + 3)
      out.rot[i * 4 + 3] = 1
      setColor(out, i, cell.color)
    }
  }
  const yaw = new THREE.Quaternion().setFromAxisAngle(UP, 0.13)
  return {
    id: 'instancing',
    shape: new THREE.Vector4(1, 0, 0, 0),
    flat: 0,
    camera(t, _ctx, out) {
      const r = side * 0.7
      look(out, Math.sin(t * 0.1) * r, side * 0.46, Math.cos(t * 0.1) * r, 0, -4, 0, 35)
      // turned a little to the left, so the middle of the ripple sits right of the panel
      out.quaternion.multiply(yaw)
      return out
    },
    start: (out) => update(out, 0),
    update: (out, t) => update(out, t),
  }
}

/* ── re-renders: gems spread over a globe, each spinning ─────────────────────────────────────────────────────── */
export function rerenders(n: number, gems: number): Formation {
  const radius = 9.5
  const golden = Math.PI * (3 - Math.sqrt(5))
  const items = Array.from({ length: gems }, (_, i) => {
    const y = 1 - (i / (gems - 1)) * 2
    const ring = Math.sqrt(1 - y * y)
    const angle = golden * i
    return {
      base: new THREE.Vector3(Math.cos(angle) * ring * radius, y * radius, Math.sin(angle) * ring * radius),
      color: along((1 - y) / 2).clone(),
      speed: 0.6 + ((i * 7919) % 100) / 100,
    }
  })
  const update = (out: Layout, t: number, spin: boolean) => {
    // the globe turns slowly, tilted, right of the panel
    _m.makeRotationFromEuler(_e.set(0.35, t * 0.15, 0.12))
    for (let i = 0; i < n; i++) {
      const g = i % gems
      _v.copy(items[g].base).applyMatrix4(_m)
      out.pos[i * 3] = _v.x + 4.6
      out.pos[i * 3 + 1] = _v.y
      out.pos[i * 3 + 2] = _v.z
      // the extra particles hide inside the gems
      const size = i < gems ? 1 : 0
      out.scale.fill(size, i * 3, i * 3 + 3)
      if (spin) {
        const a = t * items[g].speed
        _q.setFromEuler(_e.set(a, a * 0.7, 0))
        _q.toArray(out.rot, i * 4)
      }
      setColor(out, i, items[g].color)
    }
  }
  return {
    id: 'rerenders',
    shape: new THREE.Vector4(0, 1, 0, 0),
    flat: 0,
    camera: (_t, _ctx, out) => look(out, 0, 0, 27, 0, 0, 0, 50),
    start: (out) => update(out, 0, true),
    // in the r3f version each gem's spin comes from React state instead (World.tsx: StateGem)
    update: (out, t, _dt, ctx) => update(out, t, ctx.mode === 'better'),
  }
}

/* ── frame pool: three swarms, each chasing its own point; four temporary vectors per particle per frame ──────── */
export const allocations = { perFrame: 0 }

export function pool(n: number): Formation {
  const MAX_FORCE = 0.004
  const groups = [
    { color: new THREE.Color(KIVZ.yellow), phase: 0 },
    { color: new THREE.Color(KIVZ.pink), phase: 2.1 },
    { color: new THREE.Color(KIVZ.blue), phase: 4.2 },
  ]
  const targetX = (t: number, g: number) => 2.4 + Math.sin(t * 0.55 + groups[g].phase) * 4.4
  const targetY = (t: number, g: number) => Math.sin(t * 0.8 + groups[g].phase * 1.7) * 2.3
  const targetZ = (t: number, g: number) => Math.cos(t * 0.55 + groups[g].phase) * 3.4
  const random = sequence(7)
  const particles = Array.from({ length: n }, (_, i) => {
    // a seeded scatter round the middle, the same on every visit, so a move into the swarms always lands the same
    const u = random() * 2 - 1
    const a = random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const start = new THREE.Vector3(Math.cos(a) * s, u, Math.sin(a) * s).multiplyScalar(2 + random() * 6)
    start.x += 2.4
    const offset = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize()
    offset.multiplyScalar(0.4 + random() * 1.6)
    return {
      start,
      position: start.clone(),
      velocity: new THREE.Vector3(),
      offset,
      speed: 0.05 + random() * 0.07,
      group: i % groups.length,
    }
  })
  const write = (out: Layout) => {
    for (let i = 0; i < n; i++) {
      const p = particles[i]
      p.position.toArray(out.pos, i * 3)
      out.scale.fill(0.11, i * 3, i * 3 + 3)
      out.rot.fill(0, i * 4, i * 4 + 3)
      out.rot[i * 4 + 3] = 1
      setColor(out, i, groups[p.group].color)
    }
  }
  return {
    id: 'pool',
    shape: new THREE.Vector4(0, 0, 1, 0),
    flat: 0.65,
    camera: (_t, _ctx, out) => look(out, 0, 2.5, 15, 0, 0, 0, 50),
    start(out) {
      for (const p of particles) {
        p.position.copy(p.start)
        p.velocity.set(0, 0, 0)
      }
      write(out)
    },
    update(out, t, _dt, ctx) {
      if (ctx.mode === 'classic') {
        // a new vector for every in-between value: garbage the moment the frame ends
        for (let i = 0; i < n; i++) {
          const { position, velocity, offset, speed, group } = particles[i]
          const target = new THREE.Vector3(targetX(t, group), targetY(t, group), targetZ(t, group)).add(offset)
          const desired = new THREE.Vector3().subVectors(target, position).setLength(speed)
          const steer = new THREE.Vector3().subVectors(desired, velocity).clampLength(0, MAX_FORCE)
          const swirl = new THREE.Vector3(-offset.z, 0, offset.x).setLength(MAX_FORCE * 0.5)
          velocity.add(steer).add(swirl).clampLength(0, speed)
          position.add(velocity)
        }
        allocations.perFrame = n * 4
      } else {
        // the same math with vectors from the frame pool
        const pool = ctx.pool
        const created = pool.stats.created
        for (let i = 0; i < n; i++) {
          const { position, velocity, offset, speed, group } = particles[i]
          const target = pool.vector3(targetX(t, group), targetY(t, group), targetZ(t, group)).add(offset)
          const desired = pool.vector3().subVectors(target, position).setLength(speed)
          const steer = pool.vector3().subVectors(desired, velocity).clampLength(0, MAX_FORCE)
          const swirl = pool.vector3(-offset.z, 0, offset.x).setLength(MAX_FORCE * 0.5)
          velocity.add(steer).add(swirl).clampLength(0, speed)
          position.add(velocity)
        }
        allocations.perFrame = pool.stats.created - created
      }
      write(out)
    },
  }
}

/* ── fluid: the representatives of the graphics card's particles, as plain coloured squares on the screen ─────── */

/** the fluid's camera: the screen is the plane z = 0, this tall */
export const FLUID_FOV = 50
export const FLUID_Z = 15
export const FLUID_HEIGHT = 2 * FLUID_Z * Math.tan(THREE.MathUtils.degToRad(FLUID_FOV / 2))
/** a square's side, in CSS pixels */
export const SQUARE = 2

const YELLOW = new THREE.Color(KIVZ.yellow)
const ORANGE_RED = new THREE.Color('#ff4a1c')
const _h = [0, 0, 0]

/** where fluid particle `j` sits in the cloud at time 0, round `center` (screen heights) */
export function fluidHome(j: number, side: number, center: THREE.Vector2, out: THREE.Vector2) {
  rand3(j % side, Math.floor(j / side), 3, _h)
  const r = Math.sqrt(-2 * Math.log(Math.max(_h[0], 1e-6))) * REST
  const a = _h[1] * Math.PI * 2
  return out.set(center.x + Math.cos(a) * r, center.y + Math.sin(a) * r)
}

/** fluid particle `j`'s colour at `time`, still (the shader's formula) */
export function fluidColor(j: number, side: number, time: number, out: THREE.Color) {
  const x = j % side
  const y = Math.floor(j / side)
  rand3(x, y, 3, _h)
  const r = Math.sqrt(-2 * Math.log(Math.max(_h[0], 1e-6)))
  const seed = rand3(x, y, 5, _h)[0]
  const wave = 0.5 + 0.5 * Math.sin(time * 1.4 - r * 2.8 + seed * 0.9)
  // the shader's colours are written as they are, so mix them as the screen sees them, then hand them over in linear
  out.setRGB(
    THREE.MathUtils.lerp(0.992, 1.0, wave * 0.7),
    THREE.MathUtils.lerp(0.851, 0.29, wave * 0.7),
    THREE.MathUtils.lerp(0.0, 0.11, wave * 0.7),
    THREE.SRGBColorSpace,
  )
  return out
}

/** the fluid particle drawn last on representative i's spot, so on top: the colour you see there */
export const topmost = (i: number, n: number, count: number) => i + n * Math.floor((count - 1 - i) / n)

/** screen heights → the fluid camera's world */
export function toWorld(x: number, y: number, aspect: number, out: THREE.Vector3) {
  return out.set((x - aspect / 2) * FLUID_HEIGHT, (y - 0.5) * FLUID_HEIGHT, 0)
}

export function fluid(n: number): Formation {
  const home = new THREE.Vector2()
  return {
    id: 'fluid',
    shape: new THREE.Vector4(0, 0, 0, 1),
    flat: 1,
    camera: (_t, _ctx, out) => look(out, 0, 0, FLUID_Z, 0, 0, 0, FLUID_FOV),
    start(out, ctx) {
      const size = (SQUARE / ctx.height) * FLUID_HEIGHT
      for (let i = 0; i < n; i++) {
        fluidHome(i, ctx.fluidSide, ctx.center, home)
        toWorld(home.x, home.y, ctx.aspect, _v).toArray(out.pos, i * 3)
        out.scale[i * 3] = size
        out.scale[i * 3 + 1] = size
        out.scale[i * 3 + 2] = size
        out.rot.fill(0, i * 4, i * 4 + 3)
        out.rot[i * 4 + 3] = 1
        setColor(out, i, fluidColor(topmost(i, n, ctx.fluidCount), ctx.fluidSide, 0, _c))
      }
    },
    // while the fluid runs the graphics card draws it; the representatives wait
    update() {},
  }
}

export { YELLOW, ORANGE_RED, SPIN }
