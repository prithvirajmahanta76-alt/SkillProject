from typing import List, Dict, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter()


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
    patient_id: Optional[str] = Field(default="PAT-EMERGENCY-01", example="PAT-EMERGENCY-01")
    location_tag: Optional[str] = Field(
        default="Ward 3, Bed 14",
        description="Bed number, ward name, or GPS coordinate string",
        example="Ward 3, Bed 14",
    )
    preferred_language: str = Field(default="hi-IN", example="hi-IN")

    model_config = {
        "json_schema_extra": {
            "example": {
                "emergency_type": "SEVERE_PAIN",
                "patient_id": "PAT-EMERGENCY-01",
                "location_tag": "Ward 3, Bed 14",
                "preferred_language": "hi-IN",
            }
        }
    }


class SOSTriggerResponse(BaseModel):
    sos_id: str = Field(..., example="SOS-20261108-0042")
    status: str = Field(..., example="DISPATCHED")
    timestamp_iso: str = Field(..., example="2026-11-08T10:00:00Z")
    emergency_type: str = Field(..., example="SEVERE_PAIN")
    strobe_visual_alert: bool = Field(
        ...,
        description="If True, client triggers high-contrast visual strobe to attract in-room staff",
        example=True,
    )
    regional_audio_broadcast: Dict[str, str] = Field(
        ...,
        description="Multilingual announcements triggered for hospital PA or bedside speaker",
        example={
            "en": "Emergency alert! Patient in Ward 3, Bed 14 reports severe pain!",
            "hi": "आपातकालीन चेतावनी! वार्ड 3, बेड 14 के मरीज को गंभीर दर्द है!",
            "or": "ଜରୁରୀକାଳୀନ ସତର୍କତା! ୱାର୍ଡ 3, ବେଡ୍ 14 ର ରୋଗୀ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ଅନୁଭବ କରୁଛନ୍ତି!",
            "te": "అత్యవసర హెచ్చరిక! వార్డ్ 3, బెడ్ 14 లోని రోగికి తీవ్రమైన నొప్పి ఉంది!",
        },
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
    description="Returns pre-loaded emergency phrases across English, Hindi, Odia, and Telugu with audio mappings.",
)
async def get_emergency_phrases() -> EmergencyPhrasesResponse:
    """Returns the 8 critical 1-tap SOS cards for the emergency grid."""
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
    summary="Trigger 1-Tap SOS Emergency Broadcast",
    description="Dispatches instant audio, visual strobe, and notification alerts to nursing desks and guardians.",
)
async def trigger_sos(request: SOSTriggerRequest) -> SOSTriggerResponse:
    """Stub endpoint for SOS emergency broadcasting."""
    location = request.location_tag or "Hospital Kiosk Terminal"
    return SOSTriggerResponse(
        sos_id="SOS-20261108-0042",
        status="DISPATCHED",
        timestamp_iso="2026-11-08T10:00:00Z",
        emergency_type=request.emergency_type,
        strobe_visual_alert=True,
        regional_audio_broadcast={
            "en": f"Emergency alert! Patient at {location} reports {request.emergency_type}!",
            "hi": f"आपातकालीन चेतावनी! {location} के मरीज ने सहायता माँगी है!",
            "or": f"ଜରୁରୀକାଳୀନ ସତର୍କତା! {location} ରୋଗୀ ସାହାଯ୍ୟ ମାଗିଛନ୍ତି!",
            "te": f"అత్యవసర హెచ్చరిక! {location} లో రోగి అత్యవసర సహాయం కోరారు!",
        },
        dispatch_notifications={
            "nursing_station": "SENT",
            "duty_doctor_sms": "SENT",
            "guardian_whatsapp": "SENT",
        },
    )

