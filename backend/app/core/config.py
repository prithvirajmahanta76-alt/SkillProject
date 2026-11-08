import os
from typing import List
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PROJECT_NAME: str = "SignBridge Universal API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Multi-modal assistive healthcare and communication bridge for "
        "Deaf/Mute, Blind/Low-Vision, Motor-Impaired, and Elderly patients."
    )
    API_PREFIX: str = "/api"

    # AI & Cloud Configuration
    GEMINI_API_KEY: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    FIREBASE_CONFIG: str = Field(default_factory=lambda: os.getenv("FIREBASE_CONFIG", "{}"))

    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    # Localization
    DEFAULT_LANGUAGE: str = "en-IN"
    SUPPORTED_LANGUAGES: List[str] = [
        "en-IN",  # Indian English
        "hi-IN",  # Hindi
        "or-IN",  # Odia
        "te-IN",  # Telugu
    ]


settings = Settings()

