/**
 * Development checks run unless the bundler replaced `process.env.NODE_ENV` with "production".
 * An unbundled browser module has no `process`, which counts as development.
 */
export const isDev: boolean = /* @__PURE__ */ (() => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return true
  }
})()

export const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())
