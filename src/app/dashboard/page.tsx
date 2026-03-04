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

export default function DashboardPage() {
  const { selectedClient, clients, selectClient } = useClient();
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  // Fetch recent workflow runs when client is selected
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
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'document_intake': return '📄';
      case 'claims_adjudication': return '⚖️';
      case 'provider_bills': return '💵';
      case 'workers_comp': return '🏗️';
      default: return '📋';
    }
  };

  const getWorkflowLabel = (type: string) => {
    switch (type) {
      case 'document_intake': return 'Document Intake';
      case 'claims_adjudication': return 'Claims Adjudication';
      case 'provider_bills': return 'Provider Bills';
      case 'workers_comp': return 'Workers Comp';
      default: return type;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', color: '#16a34a' };
      case 'processing': return { bg: '#fef3c7', color: '#d97706' };
      case 'failed': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  // Platform-level view (no client selected)
  if (!selectedClient) {
    const client = clients[0]; // First client or undefined
    
    // Show loading state if no clients loaded yet
    if (!client) {
      return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>DOKit Admin Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Document processing and claims adjudication platform.</p>
          </div>
          <div style={{ background: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading clients...</p>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>If this persists, check database connection.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>DOKit Admin Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Document processing and claims adjudication platform. Select a client to configure workflows.</p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Active Clients</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#00d4ff' }}>1</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>United Refuah HealthShare</p>
          </div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Active Workflows</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#0a0f1a' }}>2</p>
            <p style={{ fontSize: '13px', color: '#f59e0b' }}>Configuring</p>
          </div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Documents Processed</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#0a0f1a' }}>0</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Ready to start</p>
          </div>
        </div>

        {/* Client Card */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '16px' }}>Clients</h2>
          <button
            onClick={() => selectClient(client)}
            style={{
              width: '100%',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#00d4ff';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '12px',
                  background: '#00d4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px', fontWeight: 600,
                }}>
                  UR
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '4px' }}>{client.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>Healthcare cost sharing ministry</p>
                  
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>Workflows</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>{client.workflows.length}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>Document Types</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>{client.documentTypes?.length || 0}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>Rules</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>{client.adjudicationRules?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#dcfce7',
                  color: '#166534',
                }}>
                  Active
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff', fontSize: '14px', fontWeight: 500 }}>
                  Configure
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Workflows Overview */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '16px' }}>Workflows</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {client.workflows.map(workflow => (
              <div key={workflow.id} style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: workflow.type === 'document-intake' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {workflow.type === 'document-intake' ? (
                      <svg width="20" height="20" fill="none" stroke="#00d4ff" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#fef3c7',
                    color: '#92400e',
                  }}>
                    Configuring
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a', marginBottom: '8px' }}>{workflow.name}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, marginBottom: '16px' }}>{workflow.description}</p>
                <button
                  onClick={() => selectClient(client)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#0a0f1a',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Configure Workflow →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Client-specific view (United Refuah selected)
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with client context */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <button 
            onClick={() => selectClient(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#6b7280', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              padding: 0,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
            Platform
          </button>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#00d4ff', fontWeight: 500 }}>{selectedClient.name}</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>
          {selectedClient.name}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Configure workflows, document types, and adjudication rules
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <Link href="/dashboard/workflows" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Workflows</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#00d4ff' }}>{selectedClient.workflows.length}</p>
            <p style={{ fontSize: '13px', color: '#f59e0b' }}>Configuring</p>
          </div>
        </Link>
        <Link href="/dashboard/documents" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Document Types</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#0a0f1a' }}>{selectedClient.documentTypes?.length || 0}</p>
            <p style={{ fontSize: '13px', color: '#16a34a' }}>Configured</p>
          </div>
        </Link>
        <Link href="/dashboard/rules" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Adjudication Rules</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#0a0f1a' }}>{selectedClient.adjudicationRules?.length || 0}</p>
            <p style={{ fontSize: '13px', color: '#16a34a' }}>Active</p>
          </div>
        </Link>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Documents Processed</p>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#0a0f1a' }}>{selectedClient.documentsThisMonth}</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>This month</p>
        </div>
      </div>

      {/* Recent Workflow Runs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a' }}>Recent Workflow Runs</h2>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Last 10 runs</span>
        </div>
        
        {runsLoading ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280' }}>Loading workflow runs...</p>
          </div>
        ) : workflowRuns.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>📋</p>
            <p style={{ color: '#6b7280' }}>No workflow runs yet</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Workflow</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Documents</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Success</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>MCO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Started</th>
                </tr>
              </thead>
              <tbody>
                {workflowRuns.map((run) => {
                  const statusStyle = getStatusStyle(run.status);
                  const successRate = run.total_documents > 0 
                    ? Math.round((run.successful_documents / run.total_documents) * 100) 
                    : 0;
                  return (
                    <tr 
                      key={run.id} 
                      style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onClick={() => setSelectedRun(run)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{getWorkflowIcon(run.workflow_type)}</span>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{getWorkflowLabel(run.workflow_type)}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Run #{run.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize'
                        }}>
                          {run.status === 'processing' ? '⏳ ' : run.status === 'completed' ? '✓ ' : '✕ '}{run.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700 }}>{run.total_documents.toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          color: successRate >= 99 ? '#16a34a' : successRate >= 95 ? '#d97706' : '#dc2626' 
                        }}>
                          {successRate}%
                        </span>
                        {run.failed_documents > 0 && (
                          <span style={{ fontSize: '11px', color: '#dc2626', display: 'block' }}>
                            {run.failed_documents} failed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                        {formatDuration(run.duration_seconds)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {run.mco_delivery_status === 'delivered' ? (
                          <span style={{ color: '#16a34a', fontSize: '13px' }}>✓ Delivered</span>
                        ) : run.status === 'processing' ? (
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>Pending</span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '13px' }}>⏳ Queued</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#6b7280' }}>
                        {formatTimeAgo(run.started_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Run Detail Modal */}
      {selectedRun && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000 
          }}
          onClick={() => setSelectedRun(null)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '32px', 
              maxWidth: '600px', 
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>{getWorkflowIcon(selectedRun.workflow_type)}</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{getWorkflowLabel(selectedRun.workflow_type)}</h2>
                </div>
                <p style={{ color: '#6b7280', margin: 0 }}>Run #{selectedRun.id}</p>
              </div>
              <button 
                onClick={() => setSelectedRun(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >×</button>
            </div>

            {/* Status & Timing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</p>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: getStatusStyle(selectedRun.status).bg,
                  color: getStatusStyle(selectedRun.status).color,
                  textTransform: 'capitalize'
                }}>
                  {selectedRun.status}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration</p>
                <p style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{formatDuration(selectedRun.duration_seconds)}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>MCO Delivery</p>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: selectedRun.mco_delivery_status === 'delivered' ? '#16a34a' : '#d97706' }}>
                  {selectedRun.mco_delivery_status === 'delivered' ? '✓ Delivered' : 'Pending'}
                </p>
              </div>
            </div>

            {/* Document Summary */}
            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '16px' }}>Document Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>{selectedRun.total_documents.toLocaleString()}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', margin: 0 }}>{selectedRun.successful_documents.toLocaleString()}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Successful</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: selectedRun.failed_documents > 0 ? '#dc2626' : '#6b7280', margin: 0 }}>{selectedRun.failed_documents}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Failed</p>
                </div>
              </div>
            </div>

            {/* Document Breakdown */}
            {selectedRun.document_breakdown && Object.keys(selectedRun.document_breakdown).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Breakdown by Type</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {Object.entries(selectedRun.document_breakdown).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{type}</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#00d4ff' }}>{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '4px' }}>Started</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{new Date(selectedRun.started_at).toLocaleString()}</p>
                </div>
                {selectedRun.completed_at && (
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '4px' }}>Completed</p>
                    <p style={{ fontWeight: 500, margin: 0 }}>{new Date(selectedRun.completed_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedRun.mco_delivered_at && (
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '4px' }}>MCO Delivered</p>
                    <p style={{ fontWeight: 500, margin: 0 }}>{new Date(selectedRun.mco_delivered_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflows */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a' }}>Workflows</h2>
          <Link href="/dashboard/workflows" style={{ fontSize: '14px', color: '#00d4ff', textDecoration: 'none' }}>Manage workflows →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {selectedClient.workflows.map(workflow => (
            <Link key={workflow.id} href={`/dashboard/workflows/${workflow.type}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00d4ff'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: workflow.type === 'document-intake' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {workflow.type === 'document-intake' ? (
                      <svg width="20" height="20" fill="none" stroke="#00d4ff" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: workflow.status === 'active' ? '#dcfce7' : '#fef3c7',
                    color: workflow.status === 'active' ? '#166534' : '#92400e',
                    textTransform: 'capitalize',
                  }}>
                    {workflow.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a', marginBottom: '8px' }}>{workflow.name}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{workflow.description}</p>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '24px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>Processed</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0f1a' }}>{workflow.documentsProcessed}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>Last Run</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0f1a' }}>{workflow.lastRun}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions - Link to workflow pages */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '16px' }}>Configure Workflows</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <Link href="/dashboard/workflows/document-intake" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #00d4ff 0%, #00b8e6 100%)', 
              padding: '24px', 
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
            }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: '12px' }}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Document Intake & Classification</p>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>FTP config, document types, extraction fields</p>
            </div>
          </Link>
          <Link href="/dashboard/workflows/claims-adjudication" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
              padding: '24px', 
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
            }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: '12px' }}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Claims Adjudication</p>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>API config, adjudication rules</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
