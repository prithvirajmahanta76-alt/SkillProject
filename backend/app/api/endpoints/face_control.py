from typing import Optional, Dict
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


class FaceMetricsRequest(BaseModel):
    ear: float = Field(
        ...,
        description="Eye Aspect Ratio (EAR). Typical open eye ~0.30, closed eye < 0.20",
        example=0.18,
    )
    pitch: float = Field(
        ...,
        description="Head vertical pitch angle in degrees (+up, -down)",
        example=-18.5,
    )
    yaw: float = Field(
        ...,
        description="Head horizontal yaw angle in degrees (+right, -left)",
        example=2.1,
    )
    roll: Optional[float] = Field(default=0.0, description="Head roll tilt angle in degrees", example=0.5)
    blink_duration_ms: Optional[float] = Field(
        default=0.0,
        description="Duration eyes have been continuously below EAR threshold in ms",
        example=650.0,
    )
    consecutive_blinks: Optional[int] = Field(
        default=0,
        description="Count of rapid deliberate blinks detected within 1.5s window",
        example=2,
    )
    patient_id: Optional[str] = Field(default="PAT-MOTOR-01", example="PAT-MOTOR-01")

    model_config = {
        "json_schema_extra": {
            "example": {
                "ear": 0.18,
                "pitch": -18.5,
                "yaw": 2.1,
                "blink_duration_ms": 650.0,
                "consecutive_blinks": 2,
                "patient_id": "PAT-MOTOR-01",
            }
        }
    }


class FaceActionResponse(BaseModel):
    action: str = Field(
        ...,
        description="Detected control action: 'YES_CONFIRM', 'NO_CANCEL', 'DOUBLE_BLINK_EMERGENCY', 'IDLE'",
        example="YES_CONFIRM",
    )
    confidence: float = Field(..., example=0.92)
    emergency_alarm: bool = Field(..., description="True if emergency trigger sequence detected", example=False)
    metrics_summary: Dict[str, float] = Field(
        ...,
        example={"ear": 0.18, "pitch": -18.5, "yaw": 2.1},
    )
    feedback_message: str = Field(
        ...,
        example="Head Nod Detected (YES / Confirm)",
    )


class CalibrationRequest(BaseModel):
    baseline_ear: float = Field(..., example=0.31)
    baseline_pitch: float = Field(..., example=0.0)
    baseline_yaw: float = Field(..., example=0.0)
    patient_id: str = Field(..., example="PAT-MOTOR-01")


class CalibrationResponse(BaseModel):
    status: str = Field(..., example="calibrated")
    ear_threshold: float = Field(..., example=0.20)
    nod_threshold_degrees: float = Field(..., example=15.0)
    shake_threshold_degrees: float = Field(..., example=18.0)
    message: str = Field(..., example="Baseline calibrated successfully.")


@router.post(
    "/detect-gesture",
    response_model=FaceActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Motor Actions via Head Nod, Shake, or Eye Blink",
    description="Classifies motor intent from MediaPipe Face Mesh head angles and EAR calculation.",
)
async def detect_face_gesture(metrics: FaceMetricsRequest) -> FaceActionResponse:
    """Stub endpoint for face mesh motor impairment navigation."""
    # Logic simulation for contract demonstration:
    if metrics.consecutive_blinks and metrics.consecutive_blinks >= 2:
        return FaceActionResponse(
            action="DOUBLE_BLINK_EMERGENCY",
            confidence=0.98,
            emergency_alarm=True,
            metrics_summary={"ear": metrics.ear, "pitch": metrics.pitch, "yaw": metrics.yaw},
            feedback_message="Sustained Double Blink: Emergency Alarm Activated!",
        )
    elif metrics.pitch < -12.0 or metrics.pitch > 12.0:
        return FaceActionResponse(
            action="YES_CONFIRM",
            confidence=0.91,
            emergency_alarm=False,
            metrics_summary={"ear": metrics.ear, "pitch": metrics.pitch, "yaw": metrics.yaw},
            feedback_message="Head Nod Detected: YES / Confirm",
        )
    elif abs(metrics.yaw) > 15.0:
        return FaceActionResponse(
            action="NO_CANCEL",
            confidence=0.89,
            emergency_alarm=False,
            metrics_summary={"ear": metrics.ear, "pitch": metrics.pitch, "yaw": metrics.yaw},
            feedback_message="Head Shake Detected: NO / Cancel",
        )

    return FaceActionResponse(
        action="IDLE",
        confidence=0.95,
        emergency_alarm=False,
        metrics_summary={"ear": metrics.ear, "pitch": metrics.pitch, "yaw": metrics.yaw},
        feedback_message="Awaiting deliberate nod, shake, or blink.",
    )


@router.post(
    "/calibrate",
    response_model=CalibrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calibrate Resting Face Position for Patient",
    description="Registers baseline eye openness and head posture for customized motor navigation.",
)
async def calibrate_face_baseline(request: CalibrationRequest) -> CalibrationResponse:
    """Stub endpoint for personalized face mesh calibration."""
    return CalibrationResponse(
        status="calibrated",
        ear_threshold=round(request.baseline_ear * 0.65, 3),
        nod_threshold_degrees=15.0,
        shake_threshold_degrees=18.0,
        message=f"Patient {request.patient_id} baseline calibrated successfully.",
    )

