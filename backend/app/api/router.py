from fastapi import APIRouter
from app.api.endpoints import (
    consultation,
    emergency,
    face_control,
    gesture,
    speech,
    translate,
    vision_reader,
)

api_router = APIRouter()

api_router.include_router(gesture.router, prefix="/gesture", tags=["Gesture Recognition"])
api_router.include_router(translate.router, prefix="/translate", tags=["Translation & Grammar"])
api_router.include_router(vision_reader.router, prefix="/vision", tags=["Vision & OCR Reader"])
api_router.include_router(face_control.router, prefix="/face-control", tags=["Face Mesh Motor Control"])
api_router.include_router(speech.router, prefix="/speech", tags=["Regional Speech & Signs"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["Emergency & SOS"])
api_router.include_router(consultation.router, prefix="/consultation", tags=["Consultation & OPD Slip"])


