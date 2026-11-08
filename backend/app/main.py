import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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

