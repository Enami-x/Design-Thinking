"""
main.py — FastAPI application entry point.
Run with:  uvicorn app.main:app --reload   (from backend/ directory)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

from app.routes import safety, incidents


# ── Startup: warm up the ML model ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.ml import model as ml
        ml._load_model()
        print("[OK] ML model loaded successfully.")
    except FileNotFoundError as e:
        print(f"[WARN] {e}")
        print("  Run `python -m app.ml.train` to generate model.pkl before starting the server.")
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SafeWalk API",
    description="Backend for the SafeWalk women's safety navigation app.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(safety.router)
app.include_router(incidents.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "SafeWalk API"}
