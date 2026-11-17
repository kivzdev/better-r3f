/**
 * The particles' integer hash (PCG 3D), the same as the shaders' `pcg3d`, so the page can tell where a particle on the
 * graphics card is placed and what colour it is without reading it back.
 */
export function rand3(x: number, y: number, z: number, out: number[] = [0, 0, 0]) {
  x = (Math.imul(x, 1664525) + 1013904223) >>> 0
  y = (Math.imul(y, 1664525) + 1013904223) >>> 0
  z = (Math.imul(z, 1664525) + 1013904223) >>> 0
  x = (x + Math.imul(y, z)) >>> 0
  y = (y + Math.imul(z, x)) >>> 0
  z = (z + Math.imul(x, y)) >>> 0
  x = (x ^ (x >>> 16)) >>> 0
  y = (y ^ (y >>> 16)) >>> 0
  z = (z ^ (z >>> 16)) >>> 0
  x = (x + Math.imul(y, z)) >>> 0
  y = (y + Math.imul(z, x)) >>> 0
  z = (z + Math.imul(x, y)) >>> 0
  out[0] = x / 4294967295
  out[1] = y / 4294967295
  out[2] = z / 4294967295
  return out
}

/** a seeded random sequence for the formations' starting points, the same on every visit */
export function sequence(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}
