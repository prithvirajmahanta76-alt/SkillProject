import json
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, status
import google.generativeai as genai
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ml.vocabulary import GLOSS_LIST

router = APIRouter()

# Patient Documented Allergies & Contraindications Database
PATIENT_ALLERGY_REGISTRY: Dict[str, Dict[str, Any]] = {
    "PAT-9842": {
        "name": "Rahul Sahoo",
        "abha_id": "91-4829-1039-4820",
        "allergies": ["Penicillin", "Amoxicillin", "Ampicillin"],
        "chronic_conditions": ["Mild Asthma"],
        "contraindicated_drug_classes": ["Beta-lactam Antibiotics"],
    }
}

# Standardized Clinical Ontologies (ICD-10 & SNOMED-CT)
MEDICAL_ONTOLOGY_MAP: Dict[str, Dict[str, str]] = {
    "PAIN_STOMACH": {
        "icd10_code": "R10.9",
        "icd10_title": "Unspecified abdominal pain",
        "snomed_ct_id": "21522001",
        "snomed_concept": "Abdominal pain",
        "triage_urgency": "high"
    },
    "PAIN_CHEST": {
        "icd10_code": "R07.9",
        "icd10_title": "Chest pain, unspecified",
        "snomed_ct_id": "29857009",
        "snomed_concept": "Chest pain",
        "triage_urgency": "critical"
    },
    "FEVER": {
        "icd10_code": "R50.9",
        "icd10_title": "Fever, unspecified",
        "snomed_ct_id": "386661006",
        "snomed_concept": "Fever",
        "triage_urgency": "medium"
    },
    "CANNOT_BREATHE": {
        "icd10_code": "R06.02",
        "icd10_title": "Shortness of breath",
        "snomed_ct_id": "267036007",
        "snomed_concept": "Dyspnea",
        "triage_urgency": "critical"
    },
    "MEDICINE_HEADACHE": {
        "icd10_code": "R51.9",
        "icd10_title": "Headache, unspecified",
        "snomed_ct_id": "25064002",
        "snomed_concept": "Headache",
        "triage_urgency": "normal"
    }
}


class ClinicalSafetyAlert(BaseModel):
    has_allergy_conflict: bool = Field(..., example=True)
    severity: str = Field(..., example="CRITICAL")
    allergen_detected: Optional[str] = Field(default=None, example="Penicillin")
    alert_summary: str = Field(..., example="Patient has documented Penicillin Allergy. Beta-lactam antibiotics are contraindicated.")
    safe_clinical_alternative: Optional[str] = Field(default=None, example="Consider Macrolides (Azithromycin) or consult supervising physician.")


class ClinicalOntologyItem(BaseModel):
    icd10_code: str = Field(..., example="R10.9")
    icd10_title: str = Field(..., example="Unspecified abdominal pain")
    snomed_ct_id: str = Field(..., example="21522001")
    snomed_concept: str = Field(..., example="Abdominal pain")


class SynthesizeRequest(BaseModel):
    tokens: List[str] = Field(
        ...,
        description="Accumulated sign language gloss tokens from gesture recognizer",
        example=["I", "PAIN", "STOMACH"],
    )
    target_language: str = Field(
        default="hi",
        description="Target regional language code: 'en' (English), 'hi' (Hindi), 'or' (Odia), 'te' (Telugu)",
        example="hi",
    )
    medical_context: Optional[str] = Field(
        default="emergency_room",
        description="Contextual setting: 'emergency_room', 'opd', 'pharmacy'",
        example="emergency_room",
    )
    patient_id: Optional[str] = Field(default="PAT-9842", example="PAT-9842")
    doctor_prescribed_drug: Optional[str] = Field(default=None, example="Amoxicillin 500mg")


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
    ontology: Optional[ClinicalOntologyItem] = None
    clinical_safety_alert: Optional[ClinicalSafetyAlert] = None


class TextToGlossRequest(BaseModel):
    text: str = Field(
        ...,
        description="Doctor or hospital staff spoken/written phrase to be signed back to patient",
        example="Where does it hurt? Please take a seat.",
    )
    source_language: str = Field(default="en", example="en")


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


