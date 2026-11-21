import time
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.api.endpoints.consultation import get_db_connection

router = APIRouter()


class StartTriageEvaluateRequest(BaseModel):
    casualty_tag: str = Field(default="Casualty #108", example="Casualty #108")
    can_walk: bool = Field(default=False, example=False)
    spontaneous_breathing: bool = Field(default=True, example=True)
    respiratory_rate: int = Field(default=34, example=34)  # > 30 is Immediate Red
    radial_pulse_present: bool = Field(default=False, example=False)  # Absent or refill > 2s -> Red
    follows_simple_commands: bool = Field(default=False, example=False)  # Unable -> Red, Able -> Yellow
    location_mesh_node: str = Field(default="Mesh Node B (North Wing)", example="Mesh Node B (North Wing)")
    acoustic_whistle_detected: bool = Field(default=True, example=True)


class StartTriageResponse(BaseModel):
    casualty_tag: str
    triage_color: str  # RED_IMMEDIATE, YELLOW_DELAYED, GREEN_MINOR, BLACK_EXPECTANT
    clinical_priority: str
    action_protocol: str
    vital_summary: str
    location_mesh_node: str
    relayed_via_mesh: bool
    created_at: str


class AcousticDetectRequest(BaseModel):
    peak_frequency_hz: float = Field(default=3150.0, example=3150.0)
    amplitude_db: float = Field(default=-18.5, example=-18.5)
    rhythmic_interval_ms: Optional[int] = Field(default=450, example=450)


class AcousticDetectResponse(BaseModel):
    is_emergency_signal: bool
    signal_type: str  # "RESCUE_WHISTLE_SOS", "RUBBLE_RHYTHMIC_TAP", "AMBIENT_NOISE"
    confidence_score: float
    recommended_action: str
    audio_spectral_band: str


@router.post(
    "/evaluate-triage",
    response_model=StartTriageResponse,
    summary="START (Simple Triage & Rapid Treatment) Mass-Casualty Classifier",
)
async def evaluate_start_triage(request: StartTriageEvaluateRequest):
    """Executes the internationally validated START Triage algorithm."""
    # 1. Walking Wounded -> GREEN (Minor)
    if request.can_walk:
        color = "GREEN_MINOR"
        priority = "PRIORITY 3 (Ambulatory / Minor Injuries)"
        action = "Direct to Secondary Casualty Clearing Station. Monitor vitals every 30 minutes."
    # 2. Respiration Check
    elif not request.spontaneous_breathing:
        color = "BLACK_EXPECTANT"
        priority = "PRIORITY 4 (No spontaneous respiration after airway clearance)"
        action = "Reposition airway. If still apneic, tag expectant and preserve resources for salvageable survivors."
    elif request.respiratory_rate > 30 or request.respiratory_rate < 10:
        color = "RED_IMMEDIATE"
        priority = "PRIORITY 1 (Tachypnea / Severe Respiratory Distress)"
        action = "Immediate high-flow oxygen, needle decompression if tension pneumothorax suspected. Evacuate first."
    # 3. Perfusion Check (Radial pulse / capillary refill)
    elif not request.radial_pulse_present:
        color = "RED_IMMEDIATE"
        priority = "PRIORITY 1 (Hemorrhagic Shock / Perfusion Failure)"
        action = "Direct pressure on external bleeding, bilateral large-bore IV access, rapid crystalloid resuscitation."
    # 4. Mental Status Check (Follows commands)
    elif not request.follows_simple_commands:
        color = "RED_IMMEDIATE"
        priority = "PRIORITY 1 (Altered Mental Status / Traumatic Brain Injury)"
        action = "Cervical spine stabilization, GCS evaluation, immediate neurosurgical triage."
    else:
        color = "YELLOW_DELAYED"
        priority = "PRIORITY 2 (Significant Injury, Hemodynamically Stable)"
        action = "Splint fractures, dress wounds, transport within 2-4 hours to regional trauma center."

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    record_id = f"TS-{int(time.time())}"

    # Save to SQLite
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO disaster_triage (
                id, casualty_tag, start_triage_color, respiratory_rate,
                perfusion_radial, mental_status, location_mesh_node,
                acoustic_alert, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id,
            request.casualty_tag,
            color,
            request.respiratory_rate,
            "PRESENT" if request.radial_pulse_present else "ABSENT_WEAK",
            "ALERT_COOPERATIVE" if request.follows_simple_commands else "CONFUSED_UNRESPONSIVE",
            request.location_mesh_node,
            "SOS Whistle Active" if request.acoustic_whistle_detected else "None",
            now_iso,
        ))
        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"[DisasterTriage DB Error] {exc}")

    vital_str = f"RR: {request.respiratory_rate}/min | Radial Pulse: {'Normal' if request.radial_pulse_present else 'Absent/Delayed'} | Commands: {'Follows' if request.follows_simple_commands else 'Altered'}"

    return StartTriageResponse(
        casualty_tag=request.casualty_tag,
        triage_color=color,
        clinical_priority=priority,
        action_protocol=action,
        vital_summary=vital_str,
        location_mesh_node=request.location_mesh_node,
        relayed_via_mesh=True,
        created_at=now_iso,
    )


