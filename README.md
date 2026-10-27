# AI Slop Detector: working web app

Landing page + app. Frontend: React + Vite + three.js. Backend: FastAPI serving the real models
(RoBERTa trained on HC3, GPT-2 perplexity and burstiness, Swin image detector).

## Run (two terminals in VS Code)
Terminal 1, backend (first run downloads the models):
```
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --port 8000
```
Terminal 2, frontend:
```
npm install
npm run dev        # http://localhost:5173
```
If the backend is not running, the site falls back to a rule-based demo mode for text.
