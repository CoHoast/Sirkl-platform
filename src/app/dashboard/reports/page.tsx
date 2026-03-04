'use client';

import { useState, useEffect } from 'react';

interface Overview {
  total_documents: string;
  recent_documents: string;
  today_documents: string;
  active_clients: string;
  avg_confidence: string;
}

interface DocByType {
  document_type: string;
  count: string;
  avg_confidence: string;
}

interface DocByDay {
  date: string;
  count: string;
}

interface DocByClient {
  client_name: string;
  client_id: number;
  document_count: string;
  avg_confidence: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [byType, setByType] = useState<DocByType[]>([]);
  const [byDay, setByDay] = useState<DocByDay[]>([]);
  const [byClient, setByClient] = useState<DocByClient[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/reports?type=overview&days=${days}`);
      const data = await res.json();
      setOverview(data.overview);
      setByType(data.byType || []);
      setByDay(data.byDay || []);
      setByClient(data.byClient || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [days]);

  const formatNumber = (val: string | number) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const formatPercent = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '0%' : `${(num * 100).toFixed(1)}%`;
  };

  const docTypeColors: Record<string, { bg: string; text: string }> = {
    'CMS-1500': { bg: '#dbeafe', text: '#1d4ed8' },
    'CMS1500': { bg: '#dbeafe', text: '#1d4ed8' },
    'UB-04': { bg: '#f3e8ff', text: '#7c3aed' },
    'UB04': { bg: '#f3e8ff', text: '#7c3aed' },
    'ITEMIZED_BILL': { bg: '#fed7aa', text: '#c2410c' },
    'EOB': { bg: '#dcfce7', text: '#166534' },
  };

  const getDocTypeColor = (type: string) => {
    return docTypeColors[type] || { bg: '#f3f4f6', text: '#4b5563' };
  };

  // Simple bar chart component
  const BarChart = ({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '80px', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>{item.label}</div>
          <div style={{ flex: 1, height: '24px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00d4ff, #00b8e6)',
                borderRadius: '4px',
                minWidth: item.value > 0 ? '4px' : '0',
              }}
            />
          </div>
          <div style={{ width: '50px', fontSize: '13px', fontWeight: 500, color: '#0a0f1a' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#6b7280' }}>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Reports & Analytics</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Document processing metrics and insights</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: days === d ? 'none' : '1px solid #e5e7eb',
                background: days === d ? '#0a0f1a' : 'white',
                color: days === d ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Total Documents</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#0a0f1a' }}>{formatNumber(overview?.total_documents || 0)}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>All time</p>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Last {days} Days</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#00d4ff' }}>{formatNumber(overview?.recent_documents || 0)}</p>
          <p style={{ fontSize: '12px', color: '#16a34a' }}>Recent activity</p>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Today</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#16a34a' }}>{formatNumber(overview?.today_documents || 0)}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Documents processed</p>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Avg Confidence</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#7c3aed' }}>{formatPercent(overview?.avg_confidence || 0)}</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>AI extraction accuracy</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Documents by Type */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Documents by Type</h3>
          {byType.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No documents processed yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {byType.map((item, i) => {
                const colors = getDocTypeColor(item.document_type);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: colors.bg, color: colors.text }}>{item.document_type}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, color: '#0a0f1a' }}>{formatNumber(item.count)}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>{formatPercent(item.avg_confidence)} avg</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents by Client */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Documents by Client</h3>
          {byClient.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No clients yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {byClient.map((client, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a2332 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00d4ff',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}>
                      {client.client_name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?'}
                    </div>
                    <span style={{ fontWeight: 500 }}>{client.client_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, color: '#0a0f1a' }}>{formatNumber(client.document_count)}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>documents</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents by Day Chart */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Processing Volume (Last {days} Days)</h3>
        {byDay.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No data for selected period</p>
        ) : (
          <BarChart
            data={byDay.slice(0, 14).reverse().map(d => ({
              label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: parseInt(d.count)
            }))}
            maxValue={Math.max(...byDay.map(d => parseInt(d.count)), 1)}
          />
        )}
      </div>

      {/* Export Section */}
      <div style={{ marginTop: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Export Reports</h3>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Download detailed reports for external analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            📊 Export CSV
          </button>
          <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            📄 Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
