import * as React from 'react'
import { act } from 'react'
import * as THREE from 'three'
import { createCanvas } from '@react-three/test-renderer/src/createTestCanvas'

import {
  AdaptiveDprController,
  InstanceItem,
  InstanceProxy,
  Instances,
  InstancesMesh,
  ReconcilerRoot,
  RootStore,
  advance,
  createRoot,
  disposeValue,
  extend,
  setWarnings,
  useDisposable,
  useFrame,
} from '../src'
import { auditScene, resetWarnings } from '../src/core/better/warnings'

extend(THREE as any)

let roots: ReconcilerRoot<HTMLCanvasElement>[] = []
let warn: jest.SpyInstance

async function mount(
  element: React.ReactNode,
  config: Parameters<ReconcilerRoot<HTMLCanvasElement>['configure']>[0] = {},
) {
  const root = createRoot(createCanvas())
  roots.push(root)
  let store: RootStore = null!
  await act(async () => {
    await root.configure({ frameloop: 'never', ...config })
    store = root.render(element)
  })
  return { root, store }
}

class Catch extends React.Component<{ onError: (error: Error) => void; children: React.ReactNode }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const warnings = () => warn.mock.calls.map((call) => String(call[0]))

beforeEach(() => {
  resetWarnings()
  setWarnings(true)
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  for (const root of roots) await act(async () => root.unmount())
  roots = []
  warn.mockRestore()
})

describe('frame pool', () => {
  it('hands out reset objects and recycles them every frame', async () => {
    const taken: THREE.Vector3[][] = []
    function Probe() {
      useFrame(({ pool }) => {
        const a = pool.vector3(1, 2, 3)
        const b = pool.vector3()
        taken.push([a, b])
        a.set(9, 9, 9)
        b.set(9, 9, 9)
      })
      return null
    }
    const { store } = await mount(<Probe />)

    await act(async () => advance(1))
    await act(async () => advance(2))

    expect(taken).toHaveLength(2)
    const [[a1, b1], [a2, b2]] = taken
    // The same objects come back next frame...
    expect(a2).toBe(a1)
    expect(b2).toBe(b1)
    expect(a1).not.toBe(b1)
    // ...and the pool stops creating once it is warm
    expect(store.getState().pool.stats.created).toBe(2)
  })

  it('resets each kind of object to its default', async () => {
    const { store } = await mount(null)
    const pool = store.getState().pool

    expect(pool.vector2().toArray()).toEqual([0, 0])
    expect(pool.vector3(1, 2, 3).toArray()).toEqual([1, 2, 3])
    expect(pool.vector4().toArray()).toEqual([0, 0, 0, 1])
    expect(pool.quaternion().toArray()).toEqual([0, 0, 0, 1])
    expect(pool.euler(0, 1, 0, 'YXZ').toArray()).toEqual([0, 1, 0, 'YXZ'])
    expect(pool.matrix3().equals(new THREE.Matrix3())).toBe(true)
    expect(pool.matrix4().equals(new THREE.Matrix4())).toBe(true)
    expect(pool.color().getHex()).toBe(0xffffff)
    expect(pool.color('#ff0000').getHex()).toBe(0xff0000)
    expect(pool.box3().isEmpty()).toBe(true)
    expect(pool.sphere().isEmpty()).toBe(true)
    expect(pool.ray().direction.toArray()).toEqual([0, 0, -1])
    expect(pool.plane().normal.toArray()).toEqual([1, 0, 0])

    pool.reset()
    const dirty = pool.matrix4().makeTranslation(1, 2, 3)
    pool.reset()
    const clean = pool.matrix4()
    expect(clean).toBe(dirty)
    expect(clean.equals(new THREE.Matrix4())).toBe(true)
  })

  it('warns once when it keeps growing between resets', async () => {
    const { store } = await mount(null)
    const pool = store.getState().pool
    for (let i = 0; i < 50000; i++) pool.vector3()
    pool.reset()
    for (let i = 0; i < 50000; i++) pool.vector3()
    expect(warnings().filter((message) => message.includes('Vector3s since the last frame'))).toHaveLength(0)

    for (let i = 0; i <= 100000; i++) pool.vector3()
    pool.reset()
    for (let i = 0; i <= 100000; i++) pool.vector3()
    expect(warnings().filter((message) => message.includes('100000 Vector3s since the last frame'))).toHaveLength(1)
  })
})

