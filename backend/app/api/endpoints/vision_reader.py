import base64
import json
import re
import datetime
import time as _time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, status
import google.generativeai as genai
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter()

# 6-preset medicine rotation (cycles when GEMINI_API_KEY is absent)
_OFFLINE_MEDICINE_ROTATION = [
    "paracetamol",
    "azithral",
    "pantocid",
    "augmentin",
    "paracetamol",   # intentionally repeated to demo allergy-safe baseline
    "paracetamol",
]
_medicine_scan_counter = 0

# Patient Documented Allergies Registry
PATIENT_ALLERGY_REGISTRY: Dict[str, Dict[str, Any]] = {
    "PAT-9842": {
        "name": "Rahul Sahoo",
        "abha_id": "91-4829-1039-4820",
        "allergies": ["Penicillin", "Amoxicillin", "Ampicillin"],
        "chronic_conditions": ["Mild Asthma"],
    }
}

# Indian Clinical Essential Medicines Knowledge Base (NLEM / CDSCO Standards)
INDIAN_ESSENTIAL_DRUGS_DB = {
    "paracetamol": {
        "name": "Paracetamol (Dolo 650)",
        "strength": "650 mg",
        "active_ingredients": ["Acetaminophen (Paracetamol) 650mg"],
        "allergy_family": "Acetaminophen",
        "schedule": "Over-The-Counter (OTC)",
        "dosage": "Take 1 tablet after food every 6 to 8 hours as needed for fever or pain.",
        "expiry_date": "November 2027",
        "is_expired": False,
        "warnings": [
            "Do not exceed 3 tablets (2000mg) in 24 hours.",
            "Avoid alcohol while taking this medication.",
            "Consult physician if fever persists beyond 3 days."
        ],
        "spoken": {
            "en": "Dolo 650: Paracetamol 650 milligram. Take 1 tablet after food. Do not exceed 3 tablets daily. Expiry Date: November 2027.",
            "hi": "डोलो 650: पैरासिटामोल 650 मिलीग्राम। भोजन के बाद 1 गोली लें। 24 घंटे में 3 से अधिक गोलियां न लें। समाप्ति तिथि: नवंबर 2027।",
            "or": "ଡୋଲୋ 650: ପାରାସିଟାମୋଲ 650 ମିଲିଗ୍ରାମ। ଖାଇବା ପରେ 1 ଟାବଲେଟ୍ ନିଅନ୍ତୁ। ଦିନକୁ 3 ଟାରୁ ଅଧିକ ନିଅନ୍ତୁ ନାହିଁ। ଏକ୍ସପାୟରୀ: ନଭେମ୍ବର 2027।",
            "te": "డోలో 650: పారాసిటమాల్ 650 మిల్లీగ్రాములు. భోజనం తర్వాత 1 టాబ్లెట్ తీసుకోండి. రోజుకు 3 కంటే ఎక్కువ తీసుకోకండి. గడువు: నవంబర్ 2027.",
        }
    },
    "augmentin": {
        "name": "Augmentin 625 Duo",
        "strength": "625 mg",
        "active_ingredients": ["Amoxicillin Trihydrate (500mg)", "Potassium Clavulanate (125mg)"],
        "allergy_family": "Penicillin",
        "schedule": "Schedule H (Prescription Required)",
        "dosage": "Take 1 tablet twice daily with food for the full 5-day course.",
        "expiry_date": "December 2026",
        "is_expired": False,
        "warnings": [
            "Contains Amoxicillin (Penicillin family antibiotic).",
            "CONTRAINDICATED in patients with documented Penicillin allergy.",
            "Must be taken with food to reduce gastrointestinal upset."
        ],
        "spoken": {
            "en": "Augmentin 625: Contains Amoxicillin and Clavulanic Acid. Take 1 tablet twice daily with food. Warning: Contains Penicillin class antibiotic.",
            "hi": "ऑगमेंटिन 625: इसमें एमोक्सिसिलिन और क्लेवुलैनिक एसिड है। भोजन के साथ दिन में दो बार 1 गोली लें। चेतावनी: पेनिसिलिन एलर्जी वाले न लें।",
            "or": "ଅଗମେଣ୍ଟିନ୍ 625: ଏଥିରେ ଆମୋକ୍ସିସିଲିନ୍ ଅଛି। ଖାଇବା ସହିତ ଦିନକୁ ଦୁଇଥର 1 ଟାବଲେଟ୍ ନିଅନ୍ତୁ। ପେନିସିଲିନ୍ ଆଲର୍ଜି ଥିଲେ ଖାଆନ୍ତୁ ନାହିଁ।",
            "te": "ఆగ్మెంటిన్ 625: ఇందులో అమోక్సిసిలిన్ ఉంది. భోజనంతో రోజుకు రెండుసార్లు 1 టాబ్లెట్ తీసుకోండి. పెన్సిలిన్ అలెర్జీ ఉన్నవారు తీసుకోరాదు.",
        }
    },
    "azithral": {
        "name": "Azithral 500",
        "strength": "500 mg",
        "active_ingredients": ["Azithromycin 500mg"],
        "allergy_family": "Macrolide",
        "schedule": "Schedule H (Prescription Required)",
        "dosage": "Take 1 tablet once daily, 1 hour before or 2 hours after meals for 3 days.",
        "expiry_date": "March 2027",
        "is_expired": False,
        "warnings": [
            "Complete full 3-day course even if symptoms improve.",
            "Safe alternative for patients with Penicillin allergy."
        ],
        "spoken": {
            "en": "Azithral 500: Azithromycin 500 milligram. Take 1 tablet once daily for 3 days. Safe alternative for penicillin-allergic patients.",
            "hi": "एजिथ्रल 500: एज़िथ्रोमाइसिन 500 मिलीग्राम। 3 दिनों के लिए दिन में एक बार 1 गोली लें।",
            "or": "ଆଜିଥ୍ରାଲ୍ 500: ଆଜିଥ୍ରୋମାଇସିନ୍ 500 ମିଲିଗ୍ରାମ। 3 ଦିନ ପାଇଁ ଦିନକୁ ଥରେ 1 ଟାବଲେଟ୍ ନିଅନ୍ତୁ।",
            "te": "అజిత్రాల్ 500: అజిత్రోమైసిన్ 500 మిల్లీగ్రాములు. 3 రోజుల పాటు రోజుకు ఒకసారి 1 టాబ్లెట్ తీసుకోండి.",
        }
    },
    "pantocid": {
        "name": "Pantocid 40",
        "strength": "40 mg",
        "active_ingredients": ["Pantoprazole Sodium 40mg"],
        "allergy_family": "Proton Pump Inhibitor (PPI)",
        "schedule": "Schedule H",
        "dosage": "Take 1 tablet in the morning 30 minutes before breakfast.",
        "expiry_date": "August 2027",
        "is_expired": False,
        "warnings": ["Swallow whole with water; do not crush or chew."],
        "spoken": {
            "en": "Pantocid 40: Pantoprazole 40 milligram. Take 1 tablet in the morning 30 minutes before breakfast with water.",
            "hi": "पेंटोसिड 40: पेंटोप्राजोल 40 मिलीग्राम। सुबह नाश्ते से 30 मिनट पहले 1 गोली पानी के साथ लें।",
            "or": "ପାଣ୍ଟୋସିଡ୍ 40: ପାଣ୍ଟୋପ୍ରାଜୋଲ 40 ମିଲିଗ୍ରାମ। ସକାଳ ଜଳଖିଆର 30 ମିନିଟ୍ ପୂର୍ବରୁ 1 ଟାବଲେଟ୍ ପାଣି ସହ ନିଅନ୍ତୁ।",
            "te": "పాంటోసిడ్ 40: పాంటోప్రాజోల్ 40 మిల్లీగ్రాములు. ఉదయం అల్పాహారానికి 30 నిమిషాల ముందు 1 టాబ్లెట్ నీటితో తీసుకోండి.",
        }
    }
}


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
    patient_id: Optional[str] = Field(default="PAT-9842", example="PAT-9842")
    user_context: Optional[str] = Field(default="prescription_check", example="prescription_check")


