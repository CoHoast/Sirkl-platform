'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClient } from '@/context/ClientContext';

interface ExtractionItem {
  id: number;
  bill_id: number;
  extraction_id: string;
  status: string;
  overall_confidence: number;
  extracted_data: {
    member: { name: { value: string; confidence: number }; id: { value: string; confidence: number } };
    provider: { name: { value: string; confidence: number }; npi: { value: string; confidence: number } };
    billing: { total_billed: { value: number; confidence: number }; date_of_service: { value: string; confidence: number } };
    line_items: Array<{ cpt_code: { value: string }; charge: { value: number }; confidence: number }>;
  };
  fair_price_data: {
    total_billed: number;
    total_fair_price: number;
    savings_percent: number;
  } | null;
  fields_needing_review: string[];
  created_at: string;
  bill_member_name?: string;
  bill_provider_name?: string;
  bill_total_billed?: number;
}

export default function ReviewQueuePage() {
  const { selectedClient } = useClient();
  const [items, setItems] = useState<ExtractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ExtractionItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviewQueue();
  }, [selectedClient]);

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const clientParam = selectedClient ? `&clientId=${selectedClient.id}` : '';
      const res = await fetch(`/api/db/bill-negotiator/review-queue?status=review_needed${clientParam}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching review queue:', error);
    }
    setLoading(false);
  };

  const approveExtraction = async (item: ExtractionItem) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/db/bill-negotiator/review-queue/${item.id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchReviewQueue();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
    setSaving(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return '#16a34a';
    if (confidence >= 60) return '#f59e0b';
    if (confidence >= 40) return '#f97316';
    return '#dc2626';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 85) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Critical';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#64748b' }}>Loading review queue...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Link href="/dashboard/bill-negotiator" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
              Bill Negotiator
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#6366f1', fontWeight: 500, fontSize: '14px' }}>Review Queue</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Human Review Queue
          </h1>
          <p style={{ color: '#64748b' }}>
            Review and verify AI-extracted bill data
          </p>
        </div>
        <div style={{ 
          padding: '12px 20px', 
          background: items.length > 0 ? '#fef3c7' : '#dcfce7',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>{items.length > 0 ? '⚠️' : '✅'}</span>
          <div>
            <p style={{ fontWeight: 600, color: items.length > 0 ? '#92400e' : '#166534' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} pending
            </p>
            <p style={{ fontSize: '13px', color: items.length > 0 ? '#a16207' : '#15803d' }}>
              {items.length > 0 ? 'Need human verification' : 'All caught up!'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 2fr' : '1fr', gap: '24px' }}>
        {/* Queue List */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Pending Review ({items.length})
            </h2>
          </div>
          
          {items.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</p>
              <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '18px' }}>All clear!</p>
              <p style={{ color: '#64748b', marginTop: '8px' }}>No items need review</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: selectedItem?.id === item.id ? '#f5f3ff' : 'white',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                        {item.extracted_data?.member?.name?.value || item.bill_member_name || 'Unknown Member'}
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        {item.extracted_data?.provider?.name?.value || item.bill_provider_name || 'Unknown Provider'}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: getConfidenceColor(item.overall_confidence) + '20',
                      color: getConfidenceColor(item.overall_confidence)
                    }}>
                      {item.overall_confidence}% {getConfidenceLabel(item.overall_confidence)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>
                      {formatCurrency(item.extracted_data?.billing?.total_billed?.value || item.bill_total_billed || 0)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {item.fields_needing_review?.length || 0} field{item.fields_needing_review?.length !== 1 ? 's' : ''} to review
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Extraction Summary */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Review Extraction #{selectedItem.bill_id}
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setSelectedItem(null)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => approveExtraction(selectedItem)}
                    disabled={saving}
                    style={{
                      padding: '8px 20px',
                      background: saving ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {saving ? 'Approving...' : '✓ Approve & Continue'}
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Confidence Bar */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Overall Confidence</span>
                    <span style={{ fontWeight: 600, color: getConfidenceColor(selectedItem.overall_confidence) }}>
                      {selectedItem.overall_confidence}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${selectedItem.overall_confidence}%`,
                      background: `linear-gradient(90deg, ${getConfidenceColor(selectedItem.overall_confidence)} 0%, ${getConfidenceColor(selectedItem.overall_confidence)}80 100%)`,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>

                {/* Extracted Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Member Info */}
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>MEMBER</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Name</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: getConfidenceColor(selectedItem.extracted_data?.member?.name?.confidence || 0) 
                        }}>
                          {selectedItem.extracted_data?.member?.name?.confidence || 0}%
                        </span>
                      </div>
                      <input
                        type="text"
                        defaultValue={selectedItem.extracted_data?.member?.name?.value || ''}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Member ID</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: getConfidenceColor(selectedItem.extracted_data?.member?.id?.confidence || 0) 
                        }}>
                          {selectedItem.extracted_data?.member?.id?.confidence || 0}%
                        </span>
                      </div>
                      <input
                        type="text"
                        defaultValue={selectedItem.extracted_data?.member?.id?.value || ''}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>PROVIDER</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Name</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: getConfidenceColor(selectedItem.extracted_data?.provider?.name?.confidence || 0) 
                        }}>
                          {selectedItem.extracted_data?.provider?.name?.confidence || 0}%
                        </span>
                      </div>
                      <input
                        type="text"
                        defaultValue={selectedItem.extracted_data?.provider?.name?.value || ''}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>NPI</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: getConfidenceColor(selectedItem.extracted_data?.provider?.npi?.confidence || 0) 
                        }}>
                          {selectedItem.extracted_data?.provider?.npi?.confidence || 0}%
                        </span>
                      </div>
                      <input
                        type="text"
                        defaultValue={selectedItem.extracted_data?.provider?.npi?.value || ''}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Summary */}
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>BILLING</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Total Billed</span>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(selectedItem.extracted_data?.billing?.total_billed?.value || 0)}
                      </p>
                    </div>
                    {selectedItem.fair_price_data && (
                      <>
                        <div>
                          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Fair Price</span>
                          <p style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>
                            {formatCurrency(selectedItem.fair_price_data.total_fair_price)}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Potential Savings</span>
                          <p style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>
                            {selectedItem.fair_price_data.savings_percent}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                {selectedItem.extracted_data?.line_items && selectedItem.extracted_data.line_items.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                      LINE ITEMS ({selectedItem.extracted_data.line_items.length})
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>CPT</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Charge</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.extracted_data.line_items.map((li, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                defaultValue={li.cpt_code.value}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  width: '100px'
                                }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <input
                                type="number"
                                defaultValue={li.charge.value}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  width: '100px',
                                  textAlign: 'right'
                                }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: getConfidenceColor(li.confidence) + '20',
                                color: getConfidenceColor(li.confidence)
                              }}>
                                {li.confidence}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href={`/dashboard/bill-negotiator/bills/${selectedItem.bill_id}`}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '20px' }}>📋</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>View Full Bill</p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>See complete bill details</p>
                </div>
              </Link>
              <button
                onClick={() => {/* Re-extract */}}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '20px' }}>🔄</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>Re-Extract</p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Run AI extraction again</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