describe('useDisposable', () => {
  it('disposes on unmount and when dependencies change', async () => {
    const created: THREE.BufferGeometry[] = []
    const disposed: THREE.BufferGeometry[] = []

    function Shape({ size }: { size: number }) {
      const geometry = useDisposable(() => {
        const geometry = new THREE.BoxGeometry(size, size, size)
        geometry.addEventListener('dispose', () => disposed.push(geometry))
        created.push(geometry)
        return geometry
      }, [size])
      return <mesh geometry={geometry} />
    }

    const { root } = await mount(<Shape size={1} />)
    await act(async () => root.render(<Shape size={1} />))
    expect(created).toHaveLength(1)
    expect(disposed).toHaveLength(0)

    await act(async () => root.render(<Shape size={2} />))
    expect(created).toHaveLength(2)
    expect(disposed).toEqual([created[0]])

    await act(async () => root.render(null))
    expect(disposed).toEqual([created[0], created[1]])
  })

  it('disposes what arrays and plain objects hold, once each', () => {
    const dispose = jest.fn()
    const texture = { dispose }
    const bundle: Record<string, unknown> = { texture, list: [texture, { dispose }], label: 'x', count: 2 }
    bundle.self = bundle

    disposeValue(bundle)
    expect(dispose).toHaveBeenCalledTimes(2)
  })

  it('leaves scenes and plain class instances alone', () => {
    const scene = new THREE.Scene()
    const spy = jest.fn()
    ;(scene as any).dispose = spy
    disposeValue(scene)
    disposeValue(new THREE.Vector3())
    disposeValue(null)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('hot props hint', () => {
  async function commitMoves(times: number, extra: Record<string, unknown> = {}) {
    let move: (x: number) => void = () => {}
    function Mover() {
      const [x, setX] = React.useState(0)
      move = setX
      return <mesh position={[x, 0, 0]} {...extra} />
    }
    const { root } = await mount(<Mover />)
    for (let i = 1; i <= times; i++) await act(async () => move(i))
    return root
  }

  it('warns once when a prop changes through React on most frames', async () => {
    await commitMoves(45)
    const hints = warnings().filter((message) => message.includes('got new'))
    expect(hints).toHaveLength(1)
    expect(hints[0]).toContain('<mesh> in <Mover> got new position from React 20 times')
    expect(hints[0]).toContain('ref.current.position.set(x, y, z)')
  })

  it('stays quiet below the threshold', async () => {
    await commitMoves(19)
    expect(warnings().filter((message) => message.includes('got new'))).toHaveLength(0)
  })

  it('ignores handlers that change on every render', async () => {
    let rerender: () => void = () => {}
    function Clicker() {
      const [, setCount] = React.useState(0)
      rerender = () => setCount((count) => count + 1)
      return <mesh onClick={() => {}} />
    }
    await mount(<Clicker />)
    for (let i = 0; i < 40; i++) await act(async () => rerender())
    expect(warnings().filter((message) => message.includes('got new'))).toHaveLength(0)
  })

  it('can be switched off', async () => {
    setWarnings({ hotProps: false })
    await commitMoves(40)
    expect(warnings().filter((message) => message.includes('got new'))).toHaveLength(0)
  })
})

describe('instancing hint', () => {
  function Boxes({ count, size = 1 }: { count: number; size?: number }) {
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i} position={[i, 0, 0]}>
            <boxGeometry args={[size, size, size]} />
            <meshBasicMaterial />
          </mesh>
        ))}
      </>
    )
  }

  it('suggests <Instances> for many identical meshes', async () => {
    const { store } = await mount(<Boxes count={120} />)
    auditScene(store.getState().scene)
    auditScene(store.getState().scene)

    const hints = warnings().filter((message) => message.includes('draw call'))
    expect(hints).toHaveLength(1)
    expect(hints[0]).toContain('120 meshes use the same BoxGeometry and MeshBasicMaterial')
    expect(hints[0]).toContain('<boxGeometry />')
  })

  it('tells apart geometries with different parameters', async () => {
    const { store } = await mount(
      <>
        <Boxes count={60} size={1} />
        <Boxes count={60} size={2} />
      </>,
    )
    auditScene(store.getState().scene)
    expect(warnings().filter((message) => message.includes('draw call'))).toHaveLength(0)
  })
})