@router.post(
    "/acoustic-detect",
    response_model=AcousticDetectResponse,
    summary="Acoustic Emergency Frequency Whistle & Rubble Tapping Detector",
)
async def detect_acoustic_signal(request: AcousticDetectRequest):
    # Emergency survival whistles resonate in narrow band 2800 Hz - 3400 Hz
    freq = request.peak_frequency_hz
    is_whistle = 2600.0 <= freq <= 3600.0 and request.amplitude_db > -35.0
    is_tap = 100.0 <= freq <= 600.0 and request.rhythmic_interval_ms and (300 <= request.rhythmic_interval_ms <= 800)

    if is_whistle:
        return AcousticDetectResponse(
            is_emergency_signal=True,
            signal_type="RESCUE_WHISTLE_SOS",
            confidence_score=0.96,
            recommended_action="High-frequency distress whistle verified. Pinpoint GPS mesh coordinates and deploy search squad.",
            audio_spectral_band=f"Narrowband Resonant Peak at {round(freq, 1)} Hz (-{abs(round(request.amplitude_db, 1))} dBFS)",
        )
    elif is_tap:
        return AcousticDetectResponse(
            is_emergency_signal=True,
            signal_type="RUBBLE_RHYTHMIC_TAP",
            confidence_score=0.89,
            recommended_action="Periodic acoustic impact detected. Structural entrapment likely. Deploy acoustic listening sticks.",
            audio_spectral_band=f"Low-frequency Structural Impulses ({round(freq, 1)} Hz at ~{request.rhythmic_interval_ms}ms intervals)",
        )
    else:
        return AcousticDetectResponse(
            is_emergency_signal=False,
            signal_type="AMBIENT_NOISE",
            confidence_score=0.22,
            recommended_action="No standardized distress pattern detected. Continue ambient frequency monitoring.",
            audio_spectral_band=f"Broadband Ambient Noise ({round(freq, 1)} Hz)",
        )


@router.get("/mesh-nodes", summary="Get P2P Mesh Network Topology Status")
async def get_mesh_nodes():
    return {
        "mesh_ssid": "SignBridge-P2P-MeshGrid",
        "protocol": "802.11s + WebRTC DataMesh",
        "gateway_active": False,  # Simulating internet is severed!
        "total_active_nodes": 4,
        "nodes": [
            {
                "node_id": "NODE-CIVIL-KIOSK-01",
                "role": "Root Tactical Hub (Ground Floor)",
                "hop_count": 0,
                "battery_pct": 98,
                "casualties_logged": 14,
                "status": "ONLINE_STANDALONE",
            },
            {
                "node_id": "NODE-TABLET-WARD-ROOF",
                "role": "Survivor Relay (North Roof)",
                "hop_count": 1,
                "battery_pct": 74,
                "casualties_logged": 6,
                "status": "ONLINE_RELAYING",
            },
            {
                "node_id": "NODE-DRONE-OVERWATCH-3",
                "role": "Aerial LoRa Bridge (120m Altitude)",
                "hop_count": 2,
                "battery_pct": 61,
                "casualties_logged": 21,
                "status": "TRANSMITTING_THERMAL",
            },
            {
                "node_id": "NODE-AMBULANCE-TRIAGE-HQ",
                "role": "Mobile Field Casualty Clearing Station",
                "hop_count": 1,
                "battery_pct": 100,
                "casualties_logged": 35,
                "status": "ONLINE_DISPATCHING",
            },
        ],
    }
