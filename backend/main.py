import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
import re, io, math, base64
import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM

app = FastAPI(title="AI Slop Detector API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("Loading models (the first run downloads them)...")
TXT = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")  # trained on HC3
IMG = pipeline("image-classification", model="umm-maybe/AI-image-detector")             # Swin transformer
tok = AutoTokenizer.from_pretrained("gpt2")
lm = AutoModelForCausalLM.from_pretrained("gpt2").eval()
print("Models ready.")

FILL = ["in today's", "fast-paced", "important to note", "game-changer", "whether you're", "unlock",
        "ever-evolving", "landscape", "crucial role", "realm", "furthermore", "testament", "seamless",
        "in conclusion", "dive into", "tapestry", "delve", "moreover", "cutting-edge", "leverage",
        "elevate", "look no further", "at the end of the day"]


def _ai(o):
    o = o[0] if isinstance(o, list) else o
    return 1 - o["score"] if o["label"].lower() == "human" else o["score"]


def p_ai_many(texts):
    return [_ai(o) for o in TXT(texts, truncation=True, max_length=512, batch_size=8)]


def _art(o):
    o = o if isinstance(o, list) else [o]
    for d in o:
        if d["label"].lower() == "artificial":
            return d["score"]
    return 1 - o[0]["score"]


def p_art_many(imgs):
    return [_art(o) for o in IMG(imgs)]


def ppl(s):
    ids = tok(s, return_tensors="pt", truncation=True, max_length=512).input_ids
    if ids.shape[1] < 2:
        return None
    with torch.no_grad():
        return math.exp(lm(ids, labels=ids).loss.item())


def burstiness(sents):
    ps = [ppl(s) for s in sents if len(s.split()) >= 4]
    ps = [p for p in ps if p]
    return float(np.std(ps) / np.mean(ps)) if len(ps) >= 2 else None


def slop_signals(text):
    words = re.findall(r"[a-z0-9'-]+", text.lower())
    n = max(len(words), 1)
    low = text.lower()
    found = [p for p in FILL if p in low]
    hits = sum(low.count(p) for p in FILL)
    tri = [" ".join(words[i:i + 3]) for i in range(len(words) - 2)]
    rep = 1 - len(set(tri)) / max(len(tri), 1)
    ttr = len(set(words)) / n
    ents = sum(1 for s in re.split(r"(?<=[.!?])\s+", text) for w in s.split()[1:]
               if re.match(r"[A-Z][a-z]", w) or re.search(r"\d", w))
    fill = min(1, hits / (n / 100) / 3)
    r = min(1, rep * 4)
    d = min(1, max(0, (.8 - ttr) / .4))
    info = 1 - min(1, ents / n / .12)
    return .3 * fill + .3 * r + .15 * d + .25 * info, rep, ttr, found


class TextIn(BaseModel):
    text: str


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/text")
def api_text(body: TextIn):
    text = body.text.replace("\u2019", "'").strip()
    if len(text.split()) < 25:
        raise HTTPException(400, "Enter at least 25 words.")
    sents = [s for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    occlude = 1 < len(sents) <= 30
    texts = [text] + ([" ".join(sents[:i] + sents[i + 1:]) for i in range(len(sents))] if occlude else [])
    ps = p_ai_many(texts)
    p_ai = ps[0]
    slop, rep, ttr, found = slop_signals(text)
    b, pp = burstiness(sents), ppl(text)
    if occlude:  # remove each sentence and see how P(AI) changes
        segments = []
        for s, pi in zip(sents, ps[1:]):
            d = p_ai - pi
            segments.append({"text": s + " ", "effect": "ai" if d > .02 else "human" if d < -.02 else None})
    else:
        segments = [{"text": text, "effect": None}]
    signals = [
        {"label": "P(AI), RoBERTa on HC3", "value": "%d%%" % round(p_ai * 100), "hint": "Trained on human vs ChatGPT answers"},
        {"label": "GPT-2 perplexity", "value": "n/a" if pp is None else "%.1f" % pp, "hint": "Lower means more predictable"},
        {"label": "Burstiness", "value": "n/a" if b is None else "%.2f" % b, "hint": "Lower means more uniform sentences"},
        {"label": "Slop score", "value": "%.2f" % slop, "hint": "Filler, repetition, little detail"},
        {"label": "Filler phrases", "value": str(len(found)), "hint": ", ".join(found) or "none found"},
        {"label": "Repeated trigrams", "value": "%d%%" % round(rep * 100), "hint": "Lexical diversity %.2f" % ttr},
    ]
    return {"probs": [float(1 - p_ai), float(p_ai * (1 - slop)), float(p_ai * slop)], "signals": signals, "segments": segments}


@app.post("/api/image")
def api_image(file: UploadFile = File(...)):
    try:
        img = Image.open(io.BytesIO(file.file.read())).convert("RGB")
    except Exception:
        raise HTTPException(400, "That file is not a readable image.")
    img.thumbnail((448, 448))
    w, h = img.size
    base = float(p_art_many([img])[0])
    g, masked = 4, []
    for gy in range(g):
        for gx in range(g):
            m = img.copy()
            ImageDraw.Draw(m).rectangle([gx * w // g, gy * h // g, (gx + 1) * w // g, (gy + 1) * h // g], fill=(128, 128, 128))
            masked.append(m)
    H = np.array([max(0.0, base - float(p)) for p in p_art_many(masked)]).reshape(g, g)
    if H.max() > 0:
        H = H / H.max()  # occlusion sensitivity: which regions support "AI-generated"
    hm = Image.fromarray((H * 255).astype("uint8")).resize((w, h), Image.BICUBIC).point(lambda v: int(v * .6))
    overlay = Image.composite(Image.new("RGB", (w, h), (255, 0, 60)), img, hm)
    buf = io.BytesIO()
    overlay.save(buf, format="PNG")
    return {"probs": [1 - base, base], "heatmap": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()}
