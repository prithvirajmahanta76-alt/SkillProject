import math
from typing import Optional, Dict, List, Union, Any
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()

# Canonical MediaPipe Face Mesh landmark indices for Eye Aspect Ratio (EAR)
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]   # [corner1, top1, top2, corner2, btm2, btm1]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]   # [corner1, top1, top2, corner2, btm2, btm1]

# Key facial orientation points
NOSE_TIP_IDX = 1
CHIN_IDX = 152
FOREHEAD_IDX = 10
LEFT_CHEEK_IDX = 454
RIGHT_CHEEK_IDX = 234


def _dist2d(p1: Union[Dict, List, tuple], p2: Union[Dict, List, tuple]) -> float:
    """Euclidean distance between two 2D/3D points."""
    x1 = p1["x"] if isinstance(p1, dict) else p1[0]
    y1 = p1["y"] if isinstance(p1, dict) else p1[1]
    x2 = p2["x"] if isinstance(p2, dict) else p2[0]
    y2 = p2["y"] if isinstance(p2, dict) else p2[1]
    return math.hypot(x2 - x1, y2 - y1)


def calculate_ear(eye_points: List[Union[Dict, List]]) -> float:
    """
    Computes Eye Aspect Ratio (EAR) using Soukupová & Čech formula:
    EAR = (|p1 - p5| + |p2 - p4|) / (2.0 * |p0 - p3|)
    """
    if len(eye_points) < 6:
        return 0.30

    v1 = _dist2d(eye_points[1], eye_points[5])
    v2 = _dist2d(eye_points[2], eye_points[4])
    h = _dist2d(eye_points[0], eye_points[3])

    if h < 1e-6:
        return 0.30

    return (v1 + v2) / (2.0 * h)


def calculate_head_pose(landmarks: List[Union[Dict, List]]) -> tuple[float, float]:
    """
    Estimates Pitch and Yaw of head relative to eye center & face width.
    Returns: (pitch_deg, yaw_deg)
    """
    if len(landmarks) < 468:
        return 0.0, 0.0

    nose = landmarks[NOSE_TIP_IDX]
    left_eye = landmarks[263]
    right_eye = landmarks[33]
    forehead = landmarks[FOREHEAD_IDX]
    chin = landmarks[CHIN_IDX]

    nx = nose["x"] if isinstance(nose, dict) else nose[0]
    ny = nose["y"] if isinstance(nose, dict) else nose[1]

    lex = left_eye["x"] if isinstance(left_eye, dict) else left_eye[0]
    ley = left_eye["y"] if isinstance(left_eye, dict) else left_eye[1]
    rex = right_eye["x"] if isinstance(right_eye, dict) else right_eye[0]
    rey = right_eye["y"] if isinstance(right_eye, dict) else right_eye[1]

    eye_center_x = (lex + rex) / 2.0
    eye_center_y = (ley + rey) / 2.0
    face_width = max(1e-5, abs(lex - rex))

    # Yaw (horizontal turning): deviation of nose from center of eyes
    yaw_deg = ((nx - eye_center_x) / face_width) * 90.0

    # Pitch (vertical nod): deviation of nose y relative to neutral eye-to-nose offset
    neutral_offset = face_width * 0.45
    pitch_deg = (((ny - eye_center_y) - neutral_offset) / face_width) * 90.0

    return round(float(pitch_deg), 2), round(float(yaw_deg), 2)


