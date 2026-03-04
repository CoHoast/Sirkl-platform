'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'next/navigation';

interface ProcessedDocument {
  id: number;
  client_id: number;
  document_type: string;
  original_filename: string;
  s3_key: string;
  status: string;
  confidence_score: number;
  extracted_data: any;
  processed_at: string;
  created_at: string;
  client_name: string;
}

interface DocumentType {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  identifiers: { id: number; type: string; value: string }[];
  field_count: number;
}

interface ExtractionField {
  id: number;
  field_name: string;
  field_key: string;
  field_type: string;
  format: string | null;
  is_required: boolean;
  description: string | null;
  display_order: number;
}

interface Identifier {
  id: number;
  identifier_type: string;
  value: string;
}

export default function DocumentIntakeWorkflowPage() {
  const router = useRouter();
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'processed' | 'config' | 'types'>('processed');

  // Processed documents
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Document types
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [typeFields, setTypeFields] = useState<ExtractionField[]>([]);
  const [typeIdentifiers, setTypeIdentifiers] = useState<Identifier[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showAddIdentifierModal, setShowAddIdentifierModal] = useState(false);
  const [newType, setNewType] = useState({ name: '', slug: '', description: '' });
  const [newField, setNewField] = useState({ fieldName: '', fieldKey: '', fieldType: 'string', format: '', isRequired: false, description: '' });
  const [newIdentifier, setNewIdentifier] = useState({ identifierType: 'form_text', value: '' });

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClient?.id) params.append('clientId', selectedClient.id.toString());
      const res = await fetch(`/api/db/documents?${params}`);
      const data = await res.json();
      setProcessedDocs(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    setTypesLoading(true);
    try {
      const res = await fetch('/api/db/document-types');
      const data = await res.json();
      setDocumentTypes(data.documentTypes || []);
    } catch (err) {
      console.error('Failed to fetch document types:', err);
    } finally {
      setTypesLoading(false);
    }
  };

  const fetchTypeDetails = async (typeId: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/db/document-types/${typeId}`);
      const data = await res.json();
      setTypeFields(data.fields || []);
      setTypeIdentifiers(data.identifiers || []);
    } catch (err) {
      console.error('Failed to fetch type details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'processed') fetchDocuments();
    if (activeTab === 'types') fetchDocumentTypes();
  }, [activeTab, selectedClient]);

  useEffect(() => {
    if (selectedType) fetchTypeDetails(selectedType.id);
  }, [selectedType]);

  const handleAddType = async () => {
    if (!newType.name) return;
    try {
      const res = await fetch('/api/db/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      });
      if (res.ok) {
        setShowAddTypeModal(false);
        setNewType({ name: '', slug: '', description: '' });
        fetchDocumentTypes();
      }
    } catch (err) {
      console.error('Failed to add document type:', err);
    }
  };

  const handleAddField = async () => {
    if (!selectedType || !newField.fieldName || !newField.fieldKey) return;
    try {
      const res = await fetch(`/api/db/document-types/${selectedType.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField)
      });
      if (res.ok) {
        setShowAddFieldModal(false);
        setNewField({ fieldName: '', fieldKey: '', fieldType: 'string', format: '', isRequired: false, description: '' });
        fetchTypeDetails(selectedType.id);
        fetchDocumentTypes();
      }
    } catch (err) {
      console.error('Failed to add field:', err);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!selectedType || !confirm('Delete this extraction field?')) return;
    try {
      await fetch(`/api/db/document-types/${selectedType.id}/fields?fieldId=${fieldId}`, { method: 'DELETE' });
      fetchTypeDetails(selectedType.id);
      fetchDocumentTypes();
    } catch (err) {
      console.error('Failed to delete field:', err);
    }
  };

  const handleAddIdentifier = async () => {
    if (!selectedType || !newIdentifier.value) return;
    try {
      const res = await fetch(`/api/db/document-types/${selectedType.id}/identifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIdentifier)
      });
      if (res.ok) {
        setShowAddIdentifierModal(false);
        setNewIdentifier({ identifierType: 'form_text', value: '' });
        fetchTypeDetails(selectedType.id);
      }
    } catch (err) {
      console.error('Failed to add identifier:', err);
    }
  };

  const handleDeleteIdentifier = async (identifierId: number) => {
    if (!selectedType || !confirm('Delete this identifier?')) return;
    try {
      await fetch(`/api/db/document-types/${selectedType.id}/identifiers?identifierId=${identifierId}`, { method: 'DELETE' });
      fetchTypeDetails(selectedType.id);
    } catch (err) {
      console.error('Failed to delete identifier:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return '#16a34a';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const docTypeColors: Record<string, { bg: string; text: string }> = {
    'CMS-1500': { bg: '#dbeafe', text: '#1d4ed8' },
    'CMS1500': { bg: '#dbeafe', text: '#1d4ed8' },
    'UB-04': { bg: '#f3e8ff', text: '#7c3aed' },
    'UB04': { bg: '#f3e8ff', text: '#7c3aed' },
    'ITEMIZED_BILL': { bg: '#fed7aa', text: '#c2410c' },
    'EOB': { bg: '#dcfce7', text: '#166534' },
  };

  const tabs = [
    { id: 'processed', label: 'Processed Documents', icon: '📄' },
    { id: 'config', label: 'Integration Config', icon: '⚙️' },
    { id: 'types', label: 'Document Types', icon: '📋' },
  ];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>📄</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>Document Intake & Classification</h1>
        </div>
        <p style={{ color: '#64748b', margin: 0 }}>AI-powered document processing for {selectedClient?.name || 'all clients'}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedType(null); }}
            style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              color: activeTab === tab.id ? '#00d4ff' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* PROCESSED DOCUMENTS TAB */}
      {activeTab === 'processed' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processed Documents ({processedDocs.length})</h3>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Live Data</span>
            </div>
            <button onClick={fetchDocuments} disabled={docsLoading} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
              {docsLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {processedDocs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p>No documents processed yet</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Filename</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Confidence</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Processed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedDocs.map((doc) => {
                    const typeColor = docTypeColors[doc.document_type] || { bg: '#e5e7eb', text: '#4b5563' };
                    return (
                      <tr key={doc.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>#{doc.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0a0f1a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_filename}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: typeColor.bg, color: typeColor.text }}>{doc.document_type}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: getConfidenceColor(doc.confidence_score * 100) }}>{Math.round(doc.confidence_score * 100)}%</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{formatDate(doc.processed_at || doc.created_at)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => router.push(`/dashboard/workflows/document-intake/${doc.id}`)} style={{ padding: '6px 12px', background: 'rgba(0,212,255,0.1)', border: 'none', borderRadius: '6px', color: '#00b8e6', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INTEGRATION CONFIG TAB */}
      {activeTab === 'config' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Integration Configuration</h3>
          <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>FTP/SFTP Host</label>
              <input type="text" placeholder="sftp.example.com" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>FTP Path</label>
              <input type="text" placeholder="/uploads/documents" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>API Endpoint (Webhook)</label>
              <input type="text" placeholder="https://api.example.com/webhook/documents" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>API Key</label>
              <input type="password" placeholder="••••••••••••••••" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>Save Configuration</button>
          </div>
        </div>
      )}

      {/* DOCUMENT TYPES TAB */}
      {activeTab === 'types' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedType ? '1fr 2fr' : '1fr', gap: '24px' }}>
          {/* Document Types List */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Document Types</h3>
              <button onClick={() => setShowAddTypeModal(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add Type</button>
            </div>

            {typesLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documentTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => setSelectedType(dt)}
                    style={{
                      padding: '16px', background: selectedType?.id === dt.id ? 'rgba(0,212,255,0.1)' : '#f9fafb',
                      border: selectedType?.id === dt.id ? '2px solid #00d4ff' : '1px solid #e5e7eb',
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0a0f1a', margin: '0 0 4px' }}>{dt.name}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{dt.description || 'No description'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {dt.is_system && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#e5e7eb', borderRadius: '4px', color: '#6b7280' }}>SYSTEM</span>}
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{dt.field_count} fields</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Type Details */}
          {selectedType && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Identifiers Section */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>AI Classification Identifiers</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Text patterns the AI looks for to identify this document type</p>
                  </div>
                  <button onClick={() => setShowAddIdentifierModal(true)} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>+ Add Identifier</button>
                </div>

                {detailLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                ) : typeIdentifiers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f9fafb', borderRadius: '8px' }}>No identifiers configured</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {typeIdentifiers.map((id) => (
                      <div key={id.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: id.identifier_type === 'form_text' ? '#dbeafe' : '#dcfce7', color: id.identifier_type === 'form_text' ? '#1d4ed8' : '#166534', borderRadius: '4px', fontWeight: 600 }}>{id.identifier_type}</span>
                        <span style={{ fontSize: '13px', color: '#374151' }}>"{id.value}"</span>
                        <button onClick={() => handleDeleteIdentifier(id.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extraction Fields Section */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>Extraction Fields for {selectedType.name}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Fields the AI will extract from this document type</p>
                  </div>
                  <button onClick={() => setShowAddFieldModal(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add Field</button>
                </div>

                {detailLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                ) : typeFields.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f9fafb', borderRadius: '8px' }}>No extraction fields configured</div>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Field Name</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Key</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Type</th>
                          <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Required</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeFields.map((field) => (
                          <tr key={field.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0a0f1a' }}>{field.field_name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>{field.field_key}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '12px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px', color: '#374151' }}>{field.field_type}</span>
                              {field.format && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>({field.format})</span>}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {field.is_required ? <span style={{ color: '#16a34a' }}>✓</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteField(field.id)} style={{ padding: '4px 10px', background: '#fef2f2', border: 'none', borderRadius: '4px', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD DOCUMENT TYPE MODAL */}
      {showAddTypeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddTypeModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', margin: '20px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add Document Type</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Name *</label>
                <input type="text" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="Prior Authorization Form" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Slug *</label>
                <input type="text" value={newType.slug} onChange={e => setNewType({ ...newType, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="prior-auth-form" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Description</label>
                <textarea value={newType.description} onChange={e => setNewType({ ...newType, description: e.target.value })} placeholder="Description of this document type..." rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowAddTypeModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddType} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add Type</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FIELD MODAL */}
      {showAddFieldModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddFieldModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', margin: '20px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add Extraction Field</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Field Name *</label>
                <input type="text" value={newField.fieldName} onChange={e => setNewField({ ...newField, fieldName: e.target.value, fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') })} placeholder="Patient Name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Field Key *</label>
                <input type="text" value={newField.fieldKey} onChange={e => setNewField({ ...newField, fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="patient_name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Type</label>
                  <select value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                    <option value="string">String</option>
                    <option value="date">Date</option>
                    <option value="currency">Currency</option>
                    <option value="number">Number</option>
                    <option value="array">Array</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Format</label>
                  <input type="text" value={newField.format} onChange={e => setNewField({ ...newField, format: e.target.value })} placeholder="MM/DD/YYYY" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={newField.isRequired} onChange={e => setNewField({ ...newField, isRequired: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px' }}>Required field</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowAddFieldModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddField} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add Field</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD IDENTIFIER MODAL */}
      {showAddIdentifierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddIdentifierModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', margin: '20px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add AI Identifier</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Identifier Type</label>
                <select value={newIdentifier.identifierType} onChange={e => setNewIdentifier({ ...newIdentifier, identifierType: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                  <option value="form_text">Form Text (exact text on document)</option>
                  <option value="field_presence">Field Presence (field that exists)</option>
                  <option value="layout_pattern">Layout Pattern (structural hint)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Value *</label>
                <input type="text" value={newIdentifier.value} onChange={e => setNewIdentifier({ ...newIdentifier, value: e.target.value })} placeholder={newIdentifier.identifierType === 'form_text' ? 'HEALTH INSURANCE CLAIM FORM' : 'DIAGNOSIS CODES'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  {newIdentifier.identifierType === 'form_text' && 'Text that appears on this document type (e.g., "CMS-1500", "UB-04")'}
                  {newIdentifier.identifierType === 'field_presence' && 'A field/label that uniquely exists on this document type'}
                  {newIdentifier.identifierType === 'layout_pattern' && 'A structural pattern unique to this document type'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowAddIdentifierModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddIdentifier} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add Identifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
