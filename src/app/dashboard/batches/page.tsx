'use client';

import { useState } from 'react';
import { useClient } from '@/context/ClientContext';
import Link from 'next/link';

interface Batch {
  id: string;
  name: string;
  status: 'completed' | 'processing' | 'failed';
  processedAt: string;
  documentsTotal: number;
  documentsProcessed: number;
  documentsFailed: number;
  source: string;
  duration: string;
  breakdown: {
    type: string;
    code: string;
    count: number;
    successful: number;
  }[];
}

// Sample batches for United Refuah - spaced one week apart
const sampleBatches: Batch[] = [
  {
    id: 'BATCH-2026-008',
    name: 'Weekly Intake - Feb 26',
    status: 'processing',
    processedAt: '2026-02-26 14:30:00',
    documentsTotal: 156,
    documentsProcessed: 89,
    documentsFailed: 0,
    source: 'FTP: /incoming/2026-02-26',
    duration: '12 min (in progress)',
    breakdown: [
      { type: 'CMS-1500', code: 'CMS1500', count: 67, successful: 45 },
      { type: 'UB-04', code: 'UB04', count: 34, successful: 22 },
      { type: 'EOB', code: 'EOB', count: 28, successful: 12 },
      { type: 'Prior Auth', code: 'PRIOR_AUTH', count: 15, successful: 8 },
      { type: 'Other', code: 'OTHER', count: 12, successful: 2 },
    ],
  },
  {
    id: 'BATCH-2026-007',
    name: 'Weekly Intake - Feb 19',
    status: 'completed',
    processedAt: '2026-02-19 14:15:00',
    documentsTotal: 142,
    documentsProcessed: 140,
    documentsFailed: 2,
    source: 'FTP: /incoming/2026-02-19',
    duration: '18 min 32 sec',
    breakdown: [
      { type: 'CMS-1500', code: 'CMS1500', count: 58, successful: 58 },
      { type: 'UB-04', code: 'UB04', count: 31, successful: 30 },
      { type: 'EOB', code: 'EOB', count: 24, successful: 24 },
      { type: 'Prior Auth', code: 'PRIOR_AUTH', count: 18, successful: 17 },
      { type: 'Referral', code: 'REFERRAL', count: 7, successful: 7 },
      { type: 'Other', code: 'OTHER', count: 4, successful: 4 },
    ],
  },
  {
    id: 'BATCH-2026-006',
    name: 'Weekly Intake - Feb 12',
    status: 'completed',
    processedAt: '2026-02-12 14:22:00',
    documentsTotal: 178,
    documentsProcessed: 178,
    documentsFailed: 0,
    source: 'FTP: /incoming/2026-02-12',
    duration: '22 min 15 sec',
    breakdown: [
      { type: 'CMS-1500', code: 'CMS1500', count: 72, successful: 72 },
      { type: 'UB-04', code: 'UB04', count: 45, successful: 45 },
      { type: 'EOB', code: 'EOB', count: 31, successful: 31 },
      { type: 'Prior Auth', code: 'PRIOR_AUTH', count: 19, successful: 19 },
      { type: 'Member ID Card', code: 'ID_CARD', count: 8, successful: 8 },
      { type: 'Other', code: 'OTHER', count: 3, successful: 3 },
    ],
  },
  {
    id: 'BATCH-2026-005',
    name: 'Weekly Intake - Feb 5',
    status: 'completed',
    processedAt: '2026-02-05 14:08:00',
    documentsTotal: 134,
    documentsProcessed: 131,
    documentsFailed: 3,
    source: 'FTP: /incoming/2026-02-05',
    duration: '16 min 48 sec',
    breakdown: [
      { type: 'CMS-1500', code: 'CMS1500', count: 54, successful: 53 },
      { type: 'UB-04', code: 'UB04', count: 28, successful: 27 },
      { type: 'EOB', code: 'EOB', count: 22, successful: 22 },
      { type: 'Prior Auth', code: 'PRIOR_AUTH', count: 16, successful: 15 },
      { type: 'Medical Records', code: 'MED_RECORDS', count: 9, successful: 9 },
      { type: 'Other', code: 'OTHER', count: 5, successful: 5 },
    ],
  },
  {
    id: 'BATCH-2026-004',
    name: 'Weekly Intake - Jan 29',
    status: 'completed',
    processedAt: '2026-01-29 14:45:00',
    documentsTotal: 165,
    documentsProcessed: 165,
    documentsFailed: 0,
    source: 'FTP: /incoming/2026-01-29',
    duration: '20 min 12 sec',
    breakdown: [
      { type: 'CMS-1500', code: 'CMS1500', count: 68, successful: 68 },
      { type: 'UB-04', code: 'UB04', count: 38, successful: 38 },
      { type: 'EOB', code: 'EOB', count: 29, successful: 29 },
      { type: 'Prior Auth', code: 'PRIOR_AUTH', count: 21, successful: 21 },
      { type: 'Referral', code: 'REFERRAL', count: 6, successful: 6 },
      { type: 'Other', code: 'OTHER', count: 3, successful: 3 },
    ],
  },
];

