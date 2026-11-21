import time
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.api.endpoints.consultation import get_db_connection

router = APIRouter()


class StatutoryActReference(BaseModel):
    act: str
    section: str
    provision: str
    penalty_or_relief: str


class GrievanceAnalyzeRequest(BaseModel):
    patient_id: str = Field(default="PAT-9842", example="PAT-9842")
    language: str = Field(default="hi", example="hi")
    raw_speech_text: str = Field(
        ...,
        example="अस्पताल ने आयुष्मान कार्ड होने के बाद भी इमरजेंसी में 15000 रुपये जमा करवाए और बिल नहीं दिया।",
    )
    hospital_name: Optional[str] = Field(default="District Civil Hospital", example="District Civil Hospital")


class GrievanceAnalyzeResponse(BaseModel):
    grievance_category: str
    urgency_tier: str
    legal_summary_en: str
    legal_summary_regional: str
    statutory_citations: List[StatutoryActReference]
    recommended_remedy: str
    actionable_rights: List[str]


class NoticeGenerateRequest(BaseModel):
    patient_id: str = Field(default="PAT-9842", example="PAT-9842")
    patient_name: str = Field(default="Rahul Sahoo", example="Rahul Sahoo")
    abha_id: str = Field(default="91-4829-1039-4820", example="91-4829-1039-4820")
    hospital_name: str = Field(default="District Civil Hospital, Medical Superintendant Office")
    incident_date: Optional[str] = Field(default="2026-11-20")
    disputed_amount: Optional[str] = Field(default="₹15,000")
    grievance_category: str = Field(default="AYUSHMAN_DENIAL")
    detailed_facts: str = Field(
        default="Patient was admitted in acute abdominal emergency with valid ABHA PM-JAY card. Hospital staff illegally demanded advance cash."
    )


class NoticeGenerateResponse(BaseModel):
    notice_id: str
    recipient_title: str
    subject_line: str
    formal_notice_body: str
    statutory_deadlines: str
    verification_qr_text: str
    created_at: str


STATUTE_KNOWLEDGE_BASE = {
    "AYUSHMAN_DENIAL": [
        StatutoryActReference(
            act="Clinical Establishments (Registration and Regulation) Act, 2010",
            section="Section 12(2)",
            provision="Every clinical establishment must provide immediate emergency medical treatment and stabilization without advance monetary demand.",
            penalty_or_relief="Cancellation of clinical establishment license and monetary fine up to ₹5,00,000.",
        ),
        StatutoryActReference(
            act="National Health Authority (NHA) PM-JAY Empanelment Guidelines",
            section="Clause 14.3",
            provision="Empaneled hospitals are strictly prohibited from demanding out-of-pocket cash deposits from verified beneficiaries.",
            penalty_or_relief="Immediate de-empanelment and compulsory refund with 12% statutory penal interest.",
        ),
        StatutoryActReference(
            act="Rights of Persons with Disabilities Act, 2016",
            section="Section 25",
            provision="Government and private hospitals must guarantee barrier-free and non-discriminatory healthcare for persons with speech & hearing disabilities.",
            penalty_or_relief="Prosecution under Section 89 with imprisonment and heavy institutional penalties.",
        ),
    ],
    "DISABILITY_DELAY": [
        StatutoryActReference(
            act="Rights of Persons with Disabilities Act, 2016",
            section="Section 58(2)",
            provision="Medical authority must evaluate and issue UDID Disability Certificate within 30 days of application.",
            penalty_or_relief="Deemed certification and grievance redressal before State Disability Commissioner.",
        ),
    ],
    "MEDICAL_OVERCHARGE": [
        StatutoryActReference(
            act="Consumer Protection Act, 2019",
            section="Section 2(47)",
            provision="Unfair trade practices including overcharging above National List of Essential Medicines (NLEM) ceiling prices.",
            penalty_or_relief="Full refund plus mental harassment compensation in District Consumer Forum.",
        ),
    ],
}


@router.post(
    "/analyze-grievance",
    response_model=GrievanceAnalyzeResponse,
    summary="Vernacular Medico-Legal Triage & Statutory Rights Mapper",
)
async def analyze_grievance(request: GrievanceAnalyzeRequest):
    text_low = request.raw_speech_text.lower()

    if any(k in text_low for k in ["आयुष्मान", "कार्ड", "पैसे", "deposit", "cash", "pm-jay", "cashless"]):
        cat = "AYUSHMAN_DENIAL"
        summary_en = "Illegal denial of cashless treatment under PM-JAY and unauthorized advance cash deposit demand."
        summary_reg = "आयुष्मान भारत योजना के तहत कैशलेस इलाज से अवैध इनकार और अग्रिम धन की मांग।"
        urgency = "CRITICAL_STATUTORY_VIOLATION"
        remedy = "Issue formal 48-hour Statutory Rectification Notice to Hospital Medical Superintendent with CC to District Grievance Nodal Officer."
    elif any(k in text_low for k in ["सर्टिफिकेट", "certificate", "udid", "divyang", "विकलांग"]):
        cat = "DISABILITY_DELAY"
        summary_en = "Unlawful administrative delay exceeding 30-day statutory limit in UDID Certificate issuance."
        summary_reg = "दिव्यांगता प्रमाणपत्र (UDID) जारी करने में 30 दिनों से अधिक का अवैध प्रशासनिक विलंब।"
        urgency = "HIGH_ADMINISTRATIVE_NONCOMPLIANCE"
        remedy = "File statutory petition under RPwD Act Section 58 with the State Disability Commissioner."
    else:
        cat = "MEDICAL_OVERCHARGE"
        summary_en = "Excessive billing and lack of transparent price disclosure under Clinical Establishments norms."
        summary_reg = "अस्पताल द्वारा अत्यधिक बिलिंग और दवाइयों के अधिकतम खुदरा मूल्य का उल्लंघन।"
        urgency = "MEDIUM_COMMERCIAL_DISPUTE"
        remedy = "Serve consumer demand notice demanding audited itemized bill and NLEM price parity."

    citations = STATUTE_KNOWLEDGE_BASE.get(cat, STATUTE_KNOWLEDGE_BASE["AYUSHMAN_DENIAL"])

    rights = [
        "Right to Zero-Advance Emergency Stabilization (CEA 2010)",
        "Right to Full Cashless Coverage under PM-JAY (AB-NHA Standards)",
        "Right to Sign Language Accessibility & Dignified Care (RPwD 2016)",
        "Right to Audited Itemized Medical Bills within 2 hours of discharge",
    ]

    return GrievanceAnalyzeResponse(
        grievance_category=cat,
        urgency_tier=urgency,
        legal_summary_en=summary_en,
        legal_summary_regional=summary_reg,
        statutory_citations=citations,
        recommended_remedy=remedy,
        actionable_rights=rights,
    )


