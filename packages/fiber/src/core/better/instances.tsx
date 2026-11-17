import * as React from 'react'
import * as THREE from 'three'
import type { ThreeElement } from '../../three-types'
import { useIsomorphicLayoutEffect } from '../utils/react'
import { useDisposable } from './disposable'
import { markInternal } from './warnings'

const _inverse = /* @__PURE__ */ new THREE.Matrix4()
const _relative = /* @__PURE__ */ new THREE.Matrix4()
const _instance = /* @__PURE__ */ new THREE.Matrix4()
const _hits: THREE.Intersection[] = []
let _probe: THREE.Mesh | undefined

/**
 * One instance of an {@link InstancesMesh}. It is an ordinary object in the scene graph, so it takes
 * transforms, children and pointer events like any other, while the mesh it belongs to draws it.
 */
export class InstanceProxy extends THREE.Group {
  readonly isInstanceProxy = true
  /** Multiplies the material color for this instance */
  readonly color = new THREE.Color(1, 1, 1)
  /** Index in the mesh, -1 while detached. Changes when an instance before it unmounts */
  instanceId = -1
  /** The mesh that draws this instance */
  mesh: InstancesMesh | null = null

  // Lets bounds helpers (Box3.setFromObject, drei's <Bounds>) measure the instance
  get geometry(): THREE.BufferGeometry | undefined {
    return this.mesh?.geometry
  }

  // Hit-tests the instance as drawn: the shared geometry at this instance's matrix
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void {
    const mesh = this.mesh
    if (!mesh || this.instanceId < 0 || this.instanceId >= mesh.count) return

    const probe = (_probe ??= new THREE.Mesh())
    probe.geometry = mesh.geometry
    probe.material = mesh.material
    mesh.getMatrixAt(this.instanceId, _instance)
    probe.matrixWorld.multiplyMatrices(mesh.matrixWorld, _instance)
    probe.raycast(raycaster, _hits)

    for (let i = 0; i < _hits.length; i++) {
      const hit = _hits[i]
      hit.instanceId = this.instanceId
      hit.object = this
      intersects.push(hit)
    }
    _hits.length = 0
  }
}

type UpdateRange = { start: number; count: number }

// Marks part of an attribute for upload. Ranges three hasn't uploaded yet, because the mesh was
// culled or its buffer is new, merge into one so they can't pile up
function markRange(attribute: THREE.BufferAttribute, start: number, count: number): void {
  let end = start + count
  const ranges = (attribute as { updateRanges?: UpdateRange[] }).updateRanges
  if (ranges) {
    for (const range of ranges) {
      start = Math.min(start, range.start)
      end = Math.max(end, range.start + range.count)
    }
    attribute.clearUpdateRanges()
    attribute.addUpdateRange(start, end - start)
  } else {
    // three before r159 has one range, where a count of -1 means everything
    const range = (attribute as unknown as { updateRange: { offset: number; count: number } }).updateRange
    if (range.count !== -1) {
      end = Math.max(end, range.offset + range.count)
      start = Math.min(start, range.offset)
    }
    range.offset = start
    range.count = end - start
  }
  attribute.needsUpdate = true
}

// Copies `length` values when any differs, comparing at float32 precision. Returns whether it copied
function copyIfChanged(target: Float32Array, offset: number, source: ArrayLike<number>, length: number): boolean {
  for (let i = 0; i < length; i++) {
    if (target[offset + i] !== Math.fround(source[i])) {
      for (let j = i; j < length; j++) target[offset + j] = source[j]
      return true
    }
  }
  return false
}

/**
 * An InstancedMesh fed by {@link InstanceProxy} objects. Whenever three.js updates world matrices
 * (right before it renders), it copies the proxies' transforms and colors into its instance buffers,
 * and marks only the ranges that changed for upload. A scene where nothing moves uploads nothing.
 */
export class InstancesMesh extends THREE.InstancedMesh {
  readonly isInstancesMesh = true
  /** Draw at most this many instances */
  range = Infinity
  /** The registered instances, in instanceId order */
  readonly proxies: InstanceProxy[] = []