describe('dpr hint', () => {
  it('warns about pixel ratios above 2', async () => {
    await mount(null, { dpr: 3 })
    expect(warnings().filter((message) => message.includes('dpr resolves to 3'))).toHaveLength(1)
  })

  it('stays quiet for the default range', async () => {
    await mount(null)
    expect(warnings().filter((message) => message.includes('dpr resolves'))).toHaveLength(0)
  })
})

describe('Instances', () => {
  const position = (mesh: THREE.InstancedMesh, index: number) => {
    const matrix = new THREE.Matrix4()
    mesh.getMatrixAt(index, matrix)
    return new THREE.Vector3().setFromMatrixPosition(matrix).toArray()
  }
  const colorAt = (mesh: THREE.InstancedMesh, index: number) => {
    const color = new THREE.Color()
    mesh.getColorAt(index, color)
    return color.getHex()
  }

  async function mountInstances(items: { id: number; x: number; color?: string }[], props = {}) {
    const meshRef = React.createRef<InstancesMesh>()
    const itemRefs = new Map<number, InstanceProxy>()
    const scene = (list: typeof items) => (
      <Instances ref={meshRef} limit={4} {...props}>
        <boxGeometry />
        <meshBasicMaterial />
        {list.map((item) => (
          <InstanceItem
            key={item.id}
            ref={(proxy: InstanceProxy | null) => void (proxy && itemRefs.set(item.id, proxy))}
            position={[item.x, 0, 0]}
            color={item.color}
          />
        ))}
      </Instances>
    )
    const { root, store } = await mount(scene(items))
    const sync = () => store.getState().scene.updateMatrixWorld()
    sync()
    return {
      root,
      store,
      mesh: meshRef.current!,
      itemRefs,
      sync,
      rerender: (list: typeof items) => root.render(scene(list)),
    }
  }

  it('draws its items as instances', async () => {
    const { mesh } = await mountInstances([
      { id: 1, x: 1, color: 'red' },
      { id: 2, x: 2 },
      { id: 3, x: 3, color: '#0000ff' },
    ])

    expect(mesh).toBeInstanceOf(THREE.InstancedMesh)
    expect(mesh.count).toBe(3)
    expect(position(mesh, 0)).toEqual([1, 0, 0])
    expect(position(mesh, 1)).toEqual([2, 0, 0])
    expect(position(mesh, 2)).toEqual([3, 0, 0])
    expect(colorAt(mesh, 0)).toBe(0xff0000)
    expect(colorAt(mesh, 1)).toBe(0xffffff)
    expect(colorAt(mesh, 2)).toBe(0x0000ff)
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry)
  })

  it('uploads only what changed', async () => {
    const { mesh, itemRefs, sync } = await mountInstances([
      { id: 1, x: 1 },
      { id: 2, x: 2 },
      { id: 3, x: 3 },
    ])

    // Pretend three uploaded everything
    mesh.instanceMatrix.clearUpdateRanges()
    mesh.instanceColor!.clearUpdateRanges()
    const matrixVersion = mesh.instanceMatrix.version
    const colorVersion = mesh.instanceColor!.version

    sync()
    expect(mesh.instanceMatrix.version).toBe(matrixVersion)
    expect(mesh.instanceColor!.version).toBe(colorVersion)

    itemRefs.get(2)!.position.y = 5
    sync()
    expect(mesh.instanceMatrix.version).toBe(matrixVersion + 1)
    expect(mesh.instanceMatrix.updateRanges).toEqual([{ start: 16, count: 16 }])
    expect(mesh.instanceColor!.version).toBe(colorVersion)
    expect(position(mesh, 1)).toEqual([2, 5, 0])

    // A range three hasn't uploaded yet merges with the next one
    itemRefs.get(3)!.color.set('lime')
    itemRefs.get(1)!.position.y = 1
    sync()
    expect(mesh.instanceMatrix.updateRanges).toEqual([{ start: 0, count: 32 }])
    expect(mesh.instanceColor!.updateRanges).toEqual([{ start: 6, count: 3 }])
  })

  it('keeps a sphere around all instances for culling', async () => {
    const { mesh, itemRefs, sync } = await mountInstances([
      { id: 1, x: 1 },
      { id: 2, x: 2 },
      { id: 3, x: 3 },
    ])
    const contains = (exact: THREE.Sphere) =>
      mesh.boundingSphere!.center.distanceTo(exact.center) + exact.radius <= mesh.boundingSphere!.radius + 1e-6
    const exactSphere = () => {
      const reference = new THREE.InstancedMesh(mesh.geometry, mesh.material, mesh.count)
      ;(reference.instanceMatrix.array as Float32Array).set(
        (mesh.instanceMatrix.array as Float32Array).subarray(0, mesh.count * 16),
      )
      reference.computeBoundingSphere()
      return reference.boundingSphere!
    }

    expect(contains(exactSphere())).toBe(true)

    const far = itemRefs.get(2)!
    far.position.set(40, -8, 3)
    far.rotation.set(0.4, 1.1, 0)
    far.scale.set(3, 0.5, 2)
    sync()
    expect(contains(exactSphere())).toBe(true)
    expect(mesh.boundingSphere!.radius).toBeLessThan(exactSphere().radius * 2)
  })

  it('fills the gap when an item unmounts', async () => {
    const { mesh, rerender, sync } = await mountInstances([
      { id: 1, x: 1 },
      { id: 2, x: 2 },
      { id: 3, x: 3 },
    ])

    await act(async () =>
      rerender([
        { id: 2, x: 2 },
        { id: 3, x: 3 },
      ]),
    )
    sync()

    expect(mesh.count).toBe(2)
    expect([position(mesh, 0), position(mesh, 1)]).toEqual(
      expect.arrayContaining([
        [2, 0, 0],
        [3, 0, 0],
      ]),
    )
  })

  it('respects limit and range', async () => {
    const items = [1, 2, 3, 4, 5, 6].map((id) => ({ id, x: id }))
    const limited = await mountInstances(items)
    expect(limited.mesh.count).toBe(4)

    const ranged = await mountInstances(items, { range: 2 })
    expect(ranged.mesh.count).toBe(2)
  })

  it('measures nested items relative to the mesh', async () => {
    const meshRef = React.createRef<InstancesMesh>()
    const { store } = await mount(
      <Instances ref={meshRef} position={[0, 10, 0]}>
        <boxGeometry />
        <meshBasicMaterial />
        <group position={[5, 0, 0]}>
          <InstanceItem position={[1, 0, 0]} />
        </group>
      </Instances>,
    )
    store.getState().scene.updateMatrixWorld()
    expect(position(meshRef.current!, 0)).toEqual([6, 0, 0])
  })

  it('hit-tests each item where it is drawn', async () => {
    const { mesh, itemRefs, store } = await mountInstances([
      { id: 1, x: -3 },
      { id: 2, x: 3 },
    ])
    store.getState().scene.updateMatrixWorld()

    const raycaster = new THREE.Raycaster(new THREE.Vector3(3, 0, 10), new THREE.Vector3(0, 0, -1))
    const hits: THREE.Intersection[] = []
    itemRefs.get(1)!.raycast(raycaster, hits)
    expect(hits).toHaveLength(0)
    itemRefs.get(2)!.raycast(raycaster, hits)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].object).toBe(itemRefs.get(2))
    expect(hits[0].instanceId).toBe(1)
    expect(mesh.count).toBe(2)
  })

  it('disposes its mesh when it unmounts', async () => {
    const { mesh, root } = await mountInstances([{ id: 1, x: 1 }])
    const onDispose = jest.fn()
    mesh.addEventListener('dispose', onDispose)
    await act(async () => root.render(null))
    expect(onDispose).toHaveBeenCalledTimes(1)
  })

  it('needs an <Instances> parent', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    let caught: Error | undefined
    await mount(
      <Catch onError={(e) => (caught = e)}>
        <InstanceItem />
      </Catch>,
    )
    expect(caught?.message).toContain('has to be rendered inside <Instances>')
    error.mockRestore()
  })
})

