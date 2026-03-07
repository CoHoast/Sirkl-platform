'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClient } from '@/context/ClientContext';

// Clean design tokens
const colors = {
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  background: '#f8fafc',
  card: '#ffffff',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

// Simple area chart - clean and minimal
const AreaChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 180;
  const width = 100;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - 20 - ((value - min) / range) * (height - 40);
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '180px' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.12" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#areaFill)" />
      <polyline 
        points={points} 
        fill="none" 
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function DashboardPage() {
  const { selectedClient, clients } = useClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!clients || clients.length === 0) {
    return (
      <div style={{ 
        padding: '48px 32px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: `2px solid ${colors.border}`,
            borderTopColor: colors.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '14px', color: colors.textMuted }}>Loading...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  const client = selectedClient || clients[0];
  const greeting = currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  // Stats data
  const stats = {
    documentsProcessed: 12456,
    processingToday: 127,
    avgTime: 4.2,
    successRate: 98.7,
    pendingReview: 23,
    failedToday: 3,
  };

  const chartData = [42, 48, 51, 47, 55, 58, 52, 61, 65, 58, 72, 68, 75, 82, 78, 85, 88, 92, 87, 95, 102, 98, 108, 112];

  const recentDocuments = [
    { name: 'CMS-1500_Johnson_Sarah.pdf', type: 'CMS-1500', status: 'completed', time: '2 min ago', confidence: 98 },
    { name: 'UB04_Memorial_Hospital.pdf', type: 'UB-04', status: 'completed', time: '5 min ago', confidence: 96 },
    { name: 'EOB_BlueCross_247.pdf', type: 'EOB', status: 'review', time: '8 min ago', confidence: 87 },
    { name: 'CMS-1500_Williams.pdf', type: 'CMS-1500', status: 'completed', time: '12 min ago', confidence: 99 },
    { name: 'Invoice_Unknown.pdf', type: 'Unknown', status: 'failed', time: '15 min ago', confidence: null },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: colors.text,
          marginBottom: '4px',
          letterSpacing: '-0.02em'
        }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary }}>
          Here's an overview of {client?.name || 'your'} document processing.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        {/* Total Processed */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
            Total Processed
          </p>
          <p style={{ fontSize: '28px', fontWeight: '600', color: colors.text, letterSpacing: '-0.02em' }}>
            {stats.documentsProcessed.toLocaleString()}
          </p>
          <p style={{ fontSize: '12px', color: colors.success, marginTop: '8px' }}>
            ↑ 12% from last month
          </p>
        </div>

        {/* Today */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
            Processed Today
          </p>
          <p style={{ fontSize: '28px', fontWeight: '600', color: colors.text, letterSpacing: '-0.02em' }}>
            {stats.processingToday}
          </p>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '8px' }}>
            {stats.pendingReview} pending review
          </p>
        </div>

        {/* Avg Time */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
            Avg Processing Time
          </p>
          <p style={{ fontSize: '28px', fontWeight: '600', color: colors.text, letterSpacing: '-0.02em' }}>
            {stats.avgTime}s
          </p>
          <p style={{ fontSize: '12px', color: colors.success, marginTop: '8px' }}>
            ↓ 18% faster
          </p>
        </div>

        {/* Success Rate */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
            Success Rate
          </p>
          <p style={{ fontSize: '28px', fontWeight: '600', color: colors.text, letterSpacing: '-0.02em' }}>
            {stats.successRate}%
          </p>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '8px' }}>
            {stats.failedToday} failed today
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        
        {/* Chart Card */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: `1px solid ${colors.borderLight}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>
                Processing Volume
              </h2>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>
                Documents processed over time
              </p>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['7D', '30D', '90D'].map((period, i) => (
                <button 
                  key={period}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background: i === 1 ? colors.text : 'transparent',
                    color: i === 1 ? '#fff' : colors.textSecondary,
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '20px 24px 24px' }}>
            <AreaChart data={chartData} />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${colors.borderLight}`
            }}>
              <span style={{ fontSize: '12px', color: colors.textMuted }}>
                Last 30 days
              </span>
              <span style={{ fontSize: '12px', color: colors.success, fontWeight: '500' }}>
                ↑ 24% vs previous period
              </span>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '20px', 
            borderBottom: `1px solid ${colors.borderLight}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: colors.text }}>
              Recent Documents
            </h2>
            <Link href="/dashboard/documents" style={{
              fontSize: '13px',
              fontWeight: '500',
              color: colors.primary,
              textDecoration: 'none'
            }}>
              View all →
            </Link>
          </div>
          
          <div>
            {recentDocuments.map((doc, index) => (
              <div 
                key={index}
                style={{
                  padding: '14px 20px',
                  borderBottom: index < recentDocuments.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: doc.status === 'completed' ? colors.success : doc.status === 'review' ? colors.warning : colors.error,
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: colors.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {doc.name}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.textMuted }}>
                    {doc.type} • {doc.time}
                  </p>
                </div>
                {doc.confidence !== null && (
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: doc.confidence >= 95 ? colors.success : doc.confidence >= 85 ? colors.warning : colors.error
                  }}>
                    {doc.confidence}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { icon: '📄', title: 'Upload Documents', href: '/dashboard/documents/upload' },
            { icon: '⚙️', title: 'Configure Workflows', href: '/dashboard/workflows' },
            { icon: '📊', title: 'View Reports', href: '/dashboard/reports' },
            { icon: '👥', title: 'Manage Team', href: '/dashboard/team' },
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
              >
                <span style={{ fontSize: '20px' }}>{action.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>
                  {action.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
