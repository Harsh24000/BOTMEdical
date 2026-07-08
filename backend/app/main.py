import uuid

import groq
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .llm_client import analyze_report, stream_chat
from .config import get_settings
from .models import ChatRequest, ReportAnalysis, UploadResponse
from .pdf_utils import PdfExtractionError, extract_text_from_pdf
from .store import Session, get_session, save_session

settings = get_settings()

app = FastAPI(title="NirogGyan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024

# Free chat exchanges allowed before the paywall gate kicks in.
FREE_CHAT_LIMIT = 1


@app.post("/api/upload", response_model=UploadResponse)
async def upload_report(
    file: UploadFile = File(...),
    location: str | None = Form(None)
) -> UploadResponse:
    if not settings.groq_api_key:
        raise HTTPException(500, "Server is missing GROQ_API_KEY.")

    if (file.content_type or "") not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Please upload a PDF file.")

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large (max 15 MB).")

    try:
        report_text = extract_text_from_pdf(data)
    except PdfExtractionError as exc:
        raise HTTPException(422, str(exc)) from exc

    try:
        analysis = analyze_report(report_text, location)
    except groq.APIError as exc:
        raise HTTPException(502, f"Analysis failed: {exc}") from exc

    session_id = str(uuid.uuid4())
    session = Session(session_id=session_id, report_text=report_text, analysis=analysis)
    save_session(session)

    return UploadResponse(session_id=session_id, analysis=analysis)


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not settings.groq_api_key:
        raise HTTPException(500, "Server is missing GROQ_API_KEY.")

    session = get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found or expired.")

    if session.chat_count >= FREE_CHAT_LIMIT:
        # 402 Payment Required — no payment provider wired in yet, this is
        # the gate stub. Frontend catches this status and shows the
        # upgrade CTA instead of the chat input.
        raise HTTPException(402, "Free question limit reached. Upgrade to keep chatting with Dr. Gyan.")

    # stream_chat yields string chunks directly
    return StreamingResponse(
        stream_chat(session, req.message), media_type="text/plain"
    )