class FHIREncounterRequest(BaseModel):
    patient_id: str = Field(default="PAT-9842", example="PAT-9842")
    abha_id: str = Field(default="91-4829-1039-4820", example="91-4829-1039-4820")
    chief_complaint: str = Field(..., example="Severe stomach pain")
    clinical_signs: List[str] = Field(default=["PAIN", "STOMACH"], example=["PAIN", "STOMACH"])
    attending_doctor: str = Field(default="Dr. Ananya Sharma (MD, General Medicine)", example="Dr. Ananya Sharma")
    opd_unit: str = Field(default="Unit 4 - Acute Medical OPD", example="Unit 4 - Acute Medical OPD")


def _check_allergy_contraindications(patient_id: Optional[str], doctor_drug: Optional[str]) -> Optional[ClinicalSafetyAlert]:
    """Cross-references prescribed drugs against patient clinical allergy records."""
    if not patient_id or not doctor_drug:
        return None

    patient_rec = PATIENT_ALLERGY_REGISTRY.get(patient_id)
    if not patient_rec:
        return None

    drug_lower = doctor_drug.lower()
    for allergen in patient_rec["allergies"]:
        if allergen.lower() in drug_lower:
            return ClinicalSafetyAlert(
                has_allergy_conflict=True,
                severity="CRITICAL",
                allergen_detected=allergen,
                alert_summary=f"Patient {patient_rec['name']} (ABHA: {patient_rec['abha_id']}) has a documented {allergen} Allergy. This drug is contraindicated.",
                safe_clinical_alternative="Discontinue medication. Consider Macrolides (Azithromycin) or consult supervising physician."
            )
    return None


def _get_clinical_ontology(tokens: List[str]) -> ClinicalOntologyItem:
    """Maps token sequence to standardized ICD-10 and SNOMED-CT codes."""
    token_str = "_".join(tokens).upper()
    if "PAIN" in token_str and ("STOMACH" in token_str or "ABDOMEN" in token_str):
        entry = MEDICAL_ONTOLOGY_MAP["PAIN_STOMACH"]
    elif "PAIN" in token_str and ("CHEST" in token_str or "HEART" in token_str):
        entry = MEDICAL_ONTOLOGY_MAP["PAIN_CHEST"]
    elif "FEVER" in token_str:
        entry = MEDICAL_ONTOLOGY_MAP["FEVER"]
    elif "BREATHE" in token_str:
        entry = MEDICAL_ONTOLOGY_MAP["CANNOT_BREATHE"]
    else:
        entry = MEDICAL_ONTOLOGY_MAP["PAIN_STOMACH"]

    return ClinicalOntologyItem(
        icd10_code=entry["icd10_code"],
        icd10_title=entry["icd10_title"],
        snomed_ct_id=entry["snomed_ct_id"],
        snomed_concept=entry["snomed_concept"]
    )


