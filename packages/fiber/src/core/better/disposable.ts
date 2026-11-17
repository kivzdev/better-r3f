import * as React from 'react'

interface DisposableLike {
  type?: string
  dispose(): unknown
}

const isPlainObject = (value: object) => {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Disposes what a resource factory returned: anything with a `dispose()` method, and whatever such
 * things an array or a plain object holds. It doesn't walk into three objects, so disposing a mesh
 * leaves the geometry and material it shares with others alone.
 */
export function disposeValue(value: unknown, seen: WeakSet<object> = new WeakSet()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)

  if (typeof (value as DisposableLike).dispose === 'function') {
    // three removed Scene.dispose(), and R3F never calls it
    if ((value as DisposableLike).type !== 'Scene') (value as DisposableLike).dispose()
  } else if (Array.isArray(value)) {
    for (const item of value) disposeValue(item, seen)
  } else if (isPlainObject(value)) {
    for (const key in value) disposeValue((value as Record<string, unknown>)[key], seen)
  }
}

/**
 * Creates a resource and keeps it while the component is mounted: it is disposed when the component
 * unmounts or a dependency changes. R3F disposes what you declare in JSX on its own, but not objects
 * you create yourself, such as `new THREE.CanvasTexture()` or `new THREE.WebGLRenderTarget()`.
 *
 * ```js
 * const geometry = useDisposable(() => new THREE.TorusKnotGeometry(1, 0.3, segments), [segments])
 * const { texture, material } = useDisposable(() => {
 *   const texture = new THREE.CanvasTexture(canvas)
 *   return { texture, material: new THREE.MeshBasicMaterial({ map: texture }) }
 * }, [canvas])
 * ```
 *
 * In development, StrictMode runs the cleanup once right after mounting. three.js uploads a disposed
 * geometry, material, texture or render target again the next time it is used, so that is harmless.
 */
export function useDisposable<T>(factory: () => T, deps: React.DependencyList = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = React.useMemo(factory, deps)
  React.useEffect(() => () => disposeValue(value), [value])
  return value
}
