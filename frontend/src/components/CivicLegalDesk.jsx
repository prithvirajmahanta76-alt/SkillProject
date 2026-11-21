import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  FileText,
  Printer,
  Gavel,
  BookOpen,
} from 'lucide-react';
import api from '../services/api';

const GRIEVANCE_TEMPLATES = [
  {
    id: 'AYUSHMAN_DENIAL',
    title: 'Ayushman Bharat (PM-JAY) Cashless Denial',
    tag: 'CRITICAL STATUTORY BREACH',
    presetText: 'अस्पताल ने आयुष्मान कार्ड होने के बाद भी इमरजेंसी में 15000 रुपये नकद जमा करवाए और बिल नहीं दिया।',
    amount: '₹15,000',
  },
  {
    id: 'DISABILITY_DELAY',
    title: 'UDID Disability Certificate Delay (>30 Days)',
    tag: 'ADMINISTRATIVE NON-COMPLIANCE',
    presetText: 'दिव्यांगता प्रमाणपत्र (UDID) के लिए 45 दिन पहले आवेदन किया था, लेकिन अभी तक मेडिकल बोर्ड ने जारी नहीं किया।',
    amount: 'N/A',
  },
  {
    id: 'MEDICAL_OVERCHARGE',
    title: 'Overcharging Above NLEM Ceiling Prices',
    tag: 'UNFAIR TRADE PRACTICE',
    presetText: 'अस्पताल ने आवश्यक जीवनरक्षक दवाइयों और स्टेंट के लिए सरकारी निर्धारित मूल्य से 3 गुना अधिक बिल बनाया है।',
    amount: '₹28,500',
  },
];

const INITIAL_ANALYSIS = {
  grievance_category: 'AYUSHMAN_DENIAL',
  urgency_tier: 'CRITICAL_STATUTORY_VIOLATION',
  legal_summary_en: 'Illegal denial of cashless treatment under PM-JAY and unauthorized advance cash deposit demand.',
  legal_summary_regional: 'आयुष्मान भारत योजना के तहत कैशलेस इलाज से अवैध इनकार और अग्रिम धन की मांग।',
  statutory_citations: [
    {
      act: 'Clinical Establishments (Registration and Regulation) Act, 2010',
      section: 'Section 12(2)',
      provision: 'Every clinical establishment must provide immediate emergency medical treatment without advance monetary demand.',
      penalty_or_relief: 'Cancellation of license and monetary penalty up to ₹5,00,000.',
    },
    {
      act: 'National Health Authority (NHA) Guidelines',
      section: 'Clause 14.3',
      provision: 'Empaneled hospitals are strictly prohibited from demanding out-of-pocket deposits from verified beneficiaries.',
      penalty_or_relief: 'Immediate de-empanelment and compulsory refund with 12% interest.',
    },
    {
      act: 'Rights of Persons with Disabilities Act, 2016',
      section: 'Section 25',
      provision: 'Guarantees barrier-free and non-discriminatory healthcare for persons with speech & hearing disabilities.',
      penalty_or_relief: 'Prosecution under Section 89 with imprisonment and institutional fines.',
    },
  ],
  recommended_remedy: 'Issue formal 48-hour Statutory Rectification Notice to Hospital Medical Superintendent.',
  actionable_rights: [
    'Right to Zero-Advance Emergency Care (CEA 2010)',
    'Right to Full Cashless Coverage under PM-JAY',
    'Right to Sign Language Accessibility (RPwD 2016)',
  ],
};

const INITIAL_PAST_GRIEVANCES = [
  {
    id: 'GRV-NHA-2026-09',
    grievance_type: 'Ayushman Bharat (PM-JAY) Cashless Denial',
    narrative: 'Hospital billing desk demanded out-of-pocket cash deposit of ₹15,000.',
    target_entity: 'District Civil Hospital TPA Desk',
    status: 'RESOLVED_COMPLIANT (Full Refund Processed)',
    created_at: new Date().toISOString(),
  },
];