describe('pauseWhenOffscreen', () => {
  let observers: { callback: IntersectionObserverCallback; disconnect: jest.Mock; target?: Element }[] = []

  beforeEach(() => {
    observers = []
    ;(globalThis as any).IntersectionObserver = class {
      record: (typeof observers)[number]
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, disconnect: jest.fn() }
        observers.push(this.record)
      }
      observe(target: Element) {
        this.record.target = target
      }
      disconnect() {
        this.record.disconnect()
      }
    }
  })

  afterEach(() => {
    delete (globalThis as any).IntersectionObserver
  })

  const setIntersecting = (isIntersecting: boolean) =>
    act(async () => {
      for (const { callback } of observers) callback([{ isIntersecting } as IntersectionObserverEntry], null!)
    })

  const nextFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))

  it('skips frames while the canvas is out of view', async () => {
    const { store } = await mount(<mesh />, { frameloop: 'demand' })
    const render = jest.spyOn(store.getState().gl, 'render')
    expect(observers).toHaveLength(1)
    // Let the first frame through
    await nextFrame()
    await nextFrame()
    render.mockClear()

    await setIntersecting(false)
    expect(store.getState().internal.offscreen).toBe(true)
    await act(async () => store.getState().invalidate())
    await nextFrame()
    await nextFrame()
    expect(render).not.toHaveBeenCalled()

    // Coming back renders the frame it owes
    await setIntersecting(true)
    expect(store.getState().internal.offscreen).toBe(false)
    await nextFrame()
    await nextFrame()
    expect(render).toHaveBeenCalled()
  })

  it('skips the paused time on the clock', async () => {
    const { store } = await mount(<mesh />, { frameloop: 'demand' })
    const clock = store.getState().clock
    clock.start()
    await setIntersecting(false)
    // Ten seconds out of view
    clock.oldTime -= 10000
    // Synchronously, so no frame runs in between
    for (const { callback } of observers) callback([{ isIntersecting: true } as IntersectionObserverEntry], null!)
    expect(clock.getDelta()).toBeLessThan(1)
  })

  it('can be switched off, and stops watching on unmount', async () => {
    const { root } = await mount(<mesh />, { pauseWhenOffscreen: false })
    expect(observers).toHaveLength(0)

    await act(async () => void (await root.configure({ frameloop: 'never', pauseWhenOffscreen: true })))
    expect(observers).toHaveLength(1)

    await act(async () => root.unmount())
    roots = roots.filter((other) => other !== root)
    expect(observers[0].disconnect).toHaveBeenCalled()
  })
})