  constructor(limit = 1000) {
    super(undefined, undefined, limit)
    this.count = 0
    this.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(limit * 3).fill(1), 3)
    this.instanceColor.setUsage(THREE.DynamicDrawUsage)
  }

  attachProxy(proxy: InstanceProxy): void {
    if (proxy.mesh === this) return
    proxy.mesh?.detachProxy(proxy)
    proxy.mesh = this
    proxy.instanceId = this.proxies.push(proxy) - 1
  }

  detachProxy(proxy: InstanceProxy): void {
    const index = proxy.instanceId
    if (proxy.mesh !== this || this.proxies[index] !== proxy) return
    // Swap the last instance into the gap, so removal is O(1). The next sync rewrites that slot
    const last = this.proxies.pop()!
    if (last !== proxy) {
      this.proxies[index] = last
      last.instanceId = index
    }
    proxy.mesh = null
    proxy.instanceId = -1
  }

  updateMatrixWorld(force?: boolean): void {
    super.updateMatrixWorld(force)
    this.syncInstances()
  }

  /** Copies the proxies into the instance buffers. Runs by itself as part of every render */
  syncInstances(): void {
    const proxies = this.proxies
    const matrices = this.instanceMatrix.array as Float32Array
    const colors = this.instanceColor!.array as Float32Array
    const count = Math.floor(Math.max(0, Math.min(proxies.length, this.instanceMatrix.count, this.range)))

    let first = count
    let last = -1
    let firstColor = count
    let lastColor = -1
    let inverted = false
    // Bounds of all instances, gathered on the way: where they are, and the largest scale
    let minX = Infinity
    let minY = Infinity
    let minZ = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    let maxZ = -Infinity
    let maxScaleSq = 0

    for (let i = 0; i < count; i++) {
      const proxy = proxies[i]

      // A direct child's local matrix is already relative to this mesh. Anything nested deeper is
      // measured through world space, which super.updateMatrixWorld() just brought up to date
      let elements: number[]
      if (proxy.parent === this) {
        elements = proxy.matrix.elements
      } else {
        if (!inverted) {
          _inverse.copy(this.matrixWorld).invert()
          inverted = true
        }
        elements = _relative.multiplyMatrices(_inverse, proxy.matrixWorld).elements
      }

      if (copyIfChanged(matrices, i * 16, elements, 16)) {
        if (i < first) first = i
        last = i
      }

      const x = elements[12]
      const y = elements[13]
      const z = elements[14]
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
      // The Frobenius norm of the rotation-scale part is never smaller than its largest stretch
      const scaleSq =
        elements[0] * elements[0] +
        elements[1] * elements[1] +
        elements[2] * elements[2] +
        elements[4] * elements[4] +
        elements[5] * elements[5] +
        elements[6] * elements[6] +
        elements[8] * elements[8] +
        elements[9] * elements[9] +
        elements[10] * elements[10]
      if (scaleSq > maxScaleSq) maxScaleSq = scaleSq

      const color = proxy.color
      const offset = i * 3
      if (
        colors[offset] !== Math.fround(color.r) ||
        colors[offset + 1] !== Math.fround(color.g) ||
        colors[offset + 2] !== Math.fround(color.b)
      ) {
        colors[offset] = color.r
        colors[offset + 1] = color.g
        colors[offset + 2] = color.b
        if (i < firstColor) firstColor = i
        lastColor = i
      }
    }

    const geometry = this.geometry
    const boundsChanged = last >= 0 || count !== this.count || geometry !== this.boundsGeometry
    this.count = count
    if (last >= 0) markRange(this.instanceMatrix, first * 16, (last - first + 1) * 16)
    if (lastColor >= 0) markRange(this.instanceColor!, firstColor * 3, (lastColor - firstColor + 1) * 3)

    // Frustum culling and raycasting test one sphere around all instances. three's own
    // computeBoundingSphere() transforms a sphere per instance; this one comes from the numbers
    // gathered above, never smaller than the exact sphere and far cheaper to keep up to date
    if (boundsChanged) {
      this.boundsGeometry = geometry
      this.boundingBox = null
      const sphere = (this.boundingSphere ??= new THREE.Sphere())
      if (count === 0) {
        sphere.makeEmpty()
      } else {
        if (geometry.boundingSphere === null) geometry.computeBoundingSphere()
        const local = geometry.boundingSphere!
        sphere.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
        sphere.radius =
          Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 +
          Math.sqrt(maxScaleSq) * (local.center.length() + local.radius)
      }
    }
  }

  private boundsGeometry: THREE.BufferGeometry | null = null
}

const InstancesContext = /* @__PURE__ */ React.createContext<InstancesMesh | null>(null)

export interface InstancesProps extends Omit<ThreeElement<typeof THREE.InstancedMesh>, 'args' | 'ref' | 'count'> {
  ref?: React.Ref<InstancesMesh>
  /** How many instances it has room for. Changing it rebuilds the mesh. Default: 1000 */
  limit?: number
  /** Draw only the first n instances. Default: all of them */
  range?: number
}

/**
 * Draws all its `<InstanceItem>` children with one draw call. Give it a geometry and a material like a
 * mesh, then place instances as children: each takes position, rotation, scale, color and pointer
 * events. Instances that don't move cost no uploads.
 *
 * ```jsx
 * <Instances limit={points.length}>
 *   <boxGeometry />
 *   <meshStandardMaterial />
 *   {points.map((point) => <InstanceItem key={point.id} position={point.position} color={point.color} />)}
 * </Instances>
 * ```
 */
export function Instances({ ref, limit = 1000, range, children, ...props }: InstancesProps): React.JSX.Element {
  const mesh = useDisposable(() => new InstancesMesh(limit), [limit])
  React.useImperativeHandle(ref, () => mesh, [mesh])

  return (
    <primitive object={mesh} range={range ?? Infinity} {...props}>
      <InstancesContext.Provider value={mesh}>{children}</InstancesContext.Provider>
    </primitive>
  )
}

export type InstanceItemProps = Omit<ThreeElement<typeof InstanceProxy>, 'args' | 'ref'> & {
  ref?: React.Ref<InstanceProxy>
}

/** One instance inside `<Instances>`. Takes the props of a group, plus `color` */
export function InstanceItem({ ref, ...props }: InstanceItemProps): React.JSX.Element {
  const mesh = React.useContext(InstancesContext)
  if (!mesh) throw new Error('better-r3f: <InstanceItem> has to be rendered inside <Instances>')

  const [proxy] = React.useState(() => new InstanceProxy())
  React.useImperativeHandle(ref, () => proxy, [proxy])
  useIsomorphicLayoutEffect(() => {
    mesh.attachProxy(proxy)
    return () => mesh.detachProxy(proxy)
  }, [mesh, proxy])

  return <primitive object={proxy} {...props} />
}

markInternal(Instances)
markInternal(InstanceItem)
