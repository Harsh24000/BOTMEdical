# NirogGyan — AI Lab Report Assistant

A RAG-style AI chatbot for **NirogGyan**. A user uploads their generated lab
report (PDF); the AI analyzes it, explains what the results mean and what to do
next, and then answers follow-up questions about risks and conditions — doing
real medical research (web search with citations) along the way.

> ⚠️ Educational tool only. It does **not** provide a medical diagnosis and is not
> a substitute for advice from a qualified healthcare professional.

## How it works

```
PDF upload ──► extract text (pypdf) ──► Groq JSON analysis ──► UI panel
                                              │
                                              └─► chat (groq/compound + web search) ──► streamed answers
```

- **Backend** — FastAPI. `/api/upload` extracts text from the PDF and runs a
  one-shot **structured analysis** via Groq JSON mode. `/api/chat` streams a
  research-capable conversation grounded in the report using the `groq/compound`
  model, which has **built-in web search** so answers are evidence-based and cited.
- **Frontend** — React + Vite + TypeScript. Upload screen, analysis panel
  (findings, risks, next steps), and a streaming chat.
- **Models (Groq, configurable)** — analysis: `llama-3.3-70b-versatile` (JSON
  mode); chat: `groq/compound` (web search built in).

The "RAG" grounding here is the user's own report: extracted report text plus the
structured analysis are injected into the chat system prompt, and the compound
model's web search retrieves up-to-date medical evidence on demand.

## Project layout

```
backend/
  app/
    main.py            FastAPI app + routes
    llm_client.py      analysis + streaming chat (Groq SDK)
    prompts.py         system prompts (safety-first medical framing)
    pdf_utils.py       PDF text extraction
    models.py          schemas + analysis JSON schema
    store.py           in-memory session store
    config.py          settings (.env)
  requirements.txt
frontend/
  src/                 React app (upload, analysis, chat)
```

## Running locally

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

Get a free API key at https://console.groq.com/keys.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api/*` to the backend on
port 8000.

## Notes & next steps

- Sessions are kept **in memory** — fine for a demo, but use Redis/a database
  before running multiple workers or persisting anything.
- Only **text-based PDFs** are supported. Scanned/image-only reports would need
  OCR (not included).
- No PHI/PII is stored to disk; report text lives only in the in-memory session
  for the life of the process. Review privacy/compliance requirements before any
  real-world use.
