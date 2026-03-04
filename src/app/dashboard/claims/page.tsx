'use client';

import { useState } from 'react';

interface Claim {
  id: string;
  claimNumber: string;
  client: string;
  memberName: string;
  memberId: string;
  providerName: string;
  serviceDate: string;
  billedAmount: number;
  status: 'pending' | 'approved' | 'denied' | 'review';
  decision?: string;
  processedAt?: string;
}

const mockClaims: Claim[] = [
  { id: '1', claimNumber: 'CLM-2026-001842', client: 'Clearwater Health', memberName: 'John Smith', memberId: 'MBR-123456', providerName: 'Dr. Sarah Johnson', serviceDate: '2026-02-20', billedAmount: 450, status: 'approved', decision: 'Auto-Approved (Well Visit)', processedAt: '2 min ago' },
  { id: '2', claimNumber: 'CLM-2026-001843', client: 'Premier TPA', memberName: 'Mary Williams', memberId: 'MBR-789012', providerName: 'Cleveland Clinic', serviceDate: '2026-02-19', billedAmount: 8500, status: 'review', decision: 'High Dollar - Manual Review' },
  { id: '3', claimNumber: 'CLM-2026-001844', client: 'Clearwater Health', memberName: 'Robert Chen', memberId: 'MBR-345678', providerName: 'MetroHealth', serviceDate: '2026-02-18', billedAmount: 1200, status: 'denied', decision: 'No Prior Auth', processedAt: '15 min ago' },
  { id: '4', claimNumber: 'CLM-2026-001845', client: 'Midwest Employers', memberName: 'Lisa Garcia', memberId: 'MBR-901234', providerName: 'Dr. Michael Brown', serviceDate: '2026-02-21', billedAmount: 320, status: 'pending' },
  { id: '5', claimNumber: 'CLM-2026-001846', client: 'Premier TPA', memberName: 'David Kim', memberId: 'MBR-567890', providerName: 'University Hospitals', serviceDate: '2026-02-17', billedAmount: 2100, status: 'approved', decision: 'Auto-Approved', processedAt: '1 hour ago' },
];

export default function ClaimsPage() {
  const [claims] = useState<Claim[]>(mockClaims);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied' | 'review'>('all');

  const filteredClaims = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#dcfce7', text: '#166534' };
      case 'denied': return { bg: '#fee2e2', text: '#991b1b' };
      case 'review': return { bg: '#fef3c7', text: '#92400e' };
      case 'pending': return { bg: '#dbeafe', text: '#1e40af' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Claims</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>View and manage claims across all clients</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total', value: claims.length, color: '#0a0f1a' },
          { label: 'Pending', value: claims.filter(c => c.status === 'pending').length, color: '#3b82f6' },
          { label: 'Approved', value: claims.filter(c => c.status === 'approved').length, color: '#16a34a' },
          { label: 'Denied', value: claims.filter(c => c.status === 'denied').length, color: '#dc2626' },
          { label: 'Review', value: claims.filter(c => c.status === 'review').length, color: '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['all', 'pending', 'approved', 'denied', 'review'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: filter === f ? '#0a0f1a' : '#f3f4f6',
              color: filter === f ? 'white' : '#6b7280',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Claims Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Claim #</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Member</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Provider</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map(claim => {
              const statusColor = getStatusColor(claim.status);
              return (
                <tr key={claim.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontWeight: 600, color: '#0a0f1a' }}>{claim.claimNumber}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{claim.client}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontWeight: 500, color: '#0a0f1a' }}>{claim.memberName}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{claim.memberId}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ color: '#374151' }}>{claim.providerName}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{claim.serviceDate}</p>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#0a0f1a' }}>
                    ${claim.billedAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: statusColor.bg,
                      color: statusColor.text,
                      textTransform: 'capitalize',
                    }}>
                      {claim.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {claim.decision && <p style={{ fontSize: '13px', color: '#374151' }}>{claim.decision}</p>}
                    {claim.processedAt && <p style={{ fontSize: '11px', color: '#9ca3af' }}>{claim.processedAt}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
