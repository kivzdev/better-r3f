import * as THREE from 'three'
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js'

/**
 * A million small squares that stream from the pointer, after Edan Kwan's "The Spirit" (MIT): each is born in a small
 * ball round a point that follows the pointer, rides a curl-noise current that drifts over time — so they flow out in
 * threads that never bunch up or thin out — is pulled back towards the pointer a little, and when its life runs out it's
 * born again by the pointer. The pointer also stirs a fluid (the solver next door), whose wake sweeps them along.
 *
 * Every square is drawn the same: opaque, the same size. Only its colour moves: the mascot's yellow when it's born, an
 * orange-red as it ages, with the whole stream drifting between the two.
 *
 * Positions are in screen heights (x from 0 to the aspect ratio, y from 0 to 1) plus a depth, drawn flat.
 *
 * The page's other particle scenes hand over to this one and take over from it: `seed` starts every particle on one of
 * a few thousand "representatives" (particle j on representative j mod n), and `merge` glides them back onto those
 * representatives so the page can read their positions and carry on with fewer particles.
 */

/** the ball round the pointer the particles are born in, in screen heights */
export const SPAWN = 0.055

const HASH = /* glsl */ `
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 rand3(uvec3 v) { return vec3(pcg3d(v)) * (1.0 / 4294967295.0); }
`

