from typing import List, Optional, Dict
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


class SynthesizeRequest(BaseModel):
    tokens: List[str] = Field(
        ...,
        description="Accumulated sign language gloss tokens from gesture recognizer",
        example=["I", "PAIN", "STOMACH"],
    )
    target_language: str = Field(
        default="en",
        description="Target regional language code: 'en' (English), 'hi' (Hindi), 'or' (Odia), 'te' (Telugu)",
        example="hi",
    )
    medical_context: Optional[str] = Field(
        default="emergency_room",
        description="Contextual setting to tune Gemini tone (e.g. 'emergency_room', 'opd', 'pharmacy')",
        example="emergency_room",
    )
    patient_id: Optional[str] = Field(default=None, example="PAT-9842")

    model_config = {
        "json_schema_extra": {
            "example": {
                "tokens": ["I", "PAIN", "STOMACH"],
                "target_language": "hi",
                "medical_context": "emergency_room",
                "patient_id": "PAT-9842",
            }
        }
    }


class SynthesizeResponse(BaseModel):
    raw_tokens: List[str] = Field(..., example=["I", "PAIN", "STOMACH"])
    natural_sentence: str = Field(
        ...,
        description="Polite, grammatically structured English sentence constructed by Gemini",
        example="Doctor, I am experiencing severe stomach pain.",
    )
    target_language: str = Field(..., example="hi")
    translated_text: str = Field(
        ...,
        description="Synthesized sentence translated into the requested regional Indian language",
        example="डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।",
    )
    phonetic_pronunciation: Optional[str] = Field(
        default=None,
        description="Romanized phonetic text to assist non-native doctors reading regional script",
        example="Doctor sahab, mere pet mein bahut tez dard ho raha hai.",
    )
    urgency_level: str = Field(
        ...,
        description="Inferred triage urgency: 'normal', 'medium', 'high', 'critical'",
        example="high",
    )


class TextToGlossRequest(BaseModel):
    text: str = Field(
        ...,
        description="Doctor or hospital staff spoken/written phrase to be signed back to patient",
        example="Where does it hurt? Please take a seat.",
    )
    source_language: str = Field(default="en", example="en")

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Where does it hurt? Please take a seat.",
                "source_language": "en",
            }
        }
    }


class TextToGlossResponse(BaseModel):
    original_text: str = Field(..., example="Where does it hurt? Please take a seat.")
    gloss_sequence: List[str] = Field(
        ...,
        description="Ordered sequence of ISL glosses for avatar / video sequence engine",
        example=["YOU", "HURT", "WHERE", "SIT", "PLEASE"],
    )
    simplified_english: str = Field(
        ...,
        description="Subject-Object-Verb simplified representation for ISL alignment",
        example="You hurt where? Sit please.",
    )
    estimated_duration_seconds: float = Field(..., example=3.2)


@router.post(
    "/synthesize",
    response_model=SynthesizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize Raw Sign Glosses into Natural Medical Dialogue",
    description="Invokes Gemini 1.5 Context & Grammar Engine to turn raw glosses into polite regional dialogue.",
)
async def synthesize_sentence(request: SynthesizeRequest) -> SynthesizeResponse:
    """Stub endpoint for Gemini semantic grammar synthesis."""
    regional_translations: Dict[str, str] = {
        "hi": "डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।",
        "or": "ଡାକ୍ତର ବାବୁ, ମୋର ପେଟରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି।",
        "te": "డాక్టర్ గారు, నాకు కడుపులో తీవ్రమైన నొప్పిగా ఉంది.",
        "en": "Doctor, I am experiencing severe stomach pain.",
    }
    translated = regional_translations.get(request.target_language, regional_translations["en"])

    return SynthesizeResponse(
        raw_tokens=request.tokens,
        natural_sentence="Doctor, I am experiencing severe stomach pain.",
        target_language=request.target_language,
        translated_text=translated,
        phonetic_pronunciation="Doctor sahab, mere pet mein bahut tez dard ho raha hai.",
        urgency_level="high",
    )


@router.post(
    "/text-to-gloss",
    response_model=TextToGlossResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert Doctor Speech/Text into ISL Sign Gloss Sequence",
    description="Transforms staff's spoken sentence into an ordered sequence of ISL dictionary tokens.",
)
async def text_to_gloss(request: TextToGlossRequest) -> TextToGlossResponse:
    """Stub endpoint for 2-way doctor-to-sign tokenizer."""
    return TextToGlossResponse(
        original_text=request.text,
        gloss_sequence=["YOU", "HURT", "WHERE", "SIT", "PLEASE"],
        simplified_english="You hurt where? Sit please.",
        estimated_duration_seconds=3.2,
    )

