import { analyze as local, FILL } from './analyze'

const TEXT_NAMES = ['Human-generated', 'AI-generated (high quality)', 'AI slop']
const IMG_NAMES = ['Real photo', 'AI-generated image']
const FILL_RE = new RegExp('(' + FILL.join('|') + ')', 'gi')
const pct = (v) => Math.round(v * 100) + '%'

export async function pingBackend() {
  try { return (await fetch('/api/health')).ok } catch { return false }
}

export async function checkText(text, live) {
  if ((text.match(/\S+/g) || []).length < 25) throw new Error('Enter at least 25 words to analyze.')
  let probs, signals, segments
  if (live) {
    const r = await fetch('/api/text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
    if (!r.ok) throw new Error('The backend returned an error. Check the Python terminal.')
    ;({ probs, signals, segments } = await r.json())
  } else {
    const a = local(text)
    probs = a.p
    signals = [
      { label: 'Uniform sentences', value: pct(a.f.flat), hint: 'Little variation in sentence length' },
      { label: 'Filler phrases', value: pct(a.f.fill), hint: 'Stock phrases per 100 words' },
      { label: 'Repetition', value: pct(a.f.rep), hint: 'Repeated three-word phrases' },
      { label: 'Little specific detail', value: pct(a.f.low), hint: 'Few names and numbers' },
    ]
    segments = a.raw.split(FILL_RE).map((t, i) => ({ text: t, effect: i % 2 ? 'ai' : null }))
  }
  return { kind: 'text', live, probs, names: TEXT_NAMES, cls: probs.indexOf(Math.max(...probs)), signals, segments, snippet: text.slice(0, 90) }
}

export async function checkImage(file, live) {
  if (!live) throw new Error('Image analysis needs the Python backend. Start it, then refresh this page.')
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/image', { method: 'POST', body: fd })
  if (!r.ok) throw new Error('The backend could not read that image.')
  const { probs, heatmap } = await r.json()
  return { kind: 'image', live, probs, names: IMG_NAMES, cls: probs[1] > probs[0] ? 1 : 0, heatmap, snippet: file.name }
}
