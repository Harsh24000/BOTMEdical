import io
import base64
import groq

from pypdf import PdfReader
from .config import get_settings

MAX_CHARS = 200_000  # generous cap; lab reports are far smaller than this

# Cap the longest side of any rendered OCR image to this many pixels.
# Fixing DPI alone (e.g. dpi=150) breaks on PDFs with abnormal page sizes —
# e.g. a "photo to PDF" export that maps image pixels 1:1 to PDF points
# (a 4000x1800pt page is NOT a physically huge page, it's a phone photo
# with points misused as pixels). Rendering that at 150 DPI produces an
# ~8300x3750px image — tens of MB base64-encoded, well past Groq's request
# size limit, causing a 413. Capping the OUTPUT pixel size instead of the
# DPI means every PDF, regardless of how its page size was set, renders to
# a bounded, safe payload.
MAX_OCR_DIMENSION_PX = 1600
MAX_OCR_DPI = 200  # ceiling so tiny pages don't render at absurdly high DPI


class PdfExtractionError(Exception):
    pass


def _dpi_for_page(page, max_dimension_px: int) -> float:
    """Pick a DPI that renders this page's longest side to at most
    max_dimension_px, regardless of how large or small the page's own
    point dimensions are. No floor is applied here deliberately: for a
    pathologically large page (e.g. a "photo to PDF" export with pixels
    mapped 1:1 to points), the low DPI this produces is exactly what's
    needed to respect the pixel cap — flooring it would silently defeat
    the cap, which is what caused the original 413."""
    longest_pt = max(page.rect.width, page.rect.height)
    if longest_pt <= 0:
        return int(MAX_OCR_DPI)
    dpi = (max_dimension_px / longest_pt) * 72
    return int(min(MAX_OCR_DPI, dpi))


def _render_pages_as_jpeg_b64(data: bytes, max_dimension_px: int) -> list[str]:
    """Render up to the first 4 pages as base64 JPEGs, each capped to
    max_dimension_px on the longest side. JPEG instead of PNG cuts payload
    size significantly for photographic content like scanned reports."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise PdfExtractionError("PyMuPDF is not installed. OCR cannot run.")

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        raise PdfExtractionError(f"PyMuPDF failed to open PDF: {e}")

    images = []
    for page_num in range(min(4, len(doc))):
        page = doc[page_num]
        dpi = _dpi_for_page(page, max_dimension_px)
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("jpg", jpg_quality=85)
        images.append(base64.b64encode(img_bytes).decode("utf-8"))
    return images


def _call_ocr(images: list[str]) -> str:
    content = [
        {
            "type": "text",
            "text": "This is a scanned lab report. Extract all the text, tables, and lab results exactly as they appear. Do not summarize.",
        }
    ]
    for img in images:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{img}"},
        })

    settings = get_settings()
    client = groq.Groq(api_key=settings.groq_api_key or None)

    response = client.chat.completions.create(
        # IMPORTANT: this must be a vision-capable model — openai/gpt-oss-120b
        # is text-only on Groq and will 400 with "content must be a string"
        # if sent image_url content (learned this the hard way).
        # meta-llama/llama-4-scout-17b-16e-instruct (previously here) and
        # meta-llama/llama-4-maverick-17b-128e-instruct have both been
        # deprecated by Groq. qwen/qwen3.6-27b is the current vision-capable
        # replacement, but Groq lists it as a PREVIEW model (not guaranteed
        # stable, can be discontinued at short notice). Check
        # console.groq.com/docs/vision for the current production-ready
        # vision model before relying on this long-term.
        model="qwen/qwen3.6-27b",
        messages=[{"role": "user", "content": content}],
        temperature=0.1,
        max_tokens=4000,
    )
    return response.choices[0].message.content or ""


def _ocr_pdf(data: bytes) -> str:
    """OCR a scanned/image-based PDF via Groq Vision, with a size-based
    retry: if the first attempt is still too large for Groq's request
    limit, shrink further and try once more before giving up."""
    for max_dimension_px in (MAX_OCR_DIMENSION_PX, 1000):
        images = _render_pages_as_jpeg_b64(data, max_dimension_px)
        if not images:
            return ""
        try:
            return _call_ocr(images)
        except groq.APIStatusError as e:
            if e.status_code == 413:
                continue  # retry with the smaller dimension cap
            raise PdfExtractionError(f"OCR Vision API failed: {e}")
        except Exception as e:
            raise PdfExtractionError(f"OCR Vision API failed: {e}")

    raise PdfExtractionError(
        "This scan is too large for OCR even after compression. "
        "Try a lower-resolution scan or a smaller crop of the report."
    )


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
