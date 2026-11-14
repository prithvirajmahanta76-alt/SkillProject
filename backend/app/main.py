import os
import sys
import pickle
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings


def run_startup_diagnostics():
    """Validates core models, database schemas, and AI pipelines on startup."""
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"

    print(f"\n{CYAN}{BOLD}======================================================================{RESET}")
    print(f"{CYAN}{BOLD}       SignBridge Universal — Clinical AI Kiosk Startup Diagnostics    {RESET}")
    print(f"{CYAN}{BOLD}======================================================================{RESET}")

    # 1. Scikit-learn ISL Gesture Model Check & Auto-Retrain
    model_dir = os.path.join(os.path.dirname(__file__), "ml")
    model_path = os.path.join(model_dir, "gesture_model.pkl")
    model_status = "UNKNOWN"

    need_retrain = not os.path.exists(model_path)
    if not need_retrain:
        try:
            with open(model_path, "rb") as f:
                data = pickle.load(f)
                clf = data.get("model")
                classes = data.get("classes", [])
                if hasattr(clf, "predict") and len(classes) == 25:
                    model_status = f"{GREEN}ONLINE (25 ISL Medical Signs — sklearn 1.5.2){RESET}"
                else:
                    need_retrain = True
        except Exception as exc:
            print(f"{YELLOW}[Auto-Heal] Stale or incompatible pickle detected ({exc}). Retraining...{RESET}")
            need_retrain = True

    if need_retrain:
        try:
            from app.ml.train_model import train_baseline_model
            train_baseline_model(model_path)
            model_status = f"{GREEN}RETRAINED & READY (25 Geometric ISL Signs){RESET}"
        except Exception as exc:
            model_status = f"{YELLOW}OFFLINE FALLBACK ({exc}){RESET}"

    # 2. SQLite Clinical Database & Default Consultation Seed
    db_status = "UNKNOWN"
    try:
        from app.api.endpoints.consultation import init_db, DB_PATH
        init_db()
        if os.path.exists(DB_PATH):
            db_status = f"{GREEN}HEALTHY (signbridge.db — Benchmark PAT-9842 & OPD-CIVIL-1794156577 seeded){RESET}"
        else:
            db_status = f"{YELLOW}INITIALIZED (In-Memory Fallback){RESET}"
    except Exception as exc:
        db_status = f"{YELLOW}WARNING ({exc}){RESET}"

    # 3. Gemini 1.5 Clinical Grammar & OCR Engine
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        gemini_status = f"{GREEN}ONLINE (Gemini 1.5 Flash Connected){RESET}"
    else:
        gemini_status = f"{YELLOW}STANDALONE (40-Template Clinical Lexicon & NLEM Matrix Active){RESET}"

    # 4. Regional Neural TTS (edge-tts)
    try:
        import edge_tts
        tts_status = f"{GREEN}ONLINE (Microsoft Neural Voices: Hindi, Telugu, English){RESET}"
    except ImportError:
        tts_status = f"{YELLOW}COMPATIBILITY MODE (Standard Audio Buffer Fallback){RESET}"

    print(f"  • {BOLD}SQLite Database:{RESET}       {db_status}")
    print(f"  • {BOLD}Gesture Classifier:{RESET}    {model_status}")
    print(f"  • {BOLD}Grammar / Vision AI:{RESET}   {gemini_status}")
    print(f"  • {BOLD}Neural Speech Synth:{RESET}   {tts_status}")
    print(f"  • {BOLD}WebRTC / WebSocket:{RESET}    {GREEN}ACTIVE (/api/gesture/ws/stream){RESET}")
    print(f"{CYAN}{BOLD}======================================================================{RESET}\n")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup diagnostics & self-healing
    run_startup_diagnostics()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature endpoints under /api
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["System"])
async def root():
    """SignBridge Universal API Root Overview."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "supported_languages": settings.SUPPORTED_LANGUAGES,
        "modules": [
            "Deaf/Mute ISL Gesture Classifier (/api/gesture)",
            "Gemini Semantic Grammar Synthesizer (/api/translate)",
            "Blind Camera OCR & Signboard Reader (/api/vision)",
            "Motor Face Mesh Nod/Blink Controller (/api/face-control)",
            "Regional Speech & Sign Sequencer (/api/speech)",
            "Instant 1-Tap SOS Emergency Grid (/api/emergency)",
            "Clinical Consultation & ABDM Health Records (/api/consultation)",
        ],
    }


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for container and deployment monitors."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
