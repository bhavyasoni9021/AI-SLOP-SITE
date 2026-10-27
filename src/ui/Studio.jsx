import { lazy, Suspense, useEffect, useState } from 'react'
import { CLASSES, SAMPLES } from '../lib/analyze'
import { useInView, webglAvailable } from '../lib/env'
import { Boundary } from './Boundary'

const VerdictCanvas = lazy(() => import('../three/Canvases').then((m) => ({ default: m.VerdictCanvas })))
const words = (t) => (t.match(/\S+/g) || []).length

export function Composer({ onRun, busy, live, seed }) {
  const [tab, setTab] = useState('text')
  const [text, setText] = useState('')
  const [drag, setDrag] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (seed) { setTab('text'); setText(seed.text) } }, [seed])
  const submit = (t) => {
    if (words(t) < 25) { setMsg('Enter at least 25 words to analyze.'); return }
    setMsg(''); onRun('text', t)
  }
  const pick = (f) => {
    if (f && f.type.startsWith('image/')) { setMsg(''); onRun('image', f) } else setMsg('Choose an image file (PNG, JPG or WebP).')
  }
  return (
    <div className="card glass composer">
      <div className="tabs" role="tablist">
        {['text', 'image'].map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'text' ? 'Text' : 'Image'}</button>)}
      </div>
      {tab === 'text' ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} aria-label="Text to analyze" placeholder="Paste an article, post or review (25+ words)." />
          <div className="row">
            <span className="muted">Try:</span>
            {SAMPLES.map((s) => <button key={s.label} className="pill" onClick={() => { setText(s.text); submit(s.text) }} disabled={busy}>{s.label}</button>)}
            <button className="btn primary push" onClick={() => submit(text)} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze text'}</button>
          </div>
        </>
      ) : (
        <label className={`drop${drag ? ' on' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}>
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
          <b>Drop an image here, or click to browse</b>
          <span>PNG, JPG or WebP. Analysis takes a few seconds.</span>
          {live === false && <em>Needs the Python backend, which is not running.</em>}
        </label>
      )}
      {msg && <p className="err">{msg}</p>}
    </div>
  )
}

const Ring = ({ v, color }) => {
  const r = 34, c = 2 * Math.PI * r
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-label={`${Math.round(v * 100)}% confidence`}>
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700">{Math.round(v * 100)}%</text>
    </svg>
  )
}

export function Verdict({ res, busy, err }) {
  const [ref, visible] = useInView('0px')
  const [gl, setGl] = useState(false)
  useEffect(() => { setGl(webglAvailable()) }, [])
  const color = res ? CLASSES[res.cls].color : undefined
  return (
    <div className="card glass verdict" ref={ref}>
      <div className="orb">
        {gl && <Boundary><Suspense fallback={null}><VerdictCanvas cls={res ? res.cls : null} busy={busy} visible={visible} /></Suspense></Boundary>}
      </div>
      <div className="vbody">
        {err ? <p className="err">{err}</p> : busy ? <p className="muted">Analyzing with the models…</p> : res ? (
          <>
            <div className="vtop">
              <Ring v={res.probs[res.cls]} color={color} />
              <div><h2 style={{ color }}>{res.names[res.cls]}</h2><p className="muted">{res.live ? 'Trained models' : 'Demo mode: rule-based scoring'}</p></div>
            </div>
            {res.names.map((n, j) => (
              <div className="bar" key={n}>
                <span>{n}</span>
                <i><b style={{ width: `${Math.round(res.probs[j] * 100)}%`, background: res.kind === 'image' ? CLASSES[j].color : CLASSES[j].color }} /></i>
                <em>{Math.round(res.probs[j] * 100)}%</em>
              </div>
            ))}
          </>
        ) : <p className="muted">Your verdict appears here. The orb is calm for human, rippled for polished AI and spiky for slop.</p>}
      </div>
    </div>
  )
}

export function Explain({ res, preview }) {
  return (
    <section className="container explain reveal in">
      <h2>Why this verdict</h2>
      {res.kind === 'text' ? (
        <>
          <div className="tiles">{res.signals.map((s) => <div key={s.label} className="tile glass"><span>{s.label}</span><b>{s.value}</b><small>{s.hint}</small></div>)}</div>
          <div className="card glass">
            <p className="legend"><i className="k ai" />pushes toward AI <i className="k human" />pushes toward human</p>
            <p className="text">{res.segments.map((s, i) => <span key={i} className={`seg ${s.effect || ''}`}>{s.text}</span>)}</p>
          </div>
        </>
      ) : (
        <div className="imgs">
          <figure className="glass"><img src={preview} alt="Uploaded" /><figcaption>Your image</figcaption></figure>
          <figure className="glass"><img src={res.heatmap} alt="Heatmap" /><figcaption>Red marks the regions that support “AI-generated”. Found by covering each region and measuring the change.</figcaption></figure>
        </div>
      )}
    </section>
  )
}

export function History({ items, onOpen, onClear }) {
  if (!items.length) return null
  return (
    <section id="history" className="container section">
      <div className="hhead"><h2>Recent checks</h2><button className="pill" onClick={onClear}>Clear</button></div>
      <div className="hgrid">
        {items.map((h) => (
          <button key={h.id} className="card glass hitem" onClick={() => onOpen(h)} disabled={h.kind !== 'text'}>
            <span className="tag">{h.kind}</span>
            <b style={{ color: CLASSES[h.cls].color }}>{h.label}</b>
            <small>{h.conf}% · {new Date(h.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            <p>{h.snippet}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
