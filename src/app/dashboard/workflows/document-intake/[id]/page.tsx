'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(p => setDocumentId(p.id));
  }, [params]);

  // Fetch document when we have the ID
  useEffect(() => {
    if (!documentId) return;
    
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/db/documents/${documentId}`);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();
        setDocument(data);

        // Try to get S3 signed URL
        if (data.s3_key) {
          try {
            const urlResponse = await fetch(`/api/s3/signed-url?key=${encodeURIComponent(data.s3_key)}`);
            if (urlResponse.ok) {
              const urlData = await urlResponse.json();
              setImageUrl(urlData.url);
            }
          } catch (e) {
            console.error('S3 error:', e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading || !documentId) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading document...</p>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Document not found'}</p>
        <button 
          onClick={() => router.push('/dashboard/workflows/document-intake')} 
          style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // Parse extracted data safely
  let extractedData: Record<string, any> = {};
  try {
    if (document.extracted_data) {
      extractedData = typeof document.extracted_data === 'string' 
        ? JSON.parse(document.extracted_data) 
        : document.extracted_data;
      if (extractedData.extracted) {
        extractedData = extractedData.extracted;
      }
    }
  } catch (e) {
    console.error('Parse error:', e);
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/workflows/document-intake')}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}
        >
          ← Back to Document Intake
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{document.original_filename || `Document #${document.id}`}</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>Processed {formatDate(document.processed_at || document.created_at)}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ padding: '6px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '14px', fontWeight: 500 }}>
              {document.document_type || 'Unknown'}
            </span>
            <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontSize: '14px', fontWeight: 500 }}>
              {document.confidence_score || 0}% Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Original Document */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📄 Original Document</h3>
          <div style={{ background: '#f8fafc', borderRadius: '8px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageUrl ? (
              <img src={imageUrl} alt="Document" style={{ maxWidth: '100%', maxHeight: '500px' }} />
            ) : (
              <p style={{ color: '#64748b' }}>Image not available</p>
            )}
          </div>
        </div>

        {/* Extracted Data */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📋 Extracted Data</h3>
          
          {Object.keys(extractedData).length > 0 ? (
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              {/* Patient Info */}
              {(extractedData.patient_name || extractedData.dob || extractedData.member_id) && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>PATIENT</h4>
                  {extractedData.patient_name && <p style={{ margin: '8px 0' }}><strong>Name:</strong> {extractedData.patient_name}</p>}
                  {extractedData.dob && <p style={{ margin: '8px 0' }}><strong>DOB:</strong> {extractedData.dob}</p>}
                  {extractedData.member_id && <p style={{ margin: '8px 0' }}><strong>Member ID:</strong> {extractedData.member_id}</p>}
                  {extractedData.address && <p style={{ margin: '8px 0' }}><strong>Address:</strong> {extractedData.address}</p>}
                </div>
              )}

              {/* Insurance */}
              {(extractedData.insurance_name || extractedData.group_number) && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>INSURANCE</h4>
                  {extractedData.insurance_name && <p style={{ margin: '8px 0' }}><strong>Payer:</strong> {extractedData.insurance_name}</p>}
                  {extractedData.group_number && <p style={{ margin: '8px 0' }}><strong>Group:</strong> {extractedData.group_number}</p>}
                </div>
              )}

              {/* Provider */}
              {(extractedData.provider_name || extractedData.npi) && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>PROVIDER</h4>
                  {extractedData.provider_name && <p style={{ margin: '8px 0' }}><strong>Name:</strong> {extractedData.provider_name}</p>}
                  {extractedData.npi && <p style={{ margin: '8px 0' }}><strong>NPI:</strong> {extractedData.npi}</p>}
                </div>
              )}

              {/* Diagnoses */}
              {extractedData.diagnoses && Array.isArray(extractedData.diagnoses) && extractedData.diagnoses.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>DIAGNOSIS CODES</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {extractedData.diagnoses.map((code: string, i: number) => (
                      <span key={i} style={{ padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Procedures */}
              {extractedData.procedures && Array.isArray(extractedData.procedures) && extractedData.procedures.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>PROCEDURES</h4>
                  {extractedData.procedures.map((proc: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0fdf4', borderRadius: '4px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{proc.cpt || proc.code || JSON.stringify(proc)}</span>
                      {proc.charges && <span style={{ color: '#16a34a', fontWeight: 600 }}>${proc.charges}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              {extractedData.total_charges && (
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Total Charges</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>${extractedData.total_charges}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No extracted data available</p>
          )}
        </div>
      </div>

      {/* Raw JSON */}
      <details style={{ marginTop: '24px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>View Raw JSON</summary>
        <pre style={{ marginTop: '16px', padding: '16px', background: '#1e293b', color: '#e2e8f0', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(extractedData, null, 2)}
        </pre>
      </details>
    </div>
  );
}
