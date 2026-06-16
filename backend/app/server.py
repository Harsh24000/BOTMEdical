import os
from pathlib import Path

from fastapi.staticfiles import StaticFiles

from .main import app

# Serve the compiled React frontend (copied to /app/static by the Dockerfile)
# from the same origin, so "/" returns the UI instead of a 404.
STATIC_DIR = Path(os.getenv("STATIC_DIR", "/app/static"))
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="frontend")
