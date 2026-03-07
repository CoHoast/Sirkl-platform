'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClient } from '@/context/ClientContext';

interface WorkflowRun {
  id: number;
  client_id: number;
  workflow_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_documents: number;
  successful_documents: number;
  failed_documents: number;
  document_breakdown: Record<string, number>;
  mco_delivery_status: string | null;
  mco_delivered_at: string | null;
  duration_seconds: number;
  client_name: string;
}

// Premium design tokens
const colors = {
  // Backgrounds
  pageBg: '#fafafa',
  cardBg: '#ffffff',
  
  // Text
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Accent colors for stat icons
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  green: '#10b981',
  greenLight: '#d1fae5',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  rose: '#f43f5e',
  roseLight: '#ffe4e6',
  cyan: '#06b6d4',
  cyanLight: '#cffafe',
  
  // Status colors
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#ef4444',
  errorBg: '#fee2e2',
  
  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
};

// Document type icon colors
const docTypeColors: Record<string, { bg: string; text: string }> = {
  'CMS-1500': { bg: '#ede9fe', text: '#7c3aed' },
  'UB-04': { bg: '#fef3c7', text: '#d97706' },
  'EOB': { bg: '#cffafe', text: '#0891b2' },
  'Invoice': { bg: '#d1fae5', text: '#059669' },
  'Prior Auth': { bg: '#ffe4e6', text: '#e11d48' },
  'Unknown': { bg: '#f3f4f6', text: '#6b7280' },
};

