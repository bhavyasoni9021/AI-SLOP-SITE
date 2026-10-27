import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { CLASSES, IDLE } from '../lib/analyze'
import { prefersReducedMotion } from '../lib/env'

/** The verdict orb: colour and surface distortion follow the class (calm, rippled, spiky). */
export function Orb({ getTarget, busy }) {
  const mesh = useRef()
  const mat = useRef()
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }, dt) => {
    if (!mat.current || !mesh.current) return
    const t = getTarget(clock.elapsedTime)
    const k = Math.min(1, dt * 3)
    col.set(t.color)
    mat.current.color.lerp(col, k)
    mat.current.emissive.lerp(col, k)
    mat.current.distort += ((busy ? 0.65 : t.distort) - mat.current.distort) * k
    mesh.current.rotation.y += dt * (busy ? 1.2 : 0.2)
  })
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.5, 24]} />
      <MeshDistortMaterial ref={mat} color={IDLE.color} emissive={IDLE.color} emissiveIntensity={0.45}
        roughness={0.3} metalness={0.25} distort={0.2} speed={2.2} />
    </mesh>
  )
}

/** Text tokens (bars) and image patches (tiles) orbiting the orb: the two input branches. */
export function Satellites({ busy }) {
  const a = useRef()
  const b = useRef()
  useFrame((_, dt) => {
    const s = busy ? 3 : 1
    if (a.current) a.current.rotation.y += dt * 0.35 * s
    if (b.current) b.current.rotation.y -= dt * 0.25 * s
  })
  const N = 14
  const ring = (r, make) => Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2
    return <mesh key={i} position={[Math.cos(t) * r, 0, Math.sin(t) * r]} rotation={[0, -t, 0]}>{make}</mesh>
  })
  return (
    <>
      <group ref={a} rotation={[0.35, 0, 0.2]}>
        {ring(2.7, <><boxGeometry args={[0.28, 0.1, 0.1]} /><meshStandardMaterial color="#7dd3fc" emissive="#7dd3fc" emissiveIntensity={1.3} /></>)}
      </group>
      <group ref={b} rotation={[-0.4, 0, -0.25]}>
        {ring(3.3, <><planeGeometry args={[0.34, 0.34]} /><meshBasicMaterial color="#c4b5fd" side={THREE.DoubleSide} transparent opacity={0.85} /></>)}
      </group>
    </>
  )
}

function Shift({ children }) {
  const { width, height } = useThree((s) => s.size)
  const wide = width / height > 1.2
  return <group position={[wide ? 1.9 : 0, wide ? 0 : 0.7, 0]} scale={wide ? 1 : 0.78}>{children}</group>
}

function Lights() {
  return (
    <>
      <color attach="background" args={['#07131a']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 5]} intensity={1.6} />
      <pointLight position={[-4, -2, 3]} intensity={8} color="#7dd3fc" />
    </>
  )
}

/** Hero: the orb cycles through the three classes so visitors see them before reading a word. */
export function HeroCanvas({ visible }) {
  const reduced = prefersReducedMotion()
  const getTarget = (t) => (reduced ? CLASSES[0] : CLASSES[Math.floor(t / 4) % 3])
  return (
    <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: false }}>
      <Lights />
      <Shift>
        <Float speed={reduced ? 0 : 1.4} floatIntensity={0.6} rotationIntensity={0.2}>
          <Orb getTarget={getTarget} busy={false} />
          <Satellites busy={false} />
        </Float>
      </Shift>
      <Sparkles count={80} scale={14} size={2} speed={reduced ? 0 : 0.3} color="#9ee7f2" />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.25} mipmapBlur />
        <Vignette darkness={0.55} />
      </EffectComposer>
    </Canvas>
  )
}

/** Demo: the orb reflects the live verdict. */
export function VerdictCanvas({ cls, busy, visible }) {
  const getTarget = () => (cls == null ? IDLE : CLASSES[cls])
  return (
    <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0, 7.2], fov: 45 }} gl={{ antialias: false }}>
      <Lights />
      <Float speed={1.2} floatIntensity={0.5} rotationIntensity={0.15}>
        <Orb getTarget={getTarget} busy={busy} />
        <Satellites busy={busy} />
      </Float>
      <Sparkles count={50} scale={10} size={2} speed={0.3} color="#9ee7f2" />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.7} luminanceThreshold={0.25} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
