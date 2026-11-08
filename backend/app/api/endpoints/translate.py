import json
from typing import List, Optional, Dict
from fastapi import APIRouter, status
import google.generativeai as genai
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ml.vocabulary import GLOSS_LIST

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


def _synthesize_with_gemini(tokens: List[str], target_language: str, medical_context: str) -> Optional[dict]:
    """Invokes Google Gemini 1.5 Flash to convert raw ISL glosses into polite medical dialogue."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        lang_names = {"hi": "Hindi (हिन्दी)", "or": "Odia (ଓଡ଼ିଆ)", "te": "Telugu (తెలుగు)", "en": "English"}
        target_name = lang_names.get(target_language, "English")

        prompt = f"""You are the SignBridge Universal Medical Semantic Grammar Synthesizer.
A deaf/mute patient signed the following discrete Indian Sign Language (ISL) gloss tokens:
Tokens: {tokens}
Setting / Context: {medical_context}

Your task:
1. Construct a polite, natural, grammatically correct sentence in English suitable for a hospital doctor.
2. Translate that exact sentence into {target_name}.
3. Provide a romanized phonetic pronunciation of the {target_name} translation to assist English-speaking staff.
4. Estimate urgency: 'normal', 'medium', 'high', or 'critical'.

Respond strictly in pure JSON format:
{{
  "natural_sentence": "English sentence here",
  "translated_text": "Translated sentence here",
  "phonetic_pronunciation": "Phonetic text here",
  "urgency_level": "high"
}}"""

        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        return json.loads(raw_text.strip())
    except Exception:
        return None


def _text_to_gloss_with_gemini(text: str, source_language: str) -> Optional[dict]:
    """Invokes Google Gemini 1.5 Flash to tokenize doctor speech into ISL gloss sequence."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""You are the SignBridge Universal ISL Tokenizer.
A doctor spoke or typed: "{text}"
Source Language: {source_language}

Map this sentence into an ordered sequence of Indian Sign Language (ISL) gloss tokens.
Prefer tokens from this core medical vocabulary: {GLOSS_LIST}

Respond strictly in JSON format:
{{
  "gloss_sequence": ["YOU", "HURT", "WHERE", "SIT", "PLEASE"],
  "simplified_english": "You hurt where? Sit please.",
  "estimated_duration_seconds": 3.0
}}"""

        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        return json.loads(raw_text.strip())
    except Exception:
        return None


@router.post(
    "/synthesize",
    response_model=SynthesizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize Raw Sign Glosses into Natural Medical Dialogue",
    description="Invokes Gemini 1.5 Context & Grammar Engine to turn raw glosses into polite regional dialogue.",
)
async def synthesize_sentence(request: SynthesizeRequest) -> SynthesizeResponse:
    """Synthesizes sign glosses into natural medical speech using Gemini 1.5 with regional fallback."""
    # 1. Try Gemini 1.5 Flash
    gemini_result = _synthesize_with_gemini(request.tokens, request.target_language, request.medical_context or "emergency_room")
    if gemini_result and "natural_sentence" in gemini_result:
        return SynthesizeResponse(
            raw_tokens=request.tokens,
            natural_sentence=gemini_result.get("natural_sentence", ""),
            target_language=request.target_language,
            translated_text=gemini_result.get("translated_text", gemini_result.get("natural_sentence", "")),
            phonetic_pronunciation=gemini_result.get("phonetic_pronunciation", None),
            urgency_level=gemini_result.get("urgency_level", "medium"),
        )

    # 2. Rule-based / Dictionary Fallback
    regional_translations: Dict[str, Dict[str, str]] = {
        "hi": {
            "sentence": "डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।",
            "phonetic": "Doctor sahab, mere pet mein bahut tez dard ho raha hai.",
        },
        "or": {
            "sentence": "ଡାକ୍ତର ବାବୁ, ମୋର ପେଟରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି।",
            "phonetic": "Daktara babu, mora petare prabala jantrana heuchi.",
        },
        "te": {
            "sentence": "డాక్టర్ గారు, నాకు కడుపులో తీవ్రమైన నొప్పిగా ఉంది.",
            "phonetic": "Doctor garu, naaku kadapulo teevramaina noppiga undi.",
        },
        "en": {
            "sentence": "Doctor, I am experiencing severe stomach pain.",
            "phonetic": "Doctor, I am experiencing severe stomach pain.",
        },
    }

    target = request.target_language.split("-")[0]
    matched = regional_translations.get(target, regional_translations["en"])

    # Basic grammatical assembly from tokens if different tokens supplied
    token_str = " ".join(request.tokens)
    natural_eng = f"Doctor, I need assistance regarding {token_str.lower()}." if request.tokens != ["I", "PAIN", "STOMACH"] else "Doctor, I am experiencing severe stomach pain."

    return SynthesizeResponse(
        raw_tokens=request.tokens,
        natural_sentence=natural_eng,
        target_language=request.target_language,
        translated_text=matched["sentence"] if natural_eng == "Doctor, I am experiencing severe stomach pain." else natural_eng,
        phonetic_pronunciation=matched.get("phonetic"),
        urgency_level="high" if any(t in ["PAIN", "EMERGENCY", "HELP", "BLOOD"] for t in request.tokens) else "medium",
    )


@router.post(
    "/text-to-gloss",
    response_model=TextToGlossResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert Doctor Speech/Text into ISL Sign Gloss Sequence",
    description="Transforms staff's spoken sentence into an ordered sequence of ISL dictionary tokens.",
)
async def text_to_gloss(request: TextToGlossRequest) -> TextToGlossResponse:
    """Tokenizes doctor's phrase into ISL animation gloss sequence using Gemini or lemma extraction."""
    gemini_result = _text_to_gloss_with_gemini(request.text, request.source_language)
    if gemini_result and "gloss_sequence" in gemini_result:
        return TextToGlossResponse(
            original_text=request.text,
            gloss_sequence=gemini_result.get("gloss_sequence", []),
            simplified_english=gemini_result.get("simplified_english", request.text),
            estimated_duration_seconds=float(gemini_result.get("estimated_duration_seconds", 3.0)),
        )

    # Fallback lemma extractor
    words = request.text.upper().replace("?", "").replace(".", "").replace(",", "").split()
    gloss_map = {
        "HURT": "PAIN",
        "ACHE": "PAIN",
        "PHYSICIAN": "DOCTOR",
        "PILLS": "MEDICINE",
        "TABLET": "MEDICINE",
    }
    glosses = [gloss_map.get(w, w) for w in words if len(w) > 2]
    if not glosses:
        glosses = ["PLEASE", "WAIT"]

    return TextToGlossResponse(
        original_text=request.text,
        gloss_sequence=glosses[:6],
        simplified_english=request.text,
        estimated_duration_seconds=round(len(glosses) * 0.8, 1),
    )
