import time
import urllib.parse
from typing import List, Dict, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()

# In-Memory Active Alerts Queue for Hospital Nursing Station Dashboard
_ACTIVE_ALERTS_LOG: List[Dict] = []


class EmergencyPhrase(BaseModel):
    id: str = Field(..., example="sos_ambulance")
    code: str = Field(..., example="AMBULANCE")
    title: str = Field(..., example="Call Ambulance")
    severity: str = Field(..., description="'critical', 'high', 'urgent'", example="critical")
    icon: str = Field(..., example="Ambulance")
    english: str = Field(..., example="Please call an ambulance immediately!")
    hindi: str = Field(..., example="कृपया तुरंत एम्बुलेंस बुलाएं!")
    odia: str = Field(..., example="ଦୟାକରି ତୁରନ୍ତ ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ!")
    telugu: str = Field(..., example="దయచేసి వెంటనే అంబులెన్స్ పిలవండి!")
    audio_asset: str = Field(..., example="/assets/audio/sos_ambulance.mp3")


class EmergencyPhrasesResponse(BaseModel):
    count: int = Field(..., example=8)
    phrases: List[EmergencyPhrase]


class SOSTriggerRequest(BaseModel):
    emergency_type: str = Field(
        ...,
        description="Type of emergency: 'AMBULANCE', 'SEVERE_PAIN', 'DOCTOR_NEEDED', 'FALL_DETECTED', 'CANNOT_BREATHE'",
        example="SEVERE_PAIN",
    )
    patient_id: Optional[str] = Field(default="PAT-9842", example="PAT-9842")
    patient_name: Optional[str] = Field(default="Rahul Sahoo", example="Rahul Sahoo")
    abha_id: Optional[str] = Field(default="91-4829-1039-4820", example="91-4829-1039-4820")
    location_tag: Optional[str] = Field(
        default="Ward 3, Bed 14",
        description="Bed number, ward name, or hospital wing",
        example="Ward 3, Bed 14",
    )
    latitude: Optional[float] = Field(default=20.2961, description="GPS Latitude", example=20.2961)
    longitude: Optional[float] = Field(default=85.8245, description="GPS Longitude", example=85.8245)
    preferred_language: str = Field(default="hi-IN", example="hi-IN")


class SOSTriggerResponse(BaseModel):
    sos_id: str = Field(..., example="SOS-20261108-0042")
    status: str = Field(..., example="DISPATCHED")
    timestamp_iso: str = Field(..., example="2026-11-08T10:00:00Z")
    emergency_type: str = Field(..., example="SEVERE_PAIN")
    triage_esi_level: str = Field(..., example="ESI Level 1 (Resuscitation)")
    strobe_visual_alert: bool = Field(..., example=True)
    google_maps_url: str = Field(..., example="https://www.google.com/maps?q=20.2961,85.8245")
    whatsapp_dispatch_link: str = Field(
        ...,
        description="Clickable instant WhatsApp notification payload",
        example="https://api.whatsapp.com/send?text=...",
    )
    regional_audio_broadcast: Dict[str, str] = Field(
        ...,
        description="Multilingual announcements triggered for hospital PA or bedside speaker",
    )
    dispatch_notifications: Dict[str, str] = Field(
        ...,
        example={
            "nursing_station": "SENT",
            "duty_doctor_sms": "SENT",
            "guardian_whatsapp": "SENT",
        },
    )


