'use client';

import { useState } from 'react';
import { useClient, Workflow } from '@/context/ClientContext';
import Link from 'next/link';

export default function WorkflowsPage() {
  const { selectedClient, updateWorkflow } = useClient();
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Workflow>>({});

  if (!selectedClient) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#0a0f1a', marginBottom: '16px' }}>No Client Selected</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please select a client to configure workflows.</p>
        <Link href="/dashboard" style={{ color: '#00d4ff' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow.id);
    setFormData({
      ftpHost: workflow.ftpHost || '',
      ftpPath: workflow.ftpPath || '',
      ftpUsername: workflow.ftpUsername || '',
      outputApiEndpoint: workflow.outputApiEndpoint || '',
      outputApiKey: workflow.outputApiKey || '',
    });
  };

  const handleSave = (workflowId: string) => {
    updateWorkflow(selectedClient.id, workflowId, formData);
    setEditingWorkflow(null);
    setFormData({});
  };

  const handleCancel = () => {
    setEditingWorkflow(null);
    setFormData({});
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
            {selectedClient.name}
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#00d4ff', fontWeight: 500 }}>Workflows</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Workflows</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Configure document processing and claims adjudication workflows</p>
      </div>

      {/* Workflows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {selectedClient.workflows.map(workflow => (
          <div key={workflow.id} style={{ 
            background: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            {/* Workflow Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: workflow.type === 'document-intake' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {workflow.type === 'document-intake' ? (
                      <svg width="24" height="24" fill="none" stroke="#00d4ff" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '4px' }}>{workflow.name}</h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '600px' }}>{workflow.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: workflow.status === 'active' ? '#dcfce7' : workflow.status === 'paused' ? '#fee2e2' : '#fef3c7',
                    color: workflow.status === 'active' ? '#166534' : workflow.status === 'paused' ? '#991b1b' : '#92400e',
                    textTransform: 'capitalize',
                  }}>
                    {workflow.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow Configuration */}
            <div style={{ padding: '24px' }}>
              {editingWorkflow === workflow.id ? (
                // Edit Mode
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0a0f1a', marginBottom: '16px' }}>Configuration</h3>
                  
                  {workflow.type === 'document-intake' && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>FTP Input</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>FTP Host</label>
                          <input
                            type="text"
                            value={formData.ftpHost || ''}
                            onChange={e => setFormData({ ...formData, ftpHost: e.target.value })}
                            placeholder="ftp.example.com"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>FTP Path</label>
                          <input
                            type="text"
                            value={formData.ftpPath || ''}
                            onChange={e => setFormData({ ...formData, ftpPath: e.target.value })}
                            placeholder="/incoming"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>FTP Username</label>
                          <input
                            type="text"
                            value={formData.ftpUsername || ''}
                            onChange={e => setFormData({ ...formData, ftpUsername: e.target.value })}
                            placeholder="username"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>MCO Output API</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>API Endpoint</label>
                        <input
                          type="text"
                          value={formData.outputApiEndpoint || ''}
                          onChange={e => setFormData({ ...formData, outputApiEndpoint: e.target.value })}
                          placeholder="https://api.mco-advantage.com/v1/documents"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>API Key</label>
                        <input
                          type="password"
                          value={formData.outputApiKey || ''}
                          onChange={e => setFormData({ ...formData, outputApiKey: e.target.value })}
                          placeholder="••••••••••••••••"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleSave(workflow.id)}
                      style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Configuration
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '48px' }}>
                      {workflow.type === 'document-intake' && (
                        <div>
                          <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>FTP Input</h4>
                          {workflow.ftpHost ? (
                            <div style={{ fontSize: '14px', color: '#374151' }}>
                              <p><span style={{ color: '#6b7280' }}>Host:</span> {workflow.ftpHost}</p>
                              <p><span style={{ color: '#6b7280' }}>Path:</span> {workflow.ftpPath}</p>
                              <p><span style={{ color: '#6b7280' }}>User:</span> {workflow.ftpUsername}</p>
                            </div>
                          ) : (
                            <p style={{ fontSize: '14px', color: '#f59e0b' }}>Not configured</p>
                          )}
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>MCO Output API</h4>
                        {workflow.outputApiEndpoint ? (
                          <div style={{ fontSize: '14px', color: '#374151' }}>
                            <p><span style={{ color: '#6b7280' }}>Endpoint:</span> {workflow.outputApiEndpoint}</p>
                            <p><span style={{ color: '#6b7280' }}>API Key:</span> ••••••••</p>
                          </div>
                        ) : (
                          <p style={{ fontSize: '14px', color: '#f59e0b' }}>Not configured</p>
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Stats</h4>
                        <div style={{ fontSize: '14px', color: '#374151' }}>
                          <p><span style={{ color: '#6b7280' }}>Processed:</span> {workflow.documentsProcessed}</p>
                          <p><span style={{ color: '#6b7280' }}>Last Run:</span> {workflow.lastRun}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(workflow)}
                      style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Configure
                    </button>
                  </div>

                  {/* Related Links */}
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                    {workflow.type === 'document-intake' ? (
                      <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#00d4ff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Manage Document Types →
                      </Link>
                    ) : (
                      <Link href="/dashboard/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Manage Adjudication Rules →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
