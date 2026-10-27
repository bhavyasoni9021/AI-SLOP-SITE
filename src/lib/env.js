import { useEffect, useRef, useState } from 'react'

const mq = (q) => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(q).matches
export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)')

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

/** true while the element is on screen; used to pause WebGL when scrolled away */
export function useInView(rootMargin = '120px') {
  const ref = useRef(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, visible]
}

/** adds .in to every .reveal element once it scrolls into view */
export function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.1 })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

/** 3D hover tilt for cards (sets --rx / --ry that the .tilt CSS reads) */
export function useTilt() {
  return {
    onPointerMove: (e) => {
      const el = e.currentTarget, r = el.getBoundingClientRect()
      el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 12 + 'deg')
      el.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 12 + 'deg')
    },
    onPointerLeave: (e) => { e.currentTarget.style.removeProperty('--ry'); e.currentTarget.style.removeProperty('--rx') },
  }
}

/** which [data-scene] section is active, and how far through the hand-off to the next one we are */
export function useSceneMarks() {
  const marks = useRef({ idx: 0, p: 0 })
  useEffect(() => {
    const calc = () => {
      const els = [...document.querySelectorAll('[data-scene]')]
      if (!els.length) return
      const top = (el) => el.getBoundingClientRect().top + window.scrollY
      const y = window.scrollY + window.innerHeight * 0.4
      let idx = 0
      els.forEach((el, i) => { if (top(el) <= y) idx = i })
      const a = top(els[idx]), b = els[idx + 1] ? top(els[idx + 1]) : a + els[idx].offsetHeight
      marks.current = { idx, p: Math.min(1, Math.max(0, (y - a) / Math.max(1, b - a))) }
    }
    calc()
    window.addEventListener('scroll', calc, { passive: true })
    window.addEventListener('resize', calc)
    return () => { window.removeEventListener('scroll', calc); window.removeEventListener('resize', calc) }
  }, [])
  return marks
}