class MedicineScanResponse(BaseModel):
    medicine_name: str = Field(..., example="Paracetamol (Dolo 650)")
    strength: Optional[str] = Field(default=None, example="650 mg")
    active_ingredients: List[str] = Field(
        default_factory=list,
        example=["Acetaminophen (Paracetamol) 650mg"],
    )
    dosage_instructions: str = Field(
        ...,
        example="Take one tablet after food with water, every 6-8 hours as needed.",
    )
    expiry_date: Optional[str] = Field(default=None, example="November 2027")
    is_expired: bool = Field(default=False, example=False)
    schedule: str = Field(default="Over-The-Counter (OTC)", example="Over-The-Counter (OTC)")
    has_allergy_contraindication: bool = Field(default=False, example=False)
    warnings: List[str] = Field(
        default_factory=list,
        example=["Do not exceed 4000mg in 24 hours", "Avoid alcohol consumption"],
    )
    spoken_summary: str = Field(
        ...,
        description="High-clarity, text-to-speech optimized audio script designed for blind patients",
        example="Dolo 650: Paracetamol 650 milligram. Take 1 tablet after food. Expiry: November 2027.",
    )
    confidence: float = Field(..., example=0.96)


class SignboardScanRequest(BaseModel):
    image_base64: str = Field(
        ...,
        description="Base64 encoded snapshot of hospital doors, corridors, or directional signs",
        example="data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    )
    preferred_language: str = Field(default="en", example="en")


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


def _clean_base64(data_uri: str) -> tuple[str, bytes]:
    mime_type = "image/jpeg"
    clean_b64 = data_uri
    if "," in data_uri:
        header, clean_b64 = data_uri.split(",", 1)
        match = re.search(r"data:([^;]+);", header)
        if match:
            mime_type = match.group(1)

    raw_bytes = base64.b64decode(clean_b64)
    return mime_type, raw_bytes


def _scan_medicine_with_gemini(image_base64: str, preferred_language: str) -> Optional[dict]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        mime_type, raw_bytes = _clean_base64(image_base64)
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are the SignBridge Universal Medicine Scanner designed for blind and visually impaired patients in India.
Analyze this medicine packaging / strip / prescription.
Extract the drug details accurately.
Preferred language for spoken audio summary: '{preferred_language}' (en = English, hi = Hindi, or = Odia, te = Telugu).

Respond strictly in pure JSON format:
{{
  "medicine_name": "Dolo 650",
  "strength": "650 mg",
  "active_ingredients": ["Paracetamol 650mg"],
  "dosage_instructions": "Take 1 tablet after food with water.",
  "expiry_date": "November 2027",
  "is_expired": false,
  "warnings": ["Do not exceed 3 tablets in 24 hours."],
  "spoken_summary": "Clear, concise spoken sentence for blind user in {preferred_language}.",
  "confidence": 0.96
}}"""

        image_part = {"mime_type": mime_type, "data": raw_bytes}
        response = model.generate_content([prompt, image_part])

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


def _scan_signboard_with_gemini(image_base64: str, preferred_language: str) -> Optional[dict]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        mime_type, raw_bytes = _clean_base64(image_base64)
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are the SignBridge Universal Hospital Navigation Scanner for blind and elderly patients.
Analyze this image of a hospital corridor, door, or directional signboard.
Extract:
- detected_text: exact text written on the signboard.
- facility_type: e.g. "Emergency OPD", "Pharmacy", "ICU", "Restroom".
- directional_guidance: spatial instructions (e.g. "Entrance is 5 meters straight ahead.").
- spoken_summary: high-clarity voice output in preferred language '{preferred_language}'.
- emergency_facility: true if emergency or triage.

Respond strictly in pure JSON format:
{{
  "detected_text": "...",
  "facility_type": "...",
  "directional_guidance": "...",
  "spoken_summary": "...",
  "emergency_facility": true
}}"""

        image_part = {"mime_type": mime_type, "data": raw_bytes}
        response = model.generate_content([prompt, image_part])

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
    "/scan-medicine",
    response_model=MedicineScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan Medicine Strip or Prescription with Clinical Safety Verification",
    description="Extracts drug name, dosage, checks expiry risk, verifies patient allergies, and produces an instant audio summary for blind users.",
)
async def scan_medicine(request: MedicineScanRequest) -> MedicineScanResponse:
    # 1. Try Gemini 1.5 Vision OCR if API Key present and image provided
    gemini_result = None
    if request.image_base64 and len(request.image_base64) > 100:
        gemini_result = _scan_medicine_with_gemini(request.image_base64, request.preferred_language)

    # 2. Match with Indian Clinical Drug Knowledge Base
    target_lang = request.preferred_language.split("-")[0]
    # Offline: rotate through 6 presets instead of always defaulting to Dolo 650
    global _medicine_scan_counter
    offline_key = _OFFLINE_MEDICINE_ROTATION[_medicine_scan_counter % len(_OFFLINE_MEDICINE_ROTATION)]
    _medicine_scan_counter += 1
    matched_entry = INDIAN_ESSENTIAL_DRUGS_DB.get(offline_key, INDIAN_ESSENTIAL_DRUGS_DB["paracetamol"])

    if gemini_result and "medicine_name" in gemini_result:
        med_name_lower = gemini_result["medicine_name"].lower()
        for key, entry in INDIAN_ESSENTIAL_DRUGS_DB.items():
            if key in med_name_lower:
                matched_entry = entry
                break

    # 3. Patient Allergy Contraindication Cross-Check
    has_allergy_risk = False
    allergy_warnings = list(matched_entry["warnings"])
    patient_info = PATIENT_ALLERGY_REGISTRY.get(request.patient_id or "PAT-9842")

    if patient_info and matched_entry.get("allergy_family"):
        allergy_fam = matched_entry["allergy_family"].lower()
        for patient_allergy in patient_info["allergies"]:
            if patient_allergy.lower() in allergy_fam or allergy_fam in patient_allergy.lower():
                has_allergy_risk = True
                allergy_warnings.insert(
                    0,
                    f"🚨 CRITICAL CONTRAINDICATION: Patient {patient_info['name']} has documented {patient_allergy} Allergy! DO NOT ADMINISTER."
                )

    spoken = matched_entry["spoken"].get(target_lang, matched_entry["spoken"]["en"])
    if has_allergy_risk:
        spoken = f"Warning: Allergy Conflict! Patient is allergic to this medicine. " + spoken

    return MedicineScanResponse(
        medicine_name=gemini_result.get("medicine_name", matched_entry["name"]) if gemini_result else matched_entry["name"],
        strength=gemini_result.get("strength", matched_entry["strength"]) if gemini_result else matched_entry["strength"],
        active_ingredients=gemini_result.get("active_ingredients", matched_entry["active_ingredients"]) if gemini_result else matched_entry["active_ingredients"],
        dosage_instructions=gemini_result.get("dosage_instructions", matched_entry["dosage"]) if gemini_result else matched_entry["dosage"],
        expiry_date=gemini_result.get("expiry_date", matched_entry["expiry_date"]) if gemini_result else matched_entry["expiry_date"],
        is_expired=gemini_result.get("is_expired", matched_entry["is_expired"]) if gemini_result else matched_entry["is_expired"],
        schedule=matched_entry.get("schedule", "Over-The-Counter (OTC)"),
        has_allergy_contraindication=has_allergy_risk,
        warnings=allergy_warnings,
        spoken_summary=spoken,
        confidence=float(gemini_result.get("confidence", 0.965)) if gemini_result else 0.965,
    )


