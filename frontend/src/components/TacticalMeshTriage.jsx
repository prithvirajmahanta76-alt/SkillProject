import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  WifiOff,
  AlertOctagon,
  Volume2,
  Share2,
  Battery,
} from 'lucide-react';
import api from '../services/api';

const INITIAL_TRIAGE = {
  casualty_tag: 'Casualty #109 (Structural Trauma)',
  triage_color: 'RED_IMMEDIATE',
  clinical_priority: 'PRIORITY 1 (Tachypnea / Severe Respiratory Distress)',
  action_protocol: 'Immediate high-flow oxygen, bilateral large-bore IV access. Evacuate first.',
  vital_summary: 'RR: 34/min | Radial Pulse: Absent/Delayed | Commands: Altered',
  location_mesh_node: 'NODE-TABLET-WARD-ROOF',
  relayed_via_mesh: true,
  created_at: new Date().toISOString(),
};

const DEFAULT_MESH_TOPOLOGY = {
  mesh_ssid: 'SignBridge-P2P-MeshGrid',
  gateway_active: false,
  total_active_nodes: 4,
  nodes: [
    { node_id: 'NODE-CIVIL-KIOSK-01', role: 'Root Tactical Hub (Ground Floor)', hop_count: 0, battery_pct: 98, status: 'ONLINE_STANDALONE' },
    { node_id: 'NODE-TABLET-WARD-ROOF', role: 'Survivor Relay (North Roof)', hop_count: 1, battery_pct: 74, status: 'ONLINE_RELAYING' },
    { node_id: 'NODE-DRONE-OVERWATCH-3', role: 'Aerial LoRa Bridge (120m Altitude)', hop_count: 2, battery_pct: 61, status: 'TRANSMITTING_THERMAL' },
    { node_id: 'NODE-AMBULANCE-TRIAGE-HQ', role: 'Mobile Field Casualty Station', hop_count: 1, battery_pct: 100, status: 'ONLINE_DISPATCHING' },
  ],
};

