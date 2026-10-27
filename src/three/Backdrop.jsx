import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Orb, Satellites } from './Canvases'
import { prefersReducedMotion } from '../lib/env'

// One keyframe per [data-scene] section, in page order. The orb flies, spins and changes class as you scroll.
const KEYS = [
  { x: 2.4, y: 0, s: 1, ry: 0, sat: 1 },                                  // hero (colour cycles through the 3 classes)
  { x: -2.7, y: 0.2, s: 0.9, ry: 1.0, sat: 0.6, c: '#fb4f8a', d: 0.78 },  // problem: slop
  { x: 0, y: 1.9, s: 0.62, ry: 2.0, sat: 1.5, c: '#fbbf24', d: 0.3 },     // features: polished AI
  { x: 2.7, y: -0.2, s: 0.85, ry: 3.0, sat: 1.1, c: '#7dd3fc', d: 0.22 }, // how it works
  { x: 5.6, y: -2.6, s: 0.3, ry: 4.0, sat: 0.4, c: '#8aa4ff', d: 0.15 },  // try it: steps aside for the app
  { x: -2.7, y: 0, s: 0.9, ry: 5.0, sat: 1, c: '#c4b5fd', d: 0.24 },      // use cases
  { x: 0, y: 0, s: 1.15, ry: 6.0, sat: 1.3, c: '#34d399', d: 0.1 },       // final call: human, calm
]
const CYC = [{ c: '#34d399', d: 0.12 }, { c: '#fbbf24', d: 0.3 }, { c: '#fb4f8a', d: 0.72 }]

function Rig({ marks }) {
  const g = useRef()
  const sat = useRef()
  const cur = useRef({ x: 2.4, y: 0, s: 1, ry: 0, sat: 1 })
  const A = useMemo(() => new THREE.Color(), [])
  const B = useMemo(() => new THREE.Color(), [])
  const tgt = useMemo(() => ({ color: '#8aa4ff', distort: 0.2 }), [])
  const reduced = prefersReducedMotion()
  useFrame((st, dt) => {
    if (!g.current) return
    const { idx, p } = marks.current
    const cyc = CYC[Math.floor(st.clock.elapsedTime / 4) % 3]
    const a = KEYS[idx], b = KEYS[Math.min(idx + 1, KEYS.length - 1)]
    const q = Math.min(1, Math.max(0, (p - 0.45) / 0.55)), e = q * q * (3 - 2 * q) // hold, then hand off to the next scene
    const L = (u, v) => u + (v - u) * e
    const wide = st.size.width / st.size.height > 1.1
    const k = reduced ? 1 : Math.min(1, dt * 3.5), c = cur.current
    c.x += (L(a.x, b.x) * (wide ? 1 : 0.2) - c.x) * k
    c.y += (L(a.y, b.y) + (wide ? 0 : 1.2) - c.y) * k
    c.s += (L(a.s, b.s) * (wide ? 1 : 0.7) - c.s) * k
    c.sat += (L(a.sat, b.sat) - c.sat) * k
    c.ry += (L(a.ry, b.ry) - c.ry) * k
    g.current.position.set(c.x, c.y, 0)
    g.current.scale.setScalar(c.s)
    g.current.rotation.y = c.ry
    sat.current.scale.setScalar(c.sat)
    A.set(a.c || cyc.c); B.set(b.c || cyc.c)
    tgt.color = '#' + A.lerp(B, e).getHexString()
    tgt.distort = L(a.d ?? cyc.d, b.d ?? cyc.d)
    st.camera.position.x += ((reduced ? 0 : st.pointer.x * 0.5) - st.camera.position.x) * 0.04
    st.camera.position.y += ((reduced ? 0 : st.pointer.y * 0.3) - st.camera.position.y) * 0.04
    st.camera.lookAt(0, 0, 0)
  })
  return (
    <group ref={g}>
      <Orb getTarget={() => tgt} busy={false} />
      <group ref={sat}><Satellites busy={false} /></group>
    </group>
  )
}

export default function Backdrop({ marks }) {
  return (
    <div className="backdrop" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: false }}>
        <color attach="background" args={['#07131a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 5]} intensity={1.6} />
        <pointLight position={[-4, -2, 3]} intensity={8} color="#7dd3fc" />
        <Rig marks={marks} />
        <Sparkles count={70} scale={[18, 12, 10]} size={2} speed={0.3} color="#9ee7f2" />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.75} luminanceThreshold={0.25} mipmapBlur />
          <Vignette darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