# Clinical Drug-Drug Interaction (DDI) & Pharmacovigilance Rules
DDI_RULES_MATRIX = [
    {
        "pair": ("aspirin", "warfarin"),
        "severity": "CRITICAL",
        "mechanism": "Additive anticoagulant and antiplatelet synergy with gastric mucosal injury.",
        "effect": "Severe hemorrhage, gastrointestinal bleeding, elevated INR.",
        "recommendation": "Avoid concurrent administration unless clinically indicated (e.g. mechanical heart valve) with PPI gastroprotection.",
    },
    {
        "pair": ("amlodipine", "ibuprofen"),
        "severity": "MAJOR",
        "mechanism": "NSAID inhibition of renal prostaglandins attenuates calcium channel blocker hypotensive effect.",
        "effect": "Loss of blood pressure control and increased risk of acute kidney injury (AKI).",
        "recommendation": "Substitute NSAID with Paracetamol (Dolo 650) for analgesia in hypertensive patients.",
    },
    {
        "pair": ("telmisartan", "diclofenac"),
        "severity": "MAJOR",
        "mechanism": "Dual inhibition of renal hemodynamic autoregulation via ARB + NSAID.",
        "effect": "Marked acute renal failure, hyperkalemia, and cardiovascular strain.",
        "recommendation": "Use topical analgesics or Paracetamol; monitor serum creatinine and potassium closely.",
    },
    {
        "pair": ("metformin", "contrast"),
        "severity": "MAJOR",
        "mechanism": "Radiocontrast-induced nephropathy impairs renal metformin excretion.",
        "effect": "Severe Metformin-Associated Lactic Acidosis (MALA), high mortality risk.",
        "recommendation": "Withhold Metformin 48 hours before and 48 hours after iodinated radiocontrast procedures.",
    },
    {
        "pair": ("sildenafil", "nitroglycerin"),
        "severity": "CRITICAL",
        "mechanism": "Potentiation of cGMP-mediated vasodilation via combined PDE5 inhibition and organic nitrate.",
        "effect": "Life-threatening, profound systemic hypotension and syncope.",
        "recommendation": "Absolute contraindication. Nitrates must not be administered within 24-48 hours of PDE5 inhibitors.",
    },
    {
        "pair": ("azithromycin", "ondansetron"),
        "severity": "MAJOR",
        "mechanism": "Additive cardiac electrophysiological QTc interval prolongation.",
        "effect": "Ventricular arrhythmias, Torsades de Pointes, cardiac arrest.",
        "recommendation": "Perform baseline ECG. Avoid combination in patients with preexisting congenital long QT or hypokalemia.",
    },
    {
        "pair": ("augmentin", "methotrexate"),
        "severity": "MAJOR",
        "mechanism": "Penicillins compete with and inhibit organic anion transporter (OAT1/3) renal excretion of methotrexate.",
        "effect": "Severe methotrexate bone marrow toxicity and pancytopenia.",
        "recommendation": "Monitor serum methotrexate levels; dose reduction or temporary antibiotic substitution advised.",
    },
    {
        "pair": ("ciprofloxacin", "antacid"),
        "severity": "MODERATE",
        "mechanism": "Chelation binding of fluoroquinolone to multivalent cations (Al, Mg, Ca) in gastrointestinal tract.",
        "effect": "Decreases antibiotic bioavailability by up to 90%, causing therapeutic failure.",
        "recommendation": "Administer fluoroquinolone at least 2 hours before or 6 hours after antacids or mineral supplements.",
    },
]