export default function BatchesPage() {
  const { selectedClient } = useClient();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  if (!selectedClient) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#0a0f1a', marginBottom: '16px' }}>No Client Selected</h1>
        <Link href="/dashboard" style={{ color: '#00d4ff' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; color: string } } = {
      completed: { bg: '#dcfce7', color: '#166534' },
      processing: { bg: '#dbeafe', color: '#1e40af' },
      failed: { bg: '#fee2e2', color: '#991b1b' },
    };
    return styles[status] || styles.completed;
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            {selectedClient.name}
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#00d4ff', fontWeight: 500 }}>Batches</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Processing Batches</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Document intake batch history for {selectedClient.name}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Batches</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{sampleBatches.length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Documents Processed</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#00d4ff' }}>
            {sampleBatches.reduce((acc, b) => acc + b.documentsProcessed, 0)}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Success Rate</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
            {Math.round((sampleBatches.reduce((acc, b) => acc + b.documentsProcessed, 0) / sampleBatches.reduce((acc, b) => acc + b.documentsTotal, 0)) * 100)}%
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Failed</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: sampleBatches.reduce((acc, b) => acc + b.documentsFailed, 0) > 0 ? '#dc2626' : '#0a0f1a' }}>
            {sampleBatches.reduce((acc, b) => acc + b.documentsFailed, 0)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedBatch ? '1fr 400px' : '1fr', gap: '24px' }}>
        {/* Batches List */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>Batch History</h2>
          </div>
          <div>
            {sampleBatches.map((batch, index) => {
              const statusBadge = getStatusBadge(batch.status);
              const isSelected = selectedBatch?.id === batch.id;
              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatch(isSelected ? null : batch)}
                  style={{
                    padding: '16px 24px',
                    borderBottom: index < sampleBatches.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#f0f9ff' : 'transparent',
                    borderLeft: isSelected ? '3px solid #00d4ff' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6b7280' }}>{batch.id}</span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          textTransform: 'capitalize',
                        }}>
                          {batch.status === 'processing' ? '● Processing' : batch.status}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0a0f1a', marginBottom: '4px' }}>{batch.name}</h3>
                      <p style={{ fontSize: '13px', color: '#6b7280' }}>{batch.processedAt}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: '#0a0f1a' }}>
                        {batch.status === 'processing' ? `${batch.documentsProcessed}/${batch.documentsTotal}` : batch.documentsTotal}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>documents</p>
                    </div>
                  </div>
                  {batch.status === 'processing' && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(batch.documentsProcessed / batch.documentsTotal) * 100}%`,
                          background: '#00d4ff',
                          borderRadius: '3px',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                        {Math.round((batch.documentsProcessed / batch.documentsTotal) * 100)}% complete
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Batch Detail Panel */}
        {selectedBatch && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', height: 'fit-content' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>Batch Details</h2>
              <button onClick={() => setSelectedBatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>BATCH ID</p>
                <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#0a0f1a' }}>{selectedBatch.id}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>PROCESSED AT</p>
                <p style={{ fontSize: '14px', color: '#0a0f1a' }}>{selectedBatch.processedAt}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DURATION</p>
                <p style={{ fontSize: '14px', color: '#0a0f1a' }}>{selectedBatch.duration}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>SOURCE</p>
                <p style={{ fontSize: '14px', fontFamily: 'monospace', color: '#0a0f1a' }}>{selectedBatch.source}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>RESULT</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{selectedBatch.documentsProcessed}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>Successful</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: selectedBatch.documentsFailed > 0 ? '#dc2626' : '#0a0f1a' }}>{selectedBatch.documentsFailed}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>Failed</p>
                  </div>
                </div>
              </div>

              {/* Document Breakdown */}
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>DOCUMENT BREAKDOWN</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedBatch.breakdown.map(item => (
                    <div key={item.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0a0f1a' }}>{item.type}</p>
                        <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280' }}>{item.code}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#0a0f1a' }}>{item.count}</p>
                        {item.successful < item.count && (
                          <p style={{ fontSize: '11px', color: '#dc2626' }}>{item.count - item.successful} failed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
