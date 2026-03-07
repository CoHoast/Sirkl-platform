'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'next/navigation';

interface ProcessedClaim {
  id: number;
  client_id: number;
  claim_number: string;
  member_id: string;
  provider_npi: string;
  date_of_service: string;
  cpt_codes: string[];
  icd_codes: string[];
  billed_amount: string;
  allowed_amount: string;
  claim_data: any;
  ai_decision: string;
  ai_reasoning: string;
  status: string;
  processed_at: string;
  created_at: string;
  client_name: string;
}

export default function ClaimsAdjudicationWorkflowPage() {
  const router = useRouter();
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'processed' | 'config' | 'rules'>('processed');

  // Processed claims from database
  const [processedClaims, setProcessedClaims] = useState<ProcessedClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setClaimsLoading(true);
    setClaimsError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClient?.id) {
        params.append('clientId', selectedClient.id.toString());
      }
      const response = await fetch(`/api/db/claims?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      setProcessedClaims(data.claims || []);
    } catch (err) {
      setClaimsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'processed') {
      fetchClaims();
    }
  }, [activeTab, selectedClient]);

  const tabs = [
    { id: 'processed', label: `Processed Claims (${processedClaims.length})`, icon: 'document' },
    { id: 'config', label: 'Integration Config', icon: 'settings' },
    { id: 'rules', label: 'Adjudication Rules', icon: '📜' },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number | null) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === null || isNaN(num || 0)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  const getDecisionStyle = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case 'approve': return { bg: '#dcfce7', color: '#16a34a', icon: 'check' };
      case 'deny': return { bg: '#fee2e2', color: '#dc2626', icon: 'x' };
      case 'review': return { bg: '#fef3c7', color: '#d97706', icon: 'alert' };
      default: return { bg: '#f3f4f6', color: '#6b7280', icon: '❓' };
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>⚖️</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            Claims Adjudication
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: 0 }}>
          AI-powered claims decisions for {selectedClient?.name || 'Test Client'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === tab.id ? '#8b5cf6' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Processed Claims Tab */}
      {activeTab === 'processed' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processed Claims</h3>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span>
                Live Data
              </span>
            </div>
            <button
              onClick={fetchClaims}
              disabled={claimsLoading}
              style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: claimsLoading ? 'wait' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {claimsLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {claimsError && (
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
              {claimsError}
            </div>
          )}

          {claimsLoading && processedClaims.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              Loading claims...
            </div>
          ) : processedClaims.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
              <p>No claims adjudicated yet</p>
              <p style={{ fontSize: '13px' }}>Process some claims to see them here</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Claim #</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>DOS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>CPT</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Billed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Allowed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Decision</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedClaims.map((claim) => {
                    const decisionStyle = getDecisionStyle(claim.ai_decision);
                    const cptCodes = Array.isArray(claim.cpt_codes) ? claim.cpt_codes : [];
                    
                    return (
                      <tr 
                        key={claim.id} 
                        style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                        onClick={() => router.push(`/dashboard/workflows/claims-adjudication/${claim.id}`)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
                          {claim.claim_number}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          {claim.member_id}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                          {formatDate(claim.date_of_service)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {cptCodes.slice(0, 2).map((code, i) => (
                              <span key={i} style={{ padding: '2px 6px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                                {code}
                              </span>
                            ))}
                            {cptCodes.length > 2 && (
                              <span style={{ padding: '2px 6px', background: '#f3f4f6', color: '#64748b', borderRadius: '4px', fontSize: '11px' }}>
                                +{cptCodes.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>
                          {formatCurrency(claim.billed_amount)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#16a34a' }}>
                          {formatCurrency(claim.allowed_amount)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: decisionStyle.bg,
                            color: decisionStyle.color,
                            textTransform: 'uppercase'
                          }}>
                            {decisionStyle.icon} {claim.ai_decision || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/workflows/claims-adjudication/${claim.id}`);
                            }}
                            style={{ padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {processedClaims.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#6d28d9' }}>
                <strong>Summary:</strong> {processedClaims.length} claims | 
                Approved: {processedClaims.filter(c => c.ai_decision?.toLowerCase() === 'approve').length} | 
                Denied: {processedClaims.filter(c => c.ai_decision?.toLowerCase() === 'deny').length} | 
                Review: {processedClaims.filter(c => c.ai_decision?.toLowerCase() === 'review').length} |
                Total Billed: {formatCurrency(processedClaims.reduce((sum, c) => sum + (parseFloat(c.billed_amount) || 0), 0))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Integration Config Tab */}
      {activeTab === 'config' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Integration Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Input API Endpoint</label>
              <input type="text" placeholder="https://api.client.com/claims" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>API Key</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Output Endpoint</label>
              <input type="text" placeholder="https://api.mco.com/decisions" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Output API Key</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Adjudication Rules Tab */}
      {activeTab === 'rules' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Adjudication Rules</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { name: 'Auto-Approve Preventive Care', action: 'approve', condition: 'CPT 99381-99397 with active member', active: true },
              { name: 'Auto-Approve Routine Office Visits', action: 'approve', condition: 'CPT 99201-99215, in-network, < $500', active: true },
              { name: 'Auto-Deny Terminated Members', action: 'deny', condition: 'Member not active on DOS', active: true },
              { name: 'Auto-Deny Duplicate Claims', action: 'deny', condition: 'Same member, provider, date, codes', active: true },
              { name: 'Review High Dollar Claims', action: 'review', condition: 'Billed amount > $5,000', active: true },
              { name: 'Review Out-of-Network', action: 'review', condition: 'Provider not in network', active: true },
            ].map((rule, i) => {
              const actionStyle = getDecisionStyle(rule.action);
              return (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{rule.name}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: actionStyle.bg, color: actionStyle.color, textTransform: 'uppercase' }}>
                        {rule.action}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>If: {rule.condition}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: rule.active ? '#16a34a' : '#64748b' }}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                    <input type="checkbox" checked={rule.active} readOnly style={{ width: '18px', height: '18px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