describe('adaptiveDpr', () => {
  const run = (controller: AdaptiveDprController, fps: number, seconds: number) => {
    const changes: number[] = []
    for (let t = 0; t < seconds; t += 1 / fps) {
      const dpr = controller.sample(1 / fps)
      if (dpr !== undefined) changes.push(dpr)
    }
    return changes
  }

  // runs fast frames until the ratio steps up (or `seconds` pass): returns how long that took
  const raised = (controller: AdaptiveDprController, seconds: number) => {
    const before = controller.current
    let t = 0
    while (t < seconds && controller.current === before) {
      controller.sample(1 / 60)
      t += 1 / 60
    }
    return controller.current === before ? Infinity : t
  }

  it('steps down while frames are slow, never below min', () => {
    const controller = new AdaptiveDprController({ min: 1, max: 2 })
    run(controller, 60, 1.5)
    expect(controller.current).toBe(2)

    expect(run(controller, 30, 1.6)).toEqual([1.75])
    run(controller, 30, 10)
    expect(controller.current).toBe(1)
  })

  it('steps back up once frames keep up, never above max', () => {
    const controller = new AdaptiveDprController({ min: 1, max: 2 })
    run(controller, 60, 1.5)
    run(controller, 30, 10)
    expect(controller.current).toBe(1)

    run(controller, 60, 3)
    expect(controller.current).toBe(1.25)
    run(controller, 120, 60)
    expect(controller.current).toBe(2)
  })

  it('treats long gaps as pauses, not slow frames', () => {
    const controller = new AdaptiveDprController({ min: 1, max: 2 })
    run(controller, 60, 1.5)
    for (let i = 0; i < 20; i++) controller.sample(5)
    expect(controller.current).toBe(2)
  })

  it('leaves a ratio that just failed alone, longer each time', () => {
    const controller = new AdaptiveDprController({ min: 1, max: 2 })
    run(controller, 60, 1.5)
    run(controller, 30, 1.6)
    expect(controller.current).toBe(1.75)

    // fast at 1.75, so it tries 2, which is too slow
    run(controller, 60, 2.6)
    expect(controller.current).toBe(2)
    run(controller, 30, 2)
    expect(controller.current).toBe(1.75)

    // it doesn't try 2 again for 30 seconds...
    run(controller, 60, 28)
    expect(controller.current).toBe(1.75)
    // ...then once more, and failing again doubles the wait
    expect(raised(controller, 4)).toBeLessThan(4)
    run(controller, 30, 2)
    expect(controller.current).toBe(1.75)
    run(controller, 60, 58)
    expect(controller.current).toBe(1.75)
    expect(raised(controller, 6)).toBeLessThan(6)
  })

  it('forgets a failed ratio once it holds', () => {
    const controller = new AdaptiveDprController({ min: 1, max: 2 })
    run(controller, 60, 1.5)
    run(controller, 30, 1.6)
    run(controller, 60, 2.6)
    run(controller, 30, 2)
    expect(controller.current).toBe(1.75)

    // after the wait, 2 holds this time; a slow spell much later drops it and the climb back is immediate
    run(controller, 60, 40)
    expect(controller.current).toBe(2)
    run(controller, 30, 1.6)
    expect(controller.current).toBe(1.75)
    run(controller, 60, 3)
    expect(controller.current).toBe(2)
  })

  it('holds its ratio across configuration and follows the range', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 })
    const { root, store } = await mount(<mesh />, { adaptiveDpr: true })
    const controller = store.getState().internal.adaptiveDpr!
    expect(controller).toBeInstanceOf(AdaptiveDprController)
    expect(store.getState().viewport.dpr).toBe(2)

    controller.current = 1.5
    await act(async () => store.getState().setDpr(1.5))
    await act(async () => void (await root.configure({ frameloop: 'never', adaptiveDpr: true })))
    expect(store.getState().viewport.dpr).toBe(1.5)

    await act(async () => void (await root.configure({ frameloop: 'never', adaptiveDpr: { max: 1.25 } })))
    expect(store.getState().viewport.dpr).toBe(1.25)

    await act(async () => void (await root.configure({ frameloop: 'never' })))
    expect(store.getState().internal.adaptiveDpr).toBeNull()
    expect(store.getState().viewport.dpr).toBe(2)
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 })
  })
})
