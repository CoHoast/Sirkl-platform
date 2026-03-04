'use client';

import { useState } from 'react';

interface ReviewItem {
  id: string;
  type: 'claim' | 'document';
  referenceNumber: string;
  client: string;
  flagReason: string;
  memberName: string;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  flaggedAt: string;
  assignedTo?: string;
}

const mockReviewQueue: ReviewItem[] = [
  { id: '1', type: 'claim', referenceNumber: 'CLM-2026-001843', client: 'Premier TPA', flagReason: 'High Dollar ($8,500) - Exceeds auto-approve threshold', memberName: 'Mary Williams', amount: 8500, priority: 'high', flaggedAt: '5 minutes ago' },
  { id: '2', type: 'document', referenceNumber: 'DOC-2026-014521', client: 'Clearwater Health', flagReason: 'Low confidence extraction (67%) - Manual verification needed', memberName: 'James Wilson', priority: 'medium', flaggedAt: '15 minutes ago' },
  { id: '3', type: 'claim', referenceNumber: 'CLM-2026-001847', client: 'Midwest Employers', flagReason: 'Duplicate claim detected - Possible resubmission', memberName: 'Sarah Chen', amount: 1200, priority: 'high', flaggedAt: '30 minutes ago' },
  { id: '4', type: 'claim', referenceNumber: 'CLM-2026-001848', client: 'Clearwater Health', flagReason: 'Out-of-network provider - Verify authorization', memberName: 'Michael Brown', amount: 3400, priority: 'medium', flaggedAt: '1 hour ago' },
  { id: '5', type: 'document', referenceNumber: 'DOC-2026-014522', client: 'Premier TPA', flagReason: 'Unknown document type - Classification failed', memberName: 'Unknown', priority: 'low', flaggedAt: '2 hours ago' },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>(mockReviewQueue);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'medium': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'low': return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const handleApprove = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleDeny = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Review Queue</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Claims and documents flagged for manual review</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Pending Review', value: queue.length, color: '#f59e0b' },
          { label: 'High Priority', value: queue.filter(q => q.priority === 'high').length, color: '#dc2626' },
          { label: 'Claims', value: queue.filter(q => q.type === 'claim').length, color: '#3b82f6' },
          { label: 'Documents', value: queue.filter(q => q.type === 'document').length, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Review Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {queue.map(item => {
          const priorityColor = getPriorityColor(item.priority);
          return (
            <div
              key={item.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${priorityColor.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: item.type === 'claim' ? '#dbeafe' : '#f3e8ff',
                      color: item.type === 'claim' ? '#1e40af' : '#7c3aed',
                      textTransform: 'uppercase',
                    }}>
                      {item.type}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0a0f1a' }}>{item.referenceNumber}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: priorityColor.bg,
                      color: priorityColor.text,
                      textTransform: 'uppercase',
                    }}>
                      {item.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>{item.client} • {item.memberName}</p>
                </div>
                {item.amount && (
                  <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a0f1a' }}>${item.amount.toLocaleString()}</p>
                )}
              </div>

              <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                  <strong>Flag Reason:</strong> {item.flagReason}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Flagged {item.flaggedAt}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeny(item.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#991b1b',
                      cursor: 'pointer',
                    }}
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #00d4ff 0%, #00b8e6 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0a0f1a',
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '8px' }}>All caught up!</p>
            <p style={{ color: '#6b7280' }}>No items pending review</p>
          </div>
        )}
      </div>
    </div>
  );
}
