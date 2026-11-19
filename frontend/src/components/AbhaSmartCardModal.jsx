import React, { useState } from 'react';
import { ShieldCheck, RotateCw, Printer, QrCode, AlertTriangle, X } from 'lucide-react';

/**
 * AbhaSmartCardModal
 * Ultra-Realistic 3D Flippable Ayushman Bharat Health Account (ABHA) Smart Card
 */
export default function AbhaSmartCardModal({ onClose, patientData }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const patient = patientData || {
    name: 'Abhishek Pattnaik',
    abhaNumber: '91-8421-9921-1049',
    abhaAddress: 'abhishek.pattnaik@abdm',
    dob: '14-08-1996',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98421-99210',
    allergies: 'Penicillin, Amoxicillin (Severe Anaphylaxis Risk)',
    emergencyContact: '+91 98765-43210 (Father - Mr. Pattnaik)',
    hospital: 'Government Civil Hospital, Ward 3 Bed 14',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 25, 23, 0.75)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF6EE 0%, #F5ECE0 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(217, 180, 130, 0.5)',
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1C1917' }}>
                ABHA Smart Card (3D Viewport)
              </h3>
              <p style={{ fontSize: '12px', color: '#57534E', margin: '2px 0 0' }}>
                Ayushman Bharat Digital Mission (ABDM) • National Health Authority
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(217, 180, 130, 0.25)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#1C1917',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D Card Perspective Wrapper */}
        <div
          style={{
            perspective: '1200px',
            width: '100%',
            height: '270px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '260px',
              borderRadius: '18px',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              cursor: 'pointer',
              boxShadow: '0 20px 45px -10px rgba(180, 83, 9, 0.2), 0 0 1px 1px rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* ── CARD FRONT FACE ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '18px',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 55%, #042F2E 100%)',
                color: '#FFFFFF',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Card Watermark */}
              <div
                style={{
                  position: 'absolute',
                  right: '-30px',
                  bottom: '-30px',
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Front Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color="#0F766E" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#99F6E4' }}>
                      Government of India
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.03em' }}>
                      National Health Authority
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    background: 'rgba(255, 255, 255, 0.18)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.04em',
                  }}
                >
                  ABDM ACTIVE
                </span>
              </div>

              {/* Front Body: Photo + Info + QR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '10px 0' }}>
                {/* Photo / Avatar */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {patient.name.charAt(0)}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {patient.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#CCFBF1', marginTop: '2px' }}>
                    DOB: {patient.dob} | Gender: {patient.gender} | Blood: {patient.bloodGroup}
                  </div>
                  <div style={{ fontSize: '10px', color: '#99F6E4', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {patient.abhaAddress}
                  </div>
                </div>

                {/* QR Code */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0F766E',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <QrCode size={42} />
                </div>
              </div>

              {/* Front Footer: ABHA Number */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#99F6E4' }}>
                    ABHA Identification Number:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace', color: '#FDE68A' }}>
                    {patient.abhaNumber}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#99F6E4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCw size={11} /> Tap to Flip
                </div>
              </div>
            </div>

            {/* ── CARD BACK FACE ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '18px',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, #1C1917 0%, #292524 60%, #1C1917 100%)',
                color: '#FFFFFF',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(217, 180, 130, 0.4)',
                overflow: 'hidden',
              }}
            >
              {/* Back Magnetic Strip */}
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: 0,
                  right: 0,
                  height: '32px',
                  background: 'linear-gradient(90deg, #B45309 0%, #D97706 50%, #B45309 100%)',
                  opacity: 0.85,
                }}
              />

              <div style={{ marginTop: '38px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Emergency Allergy Alert */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} color="#EF4444" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#F87171', textTransform: 'uppercase' }}>
                      Critical Drug Allergies:
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#FCA5A5' }}>
                      {patient.allergies}
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  <strong style={{ color: '#FDE68A' }}>Emergency Contact:</strong> {patient.emergencyContact}
                </div>

                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  <strong style={{ color: '#FDE68A' }}>Hospital Node:</strong> {patient.hospital}
                </div>
              </div>

              {/* Back Footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <span>National Health Helpline: 14477 (Toll-Free)</span>
                <span style={{ color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCw size={11} /> Tap to Flip Front
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(217, 180, 130, 0.45)',
              color: '#B45309',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCw size={15} /> Flip Card (3D)
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
              }}
            >
              <Printer size={15} /> Print ABHA Card
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'rgba(217, 180, 130, 0.25)',
                color: '#1C1917',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
