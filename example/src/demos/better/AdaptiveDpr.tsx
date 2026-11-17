import * as THREE from 'three'
import { Canvas, useDisposable, useFrame, useThree } from '@react-three/fiber'
import { GlStats, Hud, Stage, fixed, fps, number, params, pixelRatio, stats, useMode } from './shared'

// Raymarched metaballs: the cost is per pixel, so it grows with the pixel ratio squared. The balls move on the CPU
// (one small array a frame) and rays that miss the sphere around them stop at once, so it's heavy where it should be
// — on the balls — and the frame rate answers to the pixel ratio
const BALLS = Math.round(number('balls', 24))
// ?march: the step size along a ray, as a share of the distance to the nearest ball (smaller is slower and finer)
const MARCH = number('march', 0.85)

const fragmentShader = /* glsl */ `
  uniform vec2 uResolution;
  uniform vec4 uBalls[${BALLS}];
  uniform float uSteps;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }
  float map(vec3 p) {
    float d = 1e9;
    for (int i = 0; i < ${BALLS}; i++) d = smin(d, length(p - uBalls[i].xyz) - uBalls[i].w, 0.65);
    return d;
  }
  vec3 normalAt(vec3 p) {
    const vec2 k = vec2(1.0, -1.0);
    const float e = 0.0015;
    return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 5.2);
    vec3 rd = normalize(vec3(uv - vec2(0.18, 0.0), -1.45));
    // the page's ground; rays that miss the balls' bounding sphere stop here
    vec3 color = vec3(0.0784);
    float b = dot(ro, rd);
    float h = b * b - dot(ro, ro) + 3.6 * 3.6;
    if (h > 0.0) {
      float t = max(-b - sqrt(h), 0.0);
      float far = -b + sqrt(h);
      float glow = 0.0;
      bool hit = false;
      for (int i = 0; i < 400; i++) {
        if (float(i) >= uSteps || t > far) break;
        float d = map(ro + rd * t);
        glow += 0.012 / (0.04 + d * d);
        if (d < 0.001) { hit = true; break; }
        t += d * ${MARCH.toFixed(3)};
      }
      // a yellow haze round the balls; the balls lit in the mascot's yellow with a pink and blue rim
      color += glow * vec3(0.99, 0.85, 0.0) * 0.012;
      if (hit) {
        vec3 n = normalAt(ro + rd * t);
        float diffuse = max(dot(n, normalize(vec3(0.6, 0.8, 0.5))), 0.0);
        float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
        vec3 rimColor = mix(vec3(1.0, 0.37, 0.66), vec3(0.0, 0.48, 0.99), 0.5 + 0.5 * n.y);
        color = mix(vec3(0.1), vec3(0.99, 0.85, 0.0), diffuse) + rim * rimColor;
      }
    }
    gl_FragColor = vec4(color, 1.0);
  }
`

function Metaballs() {
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)
  const material = useDisposable(
    () =>
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
        uniforms: {
          uResolution: { value: new THREE.Vector2() },
          uBalls: { value: Array.from({ length: BALLS }, () => new THREE.Vector4()) },
          uSteps: { value: number('steps', 120) },
        },
      }),
    [],
  )
  material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const balls = material.uniforms.uBalls.value as THREE.Vector4[]
    for (let i = 0; i < BALLS; i++) {
      balls[i].set(
        Math.sin(t * 0.61 + i * 1.7) * 1.9,
        Math.cos(t * 0.47 + i * 2.3) * 1.1,
        Math.sin(t * 0.39 + i * 0.9) * 1.2,
        0.5 + 0.12 * Math.sin(i * 3.1 + t),
      )
    }
  })
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const metrics = [
  { label: 'Frames a second', read: fps, graph: { max: 60 } },
  { label: 'Pixel ratio', read: pixelRatio, format: fixed(2), graph: { min: 0.75, max: 2 } },
  {
    label: 'Pixels a frame',
    read: () => {
      const canvas = stats.gl?.domElement
      return canvas ? canvas.width * canvas.height : 0
    },
  },
]

export default function AdaptiveDpr() {
  const [mode, setMode] = useMode()
  return (
    <Stage>
      <Canvas
        key={mode}
        dpr={params.has('dpr') ? number('dpr', 2) : [1, 2]}
        adaptiveDpr={mode === 'better' ? { min: 0.5 } : false}>
        <Metaballs />
        <GlStats />
      </Canvas>
      <Hud
        mode={mode}
        setMode={setMode}
        labels={{ classic: 'dpr={[1, 2]}', better: 'adaptiveDpr' }}
        title="Adaptive pixel ratio"
        description={
          <>
            A scene that’s heavy per pixel, on a 2× screen. <code>adaptiveDpr</code> lowers the pixel ratio a step at a
            time while frames run slow, and raises it again once they keep up.
          </>
        }
        metrics={metrics}
      />
    </Stage>
  )
}
