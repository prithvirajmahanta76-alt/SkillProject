from typing import List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


class MedicineScanRequest(BaseModel):
    image_base64: str = Field(
        ...,
        description="Base64 encoded JPEG/PNG frame from the patient's webcam or smartphone viewfinder",
        example="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
    )
    preferred_language: str = Field(
        default="en",
        description="Language for spoken summary: 'en', 'hi', 'or', 'te'",
        example="en",
    )
    user_context: Optional[str] = Field(default="prescription_check", example="prescription_check")

    model_config = {
        "json_schema_extra": {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                "preferred_language": "en",
                "user_context": "prescription_check",
            }
        }
    }


class MedicineScanResponse(BaseModel):
    medicine_name: str = Field(..., example="Paracetamol")
    strength: Optional[str] = Field(default=None, example="500 mg")
    active_ingredients: List[str] = Field(
        default_factory=list,
        example=["Acetaminophen (Paracetamol) 500mg"],
    )
    dosage_instructions: str = Field(
        ...,
        example="Take one tablet after food with water, every 6-8 hours as needed.",
    )
    expiry_date: Optional[str] = Field(default=None, example="November 2027")
    is_expired: bool = Field(default=False, example=False)
    warnings: List[str] = Field(
        default_factory=list,
        example=["Do not exceed 4000mg in 24 hours", "Avoid alcohol consumption"],
    )
    spoken_summary: str = Field(
        ...,
        description="High-clarity, text-to-speech optimized audio script designed for blind patients",
        example="Paracetamol 500 milligram. Expiry Date: November 2027. Take one tablet after food.",
    )
    confidence: float = Field(..., example=0.96)


class SignboardScanRequest(BaseModel):
    image_base64: str = Field(
        ...,
        description="Base64 encoded snapshot of hospital doors, corridors, or directional signs",
        example="data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    )
    preferred_language: str = Field(default="en", example="en")

    model_config = {
        "json_schema_extra": {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                "preferred_language": "en",
            }
        }
    }


class SignboardScanResponse(BaseModel):
    detected_text: str = Field(..., example="EMERGENCY OPD & TRIAGE ROOM 102")
    facility_type: str = Field(..., example="Emergency Room / OPD")
    directional_guidance: str = Field(
        ...,
        example="You are facing the Emergency OPD entrance. The automatic door is straight ahead 5 meters.",
    )
    spoken_summary: str = Field(
        ...,
        example="Emergency Outpatient Department, Room 102. Straight ahead.",
    )
    emergency_facility: bool = Field(..., example=True)


@router.post(
    "/scan-medicine",
    response_model=MedicineScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan Medicine Strip or Prescription with Gemini Vision",
    description="Extracts drug name, dosage, expiry warnings, and produces an instant audio summary for blind users.",
)
async def scan_medicine(request: MedicineScanRequest) -> MedicineScanResponse:
    """Stub endpoint for Gemini Vision medicine inspection."""
    return MedicineScanResponse(
        medicine_name="Paracetamol",
        strength="500 mg",
        active_ingredients=["Acetaminophen (Paracetamol) 500mg"],
        dosage_instructions="Take one tablet after food with water, twice a day.",
        expiry_date="November 2027",
        is_expired=False,
        warnings=["Do not exceed 4000mg in 24 hours.", "Consult doctor if fever persists."],
        spoken_summary="Paracetamol 500 milligrams. Expiry Date: November 2027. Take one tablet after food.",
        confidence=0.965,
    )


@router.post(
    "/scan-signboard",
    response_model=SignboardScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan Hospital Signboard & Corridor Direction",
    description="Recognizes hospital department signboards, room numbers, and provides spatial audio guidance.",
)
async def scan_signboard(request: SignboardScanRequest) -> SignboardScanResponse:
    """Stub endpoint for Gemini Vision hospital signboard navigation."""
    return SignboardScanResponse(
        detected_text="EMERGENCY OPD & TRIAGE ROOM 102",
        facility_type="Emergency Room / OPD",
        directional_guidance="You are facing Emergency OPD Room 102. Entrance door is 5 meters ahead.",
        spoken_summary="Emergency Outpatient Department, Room 102. Directly ahead.",
        emergency_facility=True,
    )

