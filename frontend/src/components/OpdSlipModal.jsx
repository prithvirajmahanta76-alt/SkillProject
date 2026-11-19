import React from 'react';
import { Printer, QrCode, X } from 'lucide-react';

/**
 * OpdSlipModal
 * Authentic Bilingual Thermal Hospital OPD Consultation Slip
 */
export default function OpdSlipModal({ onClose, slipData }) {
  const data = slipData || {
    hospitalName: 'GOVERNMENT CIVIL HOSPITAL',
    opdId: 'OPD-CIVIL-1794156577',
    date: '19-Nov-2026 11:30 AM',
    patientName: 'Abhishek Pattnaik',
    ageGender: '28 Yrs / Male',
    abhaNumber: '91-8421-9921-1049',
    ward: 'General Medicine OPD - Room 14',
    doctor: 'Dr. S. K. Mahapatra (MD, Reg #MED-74921)',
    chiefComplaints: 'Acute Bronchitis, Fever (101°F), Dyspnea on Exertion (3 Days)',
    icd10: 'J20.9 (Acute Bronchitis) / R50.9 (Fever Unspecified)',
    vitals: 'BP: 124/82 mmHg | Pulse: 78 bpm | SpO2: 98% | Temp: 101.2°F',
    allergies: 'PENICILLIN CONTRAINDICATED (INTERCEPT ACTIVE)',
    medications: [
      { name: 'Tab. Azithromycin 500mg', dosage: '1 Tablet Daily (OD) after dinner for 5 days', duration: '5 Days' },
      { name: 'Tab. Paracetamol 650mg (Dolo)', dosage: '1 Tablet Thrice Daily (TDS) SOS Fever', duration: '3 Days' },
      { name: 'Syp. Levosalbutamol + Ambroxol', dosage: '10ml Thrice Daily (TDS) for cough relief', duration: '5 Days' },
    ],
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
          boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.6)',
          maxWidth: '520px',
          width: '100%',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={20} color="#B45309" />
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1C1917' }}>
              Bilingual Thermal OPD Slip
            </h3>
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

        {/* ── THERMAL RECEIPT CONTAINER ── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px dashed #D97706',
            boxShadow: '0 10px 30px rgba(180, 83, 9, 0.08)',
            padding: '22px',
            fontFamily: 'JetBrains Mono, Menlo, monospace',
            color: '#1C1917',
            fontSize: '12px',
            lineHeight: 1.45,
            position: 'relative',
          }}
        >
          {/* Hospital Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #A8A29E', paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.04em', color: '#0F766E' }}>
              {data.hospitalName}
            </div>
            <div style={{ fontSize: '10px', color: '#78716C' }}>
              AYUSHMAN BHARAT DIGITAL MISSION (ABDM) COMPLIANT
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', color: '#B45309' }}>
              OPD TOKEN: {data.opdId}
            </div>
            <div style={{ fontSize: '10px', color: '#78716C' }}>Date: {data.date}</div>
          </div>

          {/* Patient Bio */}
          <div style={{ borderBottom: '1px dashed #A8A29E', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Patient:</strong> {data.patientName}</span>
              <span><strong>Age/Sex:</strong> {data.ageGender}</span>
            </div>
            <div><strong>ABHA:</strong> {data.abhaNumber}</div>
            <div><strong>Ward/Room:</strong> {data.ward}</div>
            <div><strong>Attending MD:</strong> {data.doctor}</div>
          </div>

          {/* Vitals & Allergy Hazard Alert */}
          <div style={{ borderBottom: '1px dashed #A8A29E', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: '700' }}>
              {data.vitals}
            </div>
            <div style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '4px', background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', fontWeight: '800', fontSize: '10px' }}>
              ⚠️ {data.allergies}
            </div>
          </div>

          {/* Diagnosis & ICD-10 */}
          <div style={{ borderBottom: '1px dashed #A8A29E', paddingBottom: '10px', marginBottom: '10px' }}>
            <div><strong>Chief Complaint:</strong> {data.chiefComplaints}</div>
            <div style={{ color: '#0F766E', fontWeight: '700', marginTop: '2px' }}>
              Diagnosis (ICD-10): {data.icd10}
            </div>
          </div>

          {/* Prescriptions (Rx) */}
          <div style={{ borderBottom: '1px dashed #A8A29E', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ fontWeight: '900', fontSize: '13px', color: '#B45309', marginBottom: '4px' }}>
              ℞ PRESCRIPTION / दवाएं (Bilingual):
            </div>
            {data.medications.map((med, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: '800', color: '#1C1917' }}>
                  {i + 1}. {med.name} ({med.duration})
                </div>
                <div style={{ fontSize: '11px', color: '#57534E', paddingLeft: '12px' }}>
                  ➔ {med.dosage}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom QR + Doctor Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '4px', background: '#F5F5F4', borderRadius: '6px', border: '1px solid #D6D3D1' }}>
                <QrCode size={40} color="#0F766E" />
              </div>
              <div style={{ fontSize: '9px', color: '#78716C' }}>
                Pharmacy QR Scan<br />Auto-Dispense Ready
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: '700', color: '#0F766E' }}>
                Digitally Verified & Signed
              </div>
              <div style={{ fontSize: '9px', color: '#78716C' }}>ABDM Health Locker Synced</div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
            }}
          >
            <Printer size={15} /> Print Thermal Slip
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
