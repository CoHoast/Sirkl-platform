'use client';

import { useState, useEffect } from 'react';

interface QueueItem {
  id: string;
  type: 'document' | 'claim';
  source: string;
  status: 'processing' | 'pending' | 'completed' | 'failed';
  client: string;
  documentType?: string;
  progress: number;
  startedAt: string;
  estimatedCompletion?: string;
}

const mockQueue: QueueItem[] = [
  { id: '1', type: 'document', source: 'FTP Batch #1842', status: 'processing', client: 'Clearwater Health', documentType: 'CMS-1500', progress: 67, startedAt: '2 min ago' },
  { id: '2', type: 'claim', source: 'API - Premier TPA', status: 'processing', client: 'Premier TPA', progress: 45, startedAt: '30 sec ago' },
  { id: '3', type: 'document', source: 'FTP Batch #1842', status: 'pending', client: 'Clearwater Health', documentType: 'UB-04', progress: 0, startedAt: 'Queued' },
  { id: '4', type: 'document', source: 'FTP Batch #1842', status: 'pending', client: 'Clearwater Health', documentType: 'Prior Auth', progress: 0, startedAt: 'Queued' },
  { id: '5', type: 'claim', source: 'API - Midwest Employers', status: 'completed', client: 'Midwest Employers', progress: 100, startedAt: '5 min ago' },
  { id: '6', type: 'document', source: 'Manual Upload', status: 'failed', client: 'Ohio WC Pool', documentType: 'Unknown', progress: 23, startedAt: '10 min ago' },
];

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>(mockQueue);
  const [filter, setFilter] = useState<'all' | 'processing' | 'pending' | 'completed' | 'failed'>('all');

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(q => q.map(item => {
        if (item.status === 'processing' && item.progress < 100) {
          const newProgress = Math.min(item.progress + Math.random() * 5, 100);
          return { 
            ...item, 
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'processing'
          };
        }
        return item;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredQueue = filter === 'all' ? queue : queue.filter(q => q.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return { bg: '#dbeafe', text: '#1e40af' };
      case 'completed': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#f3f4f6', text: '#6b7280' };
      case 'failed': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Processing Queue</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Real-time view of documents and claims being processed</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Processing', value: queue.filter(q => q.status === 'processing').length, color: '#3b82f6' },
          { label: 'In Queue', value: queue.filter(q => q.status === 'pending').length, color: '#6b7280' },
          { label: 'Completed', value: queue.filter(q => q.status === 'completed').length, color: '#16a34a' },
          { label: 'Failed', value: queue.filter(q => q.status === 'failed').length, color: '#dc2626' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['all', 'processing', 'pending', 'completed', 'failed'] as const).map(f => (
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

      {/* Queue List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredQueue.map(item => {
          const statusColor = getStatusColor(item.status);
          return (
            <div key={item.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              {/* Type Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: item.type === 'document' ? 'linear-gradient(135deg, #0a0f1a 0%, #1a2332 100%)' : 'linear-gradient(135deg, #00d4ff 0%, #00ffcc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="24" height="24" fill="none" stroke={item.type === 'document' ? '#00d4ff' : '#0a0f1a'} strokeWidth="2" viewBox="0 0 24 24">
                  {item.type === 'document' ? (
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  ) : (
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  )}
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#0a0f1a' }}>{item.source}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: statusColor.bg,
                    color: statusColor.text,
                    textTransform: 'capitalize',
                  }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  {item.client} {item.documentType && `• ${item.documentType}`}
                </p>
              </div>

              {/* Progress */}
              {item.status === 'processing' && (
                <div style={{ width: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Processing...</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a0f1a' }}>{Math.round(item.progress)}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.progress}%`,
                      background: 'linear-gradient(135deg, #00d4ff 0%, #00ffcc 100%)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Time */}
              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{item.startedAt}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