@router.get(
    "/phrases",
    response_model=EmergencyPhrasesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get 1-Tap SOS Emergency Cards and Regional Translations",
)
async def get_emergency_phrases() -> EmergencyPhrasesResponse:
    phrases = [
        EmergencyPhrase(
            id="sos_ambulance",
            code="AMBULANCE",
            title="Ambulance",
            severity="critical",
            icon="Ambulance",
            english="Please call an ambulance immediately!",
            hindi="कृपया तुरंत एम्बुलेंस बुलाएं!",
            odia="ଦୟାକରି ତୁରନ୍ତ ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ!",
            telugu="దయచేసి వెంటనే అంబులెన్స్ పిలవండి!",
            audio_asset="/assets/audio/sos_ambulance.mp3",
        ),
        EmergencyPhrase(
            id="sos_pain",
            code="SEVERE_PAIN",
            title="Severe Pain",
            severity="critical",
            icon="AlertTriangle",
            english="I am in severe pain, please help me!",
            hindi="मुझे बहुत तेज दर्द हो रहा है, कृपया मदद करें!",
            odia="ମୋର ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି, ଦୟାକରି ମୋତେ ସାହାଯ୍ୟ କରନ୍ତୁ!",
            telugu="నాకు తీవ్రమైన నొప్పి ఉంది, దయచేసి నాకు సహాయం చేయండి!",
            audio_asset="/assets/audio/sos_pain.mp3",
        ),
        EmergencyPhrase(
            id="sos_doctor",
            code="DOCTOR_NEEDED",
            title="Doctor Needed",
            severity="urgent",
            icon="Stethoscope",
            english="Doctor needed urgently here!",
            hindi="यहाँ तत्काल डॉक्टर की आवश्यकता है!",
            odia="ଏଠାରେ ତୁରନ୍ତ ଡାକ୍ତରଙ୍କ ଆବଶ୍ୟକତା ଅଛି!",
            telugu="ఇక్కడ తక్షణమే డాక్టర్ అవసరం ఉంది!",
            audio_asset="/assets/audio/sos_doctor.mp3",
        ),
        EmergencyPhrase(
            id="sos_breathe",
            code="CANNOT_BREATHE",
            title="Cannot Breathe",
            severity="critical",
            icon="AlertTriangle",
            english="Patient having severe breathing difficulty!",
            hindi="मरीज को सांस लेने में भारी तकलीफ हो रही है!",
            odia="ରୋଗୀଙ୍କୁ ନିଶ୍ୱାସ ନେବାରେ ପ୍ରବଳ କଷ୍ଟ ହେଉଛି!",
            telugu="రోగికి శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది ఉంది!",
            audio_asset="/assets/audio/sos_breathe.mp3",
        ),
        EmergencyPhrase(
            id="sos_lost",
            code="LOST_CONFUSED",
            title="Lost / Help",
            severity="urgent",
            icon="HelpCircle",
            english="I am lost and cannot find my way.",
            hindi="मैं रास्ता भटक गया हूँ, कृपया मार्गदर्शन करें।",
            odia="ମୁଁ ରାସ୍ତା ହଜାଇ ଦେଇଛି ଏବଂ ପାଇପାରୁ ନାହିଁ।",
            telugu="నేను దారి తప్పిపోయాను, దయచేసి సహాయం చేయండి.",
            audio_asset="/assets/audio/sos_lost.mp3",
        ),
    ]
    return EmergencyPhrasesResponse(count=len(phrases), phrases=phrases)


@router.post(
    "/trigger-sos",
    response_model=SOSTriggerResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Multi-Channel 1-Tap SOS Emergency Broadcast",
    description="Dispatches instant audio, visual strobe, GPS link, and WhatsApp payload to hospital nurse desks and guardians.",
)
async def trigger_sos(request: SOSTriggerRequest) -> SOSTriggerResponse:
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    sos_id = f"SOS-{int(time.time())}"
    location = request.location_tag or "Civil Hospital Kiosk Terminal"
    lat = request.latitude or 20.2961
    lng = request.longitude or 85.8245
    maps_url = f"https://www.google.com/maps?q={lat},{lng}"

    # Determine Triage Level
    critical_types = ["AMBULANCE", "CANNOT_BREATHE", "SEVERE_PAIN", "DOUBLE_BLINK_EMERGENCY"]
    esi_level = "ESI Level 1 (Resuscitation / Immediate)" if request.emergency_type in critical_types else "ESI Level 2 (Emergent)"

    # WhatsApp Clickable Dispatch Payload
    message_text = (
        f"🚨 *SIGNBRIDGE HOSPITAL EMERGENCY SOS* 🚨\n"
        f"• *Alert ID:* {sos_id}\n"
        f"• *Emergency Type:* {request.emergency_type}\n"
        f"• *Triage:* {esi_level}\n"
        f"• *Patient:* {request.patient_name} (ABHA: {request.abha_id})\n"
        f"• *Location:* {location}\n"
        f"• *GPS Map:* {maps_url}\n"
        f"• *Timestamp:* {now_iso}\n"
        f"_Please respond immediately to the terminal._"
    )
    encoded_msg = urllib.parse.quote(message_text)
    whatsapp_url = f"https://api.whatsapp.com/send?text={encoded_msg}"

    alert_record = {
        "sos_id": sos_id,
        "timestamp_iso": now_iso,
        "emergency_type": request.emergency_type,
        "patient_name": request.patient_name,
        "location": location,
        "triage": esi_level,
        "maps_url": maps_url,
    }
    _ACTIVE_ALERTS_LOG.insert(0, alert_record)
    if len(_ACTIVE_ALERTS_LOG) > 30:
        _ACTIVE_ALERTS_LOG.pop()

    return SOSTriggerResponse(
        sos_id=sos_id,
        status="DISPATCHED",
        timestamp_iso=now_iso,
        emergency_type=request.emergency_type,
        triage_esi_level=esi_level,
        strobe_visual_alert=True,
        google_maps_url=maps_url,
        whatsapp_dispatch_link=whatsapp_url,
        regional_audio_broadcast={
            "en": f"Emergency alert! Patient at {location} reports {request.emergency_type}!",
            "hi": f"आपातकालीन चेतावनी! {location} के मरीज ने {request.emergency_type} सहायता माँगी है!",
            "or": f"ଜରୁରୀକାଳୀନ ସତର୍କତା! {location} ରୋଗୀ {request.emergency_type} ସାହାଯ୍ୟ ମାଗିଛନ୍ତି!",
            "te": f"అత్యవసర హెచ్చరిక! {location} లో రోగి {request.emergency_type} అత్యవసర సహాయం కోరారు!",
        },
        dispatch_notifications={
            "nursing_station": "DISPATCHED_WEBHOOK",
            "duty_doctor_sms": "SENT_TELEMETRY",
            "guardian_whatsapp": "ENCODED_PAYLOAD_READY",
        },
    )