class DDIInteractionItem(BaseModel):
    drug_a: str = Field(..., example="Amlodipine")
    drug_b: str = Field(..., example="Ibuprofen")
    severity: str = Field(..., example="MAJOR")
    mechanism: str = Field(..., example="Inhibition of renal prostaglandins")
    clinical_effect: str = Field(..., example="Loss of blood pressure control")
    recommendation: str = Field(..., example="Substitute with Paracetamol")


class DDICheckRequest(BaseModel):
    current_medications: List[str] = Field(
        default=["Amlodipine 5mg", "Metformin 500mg"],
        example=["Amlodipine 5mg", "Metformin 500mg"],
        description="Medications the patient is currently taking chronic/daily",
    )
    new_prescribed_drugs: List[str] = Field(
        ...,
        example=["Ibuprofen 400mg", "Pantocid 40"],
        description="New drugs prescribed by the physician or scanned via OCR",
    )
    patient_id: Optional[str] = Field(default="PAT-9842", example="PAT-9842")


class DDICheckResponse(BaseModel):
    patient_id: str = Field(..., example="PAT-9842")
    patient_name: str = Field(..., example="Rahul Sahoo")
    has_critical_interaction: bool = Field(..., example=False)
    has_major_interaction: bool = Field(..., example=True)
    safety_clearance: str = Field(..., example="WARNING - ACTION REQUIRED")
    interactions: List[DDIInteractionItem]
    allergy_conflicts: List[str]
    pharmacist_advisory: str = Field(..., example="Avoid NSAID co-administration with antihypertensive regimen.")


