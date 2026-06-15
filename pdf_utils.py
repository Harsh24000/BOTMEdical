import io

from pypdf import PdfReader

MAX_CHARS = 200_000  # generous cap; lab reports are far smaller than this


class PdfExtractionError(Exception):
    pass


def extract_text_from_pdf(data: bytes) -> str:
    """Extract text from a text-based PDF.

    Raises PdfExtractionError if the file can't be read or contains no
    extractable text (e.g. a purely scanned/image PDF, which would need OCR).
    """
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:  # pragma: no cover - defensive
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
    if not combined:
        raise PdfExtractionError(
            "No text could be extracted. This looks like a scanned/image-only PDF; "
            "OCR is not supported in this version."
        )
    return combined[:MAX_CHARS]
