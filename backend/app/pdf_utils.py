import io
import base64
import groq

from pypdf import PdfReader
from .config import get_settings

MAX_CHARS = 200_000  # generous cap; lab reports are far smaller than this


class PdfExtractionError(Exception):
    pass


def _ocr_pdf(data: bytes) -> str:
    """Use PyMuPDF and Groq Vision model to OCR a scanned PDF."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise PdfExtractionError("PyMuPDF is not installed. OCR cannot run.")

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        raise PdfExtractionError(f"PyMuPDF failed to open PDF: {e}")
        
    images = []
    # Limit to first 4 pages to avoid massive token usage/costs
    for page_num in range(min(4, len(doc))):
        page = doc[page_num]
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        img_base64 = base64.b64encode(img_bytes).decode("utf-8")
        images.append(img_base64)
        
    if not images:
        return ""
        
    content = [
        {
            "type": "text", 
            "text": "This is a scanned lab report. Extract all the text, tables, and lab results exactly as they appear. Do not summarize."
        }
    ]
    for img in images:
        content.append({
            "type": "image_url", 
            "image_url": {"url": f"data:image/png;base64,{img}"}
        })
        
    settings = get_settings()
    client = groq.Groq(api_key=settings.groq_api_key or None)
    
      try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": content}],
            temperature=0.1,
            max_tokens=4000,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise PdfExtractionError(f"OCR Vision API failed: {e}")

def extract_text_from_pdf(data: bytes) -> str:
    """Extract text from a text-based PDF.

    Falls back to Groq Vision OCR if the file contains no extractable text.
    """
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:
        raise PdfExtractionError(f"Could not read PDF: {exc}") from exc

    parts: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if text.strip():
            parts.append(text)

    combined = "\n\n".join(parts).strip()
    
    # If no text was extracted, it's likely a scanned image. Fallback to OCR.
    if len(combined) < 50:
        combined = _ocr_pdf(data).strip()
        
    if not combined:
        raise PdfExtractionError(
            "No text could be extracted. OCR also failed to identify text."
        )
        
    return combined[:MAX_CHARS]
