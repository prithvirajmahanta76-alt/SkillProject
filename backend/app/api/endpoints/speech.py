from typing import List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text string to synthesize to voice", example="कृपया यहाँ बैठिए, डॉक्टर आ रहे हैं।")
    language: str = Field(
        default="hi-IN",
        description="Regional Indian language: 'en-IN', 'hi-IN', 'or-IN', 'te-IN'",
        example="hi-IN",
    )
    voice_gender: Optional[str] = Field(default="FEMALE", example="FEMALE")
    speech_rate: Optional[float] = Field(default=1.0, description="Speed multiplier (0.5 to 2.0)", example=1.0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Doctor, I am experiencing severe stomach pain.",
                "language": "en-IN",
                "voice_gender": "FEMALE",
                "speech_rate": 1.0,
            }
        }
    }


class TTSResponse(BaseModel):
    text: str = Field(..., example="Doctor, I am experiencing severe stomach pain.")
    language: str = Field(..., example="en-IN")
    audio_format: str = Field(..., example="audio/mp3")
    duration_seconds: float = Field(..., example=2.8)
    audio_url: Optional[str] = Field(
        default=None,
        description="Public/cache URL to synthesized audio file",
        example="/static/audio/tts_sample_en.mp3",
    )
    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64 encoded audio binary if requested inline",
        example="UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    )


class STTRequest(BaseModel):
    audio_base64: str = Field(
        ...,
        description="Base64 encoded audio recording from microphone stream",
        example="UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    )
    language: str = Field(
        default="en-IN",
        description="Expected speech language: 'en-IN', 'hi-IN', 'or-IN', 'te-IN'",
        example="en-IN",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
                "language": "en-IN",
            }
        }
    }


class STTResponse(BaseModel):
    transcript: str = Field(..., example="Where does it hurt? Please take a seat.")
    confidence: float = Field(..., example=0.954)
    detected_language: str = Field(..., example="en-IN")
    word_count: int = Field(..., example=8)


class SignClipItem(BaseModel):
    word: str = Field(..., example="PAIN")
    matched_type: str = Field(
        ...,
        description="Match tier: 'exact', 'synonym', 'fingerspelling', 'subtitle_only'",
        example="exact",
    )
    video_url: str = Field(..., example="/assets/signs/pain.mp4")
    duration_ms: int = Field(..., example=1200)


class SignSequenceRequest(BaseModel):
    text: str = Field(
        ...,
        description="Doctor's response or announcement to sequence into sign animation",
        example="Please sit here. The medicine is ready.",
    )
    language: str = Field(default="en-IN", example="en-IN")


class SignSequenceResponse(BaseModel):
    source_text: str = Field(..., example="Please sit here. The medicine is ready.")
    tokens: List[str] = Field(..., example=["PLEASE", "SIT", "MEDICINE", "READY"])
    clips: List[SignClipItem] = Field(
        ...,
        description="Ordered playlist of video clips with seamless double-buffering metadata",
    )
    total_duration_ms: int = Field(..., example=4800)


@router.post(
    "/tts",
    response_model=TTSResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize Regional Indian Voice Audio",
    description="Edge-TTS / Neural Indian voice engine supporting Hindi, Odia, Telugu, and Indian English.",
)
async def text_to_speech(request: TTSRequest) -> TTSResponse:
    """Stub endpoint for regional multilingual text-to-speech."""
    return TTSResponse(
        text=request.text,
        language=request.language,
        audio_format="audio/mp3",
        duration_seconds=2.8,
        audio_url=f"/static/audio/tts_{request.language}.mp3",
        audio_base64="UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    )


@router.post(
    "/stt",
    response_model=STTResponse,
    status_code=status.HTTP_200_OK,
    summary="Speech to Text for Regional Audio",
    description="Transcribes live microphone audio from hospital staff or patients.",
)
async def speech_to_text(request: STTRequest) -> STTResponse:
    """Stub endpoint for speech recognition."""
    return STTResponse(
        transcript="Where does it hurt? Please take a seat.",
        confidence=0.954,
        detected_language=request.language,
        word_count=8,
    )


@router.post(
    "/tokenize-signs",
    response_model=SignSequenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Tokenize Doctor Speech into ISL Video Sequence",
    description="Converts transcribed spoken text into a playlist of ISL video clips with fallback ladder.",
)
async def tokenize_to_sign_clips(request: SignSequenceRequest) -> SignSequenceResponse:
    """Stub endpoint for Speech-to-Sign animation sequencer."""
    clips = [
        SignClipItem(word="PLEASE", matched_type="exact", video_url="/assets/signs/please.mp4", duration_ms=1000),
        SignClipItem(word="SIT", matched_type="exact", video_url="/assets/signs/sit.mp4", duration_ms=1100),
        SignClipItem(word="MEDICINE", matched_type="exact", video_url="/assets/signs/medicine.mp4", duration_ms=1200),
        SignClipItem(word="READY", matched_type="synonym", video_url="/assets/signs/ready.mp4", duration_ms=900),
    ]
    return SignSequenceResponse(
        source_text=request.text,
        tokens=["PLEASE", "SIT", "MEDICINE", "READY"],
        clips=clips,
        total_duration_ms=4200,
    )