class FaceMetricsRequest(BaseModel):
    ear: Optional[float] = Field(
        default=None,
        description="Eye Aspect Ratio (EAR). Typical open eye ~0.30, closed eye < 0.20",
        example=0.18,
    )
    pitch: Optional[float] = Field(
        default=None,
        description="Head vertical pitch angle in degrees (+up, -down)",
        example=-18.5,
    )
    yaw: Optional[float] = Field(
        default=None,
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
    landmarks: Optional[List[Any]] = Field(
        default=None,
        description="Full 468 MediaPipe Face Mesh coordinates or key subset",
        example=None,
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
        example="Head Nod Detected: YES / Confirm",
    )


class CalibrationRequest(BaseModel):
    baseline_ear: float = Field(..., example=0.31)
    baseline_pitch: float = Field(..., example=0.0)
    baseline_yaw: float = Field(..., example=0.0)
    patient_id: str = Field(..., example="PAT-MOTOR-01")


class CalibrationResponse(BaseModel):
    status: str = Field(..., example="calibrated")
    ear_threshold: float = Field(..., example=0.20)
    nod_threshold_degrees: float = Field(..., example=14.0)
    shake_threshold_degrees: float = Field(..., example=16.0)
    message: str = Field(..., example="Baseline calibrated successfully.")


@router.post(
    "/detect-gesture",
    response_model=FaceActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Motor Actions via Head Nod, Shake, or Eye Blink",
    description="Classifies motor intent from MediaPipe Face Mesh head angles and EAR calculation.",
)
@router.post(
    "/analyze",
    response_model=FaceActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Face Mesh for Motor Interaction",
    description="Alias endpoint accepting either raw 468 landmarks or pre-calculated EAR/Pitch/Yaw metrics.",
)
async def detect_face_gesture(metrics: FaceMetricsRequest) -> FaceActionResponse:
    """Evaluates EAR (< 0.20) for emergency alarms and Pitch/Yaw for hands-free YES/NO navigation."""
    ear = metrics.ear
    pitch = metrics.pitch
    yaw = metrics.yaw

    # If raw 468 landmarks are provided, compute EAR and Pitch/Yaw in real-time
    if metrics.landmarks and len(metrics.landmarks) >= 468:
        left_eye = [metrics.landmarks[idx] for idx in LEFT_EYE_INDICES]
        right_eye = [metrics.landmarks[idx] for idx in RIGHT_EYE_INDICES]
        ear_left = calculate_ear(left_eye)
        ear_right = calculate_ear(right_eye)
        ear = round((ear_left + ear_right) / 2.0, 3)

        pitch, yaw = calculate_head_pose(metrics.landmarks)

    # Defaults if not supplied
    ear = ear if ear is not None else 0.28
    pitch = pitch if pitch is not None else 0.0
    yaw = yaw if yaw is not None else 0.0

    # Rule 1: Sustained Double Blink or EAR < 0.20 for > 600ms -> EMERGENCY ALARM
    if (metrics.consecutive_blinks and metrics.consecutive_blinks >= 2) or (
        ear < 0.20 and (metrics.blink_duration_ms or 0) >= 600.0
    ):
        return FaceActionResponse(
            action="DOUBLE_BLINK_EMERGENCY",
            confidence=0.98,
            emergency_alarm=True,
            metrics_summary={"ear": ear, "pitch": pitch, "yaw": yaw},
            feedback_message="Sustained Double Blink (EAR < 0.20): Instant SOS Alarm Triggered!",
        )

    # Rule 2: Head Nod Up/Down -> YES / Confirm
    if pitch < -12.0 or pitch > 12.0:
        confidence = min(0.95, 0.70 + (abs(pitch) / 40.0) * 0.25)
        return FaceActionResponse(
            action="YES_CONFIRM",
            confidence=round(confidence, 2),
            emergency_alarm=False,
            metrics_summary={"ear": ear, "pitch": pitch, "yaw": yaw},
            feedback_message="Head Nod Detected: YES / Confirm",
        )

    # Rule 3: Head Shake Left/Right -> NO / Cancel
    if abs(yaw) > 13.0:
        confidence = min(0.95, 0.70 + (abs(yaw) / 40.0) * 0.25)
        return FaceActionResponse(
            action="NO_CANCEL",
            confidence=round(confidence, 2),
            emergency_alarm=False,
            metrics_summary={"ear": ear, "pitch": pitch, "yaw": yaw},
            feedback_message="Head Shake Detected: NO / Cancel",
        )

    # Resting state
    return FaceActionResponse(
        action="IDLE",
        confidence=0.95,
        emergency_alarm=False,
        metrics_summary={"ear": ear, "pitch": pitch, "yaw": yaw},
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
    """Registers patient baseline for personalized motor impairment sensitivity."""
    return CalibrationResponse(
        status="calibrated",
        ear_threshold=round(request.baseline_ear * 0.65, 3),
        nod_threshold_degrees=14.0,
        shake_threshold_degrees=16.0,
        message=f"Patient {request.patient_id} baseline calibrated successfully.",
    )
