import { useTilt } from '../lib/env'

const Head = ({ title, lead }) => <div className="head reveal"><h2>{title}</h2>{lead && <p className="lead sm">{lead}</p>}</div>

export function Hero() {
  return (
    <section id="top" data-scene className="sec hero">
      <div className="container">
        <p className="kicker">AI content detection for text and images</p>
        <h1>Know what you’re reading. Spot the slop.</h1>
        <p className="lead">Paste a passage or drop an image. Get a clear verdict (human, polished AI or AI slop), a confidence score and the evidence behind it.</p>
        <div className="cta"><a className="btn primary" href="#try">Try it now</a><a className="btn ghost" href="#how">See how it works</a></div>
        <ul className="chips">{['Text and images', 'Three-way verdict', 'Explained results', 'No sign-up'].map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
    </section>
  )
}

export function Problem() {
  const tilt = useTilt()
  return (
    <section id="problem" data-scene className="sec">
      <div className="container"><div className="side-right">
        <Head title="The web is filling up with slop" lead="Slop is AI content that is repetitive, generic and says very little. It buries real voices and makes trust harder for everyone." />
        <div className="stack reveal">
          {[['Generic', 'Safe, familiar phrases that could appear on any page.'], ['Repetitive', 'The same idea restated again and again.'], ['Hollow', 'Plenty of words, very little information.']].map(([t, d]) => (
            <article key={t} className="card glass tilt" {...tilt}><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
        <p className="muted pull reveal">Not all AI content is slop. Polished AI writing exists, which is why this detector separates three classes instead of two.</p>
      </div></div>
    </section>
  )
}

const FEATURES = [
  ['Three-way verdict', 'Human, AI high quality or AI slop, not a blunt yes or no.'],
  ['Text and images', 'One place to check an article, a post or a picture.'],
  ['Evidence, not just a score', 'Highlighted sentences for text and a heatmap of suspicious regions for images.'],
  ['Readable confidence', 'Every verdict comes with a confidence ring and per-class probabilities.'],
  ['Real models', 'RoBERTa trained on HC3, GPT-2 perplexity and burstiness, and a Swin transformer for images.'],
  ['Stays with you', 'No account needed. Your recent checks are kept in your own browser.'],
]
export function Features() {
  const tilt = useTilt()
  return (
    <section id="features" data-scene className="sec">
      <div className="container">
        <div className="head reveal center"><h2>Everything you need to judge a piece of content</h2></div>
        <div className="grid3 reveal">
          {FEATURES.map(([t, d]) => <article key={t} className="card glass tilt" {...tilt}><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  ['Add content', 'Paste text or drop an image. No sign-up, no setup.'],
  ['Models score it', 'Text goes through a RoBERTa detector, GPT-2 perplexity and burstiness, and slop signals. Images go through a Swin transformer.'],
  ['See the evidence', 'Highlighted sentences for text, an occlusion heatmap for images, and a confidence score for both.'],
]
export function How() {
  const tilt = useTilt()
  return (
    <section id="how" data-scene className="sec">
      <div className="container"><div className="side-left">
        <Head title="How it works" lead="Three steps from content to verdict." />
        <ol className="how3 reveal">
          {STEPS.map(([t, d], i) => <li key={t} className="card glass tilt" {...tilt}><b>{i + 1}</b><h3>{t}</h3><p>{d}</p></li>)}
        </ol>
      </div></div>
    </section>
  )
}

const CASES = [
  ['Educators', 'Check whether a submission reads like human work or generic machine output.'],
  ['Platforms and moderators', 'Triage low-quality AI posts and reviews before they pile up.'],
  ['Fact-checkers', 'Add a second signal when judging where a text or image came from.'],
  ['Writers and editors', 'Spot filler and repetition in a draft, human or AI.'],
]
export function Cases() {
  const tilt = useTilt()
  return (
    <section id="cases" data-scene className="sec">
      <div className="container"><div className="side-right">
        <Head title="Who it’s for" />
        <div className="stack reveal">{CASES.map(([t, d]) => <article key={t} className="card glass tilt" {...tilt}><h3>{t}</h3><p>{d}</p></article>)}</div>
      </div></div>
    </section>
  )
}

const FAQ = [
  ['Is the verdict proof that something is AI-generated?', 'No. It is a probabilistic indicator. Use it alongside context and human judgement.'],
  ['What counts as AI slop?', 'Content that is repetitive, generic and low in information: filler phrases, repeated ideas and very little specific detail.'],
  ['Which models does it use?', 'A RoBERTa classifier trained on the HC3 dataset, GPT-2 for perplexity and burstiness, and a Swin transformer image detector.'],
  ['How accurate is it?', 'We are still evaluating on held-out generators. The detectors were trained on older generators, so newer models can slip through. Treat results as a guide.'],
  ['Is my content stored?', 'The site does not keep your content. Your recent checks are saved only in your own browser and you can clear them any time.'],
]
export function Faq() {
  return (
    <section id="faq" className="sec">
      <div className="container narrow">
        <Head title="Questions" />
        <div className="reveal">{FAQ.map(([q, a]) => <details key={q} className="faq glass"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="start" data-scene className="sec endcap">
      <div className="container center reveal">
        <h2>Check something now</h2>
        <p className="lead sm" style={{ margin: '12px auto 0' }}>It takes a few seconds and needs no account.</p>
        <div className="cta" style={{ justifyContent: 'center' }}><a className="btn primary" href="#try">Open the detector</a></div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container foot">
        <div><b>AI Slop Detector</b><span>Text and image detection with explained verdicts.</span></div>
        <nav><a href="#features">Product</a><a href="#how">How it works</a><a href="#cases">Use cases</a><a href="#faq">FAQ</a><a href="#try">Try it</a></nav>
        <small>Built by Bhavya Soni and Aira K Salish · CINTEL, CSE-AIML · Mentor: Dr. Gopinath N. Results are probabilistic indicators, not proof.</small>
      </div>
    </footer>
  )
}
