import uuid

import groq
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .llm_client import analyze_report, stream_chat
from .config import get_settings
from .models import ChatRequest, ReportAnalysis, UploadResponse
from .pdf_utils import PdfExtractionError, extract_text_from_pdf
from .store import Session, get_session, save_session

settings = get_settings()

app = FastAPI(title="NirogGyan Lab Report Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "analysis_model": settings.analysis_model,
        "chat_model": settings.chat_model,
    }


@app.post("/api/upload", response_model=UploadResponse)
async def upload_report(file: UploadFile = File(...)) -> UploadResponse:
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
        analysis = analyze_report(report_text)
    except groq.APIError as exc:
        raise HTTPException(502, f"Analysis failed: {exc}") from exc

    try:
        validated = ReportAnalysis(**analysis)
    except (TypeError, ValueError) as exc:
        raise HTTPException(502, f"Model returned an unexpected analysis format: {exc}") from exc

    session = Session(
        session_id=uuid.uuid4().hex,
        report_text=report_text,
        analysis=analysis,
    )
    save_session(session)

    return UploadResponse(session_id=session.session_id, analysis=validated)


@app.post("/api/chat")
def chat(req: ChatRequest) -> StreamingResponse:
    if not settings.groq_api_key:
        raise HTTPException(500, "Server is missing GROQ_API_KEY.")

    session = get_session(req.session_id)
    if session is None:
        raise HTTPException(404, "Unknown session. Please upload a report first.")

    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty.")

    def generate():
        try:
            for chunk in stream_chat(session, message):
                yield chunk
        except groq.APIError as exc:  # surface API errors into the stream
            yield f"\n\n[Error: {exc}]"

    # Plain text/event-stream-like chunked response; the frontend reads the body
    # incrementally. Disable buffering proxies may add.
    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
