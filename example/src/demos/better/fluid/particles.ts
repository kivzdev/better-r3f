import * as THREE from 'three'
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js'

/**
 * A crowd of small square particles carried by the fluid. Each one has a place in a slowly turning cloud round the
 * pointer and is pulled towards it, but it also drags along with the fluid around it, so when the pointer moves the
 * cloud is swept into eddies and comes apart, then gathers again. All of them are drawn the same: opaque, the same
 * size; only their colour moves, between the kivz.dev mascot's yellow and an orange-red.
 *
 * Positions are in screen heights (x from 0 to the aspect ratio, y from 0 to 1), so distances are the same both ways.
 *
 * The page's other particle scenes hand over to this one and take over from it: `seed` starts every particle on one of
 * a few thousand "representatives" (particle j on representative j mod n), and `merge` pulls them back onto those
 * representatives so the page can read their positions and carry on with fewer particles.
 */

export const REST = 0.12 // the cloud's spread, in screen heights
export const SPIN = 0.32 // how fast it turns, near the middle

const HASH = /* glsl */ `
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 rand3(uvec3 v) { return vec3(pcg3d(v)) * (1.0 / 4294967295.0); }

/* a particle's place in the cloud: a Gaussian spread round the pointer, turning, faster near the middle */
vec3 place(ivec2 ij, float time) {
  vec3 h = rand3(uvec3(uvec2(ij), 3u));
  float r = sqrt(-2.0 * log(max(h.x, 1e-6))) * ${REST};
  float a = h.y * 6.2831853 + time * ${SPIN} / (0.35 + r / ${REST});
  return vec3(cos(a) * r, sin(a) * r, r);
}
`

const VELOCITY = /* glsl */ `
uniform sampler2D uFluid;
uniform float uFluidScale;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDt;
uniform float uMerge;
uniform int uReps;
uniform int uSideI;
${HASH}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec4 V = texelFetch(textureVel, ij, 0);
  vec2 home = uPointer + place(ij, uTime).xy;
  if (uMerge > 0.0) {
    // gathering onto the representatives
    int rep = (ij.y * uSideI + ij.x) % uReps;
    vec2 onto = texelFetch(texturePos, ivec2(rep % uSideI, rep / uSideI), 0).xy;
    home = mix(home, onto, uMerge);
  }
  // the fluid where the particle is, in screen heights per second
  vec2 fluid = texture2D(uFluid, vec2(P.x / uAspect, P.y)).xy * uFluidScale;
  vec2 v = V.xy;
  float pull = mix(3.2, 60.0, uMerge);
  v += ((home - P.xy) * pull + (fluid - v) * 7.0 * (1.0 - uMerge)) * uDt;
  v *= exp(-mix(0.9, 12.0, uMerge) * uDt);
  gl_FragColor = vec4(v, 0.0, 0.0);
}
`

const POSITION = /* glsl */ `
uniform float uDt;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec4 V = texelFetch(textureVel, ij, 0);
  gl_FragColor = vec4(P.xy + V.xy * uDt, 0.0, 1.0);
}
`

const SEED = /* glsl */ `
uniform sampler2D uReps;
uniform int uCount;
uniform int uSideI;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  int rep = (ij.y * uSideI + ij.x) % uCount;
  gl_FragColor = vec4(texelFetch(uReps, ivec2(rep % uSideI, rep / uSideI), 0).xy, 0.0, 1.0);
}
`

const ZERO = /* glsl */ `void main() { gl_FragColor = vec4(0.0); }`

const POINTS_VERTEX = /* glsl */ `
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform int uSide;
uniform float uAspect;
uniform float uSize;
uniform float uTime;
varying vec3 vColor;
${HASH}
void main() {
  ivec2 ij = ivec2(gl_VertexID % uSide, gl_VertexID / uSide);
  vec2 p = texelFetch(uPos, ij, 0).xy;
  vec2 v = texelFetch(uVel, ij, 0).xy;
  gl_Position = vec4(p.x / uAspect * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
  // waves of orange-red running out through the yellow, and redder the faster a particle goes
  float r = place(ij, 0.0).z / ${REST};
  float seed = rand3(uvec3(uvec2(ij), 5u)).x;
  float wave = 0.5 + 0.5 * sin(uTime * 1.4 - r * 2.8 + seed * 0.9);
  float speed = length(v) / ${REST};
  float mixing = clamp(wave * 0.7 + smoothstep(0.6, 5.0, speed) * 0.7, 0.0, 1.0);
  vColor = mix(vec3(0.992, 0.851, 0.0), vec3(1.0, 0.29, 0.11), mixing);
}
`

// a square, the same for every particle: no fade, no soft edge
const POINTS_FRAGMENT = /* glsl */ `
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }
`

export interface FlowStep {
  dt: number
  time: number
  aspect: number
  pointer: THREE.Vector2
  fluid: THREE.Texture
  /** fluid velocity (grid cells a second) to screen heights a second */
  fluidScale: number
  /** a particle's side, in device pixels */
  size: number
  /** 0 = in the cloud, 1 = gathered onto the representatives */
  merge: number
}

export class ParticleFlow {
  readonly side: number
  readonly count: number
  readonly points: THREE.Points
  readonly float: boolean
  private readonly gpu: GPUComputationRenderer
  private readonly pos: Variable
  private readonly vel: Variable
  private readonly material: THREE.ShaderMaterial
  private readonly seedPass: THREE.ShaderMaterial
  private readonly zeroPass: THREE.ShaderMaterial
  private reps: THREE.DataTexture | null = null
  private repCount = 1

