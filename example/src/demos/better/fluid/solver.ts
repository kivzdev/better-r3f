import * as THREE from 'three'

/**
 * A small Stable Fluids solver on the graphics card (after the one in Kivz Jelly Glass): a velocity field on a grid
 * about 160 cells tall. The pointer pushes it; vorticity confinement keeps its eddies from dying out in the numbers;
 * a pressure solve keeps it incompressible, so what's pushed one way swirls round instead of piling up. Velocities
 * are in grid cells per second.
 */

const DT = 1 / 60

function target() {
  return new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
  })
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

function pass(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader,
    uniforms: { uTexel: { value: new THREE.Vector2(1, 1) }, ...uniforms },
    depthTest: false,
    depthWrite: false,
  })
}

const CURL = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}
`

// vorticity confinement, and the pointer's push: a Gaussian splat of its velocity
const FORCES = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform vec2 uPointer;
uniform vec2 uPointerVel;
uniform float uAspect;
uniform float uRadius;
uniform float uForce;
varying vec2 vUv;
void main() {
  float l = abs(texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
  float r = abs(texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
  float t = abs(texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x);
  float b = abs(texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x);
  float c = texture2D(uCurl, vUv).x;
  vec2 force = vec2(t - b, r - l);
  float len = length(force);
  force = len > 1e-4 ? force / len : vec2(0.0);
  force *= uCurlStrength * c;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy + force * ${DT};
  vec2 d = vUv - uPointer;
  d.x *= uAspect;
  vel += uPointerVel * uForce * ${DT} * exp(-dot(d, d) / uRadius);
  gl_FragColor = vec4(clamp(vel, vec2(-2000.0), vec2(2000.0)), 0.0, 1.0);
}
`

const DIVERGENCE = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`

const FADE = /* glsl */ `
uniform sampler2D uSource;
uniform float uScale;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uSource, vUv) * uScale; }
`

const PRESSURE = /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((l + r + t + b - div) * 0.25, 0.0, 0.0, 1.0);
}
`

const GRADIENT = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uPressure;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(texture2D(uVelocity, vUv).xy - vec2(r - l, t - b), 0.0, 1.0);
}
`

const ADVECT = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
uniform float uDissipation;
varying vec2 vUv;
void main() {
  vec2 back = clamp(vUv - texture2D(uVelocity, vUv).xy * uTexel * ${DT}, 0.0, 1.0);
  gl_FragColor = vec4(texture2D(uVelocity, back).xy / (1.0 + uDissipation * ${DT}), 0.0, 1.0);
}
`

export interface FluidOptions {
  resolution: number
  curl: number
  force: number
  radius: number
  dissipation: number
  iterations: number
}

export class FluidSim {
  width = 1
  height = 1
  private velocity = [target(), target()]
  private pressure = [target(), target()]
  private curl = target()
  private divergence = target()
  private readonly curlPass = pass(CURL, { uVelocity: { value: null } })
  private readonly forcesPass: THREE.ShaderMaterial
  private readonly divergencePass = pass(DIVERGENCE, { uVelocity: { value: null } })
  private readonly fadePass = pass(FADE, { uSource: { value: null }, uScale: { value: 0.8 } })
  private readonly pressurePass = pass(PRESSURE, { uPressure: { value: null }, uDivergence: { value: null } })
  private readonly gradientPass = pass(GRADIENT, { uVelocity: { value: null }, uPressure: { value: null } })
  private readonly advectPass: THREE.ShaderMaterial
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly quad: THREE.Mesh

  constructor(private readonly options: FluidOptions) {
    this.forcesPass = pass(FORCES, {
      uVelocity: { value: null },
      uCurl: { value: null },
      uCurlStrength: { value: options.curl },
      uPointer: { value: new THREE.Vector2(-1, -1) },
      uPointerVel: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uRadius: { value: options.radius * options.radius },
      uForce: { value: options.force },
    })
    this.advectPass = pass(ADVECT, { uVelocity: { value: null }, uDissipation: { value: options.dissipation } })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
    this.quad = new THREE.Mesh(geometry, this.curlPass)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
  }

  /** the velocity field, in grid cells per second */
  get texture() {
    return this.velocity[0].texture
  }

  setSize(aspect: number) {
    const r = this.options.resolution
    const w = Math.max(1, Math.round(aspect >= 1 ? r * aspect : r))
    const h = Math.max(1, Math.round(aspect >= 1 ? r : r / aspect))
    if (w === this.width && h === this.height) return
    this.width = w
    this.height = h
    for (const t of [...this.velocity, ...this.pressure, this.curl, this.divergence]) t.setSize(w, h)
    for (const m of [
      this.curlPass,
      this.forcesPass,
      this.divergencePass,
      this.pressurePass,
      this.gradientPass,
      this.advectPass,
    ]) {
      m.uniforms.uTexel.value.set(1 / w, 1 / h)
    }
    this.forcesPass.uniforms.uAspect.value = w / h
  }

  private draw(gl: THREE.WebGLRenderer, material: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget) {
    this.quad.material = material
    gl.setRenderTarget(to)
    gl.render(this.scene, this.camera)
  }

  private swap(pair: THREE.WebGLRenderTarget[]) {
    const first = pair[0]
    pair[0] = pair[1]
    pair[1] = first
  }

  /** one step; the pointer in uv (0–1, y up) and its velocity in uv per second */
  step(gl: THREE.WebGLRenderer, pointer: THREE.Vector2, pointerVel: THREE.Vector2) {
    const v = this.velocity
    this.curlPass.uniforms.uVelocity.value = v[0].texture
    this.draw(gl, this.curlPass, this.curl)

    const f = this.forcesPass.uniforms
    f.uVelocity.value = v[0].texture
    f.uCurl.value = this.curl.texture
    f.uPointer.value.copy(pointer)
    f.uPointerVel.value.copy(pointerVel)
    this.draw(gl, this.forcesPass, v[1])
    this.swap(v)

    this.divergencePass.uniforms.uVelocity.value = v[0].texture
    this.draw(gl, this.divergencePass, this.divergence)

    const p = this.pressure
    this.fadePass.uniforms.uSource.value = p[0].texture
    this.draw(gl, this.fadePass, p[1])
    this.swap(p)
    this.pressurePass.uniforms.uDivergence.value = this.divergence.texture
    for (let i = 0; i < this.options.iterations; i++) {
      this.pressurePass.uniforms.uPressure.value = p[0].texture
      this.draw(gl, this.pressurePass, p[1])
      this.swap(p)
    }

    this.gradientPass.uniforms.uVelocity.value = v[0].texture
    this.gradientPass.uniforms.uPressure.value = p[0].texture
    this.draw(gl, this.gradientPass, v[1])
    this.swap(v)

    this.advectPass.uniforms.uVelocity.value = v[0].texture
    this.draw(gl, this.advectPass, v[1])
    this.swap(v)
    gl.setRenderTarget(null)
  }

  dispose() {
    for (const t of [...this.velocity, ...this.pressure, this.curl, this.divergence]) t.dispose()
    for (const m of [
      this.curlPass,
      this.forcesPass,
      this.divergencePass,
      this.fadePass,
      this.pressurePass,
      this.gradientPass,
      this.advectPass,
    ]) {
      m.dispose()
    }
    this.quad.geometry.dispose()
  }
}
