import * as THREE from 'three'
import { warnPoolGrowth } from './warnings'

/** More objects of one kind than this between two resets means the pool isn't being reset */
const GROWTH_WARNING = 100000

class Bucket<T> {
  readonly items: T[] = []
  used = 0

  constructor(readonly name: string, readonly create: () => T) {}

  take(): T {
    const index = this.used++
    if (index < this.items.length) return this.items[index]
    // Only a pool still growing gets here
    if (index === GROWTH_WARNING) warnPoolGrowth(this.name, GROWTH_WARNING)
    return (this.items[index] = this.create())
  }
}

export interface FramePoolStats {
  /** Objects handed out since the last reset */
  used: number
  /** Objects the pool has created in total. It stops growing once the pool is warm */
  created: number
}

/**
 * Scratch math objects for the frame loop. Everything the pool hands out is recycled before the next
 * frame, so `useFrame` callbacks can do vector math without allocating, and the garbage collector
 * has nothing to collect.
 *
 * ```js
 * useFrame(({ pool }, delta) => {
 *   const toTarget = pool.vector3().subVectors(target, ref.current.position).normalize()
 *   ref.current.position.addScaledVector(toTarget, speed * delta)
 * })
 * ```
 *
 * Each call returns a reset object: zero vectors, identity quaternions and matrices, white colors,
 * empty boxes and spheres. Use them within the callback only: to keep a value, copy it into an
 * object you own.
 */
export interface FramePool {
  vector2(x?: number, y?: number): THREE.Vector2
  vector3(x?: number, y?: number, z?: number): THREE.Vector3
  vector4(x?: number, y?: number, z?: number, w?: number): THREE.Vector4
  quaternion(x?: number, y?: number, z?: number, w?: number): THREE.Quaternion
  euler(x?: number, y?: number, z?: number, order?: THREE.EulerOrder): THREE.Euler
  matrix3(): THREE.Matrix3
  matrix4(): THREE.Matrix4
  color(color?: THREE.ColorRepresentation): THREE.Color
  box3(): THREE.Box3
  sphere(): THREE.Sphere
  ray(): THREE.Ray
  plane(): THREE.Plane
  /** Recycles everything handed out so far. The frame loop calls it before each frame */
  reset(): void
  /** How many objects this frame took, and how many the pool holds */
  readonly stats: FramePoolStats
}

class Pool implements FramePool {
  private readonly vector2s = new Bucket('Vector2', () => new THREE.Vector2())
  private readonly vector3s = new Bucket('Vector3', () => new THREE.Vector3())
  private readonly vector4s = new Bucket('Vector4', () => new THREE.Vector4())
  private readonly quaternions = new Bucket('Quaternion', () => new THREE.Quaternion())
  private readonly eulers = new Bucket('Euler', () => new THREE.Euler())
  private readonly matrix3s = new Bucket('Matrix3', () => new THREE.Matrix3())
  private readonly matrix4s = new Bucket('Matrix4', () => new THREE.Matrix4())
  private readonly colors = new Bucket('Color', () => new THREE.Color())
  private readonly box3s = new Bucket('Box3', () => new THREE.Box3())
  private readonly spheres = new Bucket('Sphere', () => new THREE.Sphere())
  private readonly rays = new Bucket('Ray', () => new THREE.Ray())
  private readonly planes = new Bucket('Plane', () => new THREE.Plane())
  private readonly buckets: Bucket<unknown>[] = [
    this.vector2s,
    this.vector3s,
    this.vector4s,
    this.quaternions,
    this.eulers,
    this.matrix3s,
    this.matrix4s,
    this.colors,
    this.box3s,
    this.spheres,
    this.rays,
    this.planes,
  ]

  vector2(x = 0, y = 0): THREE.Vector2 {
    return this.vector2s.take().set(x, y)
  }

  vector3(x = 0, y = 0, z = 0): THREE.Vector3 {
    return this.vector3s.take().set(x, y, z)
  }

  vector4(x = 0, y = 0, z = 0, w = 1): THREE.Vector4 {
    return this.vector4s.take().set(x, y, z, w)
  }

  quaternion(x = 0, y = 0, z = 0, w = 1): THREE.Quaternion {
    return this.quaternions.take().set(x, y, z, w)
  }

  euler(x = 0, y = 0, z = 0, order: THREE.EulerOrder = 'XYZ'): THREE.Euler {
    return this.eulers.take().set(x, y, z, order)
  }

  matrix3(): THREE.Matrix3 {
    return this.matrix3s.take().identity()
  }

  matrix4(): THREE.Matrix4 {
    return this.matrix4s.take().identity()
  }

  color(color?: THREE.ColorRepresentation): THREE.Color {
    const target = this.colors.take()
    return color === undefined ? target.setRGB(1, 1, 1) : target.set(color)
  }

  box3(): THREE.Box3 {
    return this.box3s.take().makeEmpty()
  }

  sphere(): THREE.Sphere {
    const sphere = this.spheres.take()
    sphere.center.set(0, 0, 0)
    sphere.radius = -1
    return sphere
  }

  ray(): THREE.Ray {
    const ray = this.rays.take()
    ray.origin.set(0, 0, 0)
    ray.direction.set(0, 0, -1)
    return ray
  }

  plane(): THREE.Plane {
    const plane = this.planes.take()
    plane.normal.set(1, 0, 0)
    plane.constant = 0
    return plane
  }

  reset(): void {
    for (let i = 0; i < this.buckets.length; i++) this.buckets[i].used = 0
  }

  get stats(): FramePoolStats {
    let used = 0
    let created = 0
    for (let i = 0; i < this.buckets.length; i++) {
      used += this.buckets[i].used
      created += this.buckets[i].items.length
    }
    return { used, created }
  }
}

export function createFramePool(): FramePool {
  return new Pool()
}