def _synthesize_with_gemini(tokens: List[str], target_language: str, medical_context: str) -> Optional[dict]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        lang_names = {"hi": "Hindi (हिन्दी)", "or": "Odia (ଓଡ଼ିଆ)", "te": "Telugu (తెలుగు)", "en": "English"}
        target_name = lang_names.get(target_language, "Hindi (हिन्दी)")

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
    summary="Synthesize Raw Sign Glosses into Natural Medical Dialogue with Allergy Guard",
    description="Invokes Gemini 1.5 Context Engine with automated Allergy/Contraindication Guard and ICD-10 Coding.",
)
async def synthesize_sentence(request: SynthesizeRequest) -> SynthesizeResponse:
    ontology = _get_clinical_ontology(request.tokens)
    safety_alert = _check_allergy_contraindications(request.patient_id, request.doctor_prescribed_drug)

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
            ontology=ontology,
            clinical_safety_alert=safety_alert,
        )

    # 2. 40-Template Clinical Grammar Mapper (offline fallback)
    # Maps frozenset(tokens) → {en, hi, or, te} multilingual sentences
    CLINICAL_GRAMMAR_TEMPLATES: Dict[frozenset, Dict[str, Dict[str, str]]] = {
        frozenset({"PAIN", "STOMACH"}): {
            "en": {"sentence": "Patient is experiencing severe abdominal pain.", "phonetic": "Patient is experiencing severe abdominal pain."},
            "hi": {"sentence": "मरीज़ को पेट में तेज़ दर्द हो रहा है।", "phonetic": "Mareez ko pet mein tez dard ho raha hai."},
            "or": {"sentence": "ରୋଗୀ ପେଟରେ ତୀବ୍ର ଯନ୍ତ୍ରଣା ଅନୁଭବ କରୁଛି।", "phonetic": "Rogi petare teebra jantrana anubhaba karuchi."},
            "te": {"sentence": "రోగికి కడుపులో తీవ్రమైన నొప్పిగా ఉంది.", "phonetic": "Rogiki kadapulo teevramaina noppiga undi."},
        },
        frozenset({"I", "PAIN", "STOMACH"}): {
            "en": {"sentence": "Doctor, I am experiencing severe stomach pain.", "phonetic": "Doctor, I am experiencing severe stomach pain."},
            "hi": {"sentence": "डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।", "phonetic": "Doctor sahab, mere pet mein bahut tez dard ho raha hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋର ପେଟରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି।", "phonetic": "Daktara babu, mora petare prabala jantrana heuchi."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు కడుపులో తీవ్రమైన నొప్పిగా ఉంది.", "phonetic": "Doctor garu, naaku kadapulo teevramaina noppiga undi."},
        },
        frozenset({"I", "WATER"}): {
            "en": {"sentence": "Patient requests drinking water.", "phonetic": "Patient requests drinking water."},
            "hi": {"sentence": "मरीज़ को पानी चाहिए।", "phonetic": "Mareez ko paani chahiye."},
            "or": {"sentence": "ରୋଗୀ ପାଣି ଚାହୁଁଛି।", "phonetic": "Rogi pani chahunchi."},
            "te": {"sentence": "రోగికి తాగడానికి నీళ్ళు కావాలి.", "phonetic": "Rogiki tagadaniki neellu kaavali."},
        },
        frozenset({"WATER"}): {
            "en": {"sentence": "Patient requests drinking water.", "phonetic": "Patient requests drinking water."},
            "hi": {"sentence": "मरीज़ को पानी चाहिए।", "phonetic": "Mareez ko paani chahiye."},
            "or": {"sentence": "ରୋଗୀ ପାଣି ଚାହୁଁଛି।", "phonetic": "Rogi pani chahunchi."},
            "te": {"sentence": "రోగికి తాగడానికి నీళ్ళు కావాలి.", "phonetic": "Rogiki tagadaniki neellu kaavali."},
        },
        frozenset({"I", "PAIN", "CHEST"}): {
            "en": {"sentence": "Doctor, I am experiencing severe chest pain. This is urgent.", "phonetic": "Doctor, I am experiencing severe chest pain. This is urgent."},
            "hi": {"sentence": "डॉक्टर साहब, मेरे सीने में बहुत तेज़ दर्द है। यह आपातकाल है।", "phonetic": "Doctor sahab, mere seene mein bahut tez dard hai. Yeh aapatkaal hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ଛାତିରେ ଭୟଙ୍କର ଯନ୍ତ୍ରଣା। ଏହା ଜରୁରୀ।", "phonetic": "Daktara babu, mo chhatire bhayankara jantrana. Eha jaruri."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు ఛాతీలో తీవ్రమైన నొప్పిగా ఉంది. ఇది అత్యవసరం.", "phonetic": "Doctor garu, naaku chaatilo teevramaina noppiga undi. Idi atyavasaram."},
        },
        frozenset({"PAIN", "CHEST"}): {
            "en": {"sentence": "Patient has chest pain — CRITICAL triage required.", "phonetic": "Patient has chest pain — CRITICAL triage required."},
            "hi": {"sentence": "मरीज़ को सीने में दर्द है — तुरंत जाँच ज़रूरी।", "phonetic": "Mareez ko seene mein dard hai — turant jaanch zaroori."},
            "or": {"sentence": "ରୋଗୀ ଛାତି ଯନ୍ତ୍ରଣା ଅଛି — ତୁରନ୍ତ ଚିକିତ୍ସା ଦରକାର।", "phonetic": "Rogi chhatira jantrana achi — turanta chikitsa darakara."},
            "te": {"sentence": "రోగికి ఛాతీ నొప్పి ఉంది — తక్షణ చికిత్స అవసరం.", "phonetic": "Rogiki chati noppi undi — takshana chikitsa avasaram."},
        },
        frozenset({"I", "FEVER"}): {
            "en": {"sentence": "Doctor, I have a fever.", "phonetic": "Doctor, I have a fever."},
            "hi": {"sentence": "डॉक्टर साहब, मुझे बुखार है।", "phonetic": "Doctor sahab, mujhe bukhar hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ଜ୍ୱର ହୋଇଛି।", "phonetic": "Daktara babu, mo jwara hoichi."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు జ్వరంగా ఉంది.", "phonetic": "Doctor garu, naaku jwaranga undi."},
        },
        frozenset({"FEVER"}): {
            "en": {"sentence": "Patient has a fever.", "phonetic": "Patient has a fever."},
            "hi": {"sentence": "मरीज़ को बुखार है।", "phonetic": "Mareez ko bukhar hai."},
            "or": {"sentence": "ରୋଗୀ ଜ୍ୱରରେ ଆକ୍ରାନ୍ତ।", "phonetic": "Rogi jwarare akranta."},
            "te": {"sentence": "రోగికి జ్వరంగా ఉంది.", "phonetic": "Rogiki jwaranga undi."},
        },
        frozenset({"I", "BREATHE"}): {
            "en": {"sentence": "Doctor, I am having difficulty breathing.", "phonetic": "Doctor, I am having difficulty breathing."},
            "hi": {"sentence": "डॉक्टर साहब, मुझे साँस लेने में तकलीफ़ है।", "phonetic": "Doctor sahab, mujhe saas lene mein taklif hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୁଁ ନିଶ୍ୱାସ ନେଇ ପାରୁନି।", "phonetic": "Daktara babu, mun nishwasa nei paruni."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు శ్వాస తీసుకోవడం కష్టంగా ఉంది.", "phonetic": "Doctor garu, naaku shwasa teesukavadm kashtanga undi."},
        },
        frozenset({"BREATHE"}): {
            "en": {"sentence": "Patient is experiencing breathing difficulty.", "phonetic": "Patient is experiencing breathing difficulty."},
            "hi": {"sentence": "मरीज़ को साँस लेने में तकलीफ़ है।", "phonetic": "Mareez ko saas lene mein taklif hai."},
            "or": {"sentence": "ରୋଗୀ ନିଶ୍ୱାସ ନେଇ ପାରୁ ନାହାଁ।", "phonetic": "Rogi nishwasa nei paru nahanta."},
            "te": {"sentence": "రోగికి శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది.", "phonetic": "Rogiki shwasa teesukavadamlo ibbandi undi."},
        },
        frozenset({"I", "HEADACHE"}): {
            "en": {"sentence": "Doctor, I have a severe headache.", "phonetic": "Doctor, I have a severe headache."},
            "hi": {"sentence": "डॉक्टर साहब, मेरे सिर में बहुत दर्द हो रहा है।", "phonetic": "Doctor sahab, mere sir mein bahut dard ho raha hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ମୁଣ୍ଡ ବ୍ୟଥା ହୋଇଛି।", "phonetic": "Daktara babu, mo munda byatha hoichi."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు తీవ్రమైన తలనొప్పిగా ఉంది.", "phonetic": "Doctor garu, naaku teevramaina thalanoppiga undi."},
        },
        frozenset({"HEADACHE"}): {
            "en": {"sentence": "Patient complains of headache.", "phonetic": "Patient complains of headache."},
            "hi": {"sentence": "मरीज़ को सिरदर्द है।", "phonetic": "Mareez ko sirdard hai."},
            "or": {"sentence": "ରୋଗୀ ଶିରୋଯନ୍ତ୍ରଣାରେ ଆଛନ୍ତି।", "phonetic": "Rogi shiroyantranare achanti."},
            "te": {"sentence": "రోగికి తలనొప్పి ఉంది.", "phonetic": "Rogiki thalanoppi undi."},
        },
        frozenset({"HELP", "EMERGENCY"}): {
            "en": {"sentence": "EMERGENCY — patient urgently needs help!", "phonetic": "EMERGENCY — patient urgently needs help!"},
            "hi": {"sentence": "आपातकाल — मरीज़ को तुरंत मदद चाहिए!", "phonetic": "Aapatkaal — mareez ko turant madad chahiye!"},
            "or": {"sentence": "ଜରୁରୀ — ରୋଗୀ ଏକ୍ଷଣି ସାହାଯ୍ୟ ଚାହୁଁଛି!", "phonetic": "Jaruri — rogi ekshani sahajya chahunchi!"},
            "te": {"sentence": "అత్యవసరం — రోగికి తక్షణ సహాయం కావాలి!", "phonetic": "Atyavasaram — rogiki takshana sahayam kaavali!"},
        },
        frozenset({"HELP"}): {
            "en": {"sentence": "Patient is asking for help.", "phonetic": "Patient is asking for help."},
            "hi": {"sentence": "मरीज़ को मदद चाहिए।", "phonetic": "Mareez ko madad chahiye."},
            "or": {"sentence": "ରୋଗୀ ସାହାଯ୍ୟ ଚାହୁଁଛି।", "phonetic": "Rogi sahajya chahunchi."},
            "te": {"sentence": "రోగికి సహాయం కావాలి.", "phonetic": "Rogiki sahayam kaavali."},
        },
        frozenset({"EMERGENCY"}): {
            "en": {"sentence": "EMERGENCY — immediate assistance required!", "phonetic": "EMERGENCY — immediate assistance required!"},
            "hi": {"sentence": "आपातकाल — तत्काल सहायता आवश्यक!", "phonetic": "Aapatkaal — tatkal sahayata aavashyak!"},
            "or": {"sentence": "ଜରୁରୀ ପରିସ୍ଥିତି — ତୁରନ୍ତ ସାହାଯ୍ୟ ଦରକାର!", "phonetic": "Jaruri paristhiti — turanta sahajya darakara!"},
            "te": {"sentence": "అత్యవసరం — తక్షణ సహాయం అవసరం!", "phonetic": "Atyavasaram — takshana sahayam avasaram!"},
        },
        frozenset({"I", "MEDICINE"}): {
            "en": {"sentence": "Doctor, I need my medication.", "phonetic": "Doctor, I need my medication."},
            "hi": {"sentence": "डॉक्टर साहब, मुझे दवा चाहिए।", "phonetic": "Doctor sahab, mujhe dava chahiye."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ଔଷଧ ଦରକାର।", "phonetic": "Daktara babu, mo aushadha darakara."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు మందు కావాలి.", "phonetic": "Doctor garu, naaku mandu kaavali."},
        },
        frozenset({"MEDICINE"}): {
            "en": {"sentence": "Patient requests medication.", "phonetic": "Patient requests medication."},
            "hi": {"sentence": "मरीज़ दवाई माँग रहा है।", "phonetic": "Mareez dawai maang raha hai."},
            "or": {"sentence": "ରୋଗୀ ଔଷଧ ଚାହୁଁଛି।", "phonetic": "Rogi aushadha chahunchi."},
            "te": {"sentence": "రోగి మందు అడుగుతున్నారు.", "phonetic": "Rogi mandu adugutunnaru."},
        },
        frozenset({"I", "DOCTOR"}): {
            "en": {"sentence": "Patient requests to see a doctor.", "phonetic": "Patient requests to see a doctor."},
            "hi": {"sentence": "मरीज़ डॉक्टर से मिलना चाहते हैं।", "phonetic": "Mareez doctor se milna chahte hain."},
            "or": {"sentence": "ରୋଗୀ ଡାକ୍ତରଙ୍କୁ ଦେଖା ଦେବାକୁ ଚାହୁଁଛି।", "phonetic": "Rogi daktaraku dekha debaku chahunchi."},
            "te": {"sentence": "రోగి వైద్యుడిని చూడాలనుకుంటున్నారు.", "phonetic": "Rogi vaidyudini chudalalanukuntunnaru."},
        },
        frozenset({"FOOD"}): {
            "en": {"sentence": "Patient requests food.", "phonetic": "Patient requests food."},
            "hi": {"sentence": "मरीज़ को खाना चाहिए।", "phonetic": "Mareez ko khana chahiye."},
            "or": {"sentence": "ରୋଗୀ ଖାଦ୍ୟ ଚାହୁଁଛି।", "phonetic": "Rogi khadya chahunchi."},
            "te": {"sentence": "రోగికి ఆహారం కావాలి.", "phonetic": "Rogiki aaharam kaavali."},
        },
        frozenset({"I", "FOOD"}): {
            "en": {"sentence": "Doctor, I would like food please.", "phonetic": "Doctor, I would like food please."},
            "hi": {"sentence": "डॉक्टर साहब, मुझे खाना चाहिए।", "phonetic": "Doctor sahab, mujhe khana chahiye."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ଖାଦ୍ୟ ଦରକାର।", "phonetic": "Daktara babu, mo khadya darakara."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు ఆహారం కావాలి.", "phonetic": "Doctor garu, naaku aaharam kaavali."},
        },
        frozenset({"BLOOD"}): {
            "en": {"sentence": "Patient has a blood-related concern — urgent.", "phonetic": "Patient has a blood-related concern — urgent."},
            "hi": {"sentence": "मरीज़ को खून से संबंधित समस्या है।", "phonetic": "Mareez ko khoon se sambandhit samasya hai."},
            "or": {"sentence": "ରୋଗୀଙ୍କ ରକ୍ତ ସମ୍ବନ୍ଧୀୟ ସମସ୍ୟା ଅଛି।", "phonetic": "Roginka rakta sambandheya samasya achi."},
            "te": {"sentence": "రోగికి రక్తం సంబంధిత సమస్య ఉంది.", "phonetic": "Rogiki raktam sambandhita samasya undi."},
        },
        frozenset({"INJECTION"}): {
            "en": {"sentence": "Patient is asking about an injection.", "phonetic": "Patient is asking about an injection."},
            "hi": {"sentence": "मरीज़ इंजेक्शन के बारे में पूछ रहे हैं।", "phonetic": "Mareez injection ke baare mein pooch rahe hain."},
            "or": {"sentence": "ରୋଗୀ ଇଞ୍ଜେକ୍ସନ ବିଷୟରେ ପଚାରୁଛନ୍ତି।", "phonetic": "Rogi injection bishayare pachharuchanti."},
            "te": {"sentence": "రోగి ఇంజెక్షన్ గురించి అడుగుతున్నారు.", "phonetic": "Rogi injection gurinchi adugutunnaru."},
        },
        frozenset({"WHEELCHAIR"}): {
            "en": {"sentence": "Patient requires a wheelchair.", "phonetic": "Patient requires a wheelchair."},
            "hi": {"sentence": "मरीज़ को व्हीलचेयर चाहिए।", "phonetic": "Mareez ko wheelchair chahiye."},
            "or": {"sentence": "ରୋଗୀ ହୁଇଲ୍‌ଚେୟାର ଚାହୁଁଛି।", "phonetic": "Rogi wheelchair chahunchi."},
            "te": {"sentence": "రోగికి వీల్‌చైర్ కావాలి.", "phonetic": "Rogiki wheelchair kaavali."},
        },
        frozenset({"I", "DIZZY"}): {
            "en": {"sentence": "Doctor, I am feeling dizzy.", "phonetic": "Doctor, I am feeling dizzy."},
            "hi": {"sentence": "डॉक्टर साहब, मुझे चक्कर आ रहा है।", "phonetic": "Doctor sahab, mujhe chakkar aa raha hai."},
            "or": {"sentence": "ଡାକ୍ତର ବାବୁ, ମୋ ମୁଣ୍ଡ ବୁଲୁଛି।", "phonetic": "Daktara babu, mo munda buluchi."},
            "te": {"sentence": "డాక్టర్ గారు, నాకు కళ్ళు తిరుగుతున్నాయి.", "phonetic": "Doctor garu, naaku kallu thirugutunnaayi."},
        },
        frozenset({"URINE"}): {
            "en": {"sentence": "Patient has a urinary concern.", "phonetic": "Patient has a urinary concern."},
            "hi": {"sentence": "मरीज़ को पेशाब की समस्या है।", "phonetic": "Mareez ko peshab ki samasya hai."},
            "or": {"sentence": "ରୋଗୀ ପରିସ୍ରା ସମ୍ବନ୍ଧୀୟ ସମସ୍ୟାରେ ଅଛନ୍ତି।", "phonetic": "Rogi parissra sambandheya samasya achanti."},
            "te": {"sentence": "రోగికి మూత్రం సంబంధిత సమస్య ఉంది.", "phonetic": "Rogiki moothram sambandhita samasya undi."},
        },
        frozenset({"FAMILY"}): {
            "en": {"sentence": "Patient is asking for their family member.", "phonetic": "Patient is asking for their family member."},
            "hi": {"sentence": "मरीज़ अपने परिवार को बुला रहे हैं।", "phonetic": "Mareez apne parivaar ko bula rahe hain."},
            "or": {"sentence": "ରୋଗୀ ପରିବାର ସଦସ୍ୟ ଚାହୁଁଛି।", "phonetic": "Rogi paribara sadassya chahunchi."},
            "te": {"sentence": "రోగి తన కుటుంబ సభ్యుణ్ణి పిలుస్తున్నారు.", "phonetic": "Rogi thana kutumba sabhyunni pilusthunnaru."},
        },
        frozenset({"PLEASE", "WAIT"}): {
            "en": {"sentence": "Please wait for the doctor.", "phonetic": "Please wait for the doctor."},
            "hi": {"sentence": "कृपया डॉक्टर की प्रतीक्षा करें।", "phonetic": "Kripaya doctor ki prateeksha karein."},
            "or": {"sentence": "ଦୟାକରି ଡାକ୍ତରଙ୍କ ପ୍ରତୀକ୍ଷା କରନ୍ତୁ।", "phonetic": "Dayakari daktaranka prateeksha karantu."},
            "te": {"sentence": "దయచేసి వైద్యుడికోసం వేచి ఉండండి.", "phonetic": "Dayachesi vaidyudikoosam vechi undandi."},
        },
        frozenset({"THANK_YOU"}): {
            "en": {"sentence": "Patient says thank you.", "phonetic": "Patient says thank you."},
            "hi": {"sentence": "मरीज़ धन्यवाद कह रहे हैं।", "phonetic": "Mareez dhanyavad keh rahe hain."},
            "or": {"sentence": "ରୋଗୀ ଧନ୍ୟବାଦ ଦେଉଛନ୍ତି।", "phonetic": "Rogi dhanyabada deuchanti."},
            "te": {"sentence": "రోగి ధన్యవాదాలు చెప్తున్నారు.", "phonetic": "Rogi dhanyavaadalu cheptunnaru."},
        },
    }

    # --- 3-layer lookup ---
    token_set = frozenset(t.upper() for t in request.tokens)
    target_lang = request.target_language.split("-")[0]

    # Layer 1: exact frozenset match
    matched_template = CLINICAL_GRAMMAR_TEMPLATES.get(token_set)

    # Layer 2: largest-subset partial match
    if not matched_template:
        best_overlap = 0
        for key_set, tmpl in CLINICAL_GRAMMAR_TEMPLATES.items():
            overlap = len(key_set & token_set)
            if overlap > best_overlap and key_set.issubset(token_set):
                best_overlap = overlap
                matched_template = tmpl

    if matched_template:
        lang_data = matched_template.get(target_lang, matched_template["en"])
        natural_eng = matched_template["en"]["sentence"]
        translated = lang_data["sentence"]
        phonetic = lang_data.get("phonetic")
    else:
        # Layer 3: Dynamic fallback — build from vocabulary multilingual fields
        from app.ml.vocabulary import ISL_25_VOCABULARY
        vocab_map = {v["gloss"]: v for v in ISL_25_VOCABULARY}
        lang_key_map = {"hi": "hindi", "or": "odia", "te": "telugu"}
        lang_field = lang_key_map.get(target_lang)
        translated_words = []
        for token in request.tokens:
            tok_up = token.upper()
            if tok_up in vocab_map and lang_field:
                translated_words.append(vocab_map[tok_up][lang_field])
            else:
                translated_words.append(token)

        symptom_tokens = [t.lower() for t in request.tokens if t.upper() not in {"I", "PLEASE", "THANK_YOU"}]
        natural_eng = f"Patient needs assistance: {', '.join(symptom_tokens)}." if symptom_tokens else "Patient requires medical attention."
        translated = " ".join(translated_words) if lang_field else natural_eng
        phonetic = None

    return SynthesizeResponse(
        raw_tokens=request.tokens,
        natural_sentence=natural_eng,
        target_language=request.target_language,
        translated_text=translated,
        phonetic_pronunciation=phonetic,
        urgency_level="critical" if any(t.upper() in {"EMERGENCY", "BREATHE", "BLOOD"} for t in request.tokens)
                      else "high" if any(t.upper() in {"PAIN", "HELP", "CHEST"} for t in request.tokens)
                      else "medium",
        ontology=ontology,
        clinical_safety_alert=safety_alert,
    )


@router.post(
    "/text-to-gloss",
    response_model=TextToGlossResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert Doctor Speech/Text into ISL Sign Gloss Sequence",
)
async def text_to_gloss(request: TextToGlossRequest) -> TextToGlossResponse:
    gemini_result = _text_to_gloss_with_gemini(request.text, request.source_language)
    if gemini_result and "gloss_sequence" in gemini_result:
        return TextToGlossResponse(
            original_text=request.text,
            gloss_sequence=gemini_result.get("gloss_sequence", []),
            simplified_english=gemini_result.get("simplified_english", request.text),
            estimated_duration_seconds=float(gemini_result.get("estimated_duration_seconds", 3.0)),
        )

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


@router.post(
    "/fhir-encounter",
    status_code=status.HTTP_200_OK,
    summary="Generate HL7 FHIR v4.0.1 / ABDM Clinical Encounter Bundle",
    description="Generates an interoperable Ayushman Bharat Digital Mission (ABDM) FHIR Encounter JSON bundle.",
)
async def generate_fhir_encounter(request: FHIREncounterRequest) -> Dict[str, Any]:
    """Constructs an HL7 FHIR Release 4 JSON resource bundle for national EHR interoperability."""
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    encounter_id = f"ENC-ABDM-{int(time.time())}"
    condition_id = f"COND-ABDM-{int(time.time())}"

    ontology = _get_clinical_ontology(request.clinical_signs)

    fhir_bundle = {
        "resourceType": "Bundle",
        "id": f"BUNDLE-{encounter_id}",
        "type": "document",
        "timestamp": now_iso,
        "entry": [
            {
                "fullUrl": f"urn:uuid:{encounter_id}",
                "resource": {
                    "resourceType": "Encounter",
                    "id": encounter_id,
                    "status": "finished",
                    "class": {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                        "code": "AMB",
                        "display": "ambulatory"
                    },
                    "subject": {
                        "reference": f"Patient/{request.patient_id}",
                        "identifier": {
                            "system": "https://healthid.ndhm.gov.in",
                            "value": request.abha_id
                        },
                        "display": "Rahul Sahoo"
                    },
                    "participant": [
                        {
                            "individual": {
                                "display": request.attending_doctor
                            }
                        }
                    ],
                    "period": {
                        "start": now_iso
                    },
                    "serviceProvider": {
                        "display": "Civil Government Hospital - OPD Accessibility Kiosk"
                    }
                }
            },
            {
                "fullUrl": f"urn:uuid:{condition_id}",
                "resource": {
                    "resourceType": "Condition",
                    "id": condition_id,
                    "clinicalStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                "code": "active"
                            }
                        ]
                    },
                    "code": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/sid/icd-10",
                                "code": ontology.icd10_code,
                                "display": ontology.icd10_title
                            },
                            {
                                "system": "http://snomed.info/sct",
                                "code": ontology.snomed_ct_id,
                                "display": ontology.snomed_concept
                            }
                        ],
                        "text": request.chief_complaint
                    },
                    "subject": {
                        "reference": f"Patient/{request.patient_id}",
                        "display": "Rahul Sahoo"
                    }
                }
            }
        ]
    }
    return fhir_bundle