/** 3D simplex noise with its gradient (Ashima Arts / Stefan Gustavson, webgl-noise, MIT); two crossed make a curl */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v, out vec3 gradient) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  vec4 m2 = m * m;
  vec4 m4 = m2 * m2;
  vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
  vec4 temp = m2 * m * pdotx;
  gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  gradient *= 105.0;
  return 105.0 * dot(m4, pdotx);
}
vec3 curl(vec3 p) {
  vec3 g1, g2;
  snoise(p, g1);
  snoise(p + vec3(31.416, -17.32, 9.71), g2);
  return cross(g1, g2);
}
`

const POSITION = /* glsl */ `
uniform sampler2D uFluid;
uniform float uFluidScale;
uniform float uAspect;
uniform vec3 uFollow;
uniform float uTime;
uniform float uDt;
uniform float uFrame;
uniform float uMerge;
uniform int uReps;
uniform int uSideI;
${HASH}
${NOISE}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec3 p = P.xyz;
  float life = P.w;

  if (uMerge > 0.0) {
    // gathering onto the representatives, still alive
    int rep = (ij.y * uSideI + ij.x) % uReps;
    vec3 onto = texelFetch(texturePos, ivec2(rep % uSideI, rep / uSideI), 0).xyz;
    p = mix(p, onto, 1.0 - exp(-uDt * mix(2.0, 22.0, uMerge)));
    gl_FragColor = vec4(p, max(life, 0.25));
    return;
  }

  life -= uDt * 0.72;
  if (life < 0.0) {
    // born again in a small ball round the pointer, which pulses a little
    vec3 r = rand3(uvec3(uvec2(ij), uint(uFrame)));
    vec3 q = rand3(uvec3(uvec2(ij), uint(uFrame) + 7919u));
    vec3 dir = normalize(vec3(r.x, r.y, q.x) * 2.0 - 1.0 + 1e-4);
    float radius = pow(r.z, 0.333) * ${SPAWN} * (1.0 + sin(uTime * 15.0) * 0.2);
    p = uFollow + dir * vec3(1.0, 1.0, 0.6) * radius;
    life = 0.5 + fract(q.y * 21.4131 + uTime);
  } else {
    // drawn back towards the pointer, less the farther it is; carried along the drifting curl current; swept by the wake
    vec3 delta = uFollow - p;
    p += delta * (0.3 + 0.6 * life) * (1.0 - smoothstep(0.2, 0.9, length(delta.xy))) * uDt;
    p += curl(p * 4.6 + vec3(0.0, 0.0, uTime * 0.22)) * 0.034 * uDt;
    vec2 wake = texture2D(uFluid, vec2(p.x / uAspect, p.y)).xy * uFluidScale;
    p.xy += wake * 0.9 * uDt;
  }
  gl_FragColor = vec4(p, life);
}
`

// every particle starts on its representative (particle j on j mod n), alive for a while yet
const SEED = /* glsl */ `
uniform sampler2D uReps;
uniform int uCount;
uniform int uSideI;
${HASH}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  int rep = (ij.y * uSideI + ij.x) % uCount;
  vec2 p = texelFetch(uReps, ivec2(rep % uSideI, rep / uSideI), 0).xy;
  gl_FragColor = vec4(p, 0.0, 0.3 + rand3(uvec3(uvec2(ij), 11u)).x * 1.1);
}
`

const POINTS_VERTEX = /* glsl */ `
uniform sampler2D uPos;
uniform int uSide;
uniform float uAspect;
uniform float uSize;
uniform float uTime;
uniform float uHandoff;
uniform int uReps;
varying vec3 vColor;
${HASH}
const vec3 YELLOW = vec3(0.992, 0.851, 0.0);
const vec3 ORANGE_RED = vec3(1.0, 0.29, 0.11);
void main() {
  ivec2 ij = ivec2(gl_VertexID % uSide, gl_VertexID / uSide);
  vec4 P = texelFetch(uPos, ij, 0);
  gl_Position = vec4(P.x / uAspect * 2.0 - 1.0, P.y * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
  // yellow when it's born, orange-red as it ages; the stream as a whole drifts between the two
  float seed = rand3(uvec3(uvec2(ij), 5u)).x;
  float age = clamp(1.0 - P.w, 0.0, 1.0);
  float drift = 0.5 + 0.5 * sin(uTime * 0.8 + seed * 2.4);
  vec3 own = mix(YELLOW, ORANGE_RED, clamp(age * 0.9 + drift * 0.3 - 0.1, 0.0, 1.0));
  // while handing over, every particle wears its representative's colour, so a few thousand can stand in for all
  int rep = (ij.y * uSide + ij.x) % uReps;
  float k = rand3(uvec3(uvec2(ivec2(rep % uSide, rep / uSide)), 13u)).x;
  vColor = mix(own, mix(YELLOW, ORANGE_RED, 0.2 + 0.55 * k), uHandoff);
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
  /** the point the stream follows, in screen heights */
  follow: THREE.Vector2
  fluid: THREE.Texture
  /** fluid velocity (grid cells a second) to screen heights a second */
  fluidScale: number
  /** a particle's side, in device pixels */
  size: number
  /** 0 = streaming, 1 = gathered onto the representatives */
  merge: number
  /** 1 = every particle shows its representative's colour (a hand-over), 0 = its own */
  handoff: number
}

export class ParticleFlow {
  readonly side: number
  readonly count: number
  readonly points: THREE.Points
  readonly float: boolean
  private readonly gpu: GPUComputationRenderer
  private readonly pos: Variable
  private readonly material: THREE.ShaderMaterial
  private readonly seedPass: THREE.ShaderMaterial
  private reps: THREE.DataTexture | null = null
  private repCount = 1
  private frame = 0
  private readonly follow = new THREE.Vector3()

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
      p[i * 4 + 3] = Math.random()
    }
    this.pos = this.gpu.addVariable('texturePos', POSITION, pos0)
    this.gpu.setVariableDependencies(this.pos, [this.pos])
    Object.assign(this.pos.material.uniforms, {
      uFluid: { value: null },
      uFluidScale: { value: 1 },
      uAspect: { value: aspect },
      uFollow: { value: new THREE.Vector3(aspect / 2, 0.5, 0) },
      uTime: { value: 0 },
      uDt: { value: 0 },
      uFrame: { value: 0 },
      uMerge: { value: 0 },
      uReps: { value: 1 },
      uSideI: { value: side },
    })
    const error = this.gpu.init()
    if (error) throw new Error(error)
    pos0.dispose()

    this.seedPass = this.gpu.createShaderMaterial(SEED, {
      uReps: { value: null },
      uCount: { value: 1 },
      uSideI: { value: side },
    })

    // one point per particle, found by gl_VertexID: the only attribute is a count
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Uint8Array(this.count), 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    this.material = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      uniforms: {
        uPos: { value: null },
        uSide: { value: side },
        uAspect: { value: aspect },
        uSize: { value: 2 },
        uTime: { value: 0 },
        uHandoff: { value: 0 },
        uReps: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })
    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = 10
  }

  /** every particle starts on a representative (`xy`, screen heights) */
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
    this.seedPass.uniforms.uReps.value = this.reps
    this.seedPass.uniforms.uCount.value = count
    for (const rt of [this.gpu.getCurrentRenderTarget(this.pos), this.gpu.getAlternateRenderTarget(this.pos)]) {
      this.gpu.doRenderTarget(this.seedPass, rt)
    }
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

  step({ dt, time, aspect, follow, fluid, fluidScale, size, merge, handoff }: FlowStep) {
    this.frame++
    const u = this.pos.material.uniforms
    u.uFluid.value = fluid
    u.uFluidScale.value = fluidScale
    u.uAspect.value = aspect
    u.uFollow.value.copy(this.follow.set(follow.x, follow.y, 0))
    u.uTime.value = time
    u.uDt.value = dt
    u.uFrame.value = this.frame
    u.uMerge.value = merge
    u.uReps.value = this.repCount
    this.gpu.compute()
    const m = this.material.uniforms
    m.uPos.value = this.gpu.getCurrentRenderTarget(this.pos).texture
    m.uAspect.value = aspect
    m.uTime.value = time
    m.uSize.value = size
    m.uHandoff.value = handoff
    m.uReps.value = this.repCount
  }

  dispose() {
    this.gpu.dispose()
    this.reps?.dispose()
    this.seedPass.dispose()
    this.points.geometry.dispose()
    this.material.dispose()
  }
}
