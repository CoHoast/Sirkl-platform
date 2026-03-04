'use client';

import { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';

interface Integration {
  id: number;
  client_id: number;
  integration_type: string;
  name: string;
  config: any;
  is_active: boolean;
  last_sync: string;
  last_error: string;
}

const integrationTypes = [
  { value: 'sftp_input', label: 'SFTP Input', icon: '📥', description: 'Pull documents from SFTP server' },
  { value: 'sftp_output', label: 'SFTP Output', icon: '📤', description: 'Push results to SFTP server' },
  { value: 's3_input', label: 'S3 Input', icon: '☁️', description: 'Pull documents from S3 bucket' },
  { value: 'webhook_output', label: 'Webhook Output', icon: '🔗', description: 'POST results to client API' },
  { value: 'email_input', label: 'Email Input', icon: '📧', description: 'Process documents from email' },
  { value: 'api_output', label: 'REST API', icon: '🔌', description: 'Push to client REST API' },
];

export default function IntegrationsPage() {
  const { selectedClient, clients } = useClient();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [newIntegration, setNewIntegration] = useState({ type: 'webhook_output', name: '', config: {} as any });

  const fetchIntegrations = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/db/integrations?clientId=${selectedClient.id}`);
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) fetchIntegrations();
  }, [selectedClient]);

  const handleAddIntegration = async () => {
    if (!selectedClient || !newIntegration.name) return;
    try {
      await fetch('/api/db/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          integrationType: newIntegration.type,
          name: newIntegration.name,
          config: newIntegration.config
        })
      });
      setShowAddModal(false);
      setNewIntegration({ type: 'webhook_output', name: '', config: {} });
      fetchIntegrations();
    } catch (err) {
      console.error('Failed to add integration:', err);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await fetch('/api/db/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      fetchIntegrations();
    } catch (err) {
      console.error('Failed to toggle integration:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this integration?')) return;
    try {
      await fetch(`/api/db/integrations?id=${id}`, { method: 'DELETE' });
      fetchIntegrations();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getTypeInfo = (type: string) => integrationTypes.find(t => t.value === type) || { label: type, icon: '🔧', description: '' };

  const renderConfigFields = () => {
    const type = newIntegration.type;
    if (type === 'sftp_input' || type === 'sftp_output') {
      return (
        <>
          <div><label style={labelStyle}>Host *</label><input style={inputStyle} placeholder="sftp.example.com" value={newIntegration.config.host || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, host: e.target.value } })} /></div>
          <div><label style={labelStyle}>Port</label><input style={inputStyle} placeholder="22" value={newIntegration.config.port || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, port: e.target.value } })} /></div>
          <div><label style={labelStyle}>Username</label><input style={inputStyle} placeholder="sftp_user" value={newIntegration.config.username || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, username: e.target.value } })} /></div>
          <div><label style={labelStyle}>Password/Key</label><input style={inputStyle} type="password" placeholder="••••••••" value={newIntegration.config.password || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, password: e.target.value } })} /></div>
          <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Path</label><input style={inputStyle} placeholder="/uploads/documents" value={newIntegration.config.path || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, path: e.target.value } })} /></div>
        </>
      );
    }
    if (type === 's3_input') {
      return (
        <>
          <div><label style={labelStyle}>Bucket *</label><input style={inputStyle} placeholder="my-bucket" value={newIntegration.config.bucket || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, bucket: e.target.value } })} /></div>
          <div><label style={labelStyle}>Prefix</label><input style={inputStyle} placeholder="incoming/" value={newIntegration.config.prefix || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, prefix: e.target.value } })} /></div>
          <div><label style={labelStyle}>Region</label><input style={inputStyle} placeholder="us-east-1" value={newIntegration.config.region || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, region: e.target.value } })} /></div>
        </>
      );
    }
    if (type === 'webhook_output' || type === 'api_output') {
      return (
        <>
          <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Endpoint URL *</label><input style={inputStyle} placeholder="https://api.example.com/webhook" value={newIntegration.config.url || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, url: e.target.value } })} /></div>
          <div><label style={labelStyle}>API Key</label><input style={inputStyle} type="password" placeholder="••••••••" value={newIntegration.config.apiKey || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, apiKey: e.target.value } })} /></div>
          <div><label style={labelStyle}>Headers (JSON)</label><input style={inputStyle} placeholder='{"Authorization": "Bearer ..."}' value={newIntegration.config.headers || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, headers: e.target.value } })} /></div>
        </>
      );
    }
    if (type === 'email_input') {
      return (
        <>
          <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Intake Email *</label><input style={inputStyle} placeholder="intake@client.dokit.ai" value={newIntegration.config.email || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, email: e.target.value } })} /></div>
          <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Allowed Senders (comma-separated)</label><input style={inputStyle} placeholder="sender@example.com, other@example.com" value={newIntegration.config.allowedSenders || ''} onChange={e => setNewIntegration({ ...newIntegration, config: { ...newIntegration.config, allowedSenders: e.target.value } })} /></div>
        </>
      );
    }
    return null;
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const };

  if (!selectedClient) {
    return (
      <div style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Integrations</h1>
        <div style={{ background: 'white', padding: '48px', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>Select a client to configure integrations</p>
          <p style={{ fontSize: '14px' }}>Use the client dropdown in the header to select a client</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Integrations</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Configure input/output connections for {selectedClient.name}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          + Add Integration
        </button>
      </div>

      {/* Integration Types Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {integrationTypes.map(type => {
          const count = integrations.filter(i => i.integration_type === type.value && i.is_active).length;
          return (
            <div key={type.value} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
              <p style={{ fontWeight: 600, color: '#0a0f1a', marginBottom: '4px' }}>{type.label}</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{count} active</p>
            </div>
          );
        })}
      </div>

      {/* Integrations List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : integrations.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No integrations configured</p>
            <p style={{ fontSize: '14px' }}>Add an integration to start receiving or sending documents</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Integration</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Type</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Last Sync</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map(integration => {
                const typeInfo = getTypeInfo(integration.integration_type);
                return (
                  <tr key={integration.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{typeInfo.icon}</span>
                        <div>
                          <p style={{ fontWeight: 500, color: '#0a0f1a' }}>{integration.name}</p>
                          {integration.config?.url && <p style={{ fontSize: '12px', color: '#6b7280' }}>{integration.config.url}</p>}
                          {integration.config?.host && <p style={{ fontSize: '12px', color: '#6b7280' }}>{integration.config.host}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}><span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px' }}>{typeInfo.label}</span></td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button onClick={() => handleToggleActive(integration.id, integration.is_active)} style={{ padding: '4px 12px', background: integration.is_active ? '#dcfce7' : '#fee2e2', color: integration.is_active ? '#166534' : '#991b1b', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {integration.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b7280' }}>
                      {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
                      {integration.last_error && <p style={{ color: '#dc2626', fontSize: '12px' }}>{integration.last_error}</p>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(integration.id)} style={{ padding: '6px 12px', background: '#fef2f2', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '550px', margin: '20px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add Integration</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Integration Type *</label>
                <select value={newIntegration.type} onChange={e => setNewIntegration({ type: e.target.value, name: '', config: {} })} style={{ ...inputStyle, background: 'white' }}>
                  {integrationTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{getTypeInfo(newIntegration.type).description}</p>
              </div>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} placeholder="Primary Webhook" value={newIntegration.name} onChange={e => setNewIntegration({ ...newIntegration, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {renderConfigFields()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddIntegration} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add Integration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
