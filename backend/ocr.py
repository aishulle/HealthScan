# ocr.py  🔍  DEBUG-ENABLED
from pathlib import Path
import io, mimetypes, traceback

import fitz               # ← requires *PyMuPDF* (pip install pymupdf)
import easyocr            # pip install easyocr
from PIL import Image      # pillow
from pdf2image import convert_from_bytes  # pip install pdf2image poppler-utils

# ──────────────────────────────────────────────────────────────
#  Initialise EasyOCR once (GPU optional)
# ──────────────────────────────────────────────────────────────
reader = easyocr.Reader(["en"], gpu=False)


# ──────────────────────────  Helper extractors  ──────────────────────────
def _text_from_pdf_bytes(raw: bytes) -> str:
    text_chunks = []
    with fitz.open(stream=raw, filetype="pdf") as doc:
        for page in doc:
            text_chunks.append(page.get_text())
    return "\n".join(text_chunks)


def _text_from_scanned_pdf(raw: bytes) -> str:
    pages = convert_from_bytes(raw, dpi=250)
    results = []
    for img in pages:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        results.extend(reader.readtext(buf.getvalue(), detail=0))
    return "\n".join(results)


def _text_from_image(raw: bytes) -> str:
    return "\n".join(reader.readtext(raw, detail=0))


# ────────────────────────────  Public API  ───────────────────────────────
def extract_text_from_file(filename: str, raw: bytes) -> str:
    """
    Decide which extractor to call based on extension / MIME type.
    Called from FastAPI router.
    """
    ext  = Path(filename).suffix.lower()
    mime, _ = mimetypes.guess_type(filename)

    print(f"\n📥  Received: {filename}  |  ext={ext}  mime={mime}")

    # ───── PDF ───────────────────────────────────────────────────────────
    if ext == ".pdf" or (mime and mime.startswith("application/pdf")):
        # Try selectable text first
        try:
            selectable = _text_from_pdf_bytes(raw)
            if selectable.strip():
                print("✅  Selectable text extracted (preview):", selectable[:200], "…")
                return selectable
            else:
                print("ℹ️  PDF has no selectable text, falling back to OCR …")
        except Exception as e:
            print("❌  Selectable-text extraction failed:")
            traceback.print_exc()

        # Fallback: rasterise + OCR
        try:
            ocr_text = _text_from_scanned_pdf(raw)
            print("✅  OCR from scanned PDF succeeded (preview):", ocr_text[:200], "…")
            return ocr_text
        except Exception:
            print("❌  OCR on scanned PDF failed:")
            traceback.print_exc()
            return ""

    # ───── Image (PNG / JPG / …) ─────────────────────────────────────────
    try:
        img_text = _text_from_image(raw)
        print("✅  Image OCR output (preview):", img_text[:200], "…")
        return img_text
    except Exception:
        print("❌  Image OCR failed:")
        traceback.print_exc()
        return ""