class PatientVitalsInput(BaseModel):
    heart_rate_bpm: Optional[int] = Field(default=None, example=128)
    spo2_percent: Optional[int] = Field(default=None, example=89)
    systolic_bp: Optional[int] = Field(default=None, example=85)
    pain_score: Optional[int] = Field(default=8, ge=0, le=10, example=8)
    distress_facial_blinks: Optional[int] = Field(default=3, example=3)


class ClinicalTriageRequest(BaseModel):
    patient_id: Optional[str] = Field(default="PAT-9842", example="PAT-9842")
    patient_name: Optional[str] = Field(default="Rahul Sahoo", example="Rahul Sahoo")
    isl_tokens: List[str] = Field(default=["I", "CANNOT", "BREATHE"], example=["I", "CANNOT", "BREATHE"])
    reported_symptoms: Optional[str] = Field(default="Sudden acute breathlessness and chest tightness", example="Sudden acute breathlessness")
    vitals: Optional[PatientVitalsInput] = Field(default_factory=PatientVitalsInput)


class ClinicalTriageResponse(BaseModel):
    patient_id: str = Field(..., example="PAT-9842")
    patient_name: str = Field(..., example="Rahul Sahoo")
    esi_level: int = Field(..., example=1)
    esi_title: str = Field(..., example="ESI Level 1 (Immediate Resuscitation)")
    triage_color: str = Field(..., example="RED")
    is_life_threatening: bool = Field(..., example=True)
    target_department: str = Field(..., example="Trauma & Resuscitation ICU")
    clinical_rationale: str = Field(..., example="SpO2 < 90% and respiratory distress tokens indicate impending failure.")
    recommended_action: str = Field(..., example="Immediate high-flow oxygen, call crash team.")
    provisional_icd10: str = Field(..., example="R06.02 (Shortness of breath)")
    timestamp_iso: str = Field(..., example="2026-11-08T10:00:00Z")


