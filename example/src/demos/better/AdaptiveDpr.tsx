import * as THREE from 'three'
import { Canvas, useDisposable, useFrame, useThree } from '@react-three/fiber'
import { GlStats, Hud, Stage, fixed, fps, number, params, pixelRatio, stats, useMode } from './shared'

// Raymarched metaballs: the cost is per pixel, so it scales with the pixel ratio squared
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uSteps;
  #define BALLS ${Math.round(number('balls', 32))}

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float map(vec3 p) {
    float d = 1e9;
    for (int i = 0; i < BALLS; i++) {
      float f = float(i);
      vec3 c = vec3(sin(uTime * 0.61 + f * 1.7) * 1.9, cos(uTime * 0.47 + f * 2.3) * 1.1, sin(uTime * 0.39 + f * 0.9) * 1.2);
      d = smin(d, length(p - c) - (0.5 + 0.12 * sin(f * 3.1 + uTime)), 0.65);
    }
    return d;
  }

  vec3 normalAt(vec3 p) {
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 5.2);
    vec3 rd = normalize(vec3(uv, -1.45));
    float t = 0.0;
    float glow = 0.0;
    bool hit = false;
    for (int i = 0; i < 256; i++) {
      if (float(i) >= uSteps) break;
      float d = map(ro + rd * t);
      glow += 0.012 / (0.04 + d * d);
      if (d < 0.0008) { hit = true; break; }
      if (t > 14.0) break;
      t += d * 0.7;
    }
    vec3 color = vec3(0.05, 0.06, 0.08) + glow * vec3(0.10, 0.32, 0.55) * 0.05;
    if (hit) {
      vec3 n = normalAt(ro + rd * t);
      float diffuse = max(dot(n, normalize(vec3(0.6, 0.8, 0.5))), 0.0);
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
      color = mix(vec3(0.08, 0.10, 0.18), vec3(0.25, 0.86, 0.6), diffuse) + rim * vec3(0.55, 0.45, 1.0);
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
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2() },
          uSteps: { value: number('steps', 240) },
        },
      }),
    [],
  )
  material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
  useFrame(({ clock }) => void (material.uniforms.uTime.value = clock.elapsedTime))
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const metrics = [
  { label: 'Frames per second', read: fps, graph: { max: 60 } },
  { label: 'Pixel ratio', read: pixelRatio, format: fixed(2), graph: { min: 0.75, max: 2 } },
  {
    label: 'Pixels per frame',
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
      <Canvas key={mode} dpr={params.has('dpr') ? number('dpr', 2) : [1, 2]} adaptiveDpr={mode === 'better'}>
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
            A fragment-heavy scene on a 2× screen. <code>adaptiveDpr</code> lowers the pixel ratio step by step while
            frames run slow, and raises it again once they keep up.
          </>
        }
        metrics={metrics}
      />
    </Stage>
  )
}