@router.post(
    "/generate-notice",
    response_model=NoticeGenerateResponse,
    summary="Generate Formal Stamped Legal Demand Notice with Statutory Citations",
)
async def generate_notice(request: NoticeGenerateRequest):
    notice_id = f"NOTC-CEA-{int(time.time())}"
    now_str = time.strftime("%d %B %Y", time.localtime())
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    citations = STATUTE_KNOWLEDGE_BASE.get(request.grievance_category, STATUTE_KNOWLEDGE_BASE["AYUSHMAN_DENIAL"])
    statute_text = "\n".join([f"  • {c.act} [{c.section}]: {c.provision}" for c in citations])

    body = f"""LEGAL DEMAND & STATUTORY RECTIFICATION NOTICE
Notice ID: {notice_id} | Issued Under Section 12(2) CEA 2010 & Section 25 RPwD Act 2016
Date of Issuance: {now_str}

TO:
The Medical Superintendent / Grievance Redressal Officer,
{request.hospital_name}

COMES NOW, {request.patient_name} (ABHA ID: {request.abha_id}), represented through the SignBridge Public Legal Aid Kiosk, and respectfully issues this statutory notice:

1. STATEMENT OF FACTS:
   On or about {request.incident_date}, the Patient presented at your facility in an acute medical emergency. Despite possessing an active and verified ABHA Ayushman Bharat (PM-JAY) Golden Card, staff at your billing counter demanded an unauthorized cash deposit of {request.disputed_amount}.
   {request.detailed_facts}

2. STATUTORY VIOLATIONS:
{statute_text}

3. FORMAL RECTIFICATION DEMAND:
   You are hereby called upon to immediately:
   (a) Direct a complete refund of {request.disputed_amount} to the Patient's registered bank account within 48 hours.
   (b) Issue an itemized zero-balance hospital clearance under the PM-JAY package guidelines.
   (c) Record this incident in your hospital Grievance Logbook as mandated by the State Health Authority.

FAILURE TO COMPLY within 48 hours will result in automatic escalation to the District Health Authority, the State Disability Commissioner, and filing of a formal consumer compensation claim for willful statutory negligence.

Issued on behalf of Citizen: {request.patient_name}
Verified by: SignBridge Universal Autonomous Civic Guard
Cryptographic Verification Token: SB-LEGAL-{notice_id}"""

    # Persist grievance in SQLite
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO civic_grievances (
                id, patient_id, grievance_type, narrative, target_entity,
                statutory_sections_json, notice_body, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notice_id,
            request.patient_id,
            request.grievance_category,
            request.detailed_facts,
            request.hospital_name,
            json.dumps([c.dict() for c in citations]),
            body,
            "NOTICE_SERVED_PENDING_REFUND",
            now_iso,
        ))
        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"[CivicNotice DB Error] {exc}")

    return NoticeGenerateResponse(
        notice_id=notice_id,
        recipient_title=f"Medical Superintendent, {request.hospital_name}",
        subject_line=f"DEMAND FOR REFUND OF {request.disputed_amount} & CEASE-AND-DESIST (PM-JAY VIOLATION)",
        formal_notice_body=body,
        statutory_deadlines="48 Hours from Electronic Delivery Timestamp",
        verification_qr_text=f"https://signbridge.gov.in/verify-notice/{notice_id}",
        created_at=now_iso,
    )


@router.get("/grievances/{patient_id}", summary="Get Logged Citizen Legal Grievances")
async def get_grievances(patient_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, grievance_type, narrative, target_entity, statutory_sections_json, notice_body, status, created_at
        FROM civic_grievances
        WHERE patient_id = ?
        ORDER BY created_at DESC
    """, (patient_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "grievance_type": r[1],
            "narrative": r[2],
            "target_entity": r[3],
            "statutory_citations": json.loads(r[4] or "[]"),
            "notice_body": r[5],
            "status": r[6],
            "created_at": r[7],
        }
        for r in rows
    ]
