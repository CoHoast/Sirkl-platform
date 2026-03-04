'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UploadMethod = 'upload' | 'paste' | 'manual' | null;
type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface ExtractedData {
  name: string;
  dob: string;
  phone: string;
  address: string;
  insurance: string;
  policyNumber: string;
  diagnosis: string[];
  medications: string[];
  allergies: string[];
  physician: string;
  facility: string;
  services: string[];
  notes: string;
  confidence: number;
  aiSummary: string;
}

export default function NewApplicationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [method, setMethod] = useState<UploadMethod>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  
  // Manual Entry Form State
  const [manualData, setManualData] = useState({
    name: '',
    dob: '',
    phone: '',
    address: '',
    insurance: '',
    policyNumber: '',
    diagnosis: '',
    medications: '',
    allergies: '',
    physician: '',
    facility: '',
    services: '',
    notes: ''
  });

  // Simulated AI extraction (in production, this would call DOKit API)
  const simulateAIExtraction = async () => {
    setStatus('processing');
    
    const steps = [
      'Analyzing document structure...',
      'Running OCR on scanned content...',
      'Extracting patient information...',
      'Identifying medical data...',
      'Verifying insurance details...',
      'Generating AI summary...',
      'Calculating confidence score...'
    ];

    for (const step of steps) {
      setProcessingStep(step);
      await new Promise(r => setTimeout(r, 600));
    }

    // Mock extracted data
    setExtractedData({
      name: 'James Mitchell',
      dob: '05/22/1939',
      phone: '(248) 555-0187',
      address: '456 Elm Street, Troy, MI 48083',
      insurance: 'Medicare Part A & B',
      policyNumber: '2KG7-RV3-PN84',
      diagnosis: ['Parkinson\'s Disease', 'Mild Cognitive Impairment', 'Hypertension'],
      medications: ['Carbidopa-Levodopa 25-100mg', 'Amlodipine 5mg', 'Memantine 10mg'],
      allergies: ['Codeine'],
      physician: 'Dr. Amanda Foster, MD',
      facility: 'MCO Advantage of Grand Rapids',
      services: ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy'],
      notes: 'Patient referred from Spectrum Health. Requires assistance with mobility and ADLs. Family actively involved in care planning.',
      confidence: 91,
      aiSummary: '86-year-old male with Parkinson\'s disease and mild cognitive impairment, referred from Spectrum Health following a fall resulting in hip fracture (surgically repaired). Requires skilled nursing care for post-surgical rehabilitation, physical therapy for mobility restoration, and occupational therapy for ADL retraining. Hypertension well-controlled on current medication. Cognitive status allows for participation in therapy. Family engaged and supportive. Estimated rehab duration: 4-6 weeks. Medicare coverage verified for skilled nursing level of care.'
    });

    setStatus('complete');
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
      setMethod('upload');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmitUpload = async () => {
    if (files.length === 0) return;
    setStatus('uploading');
    await new Promise(r => setTimeout(r, 1000));
    await simulateAIExtraction();
  };

  const handleSubmitPaste = async () => {
    if (!pastedText.trim()) return;
    setStatus('uploading');
    await new Promise(r => setTimeout(r, 500));
    await simulateAIExtraction();
  };

  const handleCreateApplication = () => {
    // In production, this would save to database
    alert('Application created successfully!');
    router.push('/dashboard/applications');
  };

  const handleStartOver = () => {
    setMethod(null);
    setStatus('idle');
    setFiles([]);
    setPastedText('');
    setExtractedData(null);
    setProcessingStep('');
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link href="/dashboard/applications" style={{ 
          width: '40px', height: '40px', borderRadius: '8px', background: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textDecoration: 'none'
        }}>
          <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>New Application</h1>
          <p style={{ color: '#666' }}>Upload documents or paste text for AI extraction</p>
        </div>
      </div>

      {/* Status: Idle - Show method selection */}
      {status === 'idle' && !method && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', maxWidth: '1100px' }}>
          {/* Upload Option */}
          <button
            onClick={() => setMethod('upload')}
            style={{
              padding: '32px',
              background: 'white',
              border: '2px dashed #e0e0e0',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0a0f1a';
              e.currentTarget.style.background = '#f9f7f4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.background = 'white';
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(39,83,128,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="28" height="28" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>Upload Documents</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
              Upload PDF, Word, or image files
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['PDF', 'DOCX', 'JPG', 'PNG'].map(fmt => (
                <span key={fmt} style={{
                  padding: '3px 8px',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#666'
                }}>{fmt}</span>
              ))}
            </div>
          </button>

          {/* Paste Option */}
          <button
            onClick={() => setMethod('paste')}
            style={{
              padding: '32px',
              background: 'white',
              border: '2px dashed #e0e0e0',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0a0f1a';
              e.currentTarget.style.background = '#f9f7f4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.background = 'white';
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(39,83,128,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="28" height="28" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>Paste Text</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
              Copy & paste from email, fax, or notes
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Email', 'Fax', 'Notes'].map(fmt => (
                <span key={fmt} style={{
                  padding: '3px 8px',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#666'
                }}>{fmt}</span>
              ))}
            </div>
          </button>

          {/* Manual Entry Option */}
          <button
            onClick={() => setMethod('manual')}
            style={{
              padding: '32px',
              background: 'white',
              border: '2px dashed #e0e0e0',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.background = '#fffbeb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.background = 'white';
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(245,158,11,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>Manual Entry</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
              Enter patient info directly
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['No AI', 'Fallback'].map(fmt => (
                <span key={fmt} style={{
                  padding: '3px 8px',
                  background: '#fef3c7',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#92400e'
                }}>{fmt}</span>
              ))}
            </div>
          </button>
        </div>
      )}

      {/* Upload Method Selected */}
      {status === 'idle' && method === 'upload' && (
        <div style={{ maxWidth: '700px' }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '60px 40px',
              background: dragActive ? 'rgba(39,83,128,0.05)' : 'white',
              border: `2px dashed ${dragActive ? '#0a0f1a' : '#e0e0e0'}`,
              borderRadius: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '24px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '72px', height: '72px', borderRadius: '16px',
              background: 'rgba(39,83,128,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="36" height="36" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {dragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>or click to browse</p>
            <p style={{ color: '#888', fontSize: '13px' }}>
              Supports PDF, Word (DOCX), JPEG, PNG, TIFF
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
                Selected Files ({files.length})
              </h4>
              {files.map((file, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: '#f9f7f4',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ flex: 1, fontWeight: 500 }}>{file.name}</span>
                  <span style={{ color: '#888', fontSize: '13px' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles(files.filter((_, idx) => idx !== i));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setMethod(null); setFiles([]); }}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Back
            </button>
            <button
              onClick={handleSubmitUpload}
              disabled={files.length === 0}
              style={{
                padding: '12px 32px',
                background: files.length > 0 ? '#0a0f1a' : '#e0e0e0',
                color: files.length > 0 ? 'white' : '#888',
                border: 'none',
                borderRadius: '8px',
                cursor: files.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2"/>
              </svg>
              Process with AI
            </button>
          </div>
        </div>
      )}

      {/* Paste Method Selected */}
      {status === 'idle' && method === 'paste' && (
        <div style={{ maxWidth: '700px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              Paste Application Content
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Paste the raw text from an email, fax transcription, or referral notes. 
              Our AI will extract all relevant patient and medical information.
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste referral email, fax content, or notes here...

Example:
From: Dr. Smith's Office
Subject: Patient Referral - John Doe

Patient Name: John Doe
DOB: 01/15/1940
Diagnosis: CHF, Type 2 Diabetes
Current Medications: Metformin 500mg, Lasix 40mg
Insurance: Medicare
Requesting: Skilled Nursing, Physical Therapy

Please contact family at (248) 555-0123..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: 1.6,
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#888' }}>
              {pastedText.length} characters
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setMethod(null); setPastedText(''); }}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Back
            </button>
            <button
              onClick={handleSubmitPaste}
              disabled={!pastedText.trim()}
              style={{
                padding: '12px 32px',
                background: pastedText.trim() ? '#0a0f1a' : '#e0e0e0',
                color: pastedText.trim() ? 'white' : '#888',
                border: 'none',
                borderRadius: '8px',
                cursor: pastedText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2"/>
              </svg>
              Process with AI
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Method Selected */}
      {status === 'idle' && method === 'manual' && (
        <div style={{ maxWidth: '900px' }}>
          {/* Info Banner */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="24" height="24" fill="none" stroke="#92400e" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600, color: '#92400e' }}>Manual Entry Mode</div>
              <div style={{ fontSize: '14px', color: '#a16207' }}>
                Enter patient information directly without AI processing. This is a fallback option when AI is unavailable.
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Patient Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={manualData.name}
                  onChange={(e) => setManualData({...manualData, name: e.target.value})}
                  placeholder="Full name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Date of Birth *
                </label>
                <input
                  type="text"
                  value={manualData.dob}
                  onChange={(e) => setManualData({...manualData, dob: e.target.value})}
                  placeholder="MM/DD/YYYY"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={manualData.phone}
                  onChange={(e) => setManualData({...manualData, phone: e.target.value})}
                  placeholder="(XXX) XXX-XXXX"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={manualData.address}
                  onChange={(e) => setManualData({...manualData, address: e.target.value})}
                  placeholder="Full address"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>Insurance Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={manualData.insurance}
                  onChange={(e) => setManualData({...manualData, insurance: e.target.value})}
                  placeholder="e.g., Medicare, Blue Cross"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Policy Number
                </label>
                <input
                  type="text"
                  value={manualData.policyNumber}
                  onChange={(e) => setManualData({...manualData, policyNumber: e.target.value})}
                  placeholder="Policy/Member ID"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>Medical Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Diagnosis (separate with commas)
                </label>
                <input
                  type="text"
                  value={manualData.diagnosis}
                  onChange={(e) => setManualData({...manualData, diagnosis: e.target.value})}
                  placeholder="e.g., CHF, Diabetes, Hypertension"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Medications (separate with commas)
                </label>
                <input
                  type="text"
                  value={manualData.medications}
                  onChange={(e) => setManualData({...manualData, medications: e.target.value})}
                  placeholder="e.g., Metformin 500mg, Lasix 40mg"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Allergies (separate with commas)
                </label>
                <input
                  type="text"
                  value={manualData.allergies}
                  onChange={(e) => setManualData({...manualData, allergies: e.target.value})}
                  placeholder="e.g., Penicillin, Sulfa"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>Referral Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Referring Physician
                </label>
                <input
                  type="text"
                  value={manualData.physician}
                  onChange={(e) => setManualData({...manualData, physician: e.target.value})}
                  placeholder="Dr. name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                  Facility
                </label>
                <input
                  type="text"
                  value={manualData.facility}
                  onChange={(e) => setManualData({...manualData, facility: e.target.value})}
                  placeholder="Requested facility"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                Requested Services (separate with commas)
              </label>
              <input
                type="text"
                value={manualData.services}
                onChange={(e) => setManualData({...manualData, services: e.target.value})}
                placeholder="e.g., Skilled Nursing, Physical Therapy, Occupational Therapy"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#666', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                value={manualData.notes}
                onChange={(e) => setManualData({...manualData, notes: e.target.value})}
                placeholder="Additional notes or information..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px 14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => { 
                setMethod(null); 
                setManualData({
                  name: '', dob: '', phone: '', address: '',
                  insurance: '', policyNumber: '',
                  diagnosis: '', medications: '', allergies: '',
                  physician: '', facility: '', services: '', notes: ''
                });
              }}
              style={{
                padding: '14px 28px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Back
            </button>
            <button
              onClick={() => {
                // Save manual entry as new application
                alert('Application saved successfully!');
                router.push('/dashboard/applications');
              }}
              disabled={!manualData.name.trim() || !manualData.dob.trim()}
              style={{
                padding: '14px 32px',
                background: (manualData.name.trim() && manualData.dob.trim()) ? '#16a34a' : '#e0e0e0',
                color: (manualData.name.trim() && manualData.dob.trim()) ? 'white' : '#888',
                border: 'none',
                borderRadius: '8px',
                cursor: (manualData.name.trim() && manualData.dob.trim()) ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save to Applications
            </button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {(status === 'uploading' || status === 'processing') && (
        <div style={{
          maxWidth: '500px',
          margin: '60px auto',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #0a0f1a 0%, #060912 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <svg width="40" height="40" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>
            {status === 'uploading' ? 'Uploading...' : 'AI Processing'}
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {processingStep || 'Preparing documents...'}
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e0e0e0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: status === 'uploading' ? '20%' : '70%',
              height: '100%',
              background: 'linear-gradient(90deg, #0a0f1a, #3a7ca5)',
              borderRadius: '2px',
              transition: 'width 0.5s ease',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            @keyframes loading {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {/* Extraction Complete - Show Results */}
      {status === 'complete' && extractedData && (
        <div>
          {/* Success Banner */}
          <div style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '12px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>AI Extraction Complete</div>
              <div style={{ fontSize: '14px', color: '#15803d' }}>
                Review the extracted information below and create the application
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              background: '#166534',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {extractedData.confidence}% confidence
            </div>
          </div>

          {/* AI Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #0a0f1a 0%, #060912 100%)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2"/>
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>AI Medical Summary</h3>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.7, opacity: 0.95 }}>
              {extractedData.aiSummary}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Patient Info */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Patient Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Full Name</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Date of Birth</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.dob}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Address</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.address}</div>
                </div>
              </div>
            </div>

            {/* Insurance & Facility */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Insurance & Facility</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Insurance</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.insurance}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Policy Number</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.policyNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Referring Physician</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.physician}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Requested Facility</div>
                  <div style={{ fontWeight: 500 }}>{extractedData.facility}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Medical Information</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Diagnosis</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {extractedData.diagnosis.map((d, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: '20px', fontSize: '13px' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Medications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {extractedData.medications.map((m, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '13px' }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Allergies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {extractedData.allergies.map((a, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: '#fef9c3', color: '#854d0e', borderRadius: '20px', fontSize: '13px' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Requested Services</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {extractedData.services.map((s, i) => (
                  <span key={i} style={{ padding: '6px 12px', background: 'rgba(39,83,128,0.1)', color: '#0a0f1a', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleStartOver}
              style={{
                padding: '14px 28px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Start Over
            </button>
            <button
              onClick={handleCreateApplication}
              style={{
                padding: '14px 32px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Create Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
