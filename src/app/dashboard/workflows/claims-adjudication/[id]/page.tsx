'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Claim {
  id: number;
  client_id: number;
  claim_number: string;
  member_id: string;
  patient_name: string | null;
  patient_dob: string | null;
  provider_name: string | null;
  provider_npi: string;
  date_of_service: string;
  diagnosis_codes: string[];
  procedure_codes: string[];
  icd_codes: string[];
  cpt_codes: string[];
  claim_amount: string;
  billed_amount: string;
  allowed_amount: string;
  decision: string;
  ai_decision: string;
  decision_confidence: number | null;
  decision_reasoning: string;
  ai_reasoning: string;
  adjudication_rules: any;
  flags: any[];
  payment_recommendation: any;
  status: string;
  processed_at: string;
  created_at: string;
  client_name: string;
}

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const response = await fetch(`/api/db/claims/${claimId}`);
        if (!response.ok) throw new Error('Claim not found');
        const data = await response.json();
        setClaim(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchClaim();
  }, [claimId]);

  const formatCurrency = (amount: string | number | null) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === null || isNaN(num || 0)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading claim details...</p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Claim not found'}</p>
        <button 
          onClick={() => router.push('/dashboard/workflows/claims-adjudication')} 
          style={{ color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back to Claims
        </button>
      </div>
    );
  }

  const decision = claim.decision || claim.ai_decision || 'pending';
  const confidence = claim.decision_confidence || 0;
  const reasoning = claim.decision_reasoning || claim.ai_reasoning;
  const diagnosisCodes = claim.diagnosis_codes || claim.icd_codes || [];
  const procedureCodes = claim.procedure_codes || claim.cpt_codes || [];

  // Decision styling
  const decisionStyles: Record<string, { bg: string; color: string; icon: string }> = {
    approve: { bg: '#dcfce7', color: '#16a34a', icon: '✓' },
    approved: { bg: '#dcfce7', color: '#16a34a', icon: '✓' },
    deny: { bg: '#fee2e2', color: '#dc2626', icon: '✕' },
    denied: { bg: '#fee2e2', color: '#dc2626', icon: '✕' },
    review: { bg: '#fef3c7', color: '#d97706', icon: '⚠' },
    pend: { bg: '#e0e7ff', color: '#4f46e5', icon: '⏸' },
    pending: { bg: '#f1f5f9', color: '#64748b', icon: '○' },
  };
  const decisionStyle = decisionStyles[decision.toLowerCase()] || decisionStyles.pending;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/workflows/claims-adjudication')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
        >
          ← Back to Claims Adjudication
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '4px' }}>
              Claim {claim.claim_number}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Processed {formatDate(claim.processed_at || claim.created_at)}
            </p>
          </div>
          
          {/* Decision Badge - Prominent */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 20px',
            background: decisionStyle.bg,
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '24px' }}>{decisionStyle.icon}</span>
            <div>
              <p style={{ fontSize: '12px', color: decisionStyle.color, opacity: 0.8, margin: 0 }}>AI Decision</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: decisionStyle.color, margin: 0, textTransform: 'uppercase' }}>
                {decision}
              </p>
            </div>
            {confidence > 0 && (
              <div style={{ 
                marginLeft: '12px', 
                paddingLeft: '12px', 
                borderLeft: `2px solid ${decisionStyle.color}`,
                opacity: 0.8
              }}>
                <p style={{ fontSize: '12px', color: decisionStyle.color, margin: 0 }}>Confidence</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: decisionStyle.color, margin: 0 }}>{confidence}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amount Summary - Hero Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #64748b' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Billed Amount</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            {formatCurrency(claim.billed_amount || claim.claim_amount)}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #16a34a' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Allowed Amount</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', margin: 0 }}>
            {formatCurrency(claim.allowed_amount)}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #00d4ff' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Service Date</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            {formatShortDate(claim.date_of_service)}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Member Information */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👤 Member Information
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Name</span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{claim.patient_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Member ID</span>
                <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  {claim.member_id || 'N/A'}
                </span>
              </div>
              {claim.patient_dob && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>Date of Birth</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatShortDate(claim.patient_dob)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Provider Information */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🏥 Provider Information
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Provider</span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{claim.provider_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>NPI</span>
                <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  {claim.provider_npi || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Codes */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📋 Clinical Codes
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Diagnosis (ICD-10)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {diagnosisCodes.length > 0 ? diagnosisCodes.map((code, idx) => (
                  <span key={idx} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 500 }}>
                    {code}
                  </span>
                )) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>
                )}
              </div>
            </div>
            
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Procedures (CPT)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {procedureCodes.length > 0 ? procedureCodes.map((code, idx) => (
                  <span key={idx} style={{ padding: '6px 12px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 500 }}>
                    {code}
                  </span>
                )) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AI Reasoning - Most Important */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: `2px solid ${decisionStyle.bg}` }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🤖 AI Analysis
            </h3>
            
            {reasoning ? (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', margin: 0 }}>{reasoning}</p>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No reasoning provided</p>
            )}
            
            {claim.adjudication_rules && (
              <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px', fontWeight: 500 }}>Rule Applied</p>
                <p style={{ fontSize: '14px', color: '#1e40af', margin: 0, fontWeight: 500 }}>{claim.adjudication_rules}</p>
              </div>
            )}
          </div>

          {/* Payment Recommendation */}
          {claim.payment_recommendation && (
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '24px', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💰 Payment Recommendation
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#166534' }}>Recommended Payment</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>
                    {formatCurrency(claim.payment_recommendation.amount)}
                  </span>
                </div>
                {claim.payment_recommendation.patient_responsibility !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #bbf7d0' }}>
                    <span style={{ color: '#166534', fontSize: '14px' }}>Patient Responsibility</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>{formatCurrency(claim.payment_recommendation.patient_responsibility)}</span>
                  </div>
                )}
                {claim.payment_recommendation.adjustment !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#166534', fontSize: '14px' }}>Contractual Adjustment</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>{formatCurrency(claim.payment_recommendation.adjustment)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flags */}
          {claim.flags && claim.flags.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🚩 Flags & Alerts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {claim.flags.map((flag, idx) => {
                  const flagType = typeof flag === 'object' ? flag.type : 'info';
                  const flagMessage = typeof flag === 'object' ? flag.message : flag;
                  const flagColors: Record<string, { bg: string; border: string; text: string }> = {
                    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
                    warning: { bg: '#fffbeb', border: '#fed7aa', text: '#d97706' },
                    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
                  };
                  const colors = flagColors[flagType] || flagColors.info;
                  return (
                    <div key={idx} style={{ padding: '12px 16px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: colors.text }}>{flagMessage}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata - Collapsed */}
          <details style={{ background: 'white', borderRadius: '12px', padding: '16px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
              📎 Claim Metadata
            </summary>
            <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Claim ID</span>
                <span style={{ fontFamily: 'monospace' }}>{claim.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span style={{ textTransform: 'capitalize' }}>{claim.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Client</span>
                <span>{claim.client_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Created</span>
                <span>{formatDate(claim.created_at)}</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
