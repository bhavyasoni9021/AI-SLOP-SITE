// Browser prototype of the text branch: rule-based signals so the website works anywhere.
// The Python app (app.py) runs the trained RoBERTa (HC3), GPT-2 and Swin models.
export const CLASSES = [
  { key: 'human', name: 'Human-generated', color: '#34d399', distort: 0.12 },
  { key: 'aihq', name: 'AI-generated (high quality)', color: '#fbbf24', distort: 0.3 },
  { key: 'slop', name: 'AI slop', color: '#fb4f8a', distort: 0.72 },
]
export const IDLE = { color: '#8aa4ff', distort: 0.2 }
export const FILL = ["in today's", 'fast-paced', 'important to note', 'game-changer', "whether you're", 'unlock', 'ever-evolving', 'landscape', 'crucial role', 'realm', 'furthermore', 'testament', 'seamless', 'in conclusion', 'dive into', 'tapestry', 'delve', 'moreover', 'cutting-edge', 'leverage', 'elevate', 'look no further', 'at the end of the day']

export const SAMPLES = [
  { label: 'Human', text: "Honestly, I almost skipped the Marina Beach clean-up on Sunday. Woke up at 5:40, rain threatening, chai gone cold. But 14 of us showed up, and by 9 we'd filled 31 sacks - mostly plastic bottles and, weirdly, a single left slipper count of 12. Priya from Adyar reckons the tide drags it all back by Tuesday. Maybe. We're going again on the 26th anyway." },
  { label: 'AI, high quality', text: 'Urban heat islands form when concrete, asphalt, and other dense materials absorb sunlight and release it slowly after sunset. Cities can therefore stay several degrees warmer than nearby rural areas during summer nights. Planting trees, installing reflective roofs, and expanding green corridors can lower surface temperatures and reduce energy demand for cooling. Many municipal planners now combine these strategies with satellite temperature maps to decide where interventions will help most.' },
  { label: 'AI slop', text: "In today's fast-paced digital world, it is important to note that content creation is a game-changer. Whether you're a beginner or an expert, content creation can unlock your full potential. In today's ever-evolving landscape, content creation plays a crucial role in the realm of success. Furthermore, content creation is a testament to innovation, and content creation is truly seamless. In conclusion, content creation is the key to unlocking a brighter future, so dive into content creation today." },
]

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))

export function analyze(input) {
  const raw = input.replace(/[’‘]/g, "'").trim()
  const words = raw.toLowerCase().match(/[a-z0-9'-]+/g) || []
  if (words.length < 25) return null
  const sents = raw.split(/(?<=[.!?])\s+/).filter((s) => s.trim())
  const L = sents.map((s) => (s.match(/[A-Za-z0-9'-]+/g) || []).length)
  const mean = L.reduce((a, b) => a + b, 0) / L.length
  const cv = Math.sqrt(L.reduce((a, b) => a + (b - mean) ** 2, 0) / L.length) / mean
  let ent = 0
  sents.forEach((s) => s.split(/\s+/).slice(1).forEach((w) => { if (/^[A-Z][a-z]/.test(w) || /\d/.test(w)) ent++ }))
  const low = raw.toLowerCase()
  let hits = 0
  FILL.forEach((p) => { hits += low.split(p).length - 1 })
  const tri = {}
  for (let i = 0; i < words.length - 2; i++) { const k = words.slice(i, i + 3).join(' '); tri[k] = (tri[k] || 0) + 1 }
  const keys = Object.keys(tri)
  const rep = 1 - keys.length / (words.length - 2)
  const ttr = new Set(words).size / words.length
  const f = {
    flat: 1 - clamp(cv / 0.8), fill: clamp(hits / (words.length / 100) / 3), rep: clamp(rep * 4),
    div: clamp((0.8 - ttr) / 0.4), low: 1 - clamp(ent / words.length / 0.12),
  }
  const slop = 0.3 * f.fill + 0.3 * f.rep + 0.15 * f.div + 0.25 * f.low
  const ai = 0.55 * f.flat + 0.3 * f.fill + 0.1 * f.low + 0.05 * f.rep
  const g = clamp((ai - 0.3) / 0.3)
  const z = [6 * (0.45 - ai), 6 * (ai - 0.45) + g * 6 * (0.5 - slop), 6 * (ai - 0.45) + g * 6 * (slop - 0.5)]
  const m = Math.max(...z)
  const e = z.map((v) => Math.exp(v - m))
  const s = e.reduce((a, b) => a + b)
  const p = e.map((v) => v / s)
  const top = keys.filter((k) => tri[k] > 1).sort((a, b) => tri[b] - tri[a]).slice(0, 3).map((k) => `"${k}" ×${tri[k]}`)
  return { p, i: p.indexOf(Math.max(...p)), raw, f, top, words: words.length, sents: sents.length }
}