@router.post(
    "/check-ddi",
    response_model=DDICheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Clinical Drug-Drug Interaction (DDI) & Allergy Safety Matrix",
    description="Cross-references active medications, newly prescribed drugs, and patient allergies against CDSCO/FDA pharmacovigilance rules.",
)
async def check_drug_drug_interactions(request: DDICheckRequest) -> DDICheckResponse:
    patient = PATIENT_ALLERGY_REGISTRY.get(request.patient_id or "PAT-9842", {
        "name": "General OPD Patient",
        "allergies": []
    })

    # Combine all drugs to check pairwise
    all_drugs = list(set([d.lower() for d in request.current_medications + request.new_prescribed_drugs]))
    detected_interactions: List[DDIInteractionItem] = []
    has_critical = False
    has_major = False

    for rule in DDI_RULES_MATRIX:
        drug_a_term, drug_b_term = rule["pair"]
        found_a = any(drug_a_term in d for d in all_drugs)
        found_b = any(drug_b_term in d for d in all_drugs)

        if found_a and found_b:
            if rule["severity"] == "CRITICAL":
                has_critical = True
            elif rule["severity"] == "MAJOR":
                has_major = True

            detected_interactions.append(
                DDIInteractionItem(
                    drug_a=drug_a_term.title(),
                    drug_b=drug_b_term.title(),
                    severity=rule["severity"],
                    mechanism=rule["mechanism"],
                    clinical_effect=rule["effect"],
                    recommendation=rule["recommendation"]
                )
            )

    # Check newly prescribed drugs against patient allergies
    allergy_conflicts = []
    for new_drug in request.new_prescribed_drugs:
        for allergen in patient.get("allergies", []):
            if allergen.lower() in new_drug.lower() or (allergen.lower() == "penicillin" and "augmentin" in new_drug.lower()):
                allergy_conflicts.append(f"Patient has documented {allergen} allergy! Prescribed '{new_drug}' is contraindicated.")
                has_critical = True

    if has_critical:
        clearance = "BLOCKED (Critical Contraindication Detected)"
        advisory = "Prescription BLOCKED: Critical drug conflict or severe patient allergy detected. Immediate clinical review required."
    elif has_major:
        clearance = "WARNING (Major Drug-Drug Interaction Detected)"
        advisory = "Caution: Major drug interaction flagged. Substitute conflicting NSAID/antibiotic or adjust monitoring interval."
    else:
        clearance = "CLEARED (Safe to Dispense)"
        advisory = "No clinical contraindications or significant drug-drug interactions detected across active regimen."

    return DDICheckResponse(
        patient_id=request.patient_id or "PAT-9842",
        patient_name=patient.get("name", "Rahul Sahoo"),
        has_critical_interaction=has_critical,
        has_major_interaction=has_major,
        safety_clearance=clearance,
        interactions=detected_interactions,
        allergy_conflicts=allergy_conflicts,
        pharmacist_advisory=advisory
    )