  constructor(gl: THREE.WebGLRenderer, side: number, aspect: number) {
    this.side = side
    this.count = side * side
    this.gpu = new GPUComputationRenderer(side, side, gl)
    this.float = gl.extensions.has('EXT_color_buffer_float')
    this.gpu.setDataType(this.float ? THREE.FloatType : THREE.HalfFloatType)

    const pos0 = this.gpu.createTexture()
    const p = pos0.image.data as unknown as Float32Array
    for (let i = 0; i < this.count; i++) {
      p[i * 4] = Math.random() * aspect
      p[i * 4 + 1] = Math.random()
    }
    const vel0 = this.gpu.createTexture()
    this.pos = this.gpu.addVariable('texturePos', POSITION, pos0)
    this.vel = this.gpu.addVariable('textureVel', VELOCITY, vel0)
    this.gpu.setVariableDependencies(this.pos, [this.pos, this.vel])
    this.gpu.setVariableDependencies(this.vel, [this.pos, this.vel])
    Object.assign(this.pos.material.uniforms, { uDt: { value: 0 } })
    Object.assign(this.vel.material.uniforms, {
      uFluid: { value: null },
      uFluidScale: { value: 1 },
      uAspect: { value: aspect },
      uPointer: { value: new THREE.Vector2(aspect / 2, 0.5) },
      uTime: { value: 0 },
      uDt: { value: 0 },
      uMerge: { value: 0 },
      uReps: { value: 1 },
      uSideI: { value: side },
    })
    const error = this.gpu.init()
    if (error) throw new Error(error)
    pos0.dispose()
    vel0.dispose()

    this.seedPass = this.gpu.createShaderMaterial(SEED, {
      uReps: { value: null },
      uCount: { value: 1 },
      uSideI: { value: side },
    })
    this.zeroPass = this.gpu.createShaderMaterial(ZERO, {})

    // one point per particle, found by gl_VertexID: the only attribute is a count
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Uint8Array(this.count), 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    this.material = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      uniforms: {
        uPos: { value: null },
        uVel: { value: null },
        uSide: { value: side },
        uAspect: { value: aspect },
        uSize: { value: 2 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })
    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = 10
  }

  /** every particle starts on a representative (`xy`, screen heights), at rest */
  seed(xy: Float32Array, count: number) {
    const rows = Math.ceil(count / this.side)
    if (!this.reps || this.reps.image.height !== rows) {
      this.reps?.dispose()
      this.reps = new THREE.DataTexture(
        new Float32Array(this.side * rows * 4),
        this.side,
        rows,
        THREE.RGBAFormat,
        THREE.FloatType,
      )
    }
    const data = this.reps.image.data as Float32Array
    for (let i = 0; i < count; i++) {
      data[i * 4] = xy[i * 2]
      data[i * 4 + 1] = xy[i * 2 + 1]
    }
    this.reps.needsUpdate = true
    this.repCount = count
    const u = this.seedPass.uniforms
    u.uReps.value = this.reps
    u.uCount.value = count
    for (const rt of [this.gpu.getCurrentRenderTarget(this.pos), this.gpu.getAlternateRenderTarget(this.pos)]) {
      this.gpu.doRenderTarget(this.seedPass, rt)
    }
    for (const rt of [this.gpu.getCurrentRenderTarget(this.vel), this.gpu.getAlternateRenderTarget(this.vel)]) {
      this.gpu.doRenderTarget(this.zeroPass, rt)
    }
    this.vel.material.uniforms.uReps.value = count
  }

  /** the representatives' positions right now (screen heights), read back from the graphics card */
  read(gl: THREE.WebGLRenderer, count: number, out: Float32Array) {
    const rows = Math.ceil(count / this.side)
    const buffer = new Float32Array(this.side * rows * 4)
    gl.readRenderTargetPixels(this.gpu.getCurrentRenderTarget(this.pos), 0, 0, this.side, rows, buffer)
    for (let i = 0; i < count; i++) {
      out[i * 2] = buffer[i * 4]
      out[i * 2 + 1] = buffer[i * 4 + 1]
    }
  }

  step({ dt, time, aspect, pointer, fluid, fluidScale, size, merge }: FlowStep) {
    this.pos.material.uniforms.uDt.value = dt
    const u = this.vel.material.uniforms
    u.uFluid.value = fluid
    u.uFluidScale.value = fluidScale
    u.uAspect.value = aspect
    u.uPointer.value.copy(pointer)
    u.uTime.value = time
    u.uDt.value = dt
    u.uMerge.value = merge
    u.uReps.value = this.repCount
    this.gpu.compute()
    const m = this.material.uniforms
    m.uPos.value = this.gpu.getCurrentRenderTarget(this.pos).texture
    m.uVel.value = this.gpu.getCurrentRenderTarget(this.vel).texture
    m.uAspect.value = aspect
    m.uTime.value = time
    m.uSize.value = size
  }

  dispose() {
    this.gpu.dispose()
    this.reps?.dispose()
    this.seedPass.dispose()
    this.zeroPass.dispose()
    this.points.geometry.dispose()
    this.material.dispose()
  }
}
