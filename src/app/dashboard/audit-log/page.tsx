'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  client_id: number;
  client_name: string;
  user_name: string;
  user_email: string;
  ip_address: string;
  created_at: string;
}

interface Stats {
  total_events: string;
  last_30_days: string;
  active_users_today: string;
  logins_30_days: string;
}

const actionColors: Record<string, { bg: string; text: string }> = {
  'login': { bg: '#dcfce7', text: '#166534' },
  'logout': { bg: '#f3f4f6', text: '#4b5563' },
  'login_failed': { bg: '#fee2e2', text: '#991b1b' },
  'password_changed': { bg: '#dbeafe', text: '#1e40af' },
  'mfa_enabled': { bg: '#dcfce7', text: '#166534' },
  'document_processed': { bg: '#f3e8ff', text: '#7c3aed' },
  'webhook_delivered': { bg: '#dcfce7', text: '#166534' },
  'webhook_failed': { bg: '#fee2e2', text: '#991b1b' },
  'client_created': { bg: '#dbeafe', text: '#1e40af' },
  'billing_updated': { bg: '#fef9c3', text: '#854d0e' },
  'user_created': { bg: '#dbeafe', text: '#1e40af' },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filter !== 'all') params.append('action', filter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/db/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    const key = Object.keys(actionColors).find(k => action.toLowerCase().includes(k));
    return key ? actionColors[key] : { bg: '#f3f4f6', text: '#4b5563' };
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Audit Log</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Complete activity history for compliance and tracking</p>
        </div>
        <button 
          onClick={fetchLogs}
          style={{ 
            padding: '10px 20px', 
            background: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Events</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{stats?.total_events || '0'}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>All time</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Last 30 Days</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{stats?.last_30_days || '0'}</p>
          <p style={{ fontSize: '12px', color: '#16a34a' }}>Recent activity</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Logins (30 days)</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{stats?.logins_30_days || '0'}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Authentication events</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Active Users Today</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#00d4ff' }}>{stats?.active_users_today || '0'}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Unique users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search by action, details, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              boxSizing: 'border-box'
            }}
          />
        </form>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Events' },
            { key: 'login', label: 'Auth' },
            { key: 'document', label: 'Documents' },
            { key: 'webhook', label: 'Webhooks' },
            { key: 'client', label: 'Clients' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: filter === f.key ? 'none' : '1px solid #e5e7eb',
                background: filter === f.key ? '#0a0f1a' : 'white',
                color: filter === f.key ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p>No audit logs yet</p>
            <p style={{ fontSize: '13px' }}>Activity will appear here as you use the dashboard</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Details</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>IP Address</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const colors = getActionColor(log.action);
                const isExpanded = expandedLog === log.id;
                
                return (
                  <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb', background: isExpanded ? '#f9fafb' : 'white' }}>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: colors.bg,
                        color: colors.text
                      }}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 500, color: '#0a0f1a' }}>{log.user_name || log.user_email || 'System'}</td>
                    <td style={{ padding: '16px 20px', color: '#6b7280', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.entity_type && <span style={{ fontWeight: 500 }}>{log.entity_type}</span>}
                      {log.entity_id && <span> #{log.entity_id}</span>}
                      {log.details && <span> — {log.details}</span>}
                      {!log.entity_type && !log.details && '—'}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af' }}>{log.ip_address || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {log.details && (
                        <button 
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          style={{ 
                            padding: '6px 12px', 
                            background: isExpanded ? '#e5e7eb' : 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#374151'
                          }}
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expanded details rows */}
      {logs.filter(log => expandedLog === log.id && log.details).map(log => (
        <div key={`${log.id}-expanded`} style={{ 
          background: '#f9fafb', 
          borderRadius: '0 0 12px 12px', 
          padding: '16px 20px',
          marginTop: '-12px',
          marginBottom: '12px'
        }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>Full Details</div>
            <div style={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' }}>{log.details}</div>
          </div>
        </div>
      ))}

      {/* HIPAA Notice */}
      <div style={{ 
        marginTop: '24px', 
        padding: '16px 20px', 
        background: '#f9fafb', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <svg width="20" height="20" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          <strong style={{ color: '#374151' }}>HIPAA Compliance:</strong> All audit logs are retained for 6 years per HIPAA requirements. 
          Logs include user actions, PHI access, and system events. Export logs periodically for long-term archival.
        </div>
      </div>
    </div>
  );
}
