'use client';

import { useClient } from '@/context/ClientContext';
import Link from 'next/link';

export default function DocumentTypesPage() {
  const { selectedClient } = useClient();

  if (!selectedClient) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#0a0f1a', marginBottom: '16px' }}>No Client Selected</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please select a client to view document types.</p>
        <Link href="/dashboard" style={{ color: '#00d4ff' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  const documentTypes = selectedClient.documentTypes || [];

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
          <span style={{ color: '#00d4ff', fontWeight: 500 }}>Document Types</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Document Types</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Document classification identifiers for the AI. When documents are scanned, the AI uses these types to classify and extract relevant data.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Document Types</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#00d4ff' }}>{documentTypes.length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Extraction Fields</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#0a0f1a' }}>
            {documentTypes.reduce((acc, dt) => acc + dt.extractionFields.length, 0)}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Avg Fields per Type</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#0a0f1a' }}>
            {Math.round(documentTypes.reduce((acc, dt) => acc + dt.extractionFields.length, 0) / documentTypes.length)}
          </p>
        </div>
      </div>

      {/* Document Types List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {documentTypes.map(docType => (
          <div key={docType.id} style={{ 
            background: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '10px',
                    background: 'rgba(0, 212, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="24" height="24" fill="none" stroke="#00d4ff" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0a0f1a', marginBottom: '4px' }}>{docType.name}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>{docType.description}</p>
                  </div>
                </div>
                <div style={{ 
                  background: '#f3f4f6', 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                }}>
                  {docType.code}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Extraction Fields ({docType.extractionFields.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {docType.extractionFields.map((field, index) => (
                    <span 
                      key={index}
                      style={{ 
                        background: '#f0f9ff', 
                        color: '#0369a1', 
                        padding: '6px 12px', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '24px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <svg width="24" height="24" fill="none" stroke="#0284c7" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0c4a6e', marginBottom: '4px' }}>How Document Classification Works</h4>
            <p style={{ fontSize: '13px', color: '#0369a1', lineHeight: 1.6 }}>
              When documents are retrieved from the FTP server, the AI analyzes each image to determine its type using these classifications. 
              Once classified, the AI extracts the defined fields and sends the data to the MCO system along with the original scanned image.
              The <strong>Code</strong> is the identifier sent to MCO's imaging system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