export default function CivicLegalDesk() {
  const [selectedTemplate, setSelectedTemplate] = useState(GRIEVANCE_TEMPLATES[0]);
  const [inputText, setInputText] = useState(GRIEVANCE_TEMPLATES[0].presetText);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(INITIAL_ANALYSIS);
  const [generatedNotice, setGeneratedNotice] = useState(null);
  const [generatingNotice, setGeneratingNotice] = useState(false);
  const [pastGrievances, setPastGrievances] = useState(INITIAL_PAST_GRIEVANCES);

  const loadPastGrievances = useCallback(async () => {
    try {
      const res = await api.getGrievances('PAT-9842');
      if (Array.isArray(res) && res.length > 0) {
        setPastGrievances(res);
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeGrievance(
        inputText,
        'hi',
        'District Civil Hospital',
        'PAT-9842'
      );
      setAnalysisResult(res);
    } catch (err) {
      console.warn('Grievance analyze fallback:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [inputText]);

  useEffect(() => {
    let active = true;
    api.getGrievances('PAT-9842')
      .then((res) => { if (active && Array.isArray(res) && res.length > 0) setPastGrievances(res); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleGenerateNotice = async () => {
    setGeneratingNotice(true);
    try {
      const res = await api.generateLegalNotice({
        patient_id: 'PAT-9842',
        patient_name: 'Rahul Sahoo',
        abha_id: '91-4829-1039-4820',
        hospital_name: 'District Civil Hospital, Medical Superintendant Office',
        incident_date: '2026-11-20',
        disputed_amount: selectedTemplate.amount,
        grievance_category: selectedTemplate.id,
        detailed_facts: inputText,
      });
      setGeneratedNotice(res);
      loadPastGrievances();
    } catch (err) {
      console.warn('Generate notice fallback:', err);
    } finally {
      setGeneratingNotice(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(217, 180, 130, 0.45)',
          borderRadius: '20px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(180, 83, 9, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #B45309, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.3)',
            }}
          >
            <Scale size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1917', margin: 0 }}>
                JanNyaya — Medico-Legal, Ayushman & Disability Rights Desk
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(21, 128, 61, 0.15)',
                  color: '#15803D',
                  border: '1px solid rgba(21, 128, 61, 0.3)',
                }}
              >
                Statutory Defense Engine
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#78716C', margin: '4px 0 0 0' }}>
              Vernacular legal grievance intake, instant statutory act mapping (RPwD 2016 / CEA 2010), and automated demand notice generation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* Left Column: Vernacular Voice/Text Grievance Intake */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#B45309" />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1C1917', margin: 0 }}>
              Vernacular Citizen Dispute Intake
            </h3>
          </div>

          {/* Dispute Scenario Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {GRIEVANCE_TEMPLATES.map((tmpl) => {
              const isSel = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setInputText(tmpl.presetText);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: isSel
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(254, 243, 199, 0.8) 100%)'
                      : 'rgba(255, 255, 255, 0.6)',
                    border: isSel ? '1px solid rgba(217, 119, 6, 0.5)' : '1px solid rgba(217, 180, 130, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: isSel ? '#B45309' : '#1C1917' }}>
                      {tmpl.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#78716C', marginTop: '2px' }}>
                      {tmpl.tag}
                    </div>
                  </div>
                  {tmpl.amount !== 'N/A' && (
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626' }}>
                      {tmpl.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Textarea for dispute narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#78716C', textTransform: 'uppercase' }}>
              Citizen Testimony (Spoken or Written)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(217, 180, 130, 0.4)',
                fontSize: '13px',
                color: '#1C1917',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                resize: 'none',
              }}
            />
          </div>

          {/* Action Button: Analyze Legal Rights */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
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
            <Gavel size={16} />
            {analyzing ? 'Evaluating Statutory Provisions...' : 'Analyze Statutory Rights & Remedies'}
          </button>

          {/* Past Grievance Log */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917', marginBottom: '8px' }}>
              Citizen Case Registry ({pastGrievances.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {pastGrievances.map((g, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(217, 180, 130, 0.3)',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ fontWeight: '800', color: '#1C1917' }}>{g.grievance_type}</div>
                  <div style={{ color: '#15803D', fontWeight: '700', marginTop: '2px' }}>{g.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Statutory Citations & Formal Legal Notice */}
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
          {analysisResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary Chip */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(217, 180, 130, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>
                    Statutory Evaluation Verdict
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', background: '#DC2626', color: '#FFFFFF' }}>
                    {analysisResult.urgency_tier}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917', marginTop: '6px' }}>
                  {analysisResult.legal_summary_en}
                </div>
                <div style={{ fontSize: '12px', color: '#57534E', marginTop: '4px' }}>
                  {analysisResult.legal_summary_regional}
                </div>
              </div>

              {/* Statutory Citations */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} color="#B45309" /> Applicable Indian Statutory Provisions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisResult.statutory_citations.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(217, 180, 130, 0.35)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#B45309' }}>
                          {c.act}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>
                          {c.section}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#292524', marginTop: '4px', lineHeight: 1.4 }}>
                        {c.provision}
                      </div>
                      <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: '700', marginTop: '4px' }}>
                        Penalty: {c.penalty_or_relief}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notice Generation Button */}
              <button
                onClick={handleGenerateNotice}
                disabled={generatingNotice}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #15803D, #16A34A)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                }}
              >
                <Printer size={16} />
                {generatingNotice ? 'Drafting Stamped Legal Notice...' : 'Draft Formal 48-Hour Legal Demand Notice'}
              </button>

              {/* Rendered Notice Preview */}
              {generatedNotice && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: '#FAF6ED',
                    border: '1px solid rgba(217, 180, 130, 0.5)',
                    boxShadow: 'inset 0 2px 6px rgba(180, 83, 9, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>
                      ✅ Stamped Notice ID: {generatedNotice.notice_id}
                    </span>
                    <button
                      onClick={() => window.print()}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(217, 180, 130, 0.5)',
                        fontSize: '10px',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      Print Notice
                    </button>
                  </div>
                  <pre
                    style={{
                      fontSize: '10px',
                      color: '#1C1917',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {generatedNotice.formal_notice_body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