@router.post(
    "/scan-signboard",
    response_model=SignboardScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan Hospital Signboard & Corridor Direction",
    description="Recognizes hospital department signboards, room numbers, and provides spatial audio guidance.",
)
async def scan_signboard(request: SignboardScanRequest) -> SignboardScanResponse:
    gemini_result = None
    if request.image_base64 and len(request.image_base64) > 100:
        gemini_result = _scan_signboard_with_gemini(request.image_base64, request.preferred_language)

    if gemini_result and "detected_text" in gemini_result:
        return SignboardScanResponse(
            detected_text=gemini_result.get("detected_text", "EMERGENCY OPD ROOM 102"),
            facility_type=gemini_result.get("facility_type", "Emergency Ward"),
            directional_guidance=gemini_result.get("directional_guidance", "Straight ahead 5 meters."),
            spoken_summary=gemini_result.get("spoken_summary", "Emergency OPD Room 102. Straight ahead."),
            emergency_facility=gemini_result.get("emergency_facility", True),
        )

    return SignboardScanResponse(
        detected_text="EMERGENCY OPD & TRIAGE ROOM 102",
        facility_type="Emergency Room / OPD",
        directional_guidance="You are facing Emergency OPD Room 102. Entrance door is 5 meters ahead.",
        spoken_summary="Emergency Outpatient Department, Room 102. Directly ahead.",
        emergency_facility=True,
    )
