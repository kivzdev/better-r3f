import type * as THREE from 'three'
import type { Instance } from '../reconciler'
import type { RootStore } from '../store'
import { isDev, now } from './env'

export interface WarningOptions {
  /** A three object that gets new props from React on most frames */
  hotProps: boolean
  /** Many meshes with the same geometry and material, drawn one call each */
  instancing: boolean
  /** A pixel ratio above 2 */
  dpr: boolean
  /** The frame pool handing out an unusual number of objects within one frame */
  pool: boolean
}

const options: WarningOptions = { hotProps: isDev, instancing: isDev, dpr: isDev, pool: isDev }
const warned = new Set<string>()

/**
 * Turns better-r3f's performance hints on or off, all at once or one by one. They are on in
 * development builds and off in production.
 *
 * ```js
 * setWarnings(false)
 * setWarnings({ instancing: false })
 * ```
 */
export function setWarnings(value: boolean | Partial<WarningOptions>): void {
  if (typeof value === 'boolean') {
    for (const key of Object.keys(options) as (keyof WarningOptions)[]) options[key] = value
  } else {
    Object.assign(options, value)
  }
}

export function warningsEnabled(kind: keyof WarningOptions): boolean {
  return options[kind]
}

export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[better-r3f] ${message}`)
}

/** Forgets which hints were shown, so they can show again */
export function resetWarnings(): void {
  warned.clear()
}

// Components of this library, skipped when naming the component that caused an update
const internals = new WeakSet<object>()
export function markInternal(component: object): void {
  internals.add(component)
}

/* -------------------------------------------------------------------------------------------------
 * Hot props: per-frame values that go through React
 * -----------------------------------------------------------------------------------------------*/

const HOT_WINDOW = 1000
// React under load commits less often than the canvas draws (1,600 components setting state each frame commit
// about 27 times a second on an M4), so the bar sits well below 60
const HOT_COMMITS = 20

interface Heat {
  start: number
  commits: number
  keys: Set<string>
}

const heat = new WeakMap<object, Heat>()

const EXAMPLES: Record<string, string> = {
  position: 'ref.current.position.set(x, y, z)',
  rotation: 'ref.current.rotation.y += delta',
  scale: 'ref.current.scale.setScalar(s)',
  quaternion: 'ref.current.quaternion.copy(q)',
  color: 'ref.current.color.set(color)',
  visible: 'ref.current.visible = visible',
}

type FiberLike = { return?: FiberLike | null; type?: any }

function findOwner(fiber: unknown): string | undefined {
  for (let node = (fiber as FiberLike | null)?.return; node; node = node.return) {
    const type = node.type
    // Function and class components, forwardRef (render) and memo (type)
    const component = typeof type === 'function' ? type : type?.render ?? type?.type
    if (typeof component !== 'function' || internals.has(component) || internals.has(type)) continue
    const name = type.displayName ?? component.displayName ?? component.name
    if (name) return name
  }
  return undefined
}

/**
 * Counts commits that change an object's props. Twenty of them within a second means a value that
 * changes every frame is going through React state, which re-renders the component each time.
 */
export function trackPropUpdate(instance: Instance, changed: Record<string, unknown>, fiber: unknown): void {
  if (!options.hotProps) return

  const time = now()
  let entry = heat.get(instance)
  if (!entry || time - entry.start > HOT_WINDOW) {
    entry = { start: time, commits: 0, keys: new Set() }
    heat.set(instance, entry)
  }

  let moved = false
  for (const key in changed) {
    // Inline handlers are new on every render. Only values count
    if (typeof changed[key] === 'function') continue
    entry.keys.add(key)
    moved = true
  }
  if (!moved || ++entry.commits !== HOT_COMMITS) return

  const owner = findOwner(fiber)
  const element = (instance.object as { isInstanceProxy?: boolean } | null)?.isInstanceProxy
    ? 'InstanceItem'
    : instance.type
  const keys = [...entry.keys].sort()
  const key = keys[0]
  const example = EXAMPLES[key] ?? `ref.current.${key.replace(/-/g, '.')} = value`
  const component = owner ? `<${owner}>` : 'its component'

  warnOnce(
    `hot:${owner}:${element}:${keys.join(',')}`,
    `<${element}>${owner ? ` in <${owner}>` : ''} got new ${keys.join(', ')} from React ${HOT_COMMITS} times ` +
      `within a second. Each update re-renders ${component} and everything below it.\n` +
      `For values that change every frame, write to the object in useFrame instead:\n\n` +
      `  const ref = useRef()\n` +
      `  useFrame((state, delta) => { ${example} })\n` +
      `  <${element} ref={ref} />\n\n` +
      `Silence with setWarnings({ hotProps: false }).`,
  )
}

/* -------------------------------------------------------------------------------------------------
 * Instancing: many identical meshes
 * -----------------------------------------------------------------------------------------------*/

const AUDIT_EVERY = 1000
const AUDIT_MIN_MESHES = 100

const scheduled = new WeakSet<RootStore>()
const geometryKeys = new WeakMap<object, string>()

const jsxName = (type: string) => type.charAt(0).toLowerCase() + type.slice(1)

function meshKey(object: THREE.Object3D): string | undefined {
  const mesh = object as THREE.Mesh & { isInstancedMesh?: boolean; isSkinnedMesh?: boolean }
  if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh || mesh.morphTargetInfluences?.length) return
  const { geometry, material } = mesh
  if (!geometry || !material || Array.isArray(material)) return

  let geometryKey = geometryKeys.get(geometry)
  if (geometryKey === undefined) {
    const parameters = (geometry as { parameters?: object }).parameters
    geometryKey = parameters ? `${geometry.type}${JSON.stringify(parameters)}` : geometry.uuid
    geometryKeys.set(geometry, geometryKey)
  }
  return `${geometryKey}|${material.type}`
}

/** Looks for groups of meshes that could be drawn as one instanced mesh */
export function auditScene(scene: THREE.Object3D | null | undefined): void {
  if (!scene || !options.instancing) return

  const groups = new Map<string, { count: number; geometry: string; material: string }>()
  scene.traverseVisible((object) => {
    const key = meshKey(object)
    if (!key) return
    const group = groups.get(key)
    if (group) {
      group.count++
    } else {
      const mesh = object as THREE.Mesh
      groups.set(key, { count: 1, geometry: mesh.geometry.type, material: (mesh.material as THREE.Material).type })
    }
  })

  for (const [key, { count, geometry, material }] of groups) {
    if (count < AUDIT_MIN_MESHES) continue
    warnOnce(
      `instancing:${key}`,
      `${count} meshes use the same ${geometry} and ${material}, and each one is a separate draw call.\n` +
        `<Instances> draws all of them in one:\n\n` +
        `  <Instances limit={${count}}>\n` +
        `    <${jsxName(geometry)} />\n` +
        `    <${jsxName(material)} />\n` +
        `    {items.map((item) => <InstanceItem key={item.id} position={item.position} color={item.color} />)}\n` +
        `  </Instances>\n\n` +
        `Silence with setWarnings({ instancing: false }).`,
    )
  }
}

/** Audits a root's scene at most once a second while it commits */
export function scheduleSceneAudit(store: RootStore): void {
  if (!options.instancing || scheduled.has(store) || typeof setTimeout !== 'function') return
  scheduled.add(store)
  setTimeout(() => {
    scheduled.delete(store)
    auditScene(store.getState().scene)
  }, AUDIT_EVERY)
}

/* -------------------------------------------------------------------------------------------------
 * Pixel ratio and pool
 * -----------------------------------------------------------------------------------------------*/

export function checkDpr(dpr: number): void {
  if (!options.dpr || dpr <= 2) return
  const pixels = Math.round(dpr * dpr * 100) / 100
  warnOnce(
    'dpr',
    `dpr resolves to ${dpr}, which renders ${pixels}× the pixels of dpr 1 (${
      Math.round((pixels / 4) * 100) / 100
    }× of dpr 2). ` +
      `Few screens look sharper above 2. Cap it with dpr={[1, 2]}, or add adaptiveDpr to lower it whenever frames run slow.\n` +
      `Silence with setWarnings({ dpr: false }).`,
  )
}

export function warnPoolGrowth(type: string, count: number): void {
  if (!options.pool) return
  warnOnce(
    `pool:${type}`,
    `state.pool handed out ${count} ${type}s since the last frame. It recycles them before each frame, so code ` +
      `that takes from it outside the frame loop, or while frameloop="never" without advance(), makes it grow ` +
      `without bound. Keep pooled objects inside the callback that took them, and copy values you want to keep.\n` +
      `Silence with setWarnings({ pool: false }).`,
  )
}