export default function DashboardPage() {
  const { selectedClient, clients, selectClient } = useClient();
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClient) {
      setRunsLoading(true);
      fetch(`/api/db/workflow-runs?clientId=${selectedClient.id}&limit=10`)
        .then(res => res.json())
        .then(data => {
          setWorkflowRuns(data.runs || []);
          setRunsLoading(false);
        })
        .catch(() => setRunsLoading(false));
    }
  }, [selectedClient]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Loading state
  if (!clients || clients.length === 0) {
    return (
      <div style={{ 
        padding: '48px 32px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.purple,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '15px', color: colors.textMuted }}>Loading...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  // Get selected client or first client
  const client = selectedClient || clients[0];

  // Mock data for demo (replace with real API data)
  const stats = {
    totalDocuments: 2847,
    processedToday: 47,
    avgProcessingTime: 8.3,
    aiAccuracy: 99.2,
    changeTotal: 12,
    changeProcessing: -23,
  };

  const recentDocuments = [
    { id: 1, name: 'CMS-1500_Johnson_Sarah.pdf', type: 'CMS-1500', subtype: 'Professional Claim', time: '2 min ago', status: 'Completed', confidence: 98 },
    { id: 2, name: 'UB04_Memorial_Hospital_03072026.pdf', type: 'UB-04', subtype: 'Institutional Claim', time: '5 min ago', status: 'Completed', confidence: 96 },
    { id: 3, name: 'EOB_BlueCross_Batch_247.pdf', type: 'EOB', subtype: 'Explanation of Benefits', time: '8 min ago', status: 'Review', confidence: 87 },
    { id: 4, name: 'CMS-1500_Williams_Michael.pdf', type: 'CMS-1500', subtype: 'Professional Claim', time: '12 min ago', status: 'Completed', confidence: 99 },
    { id: 5, name: 'Invoice_Unclear_Scan.pdf', type: 'Unknown', subtype: 'Unknown Type', time: '15 min ago', status: 'Failed', confidence: null },
  ];

  const processingStatus = {
    completed: 1842,
    pendingReview: 156,
    processing: 23,
    failed: 12,
  };
  const totalProcessing = processingStatus.completed + processingStatus.pendingReview + processingStatus.processing + processingStatus.failed;

  const documentTypes = {
    'CMS-1500': 1245,
    'UB-04': 892,
    'EOB': 456,
    'Other': 254,
  };
  const maxDocType = Math.max(...Object.values(documentTypes));

  return (
    <div style={{ 
      padding: '32px',
      minHeight: '100vh',
      background: colors.pageBg
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: '4px'
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Welcome back, {client?.name?.split(' ')[0] || 'Admin'}
          </p>
        </div>

        {/* Intake Email Card */}
        <div style={{
          background: colors.cardBg,
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: colors.purpleLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.purple} strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>
                Your Intake Email
              </p>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                intake-{client?.name?.toLowerCase().replace(/\s+/g, '')}@dokit.ai
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: colors.textMuted }}>
              Forward documents here for automatic AI processing
            </span>
            <button 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.cardBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.borderLight}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.cardBg}
              title="Copy email"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          marginBottom: '28px' 
        }}>
          {/* Total Documents */}
          <div 
            style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: hoveredCard === 'total' ? 'translateY(-2px)' : 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: colors.borderLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: colors.greenLight,
                color: colors.green
              }}>
                +{stats.changeTotal}%
              </span>
            </div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>
              Total Documents
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text, letterSpacing: '-0.5px' }}>
              {stats.totalDocuments.toLocaleString()}
            </p>
          </div>

          {/* Processed Today */}
          <div 
            style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: hoveredCard === 'processed' ? 'translateY(-2px)' : 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredCard('processed')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: colors.greenLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: colors.greenLight,
                color: colors.green
              }}>
                Live
              </span>
            </div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>
              Processed Today
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text, letterSpacing: '-0.5px' }}>
              {stats.processedToday}
            </p>
          </div>

          {/* Avg Processing Time */}
          <div 
            style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: hoveredCard === 'avg' ? 'translateY(-2px)' : 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredCard('avg')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: colors.cyanLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: colors.greenLight,
                color: colors.green
              }}>
                {stats.changeProcessing}%
              </span>
            </div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>
              Avg Processing
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text, letterSpacing: '-0.5px' }}>
              {stats.avgProcessingTime}<span style={{ fontSize: '16px', fontWeight: '400', color: colors.textMuted }}>s</span>
            </p>
          </div>

          {/* AI Accuracy */}
          <div 
            style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: hoveredCard === 'accuracy' ? 'translateY(-2px)' : 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredCard('accuracy')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: colors.roseLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.rose} strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>
              AI Accuracy
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text, letterSpacing: '-0.5px' }}>
              {stats.aiAccuracy}<span style={{ fontSize: '16px', fontWeight: '400', color: colors.textMuted }}>%</span>
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          
          {/* Recent Documents */}
          <div style={{
            background: colors.cardBg,
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '18px 24px', 
              borderBottom: `1px solid ${colors.borderLight}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>
                  Recent Documents
                </h2>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>
                  Latest processed documents
                </p>
              </div>
              <Link href="/dashboard/documents" style={{
                fontSize: '13px',
                fontWeight: '500',
                color: colors.purple,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            
            <div style={{ padding: '8px 0' }}>
              {recentDocuments.map((doc, index) => {
                const typeColor = docTypeColors[doc.type] || docTypeColors['Unknown'];
                const statusColors = {
                  'Completed': { bg: colors.greenLight, text: colors.green },
                  'Review': { bg: colors.amberLight, text: colors.amber },
                  'Failed': { bg: colors.errorBg, text: colors.error },
                };
                const statusStyle = statusColors[doc.status as keyof typeof statusColors];
                
                return (
                  <div 
                    key={doc.id}
                    style={{
                      padding: '14px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      borderBottom: index < recentDocuments.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.borderLight}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Document Type Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: typeColor.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={typeColor.text} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    
                    {/* Document Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: colors.text,
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {doc.name}
                      </p>
                      <p style={{ fontSize: '12px', color: colors.textMuted }}>
                        {doc.subtype} • {doc.time}
                      </p>
                    </div>
                    
                    {/* Status & Confidence */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: statusStyle.bg,
                        color: statusStyle.text
                      }}>
                        {doc.status}
                      </span>
                      {doc.confidence !== null && (
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: doc.confidence >= 95 ? colors.green : doc.confidence >= 85 ? colors.amber : colors.error,
                          minWidth: '36px',
                          textAlign: 'right'
                        }}>
                          {doc.confidence}%
                        </span>
                      )}
                      {doc.confidence === null && (
                        <span style={{ 
                          fontSize: '13px', 
                          color: colors.textMuted,
                          minWidth: '36px',
                          textAlign: 'right'
                        }}>
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Processing Status */}
            <div style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
                Processing Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.green }} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary, flex: 1 }}>Completed</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{processingStatus.completed.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.amber }} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary, flex: 1 }}>Pending Review</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{processingStatus.pendingReview}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.blue }} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary, flex: 1 }}>Processing</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{processingStatus.processing}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.error }} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary, flex: 1 }}>Failed</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{processingStatus.failed}</span>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
                Success Rate
              </h3>
              <div style={{ 
                height: '8px', 
                borderRadius: '4px', 
                background: colors.borderLight,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${((processingStatus.completed / totalProcessing) * 100).toFixed(0)}%`,
                  background: `linear-gradient(90deg, ${colors.green}, #34d399)`,
                  borderRadius: '4px'
                }} />
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginTop: '10px' }}>
                {((processingStatus.completed / totalProcessing) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Document Types */}
            <div style={{
              background: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
                Document Types
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(documentTypes).map(([type, count], index) => {
                  const barColors = [colors.purple, colors.amber, colors.cyan, colors.rose];
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: colors.textSecondary }}>{type}</span>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{count}</span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        borderRadius: '3px', 
                        background: colors.borderLight,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(count / maxDocType) * 100}%`,
                          background: barColors[index % barColors.length],
                          borderRadius: '3px',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
