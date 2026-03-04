'use client';

import { useState, useEffect } from 'react';

interface Email {
  id: number;
  client_id: number;
  client_name: string;
  message_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  received_at: string;
  status: string;
  patient_name: string | null;
  confidence_score: number | null;
  application_id: string | null;
  error_message: string | null;
  retry_count: number;
}

interface Stats {
  processed: number;
  failed: number;
  pending: number;
  processing: number;
  total: number;
  avg_confidence: number | null;
}

interface OverallStats {
  processed_total: number;
  failed_total: number;
  pending_total: number;
  processing_total: number;
  total: number;
  avg_confidence: number | null;
}

interface HealthData {
  overall: OverallStats;
  today: { processed: number; failed: number; pending: number; total: number };
  lastEmail: { received_at: string; subject: string; from_email: string; status: string } | null;
  lastEmailAgo: string;
  perClient: { client_id: number; client_name: string; processed: number; failed: number; pending: number; total: number }[];
  health: { status: string; color: string };
}

interface Client {
  id: number;
  name: string;
}

export default function EmailIntakePage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'failed' | 'health'>('monitor');
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDays, setSelectedDays] = useState<string>('7');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<number | null>(null);

  // Fetch clients
  useEffect(() => {
    fetch('/api/db/clients')
      .then(res => res.json())
      .then(data => setClients(data.clients || []))
      .catch(console.error);
  }, []);

  // Fetch emails
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      client_id: selectedClient,
      status: activeTab === 'failed' ? 'failed' : selectedStatus,
      days: selectedDays
    });

    fetch(`/api/db/email-intake?${params}`)
      .then(res => res.json())
      .then(data => {
        setEmails(data.emails || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedClient, selectedStatus, selectedDays, activeTab]);

  // Fetch health data
  useEffect(() => {
    if (activeTab === 'health') {
      fetch(`/api/db/email-intake/stats?client_id=${selectedClient}`)
        .then(res => res.json())
        .then(data => setHealthData(data))
        .catch(console.error);
    }
  }, [activeTab, selectedClient]);

  const handleRetry = async (emailId: number) => {
    setRetrying(emailId);
    try {
      const res = await fetch(`/api/db/email-intake/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry' })
      });
      if (res.ok) {
        // Refresh list
        setEmails(emails.map(e => 
          e.id === emailId ? { ...e, status: 'pending', error_message: null } : e
        ));
      }
    } catch (err) {
      console.error(err);
    }
    setRetrying(null);
  };

  const handleRetryAll = async () => {
    if (!confirm('Retry all failed emails?')) return;
    try {
      const res = await fetch(`/api/db/email-intake/retry-all?client_id=${selectedClient}`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(data.message);
      // Refresh list
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      processed: { bg: '#dcfce7', text: '#166534' },
      failed: { bg: '#fee2e2', text: '#991b1b' },
      pending: { bg: '#fef3c7', text: '#92400e' },
      processing: { bg: '#dbeafe', text: '#1e40af' }
    };
    const style = styles[status] || { bg: '#f3f4f6', text: '#374151' };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.text,
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
          📧 Email Intake
        </h1>
        <p style={{ color: '#6b7280' }}>
          Monitor incoming emails across all clients
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
        {[
          { id: 'monitor', label: 'Monitor', icon: '📊' },
          { id: 'failed', label: 'Failed Queue', icon: '❌' },
          { id: 'health', label: 'Health Status', icon: '🟢' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === 'failed' && stats && (
              <span style={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#fee2e2',
                color: activeTab === tab.id ? 'white' : '#991b1b',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px'
              }}>
                {stats.failed}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            minWidth: '200px'
          }}
        >
          <option value="all">All Clients</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>

        {activeTab === 'monitor' && (
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        )}

        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            minWidth: '150px'
          }}
        >
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>

        {activeTab === 'failed' && stats && stats.failed > 0 && (
          <button
            onClick={handleRetryAll}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              marginLeft: 'auto'
            }}
          >
            🔄 Retry All ({stats.failed})
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && activeTab !== 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Processed', value: stats.processed, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fef3c7' },
            { label: 'Failed', value: stats.failed, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Avg Confidence', value: stats.avg_confidence ? `${Math.round(stats.avg_confidence)}%` : 'N/A', color: '#2563eb', bg: '#dbeafe' }
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: stat.bg,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: stat.color, opacity: 0.8 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Health Status Tab */}
      {activeTab === 'health' && healthData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* System Health Card */}
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {healthData.health.status === 'healthy' ? '🟢' : healthData.health.status === 'degraded' ? '🟡' : '🔴'}
              System Health
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Status</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: healthData.health.color === 'green' ? '#16a34a' : healthData.health.color === 'yellow' ? '#d97706' : '#dc2626' }}>
                  {healthData.health.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Last Email</span>
                <span style={{ fontWeight: 500 }}>{healthData.lastEmailAgo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Today Processed</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>{healthData.today.processed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Today Failed</span>
                <span style={{ fontWeight: 500, color: healthData.today.failed > 0 ? '#dc2626' : '#6b7280' }}>{healthData.today.failed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Pending</span>
                <span style={{ fontWeight: 500, color: healthData.today.pending > 0 ? '#d97706' : '#6b7280' }}>{healthData.today.pending}</span>
              </div>
            </div>
          </div>

          {/* Overall Stats Card */}
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>📊 Overall Stats</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Emails</span>
                <span style={{ fontWeight: 600 }}>{healthData.overall.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Processed</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>{healthData.overall.processed_total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Failed</span>
                <span style={{ fontWeight: 500, color: '#dc2626' }}>{healthData.overall.failed_total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Avg Confidence</span>
                <span style={{ fontWeight: 500 }}>{healthData.overall.avg_confidence ? `${Math.round(parseFloat(healthData.overall.avg_confidence as any))}%` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Per Client Breakdown */}
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            gridColumn: 'span 2'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>🏢 Per Client (Last 7 Days)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontWeight: 500 }}>Client</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', color: '#6b7280', fontWeight: 500 }}>Total</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', color: '#6b7280', fontWeight: 500 }}>Processed</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', color: '#6b7280', fontWeight: 500 }}>Failed</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', color: '#6b7280', fontWeight: 500 }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {healthData.perClient.map(client => (
                  <tr key={client.client_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{client.client_name}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>{client.total}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#16a34a' }}>{client.processed}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: client.failed > 0 ? '#dc2626' : '#6b7280' }}>{client.failed}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: client.pending > 0 ? '#d97706' : '#6b7280' }}>{client.pending}</td>
                  </tr>
                ))}
                {healthData.perClient.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                      No email data in the last 7 days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email List */}
      {activeTab !== 'health' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              Loading...
            </div>
          ) : emails.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              No emails found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Received</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Client</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>From</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Subject</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Patient</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Confidence</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  {activeTab === 'failed' && (
                    <th style={{ textAlign: 'center', padding: '14px 16px', color: '#6b7280', fontWeight: 500, fontSize: '13px' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {emails.map((email, idx) => (
                  <tr 
                    key={email.id} 
                    style={{ 
                      borderBottom: idx < emails.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: email.status === 'failed' ? '#fef2f2' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                      {formatTime(email.received_at)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>
                      {email.client_name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <div style={{ fontWeight: 500 }}>{email.from_name || email.from_email}</div>
                      {email.from_name && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{email.from_email}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', maxWidth: '250px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.subject}
                      </div>
                      {email.error_message && (
                        <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                          ⚠️ {email.error_message}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>
                      {email.patient_name || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', textAlign: 'center' }}>
                      {email.confidence_score ? (
                        <span style={{ 
                          color: email.confidence_score >= 90 ? '#16a34a' : email.confidence_score >= 70 ? '#d97706' : '#dc2626',
                          fontWeight: 600
                        }}>
                          {Math.round(email.confidence_score)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {getStatusBadge(email.status)}
                    </td>
                    {activeTab === 'failed' && (
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRetry(email.id)}
                          disabled={retrying === email.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: retrying === email.id ? '#e5e7eb' : '#2563eb',
                            color: 'white',
                            cursor: retrying === email.id ? 'not-allowed' : 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {retrying === email.id ? '...' : '🔄 Retry'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
