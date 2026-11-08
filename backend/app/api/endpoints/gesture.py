from typing import List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0, 1.0]", example=0.523)
    y: float = Field(..., description="Normalized Y coordinate [0.0, 1.0]", example=0.612)
    z: float = Field(..., description="Normalized Z coordinate (depth)", example=-0.045)
    visibility: Optional[float] = Field(default=None, description="Landmark visibility confidence", example=0.98)


class GestureAlternative(BaseModel):
    sign: str = Field(..., description="Alternative sign candidate", example="HELP")
    confidence: float = Field(..., description="Confidence score [0.0, 1.0]", example=0.15)


class GesturePredictRequest(BaseModel):
    landmarks: Optional[List[LandmarkPoint]] = Field(
        default=None,
        description="21 MediaPipe 3D hand landmarks",
        example=[
            {"x": 0.52, "y": 0.61, "z": -0.04, "visibility": 0.99},
            {"x": 0.55, "y": 0.58, "z": -0.03, "visibility": 0.98},
        ],
    )
    raw_coordinates: Optional[List[float]] = Field(
        default=None,
        description="Flattened 63-dim normalized coordinates [x0, y0, z0, ... x20, y20, z20]",
        example=[0.52, 0.61, -0.04, 0.55, 0.58, -0.03],
    )
    handedness: str = Field(default="Right", description="Hand detected ('Right' or 'Left')", example="Right")
    timestamp_ms: Optional[int] = Field(default=None, description="Frame capture timestamp", example=1700000000000)

    model_config = {
        "json_schema_extra": {
            "example": {
                "handedness": "Right",
                "raw_coordinates": [0.52, 0.61, -0.04, 0.55, 0.58, -0.03],
                "timestamp_ms": 1700000000000,
            }
        }
    }


class GesturePredictResponse(BaseModel):
    sign: str = Field(..., description="Recognized ISL sign name", example="PAIN")
    gloss: str = Field(..., description="Standardized ISL gloss representation", example="PAIN")
    confidence: float = Field(..., description="Prediction confidence score", example=0.942)
    is_confident: bool = Field(..., description="True if confidence exceeds decision threshold (e.g. >= 0.70)", example=True)
    inference_time_ms: float = Field(..., description="Latency of classifier execution in milliseconds", example=18.4)
    alternatives: List[GestureAlternative] = Field(
        default_factory=list,
        description="Top fallback gesture candidates",
        example=[{"sign": "DOCTOR", "confidence": 0.035}, {"sign": "HOSPITAL", "confidence": 0.012}],
    )


class ISLSignVocabularyItem(BaseModel):
    sign_id: str = Field(..., example="pain")
    gloss: str = Field(..., example="PAIN")
    category: str = Field(..., example="medical", description="medical, emergency, greeting, or directional")
    description: str = Field(..., example="Expresses physical pain or discomfort")
    video_asset_url: str = Field(..., example="/assets/signs/pain.mp4")


class VocabularyResponse(BaseModel):
    total_signs: int = Field(..., example=25)
    signs: List[ISLSignVocabularyItem]


@router.post(
    "/predict",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict ISL Sign from Hand Landmarks",
    description="Ingests 21 3D MediaPipe hand landmarks and returns predicted sign with sub-30ms latency.",
)
async def predict_gesture(request: GesturePredictRequest) -> GesturePredictResponse:
    """Stub endpoint for ISL gesture classification."""
    return GesturePredictResponse(
        sign="PAIN",
        gloss="PAIN",
        confidence=0.942,
        is_confident=True,
        inference_time_ms=18.4,
        alternatives=[
            GestureAlternative(sign="DOCTOR", confidence=0.035),
            GestureAlternative(sign="HELP", confidence=0.015),
        ],
    )


@router.get(
    "/vocabulary",
    response_model=VocabularyResponse,
    status_code=status.HTTP_200_OK,
    summary="List Supported 25 Core ISL Signs",
    description="Returns the full 25-sign medical & emergency vocabulary supported by SignBridge.",
)
async def get_vocabulary() -> VocabularyResponse:
    """Returns the pre-defined 25 core ISL sign lexicon."""
    sample_lexicon = [
        ISLSignVocabularyItem(
            sign_id="pain",
            gloss="PAIN",
            category="medical",
            description="Patient indicating pain or ache",
            video_asset_url="/assets/signs/pain.mp4",
        ),
        ISLSignVocabularyItem(
            sign_id="doctor",
            gloss="DOCTOR",
            category="medical",
            description="Requesting or referring to a physician",
            video_asset_url="/assets/signs/doctor.mp4",
        ),
        ISLSignVocabularyItem(
            sign_id="medicine",
            gloss="MEDICINE",
            category="medical",
            description="Prescription or tablet",
            video_asset_url="/assets/signs/medicine.mp4",
        ),
        ISLSignVocabularyItem(
            sign_id="help",
            gloss="HELP",
            category="emergency",
            description="Immediate assistance requested",
            video_asset_url="/assets/signs/help.mp4",
        ),
        ISLSignVocabularyItem(
            sign_id="water",
            gloss="WATER",
            category="daily_needs",
            description="Requesting water to drink",
            video_asset_url="/assets/signs/water.mp4",
        ),
    ]
    return VocabularyResponse(total_signs=len(sample_lexicon), signs=sample_lexicon)