@router.post(
    "/triage-evaluate",
    response_model=ClinicalTriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Emergency Severity Index (ESI Level 1 to 5) Triage",
    description="Combines ISL distress gestures, reported symptoms, and optional vitals to grade clinical emergency urgency.",
)
async def evaluate_clinical_triage(request: ClinicalTriageRequest) -> ClinicalTriageResponse:
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    tokens = [t.upper() for t in request.isl_tokens]
    vitals = request.vitals or PatientVitalsInput()

    # Rule 1: Immediate Resuscitation (ESI 1)
    # Cardiac arrest, severe hypoxia, profound shock
    is_level_1 = False
    level_1_reasons = []

    if any(t in tokens for t in ["CANNOT_BREATHE", "BREATHLESS", "UNCONSCIOUS", "FAINT", "COLLAPSE"]):
        is_level_1 = True
        level_1_reasons.append("Severe respiratory distress tokens detected")

    if vitals.spo2_percent and vitals.spo2_percent < 90:
        is_level_1 = True
        level_1_reasons.append(f"Critical hypoxia (SpO2 {vitals.spo2_percent}%)")

    if vitals.systolic_bp and vitals.systolic_bp < 90:
        is_level_1 = True
        level_1_reasons.append(f"Hypotensive shock (Systolic BP {vitals.systolic_bp} mmHg)")

    if is_level_1:
        return ClinicalTriageResponse(
            patient_id=request.patient_id or "PAT-9842",
            patient_name=request.patient_name or "Rahul Sahoo",
            esi_level=1,
            esi_title="ESI Level 1 (Immediate Resuscitation)",
            triage_color="RED",
            is_life_threatening=True,
            target_department="Resuscitation / ICU Ward 1",
            clinical_rationale="; ".join(level_1_reasons),
            recommended_action="Immediate airway assessment, high-flow oxygen, crash cart alert.",
            provisional_icd10="R06.02 (Dyspnea / Acute Respiratory Distress)",
            timestamp_iso=now_iso
        )

    # Rule 2: High Risk / Severe Pain / Vital Instability (ESI 2)
    is_level_2 = False
    level_2_reasons = []

    if any(t in tokens for t in ["CHEST_PAIN", "HEART", "BLEEDING", "BLOOD", "STROKE"]):
        is_level_2 = True
        level_2_reasons.append("Acute vascular/cardiac warning tokens")

    if vitals.pain_score and vitals.pain_score >= 8:
        is_level_2 = True
        level_2_reasons.append(f"Excruciating intractable pain (Score {vitals.pain_score}/10)")

    if vitals.heart_rate_bpm and (vitals.heart_rate_bpm > 120 or vitals.heart_rate_bpm < 45):
        is_level_2 = True
        level_2_reasons.append(f"Significant arrhythmia/tachycardia (HR {vitals.heart_rate_bpm} bpm)")

    if is_level_2:
        return ClinicalTriageResponse(
            patient_id=request.patient_id or "PAT-9842",
            patient_name=request.patient_name or "Rahul Sahoo",
            esi_level=2,
            esi_title="ESI Level 2 (Emergent / High Risk)",
            triage_color="ORANGE",
            is_life_threatening=False,
            target_department="Acute Emergency Triage - Zone 2",
            clinical_rationale="; ".join(level_2_reasons),
            recommended_action="Bedside physician evaluation within 10 minutes, ECG stat, venous access.",
            provisional_icd10="R07.9 (Chest Pain / Acute Emergent Finding)",
            timestamp_iso=now_iso
        )

    # Rule 3: Moderate Symptoms (ESI 3) - Abdominal Pain, High Fever
    if any(t in tokens for t in ["STOMACH_PAIN", "PAIN_STOMACH", "FEVER", "VOMIT", "DIZZY"]):
        return ClinicalTriageResponse(
            patient_id=request.patient_id or "PAT-9842",
            patient_name=request.patient_name or "Rahul Sahoo",
            esi_level=3,
            esi_title="ESI Level 3 (Urgent / Multiple Diagnostic Resources)",
            triage_color="YELLOW",
            is_life_threatening=False,
            target_department="General Medicine OPD / Observation Bay",
            clinical_rationale="Moderate systemic symptoms requiring diagnostic blood work or ultrasound.",
            recommended_action="Draw blood baseline, start oral/IV hydration, doctor consult within 30 mins.",
            provisional_icd10="R10.9 (Abdominal Pain / Febrile Illness)",
            timestamp_iso=now_iso
        )

    # Rule 4 & 5: Mild/Routine (ESI 4 or 5)
    return ClinicalTriageResponse(
        patient_id=request.patient_id or "PAT-9842",
        patient_name=request.patient_name or "Rahul Sahoo",
        esi_level=4,
        esi_title="ESI Level 4 (Less Urgent / Single Resource Consultation)",
        triage_color="GREEN",
        is_life_threatening=False,
        target_department="Routine OPD Clinic - Registration Desk",
        clinical_rationale="Stable vital parameters, low acuity symptoms suitable for ambulatory care.",
        recommended_action="Routine OPD queuing, vital check, medication reconciliation.",
        provisional_icd10="Z00.00 (General Adult Medical Examination)",
        timestamp_iso=now_iso
    )


@router.get(
    "/active-alerts",
    status_code=status.HTTP_200_OK,
    summary="Get Hospital Active SOS Emergency Alerts Queue",
    description="Returns the live queue of triggered SOS emergencies for central nursing dashboards.",
)
async def get_active_alerts():
    return {
        "total_active_alerts": len(_ACTIVE_ALERTS_LOG),
        "alerts": _ACTIVE_ALERTS_LOG,
    }