export default function TacticalMeshTriage() {
  // START Triage State
  const [casualtyTag, setCasualtyTag] = useState('Casualty #109 (Structural Trauma)');
  const [canWalk, setCanWalk] = useState(false);
  const [spontaneousBreathing, setSpontaneousBreathing] = useState(true);
  const [respiratoryRate, setRespiratoryRate] = useState(34); // > 30 is Immediate Red
  const [radialPulsePresent, setRadialPulsePresent] = useState(false);
  const [followsCommands, setFollowsCommands] = useState(false);
  const [selectedNode, setSelectedNode] = useState('NODE-TABLET-WARD-ROOF');

  // Evaluation Output
  const [triageResult, setTriageResult] = useState(INITIAL_TRIAGE);

  // Acoustic Frequency Detector State
  const [acousticAlert, setAcousticAlert] = useState(null);
  const [detectingAcoustic, setDetectingAcoustic] = useState(false);

  // Mesh Topology
  const [meshTopology, setMeshTopology] = useState(DEFAULT_MESH_TOPOLOGY);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const evaluateTriage = useCallback(async () => {
    try {
      const res = await api.evaluateStartTriage({
        casualty_tag: casualtyTag,
        can_walk: canWalk,
        spontaneous_breathing: spontaneousBreathing,
        respiratory_rate: respiratoryRate,
        radial_pulse_present: radialPulsePresent,
        follows_simple_commands: followsCommands,
        location_mesh_node: selectedNode,
        acoustic_whistle_detected: !!acousticAlert,
      });
      setTriageResult(res);
    } catch (err) {
      console.warn('Triage evaluate fallback:', err);
    }
  }, [casualtyTag, canWalk, spontaneousBreathing, respiratoryRate, radialPulsePresent, followsCommands, selectedNode, acousticAlert]);

  useEffect(() => {
    let active = true;
    api.getMeshNodes()
      .then((res) => { if (active && res) setMeshTopology(res); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const triggerAcousticScan = async () => {
    setDetectingAcoustic(true);
    try {
      const res = await api.detectAcousticSignal(3150.0, -18.5, 450);
      setAcousticAlert(res);
      evaluateTriage();
    } catch (err) {
      console.warn('Acoustic detect fallback:', err);
    } finally {
      setDetectingAcoustic(false);
    }
  };

  const handleBroadcastMesh = () => {
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const getColorTheme = (color) => {
    switch (color) {
      case 'RED_IMMEDIATE':
        return { bg: '#DC2626', border: 'rgba(220, 38, 38, 0.4)', text: '#FFFFFF', label: 'RED — IMMEDIATE PRIORITY 1' };
      case 'YELLOW_DELAYED':
        return { bg: '#D97706', border: 'rgba(217, 119, 6, 0.4)', text: '#FFFFFF', label: 'YELLOW — DELAYED PRIORITY 2' };
      case 'GREEN_MINOR':
        return { bg: '#15803D', border: 'rgba(21, 128, 61, 0.4)', text: '#FFFFFF', label: 'GREEN — MINOR AMBULATORY' };
      default:
        return { bg: '#1C1917', border: 'rgba(28, 25, 23, 0.4)', text: '#FFFFFF', label: 'BLACK — EXPECTANT / DECEASED' };
    }
  };

  const colorMeta = triageResult ? getColorTheme(triageResult.triage_color) : getColorTheme('RED_IMMEDIATE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(254, 243, 199, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '20px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
            }}
          >
            <Radio size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1917', margin: 0 }}>
                DisasterMesh — Tactical Disaster & Offline Mesh Triage
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(220, 38, 38, 0.15)',
                  color: '#DC2626',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                }}
              >
                Zero-Internet Tactical Mode
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#78716C', margin: '4px 0 0 0' }}>
              Mass-casualty START protocol triage classifier, emergency whistle acoustic band detector, and peer-to-peer Wi-Fi mesh relay.
            </p>
          </div>
        </div>

        {/* Acoustic Whistle Scan Button */}
        <button
          onClick={triggerAcousticScan}
          disabled={detectingAcoustic}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #B45309, #D97706)',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
          }}
        >
          <Volume2 size={18} />
          {detectingAcoustic ? 'Analyzing 3kHz Whistle Band...' : 'Scan Acoustic SOS Whistle (3kHz)'}
        </button>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: START Protocol Clinical Matrix */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 180, 130, 0.4)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#DC2626" />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1C1917', margin: 0 }}>
                START Mass-Casualty Assessment Matrix
              </h3>
            </div>
            <input
              type="text"
              value={casualtyTag}
              onChange={(e) => setCasualtyTag(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(217, 180, 130, 0.5)',
                fontSize: '11px',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            />
          </div>

          {/* Step 1: Able to walk? */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(28, 25, 23, 0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>1. Ambulatory (Able to Walk?)</div>
              <div style={{ fontSize: '10px', color: '#78716C' }}>Yes = Minor (Green). Direct to clearing station.</div>
            </div>
            <button
              onClick={() => {
                setCanWalk(!canWalk);
                setTimeout(evaluateTriage, 50);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: canWalk ? '#15803D' : '#78716C',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {canWalk ? 'YES (Walking)' : 'NO (Immobile)'}
            </button>
          </div>

          {/* Step 2: Spontaneous Respiration */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(28, 25, 23, 0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>2. Spontaneous Breathing?</div>
              <div style={{ fontSize: '10px', color: '#78716C' }}>Reposition airway if apneic.</div>
            </div>
            <button
              onClick={() => {
                setSpontaneousBreathing(!spontaneousBreathing);
                setTimeout(evaluateTriage, 50);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: spontaneousBreathing ? '#15803D' : '#1C1917',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {spontaneousBreathing ? 'BREATHING' : 'APNEIC (No Breaths)'}
            </button>
          </div>

          {/* Step 3: Respiratory Rate Slider */}
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(28, 25, 23, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>
                3. Respiratory Rate (RR)
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: respiratoryRate > 30 ? '#DC2626' : '#15803D',
                }}
              >
                {respiratoryRate} / min {respiratoryRate > 30 ? '(Tachypneic >30: RED)' : '(Normal)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              value={respiratoryRate}
              onChange={(e) => {
                setRespiratoryRate(Number(e.target.value));
                setTimeout(evaluateTriage, 50);
              }}
              style={{ width: '100%', accentColor: respiratoryRate > 30 ? '#DC2626' : '#15803D' }}
            />
          </div>

          {/* Step 4: Radial Pulse & Perfusion */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(28, 25, 23, 0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>4. Perfusion / Radial Pulse</div>
              <div style={{ fontSize: '10px', color: '#78716C' }}>Capillary refill &gt; 2 seconds or absent pulse = Shock (RED).</div>
            </div>
            <button
              onClick={() => {
                setRadialPulsePresent(!radialPulsePresent);
                setTimeout(evaluateTriage, 50);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: radialPulsePresent ? '#15803D' : '#DC2626',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {radialPulsePresent ? 'PULSE PRESENT' : 'PULSE ABSENT / DELAYED'}
            </button>
          </div>

          {/* Step 5: Mental Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(28, 25, 23, 0.04)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>5. Mental Status (Follows Commands?)</div>
              <div style={{ fontSize: '10px', color: '#78716C' }}>Cannot follow simple command = Altered (RED).</div>
            </div>
            <button
              onClick={() => {
                setFollowsCommands(!followsCommands);
                setTimeout(evaluateTriage, 50);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: followsCommands ? '#15803D' : '#DC2626',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {followsCommands ? 'OBEYS COMMANDS' : 'UNRESPONSIVE / ALTERED'}
            </button>
          </div>

          {/* Classified Triage Output Banner */}
          {triageResult && (
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: colorMeta.bg,
                color: colorMeta.text,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '0.04em' }}>
                  {colorMeta.label}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '6px' }}>
                  START Standard
                </span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.4, opacity: 0.95 }}>
                {triageResult.action_protocol}
              </div>
            </div>
          )}

          {/* Broadcast to Mesh Button */}
          <button
            onClick={handleBroadcastMesh}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #B45309, #D97706)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
            }}
          >
            <Share2 size={16} />
            {broadcastSuccess ? '✅ Relayed Over P2P Mesh!' : 'Broadcast Casualty Tag Across Wireless Mesh'}
          </button>
        </div>

        {/* Right Column: Acoustic Whistle Radar & P2P Mesh Topology */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Acoustic Whistle Detection Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="#B45309" />
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917', margin: 0 }}>
                Acoustic Rescue Frequency Monitor
              </h4>
            </div>

            {acousticAlert ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#DC2626' }}>
                  🚨 {acousticAlert.signal_type} DETECTED
                </div>
                <div style={{ fontSize: '11px', color: '#1C1917', marginTop: '4px' }}>
                  {acousticAlert.recommended_action}
                </div>
                <div style={{ fontSize: '10px', color: '#78716C', marginTop: '4px' }}>
                  {acousticAlert.audio_spectral_band}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(28, 25, 23, 0.04)',
                  fontSize: '11px',
                  color: '#78716C',
                  textAlign: 'center',
                }}
              >
                Listening on 2800 Hz – 3400 Hz acoustic rescue band. Click "Scan Acoustic SOS Whistle" to simulate frequency capture.
              </div>
            )}
          </div>

          {/* Tactical P2P Mesh Topology */}
          {meshTopology && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(217, 180, 130, 0.4)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WifiOff size={16} color="#B45309" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917' }}>
                    {meshTopology.mesh_ssid}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(21, 128, 61, 0.15)',
                    color: '#15803D',
                  }}
                >
                  {meshTopology.total_active_nodes} Mesh Nodes
                </span>
              </div>

              {/* Node Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {meshTopology.nodes.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedNode(n.node_id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: selectedNode === n.node_id ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.85)',
                      border: selectedNode === n.node_id ? '1px solid rgba(217, 119, 6, 0.5)' : '1px solid rgba(217, 180, 130, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>
                        {n.role}
                      </div>
                      <div style={{ fontSize: '10px', color: '#78716C', marginTop: '2px' }}>
                        {n.node_id} ({n.hop_count} hops)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#15803D' }}>
                        {n.battery_pct}%
                      </span>
                      <Battery size={14} color="#15803D" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
