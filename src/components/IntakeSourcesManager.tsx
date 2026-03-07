'use client';

import { useState, useEffect, useCallback } from 'react';

interface IntakeSource {
  id: number;
  client_id: number;
  workflow_key: string;
  source_type: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  schedule: string | null;
  enabled: boolean;
  last_poll_at: string | null;
  last_poll_status: string | null;
  last_poll_message: string | null;
  source_type_name: string;
  source_type_icon: string;
  supports_schedule: boolean;
  supports_test: boolean;
}

interface SourceType {
  type_key: string;
  name: string;
  description: string;
  icon: string;
  config_schema: {
    fields: {
      key: string;
      label: string;
      type: string;
      required?: boolean;
      default?: unknown;
      options?: string[];
      readonly?: boolean;
    }[];
  };
  supports_schedule: boolean;
  supports_test: boolean;
}

interface IntakeSourcesManagerProps {
  clientId: number;
  workflowKey: string;
  workflowName: string;
}

const scheduleOptions = [
  { value: '', label: 'No Schedule (Manual Only)' },
  { value: 'every_5m', label: 'Every 5 minutes' },
  { value: 'every_15m', label: 'Every 15 minutes' },
  { value: 'every_30m', label: 'Every 30 minutes' },
  { value: 'hourly', label: 'Every hour' },
  { value: 'every_4h', label: 'Every 4 hours' },
  { value: 'daily', label: 'Once daily (midnight)' },
];

export default function IntakeSourcesManager({ clientId, workflowKey, workflowName }: IntakeSourcesManagerProps) {
  const [sources, setSources] = useState<IntakeSource[]>([]);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingSource, setTestingSource] = useState<number | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/db/intake-sources?clientId=${clientId}&workflowKey=${workflowKey}`);
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, [clientId, workflowKey]);

  const fetchSourceTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/db/intake-sources/types');
      const data = await res.json();
      if (data.success) {
        setSourceTypes(data.types);
      }
    } catch (err) {
      console.error('Failed to fetch source types:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSources(), fetchSourceTypes()]).finally(() => setLoading(false));
  }, [fetchSources, fetchSourceTypes]);

  const handleToggleSource = async (source: IntakeSource) => {
    try {
      const res = await fetch(`/api/db/intake-sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !source.enabled })
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (err) {
      console.error('Failed to toggle source:', err);
    }
  };

  const handleDeleteSource = async (source: IntakeSource) => {
    if (!confirm(`Are you sure you want to delete "${source.name}"?`)) return;
    try {
      const res = await fetch(`/api/db/intake-sources/${source.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSources();
      }
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  };

  const handleTestConnection = async (source: IntakeSource) => {
    setTestingSource(source.id);
    try {
      const res = await fetch(`/api/db/intake-sources/${source.id}/test`, { method: 'POST' });
      const data = await res.json();
      alert(data.success ? `✅ ${data.message}` : `❌ ${data.message || data.error}`);
      fetchSources();
    } catch (err) {
      alert('Test failed');
    } finally {
      setTestingSource(null);
    }
  };

  const getStatusBadge = (source: IntakeSource) => {
    if (!source.last_poll_status) {
      return <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>Never Run</span>;
    }
    const isSuccess = source.last_poll_status.includes('success');
    return (
      <span style={{ 
        padding: '2px 8px', 
        fontSize: '11px', 
        borderRadius: '4px', 
        background: isSuccess ? '#dcfce7' : '#fee2e2', 
        color: isSuccess ? '#16a34a' : '#dc2626' 
      }}>
        {source.last_poll_status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <p style={{ color: '#64748b' }}>Loading intake sources...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Intake Sources
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Configure how documents are ingested for {workflowName}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4"/>
            </svg>
            Add Source
          </button>
        </div>

        {/* Sources List */}
        <div>
          {sources.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <svg width="48" height="48" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <p style={{ color: '#64748b', fontSize: '15px' }}>No intake sources configured</p>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Add a source to start receiving documents</p>
            </div>
          ) : (
            sources.map((source, index) => (
              <div 
                key={source.id} 
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: index < sources.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '10px', 
                    background: source.enabled ? '#eef2ff' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" fill="none" stroke={source.enabled ? '#6366f1' : '#94a3b8'} strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>{source.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        {source.source_type_name}
                      </span>
                      {getStatusBadge(source)}
                    </div>
                    {source.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{source.description}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {source.supports_test && (
                    <button
                      onClick={() => handleTestConnection(source)}
                      disabled={testingSource === source.id}
                      style={{
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: testingSource === source.id ? 'wait' : 'pointer',
                        color: '#64748b'
                      }}
                      title="Test Connection"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleSource(source)}
                    style={{
                      padding: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: source.enabled ? '#16a34a' : '#94a3b8'
                    }}
                    title={source.enabled ? 'Disable' : 'Enable'}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {source.enabled ? (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      ) : (
                        <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSource(source)}
                    style={{
                      padding: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                    title="Delete"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          clientId={clientId}
          workflowKey={workflowKey}
          sourceTypes={sourceTypes}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchSources();
          }}
        />
      )}
    </>
  );
}

function AddSourceModal({
  clientId,
  workflowKey,
  sourceTypes,
  onClose,
  onSuccess
}: {
  clientId: number;
  workflowKey: string;
  sourceTypes: SourceType[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = (type: SourceType) => {
    setSelectedType(type);
    const defaults: Record<string, unknown> = {};
    type.config_schema.fields.forEach(field => {
      if (field.default !== undefined) {
        defaults[field.key] = field.default;
      }
    });
    setFormData(defaults);
    setName(`${type.name}`);
    setStep('configure');
  };

  const handleSave = async () => {
    if (!selectedType || !name) return;
    
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/db/intake-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          workflow_key: workflowKey,
          source_type: selectedType.type_key,
          name,
          description: description || null,
          config: formData,
          schedule: schedule || null,
          enabled: true
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create source');
      }
    } catch (err) {
      setError('Failed to create source');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>
            {step === 'select' ? 'Add Intake Source' : `Configure ${selectedType?.name}`}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px' }}>
          {step === 'select' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {sourceTypes.map(type => (
                <button
                  key={type.type_key}
                  onClick={() => handleSelectType(type)}
                  style={{
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.background = '#fafafa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{type.name}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>{type.description}</p>
                </button>
              ))}
            </div>
          ) : selectedType && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Source Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {selectedType.supports_schedule && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Schedule
                  </label>
                  <select
                    value={schedule}
                    onChange={e => setSchedule(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {scheduleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedType.config_schema.fields.length > 0 && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Configuration</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedType.config_schema.fields.map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={(formData[field.key] as string) || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="">Select...</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={formData[field.key] as boolean || false}
                              onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                            />
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Enable</span>
                          </label>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={(formData[field.key] as string) || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            rows={4}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          />
                        ) : (
                          <input
                            type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                            value={(formData[field.key] as string) || ''}
                            onChange={e => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                            readOnly={field.readonly}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                              background: field.readonly ? '#f9fafb' : 'white'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          {step === 'configure' && (
            <button
              onClick={() => setStep('select')}
              style={{ padding: '10px 20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
            >
              ← Back
            </button>
          )}
          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
            >
              Cancel
            </button>
            {step === 'configure' && (
              <button
                onClick={handleSave}
                disabled={saving || !name}
                style={{
                  padding: '10px 24px',
                  background: saving || !name ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: saving || !name ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Creating...' : 'Create Source'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
