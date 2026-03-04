'use client';

import { useState } from 'react';

const decisions = [
  { id: 'APP-2026-003', name: 'Dorothy Martinez', facility: 'Cranberry Park at Milford', status: 'approved', decidedBy: 'John Guiher', decidedAt: '2/24/2026 2:30 PM', notes: 'All documentation complete. Insurance verified.' },
  { id: 'APP-2026-005', name: 'Betty Anderson', facility: 'The Cottages at Grand Rapids', status: 'approved', decidedBy: 'John Guiher', decidedAt: '2/23/2026 4:15 PM', notes: 'Good fit for memory care unit. Family consulted.' },
  { id: 'APP-2026-004', name: 'Harold Johnson', facility: 'MCO Advantage of ShorePointe', status: 'denied', decidedBy: 'John Guiher', decidedAt: '2/23/2026 11:00 AM', notes: 'Does not meet medical criteria for skilled nursing level of care.' },
  { id: 'APP-2026-008', name: 'Mary Davis', facility: 'MCO Advantage of Sterling Heights', status: 'approved', decidedBy: 'Michael Chen', decidedAt: '2/22/2026 3:45 PM', notes: 'Rehab services approved for 30 days.' },
  { id: 'APP-2026-009', name: 'William Taylor', facility: 'MCO Advantage of Ann Arbor', status: 'denied', decidedBy: 'John Guiher', decidedAt: '2/22/2026 10:30 AM', notes: 'Insurance does not cover requested services.' },
  { id: 'APP-2026-010', name: 'Elizabeth Moore', facility: 'Cranberry Park at West Bloomfield', status: 'approved', decidedBy: 'Michael Chen', decidedAt: '2/21/2026 2:00 PM', notes: 'Assisted living approved. Move-in scheduled for 2/28.' },
];

export default function DecisionsPage() {
  const [filter, setFilter] = useState('all');

  const filteredDecisions = filter === 'all' 
    ? decisions 
    : decisions.filter(d => d.status === filter);

  const stats = {
    total: decisions.length,
    approved: decisions.filter(d => d.status === 'approved').length,
    denied: decisions.filter(d => d.status === 'denied').length,
    rate: Math.round((decisions.filter(d => d.status === 'approved').length / decisions.length) * 100)
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Decisions History</h1>
        <p style={{ color: '#4a4a4a' }}>View past application decisions and outcomes</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Decisions</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">Last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{stats.approved}</div>
          <div className="stat-change">{stats.rate}% approval rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Denied</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.denied}</div>
          <div className="stat-change">{100 - stats.rate}% denial rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Decision Time</div>
          <div className="stat-value">2.4h</div>
          <div className="stat-change">Within SLA target</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['all', 'approved', 'denied'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: filter === status ? 'none' : '1px solid #e0e0e0',
              background: filter === status ? '#0a0f1a' : 'white',
              color: filter === status ? 'white' : '#4a4a4a',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {status === 'all' ? 'All Decisions' : status}
          </button>
        ))}
      </div>

      {/* Decisions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredDecisions.map((decision) => (
          <div key={decision.id} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: decision.status === 'approved' ? '#dcfce7' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {decision.status === 'approved' ? (
                    <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{decision.name}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>{decision.facility}</p>
                </div>
              </div>
              <span className={`status-badge status-${decision.status}`}>
                {decision.status === 'approved' ? 'Approved' : 'Denied'}
              </span>
            </div>
            
            <div style={{ background: '#f9f7f4', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ color: '#4a4a4a', fontSize: '14px', lineHeight: 1.6 }}>
                <strong>Notes:</strong> {decision.notes}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#888' }}>
              <span>Decision by <strong style={{ color: '#4a4a4a' }}>{decision.decidedBy}</strong></span>
              <span>{decision.decidedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
