import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useDisposable, useFrame } from '@react-three/fiber'
import { GlStats, Hud, Stage, gpuGeometries, gpuTextures, number, useMode } from './shared'

const SWAP_EVERY = number('every', 120)

/** A card with its own texture and geometry, made by hand rather than in JSX */
function makeCard(index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 320
  const context = canvas.getContext('2d')!
  const hue = (index * 47) % 360
  const gradient = context.createLinearGradient(0, 0, 256, 320)
  gradient.addColorStop(0, `hsl(${hue}, 80%, 62%)`)
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 80%, 42%)`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 320)
  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.font = '700 96px -apple-system, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(`#${index}`, 128, 160)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const geometry = new THREE.BoxGeometry(2.4, 3, 0.08)
  return { texture, geometry }
}

function Spin({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<THREE.Group>(null!)
  useFrame(({ clock }) => void (ref.current.rotation.y = Math.sin(clock.elapsedTime * 1.3) * 0.5))
  return (
    <group ref={ref} position={[1.3, 0, 0]}>
      {children}
    </group>
  )
}

/** Made in useMemo: R3F never disposes it, so every swap leaks a texture and a geometry */
function MemoCard({ index }: { index: number }) {
  const { texture, geometry } = React.useMemo(() => makeCard(index), [index])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

/** Made with useDisposable: the old card is disposed as the new one arrives */
function DisposableCard({ index }: { index: number }) {
  const { texture, geometry } = useDisposable(() => makeCard(index), [index])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

const metrics = [
  { label: 'Textures on GPU', read: gpuTextures, graph: {}, peak: true },
  { label: 'Geometries on GPU', read: gpuGeometries, graph: {}, peak: true },
]

export default function Dispose() {
  const [mode, setMode] = useMode()
  const [index, setIndex] = React.useState(1)
  React.useEffect(() => {
    const interval = setInterval(() => setIndex((index) => index + 1), SWAP_EVERY)
    return () => clearInterval(interval)
  }, [])

  const Card = mode === 'classic' ? MemoCard : DisposableCard
  return (
    <Stage>
      <Canvas key={mode} camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={['#0d0f14']} />
        <Spin>
          <Card key={index} index={index} />
        </Spin>
        <GlStats />
      </Canvas>
      <Hud
        mode={mode}
        setMode={setMode}
        labels={{ classic: 'useMemo', better: 'useDisposable' }}
        title="Disposing what you create"
        description={
          <>
            A card with a hand-made texture and geometry, swapped every {SWAP_EVERY} ms. R3F disposes what JSX declares,
            not objects you make yourself. <code>useDisposable</code> does.
          </>
        }
        metrics={metrics}
      />
    </Stage>
  )
}
