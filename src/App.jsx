import { lazy, Suspense, useEffect, useState } from 'react'
import { checkImage, checkText, pingBackend } from './lib/api'
import { useRevealOnScroll, useSceneMarks, webglAvailable } from './lib/env'
import { Boundary } from './ui/Boundary'
import { Cases, Faq, Features, FinalCta, Footer, Hero, How, Problem } from './ui/Landing'
import { Composer, Explain, History, Verdict } from './ui/Studio'

const Backdrop = lazy(() => import('./three/Backdrop'))
const KEY = 'slop-history-v1'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }

export default function App() {
  useRevealOnScroll()
  const marks = useSceneMarks()
  const [gl, setGl] = useState(false)
  const [live, setLive] = useState(null)
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [preview, setPreview] = useState('')
  const [hist, setHist] = useState(load)
  const [seed, setSeed] = useState(null)
  useEffect(() => { setGl(webglAvailable()); pingBackend().then(setLive) }, [])

  const run = async (kind, payload) => {
    setErr(''); setRes(null); setBusy(true)
    if (kind === 'image') setPreview(URL.createObjectURL(payload))
    const t0 = performance.now()
    try {
      const out = kind === 'text' ? await checkText(payload, !!live) : await checkImage(payload, !!live)
      await new Promise((r) => setTimeout(r, Math.max(0, 900 - (performance.now() - t0))))
      setRes(out)
      const item = { id: Date.now(), kind, label: out.names[out.cls], cls: out.cls, conf: Math.round(out.probs[out.cls] * 100), snippet: out.snippet, text: kind === 'text' ? payload.slice(0, 4000) : null }
      const next = [item, ...hist].slice(0, 8)
      setHist(next)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    } catch (e) { setErr(e.message || 'Something went wrong.') }
    setBusy(false)
  }
  const open = (h) => { setSeed({ text: h.text, n: h.id }); document.getElementById('analyze')?.scrollIntoView({ behavior: 'smooth' }) }
  const clear = () => { setHist([]); try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

  return (
    <>
      {gl && <Boundary><Suspense fallback={null}><Backdrop marks={marks} /></Suspense></Boundary>}
      <header className="nav">
        <a href="#top" className="brand"><i className="logo" />AI Slop Detector</a>
        <nav><a href="#features">Product</a><a href="#how">How it works</a><a href="#cases">Use cases</a><a href="#faq">FAQ</a></nav>
        <span className={`status ${live ? 'on' : live === false ? 'off' : ''}`} title={live ? 'Python backend connected' : 'Python backend not running'}>
          <i />{live ? 'Models online' : live === false ? 'Demo mode' : 'Connecting…'}
        </span>
        <a href="#try" className="btn primary sm">Try it</a>
      </header>
      <main>
        <Hero />
        <Problem />
        <Features />
        <How />
        <section id="try" data-scene className="sec">
          <div className="container"><div className="head reveal"><h2>Try it now</h2><p className="lead sm">Paste text or drop an image. The verdict orb on the right reacts to what the models find.</p></div></div>
          <div id="analyze" className="container work">
            <Composer onRun={run} busy={busy} live={live} seed={seed} />
            <Verdict res={res} busy={busy} err={err} />
          </div>
          {res && <Explain res={res} preview={preview} />}
          <History items={hist} onOpen={open} onClear={clear} />
        </section>
        <Cases />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
