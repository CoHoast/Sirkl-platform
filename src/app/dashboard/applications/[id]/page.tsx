'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = 'https://mco-advantage-api-production.up.railway.app';

const mockApplications: Record<string, {
  id: string;
  name: string;
  initials: string;
  facility: string;
  status: string;
  date: string;
  priority: string;
  source: string;
  dob: string;
  phone: string;
  address: string;
  insurance: string;
  policyNumber: string;
  diagnosis: string[];
  medications: string[];
  allergies: string[];
  physician: string;
  services: string[];
  documents: { name: string; type: string; rawUrl: string; extractedUrl: string }[];
  notes: string;
  confidence: number;
  aiSummary: string;
  extraData?: Record<string, any> | null;
}> = {
  'APP-2026-004': {
    id: 'APP-2026-004', name: 'Mary Johnson', initials: 'MJ', facility: 'MCO Advantage of Grand Rapids',
    status: 'pending', date: '2/25/2026', priority: 'high', source: 'Email (AI Intake)',
    dob: '06/15/1941', phone: '(248) 555-0188', address: '456 Oak Lane, Troy, MI 48084',
    insurance: 'Medicare Part A & B', policyNumber: '1AB2-CD3-EF45',
    diagnosis: ['CHF', 'COPD', 'Type 2 Diabetes'],
    medications: ['Lasix 40mg', 'Metformin 500mg', 'Spiriva'],
    allergies: ['Penicillin'],
    physician: 'Dr. Smith (Dr. Guiher\'s Office)', services: ['Skilled Nursing', 'Respiratory Therapy'],
    documents: [
      { name: 'Email_Referral.pdf', type: 'Application', rawUrl: '/documents/raw-intake-scan.html', extractedUrl: '/documents/intake-form-APP-2026-001.html' }
    ],
    notes: 'URGENT: Patient discharging tomorrow. Received via AI email intake from rewindtriviagames@gmail.com.',
    confidence: 95,
    aiSummary: 'Mary Johnson, a patient with CHF, COPD, and Type 2 Diabetes, is being referred for Skilled Nursing and Respiratory Therapy from Dr. Guiher\'s Office. The patient is discharging tomorrow and requires immediate processing. Insurance verified - Medicare Part A & B coverage confirmed.'
  },
  'APP-2026-001': {
    id: 'APP-2026-001', name: 'Margaret Thompson', initials: 'MT', facility: 'Cranberry Park at West Bloomfield',
    status: 'pending', date: '2/24/2026', priority: 'high', source: 'Hospital Referral',
    dob: '03/15/1942', phone: '(248) 555-0123', address: '1234 Oak Street, Bloomfield Hills, MI 48301',
    insurance: 'Medicare Part A & B', policyNumber: '1EG4-TE5-MK72',
    diagnosis: ['Dementia', 'Hypertension', 'Type 2 Diabetes'],
    medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Donepezil 5mg'],
    allergies: ['Penicillin', 'Sulfa'],
    physician: 'Dr. Robert Chen, MD', services: ['Memory Care', 'Medication Management', 'Physical Therapy'],
    documents: [
      { name: 'Intake_Form.pdf', type: 'Application', rawUrl: '/documents/raw-intake-scan.html', extractedUrl: '/documents/intake-form-APP-2026-001.html' },
      { name: 'Insurance_Verification.pdf', type: 'Insurance', rawUrl: '/documents/raw-insurance-email.html', extractedUrl: '/documents/insurance-verification-APP-2026-001.html' },
      { name: 'Medical_Records.pdf', type: 'Medical', rawUrl: '/documents/raw-medical-records.html', extractedUrl: '/documents/medical-records-APP-2026-001.html' }
    ],
    notes: 'Patient being discharged from Beaumont Hospital. Family requesting urgent placement.',
    confidence: 94,
    aiSummary: '83-year-old female with progressive dementia, well-controlled hypertension, and Type 2 diabetes managed with oral medication. Currently hospitalized at Beaumont, medically stable and cleared for discharge. Family seeking memory care placement with 24/7 supervision. Patient requires assistance with ADLs and medication management. Cognitive assessment indicates moderate dementia with preserved mobility. Good candidate for memory care unit with structured activities program. No behavioral concerns noted. Insurance verified - Medicare coverage confirmed for skilled nursing level of care.'
  },
  'APP-2026-002': {
    id: 'APP-2026-002', name: 'Robert Williams', initials: 'RW', facility: 'MCO Advantage of Grand Rapids',
    status: 'review', date: '2/24/2026', priority: 'medium', source: 'Website',
    dob: '07/22/1938', phone: '(616) 555-0456', address: '567 Maple Ave, Grand Rapids, MI 49503',
    insurance: 'Blue Cross Blue Shield', policyNumber: 'XYZ123456789',
    diagnosis: ['COPD', 'Congestive Heart Failure'],
    medications: ['Lasix 40mg', 'Metoprolol 25mg', 'Spiriva'],
    allergies: ['None known'],
    physician: 'Dr. Sarah Johnson, MD', services: ['Skilled Nursing', 'Respiratory Therapy', 'Cardiac Rehab'],
    documents: [
      { name: 'Intake_Form.pdf', type: 'Application', rawUrl: '/documents/raw-intake-scan.html', extractedUrl: '/documents/intake-form-APP-2026-001.html' },
      { name: 'Insurance_Verification.pdf', type: 'Insurance', rawUrl: '/documents/raw-insurance-email.html', extractedUrl: '/documents/insurance-verification-APP-2026-001.html' }
    ],
    notes: 'Insurance verification pending. Awaiting pre-authorization.',
    confidence: 87,
    aiSummary: '87-year-old male with chronic COPD and compensated CHF, recently hospitalized for acute exacerbation. Requires supplemental oxygen (2L NC) and nebulizer treatments. Cardiac function stable with current medication regimen. Needs skilled nursing for respiratory therapy and cardiac monitoring during recovery. Estimated rehab duration: 3-4 weeks. Insurance pre-authorization pending - BCBS requires additional documentation for skilled nursing level. Recommend follow-up with pulmonology within 2 weeks of admission.'
  },
  'APP-2026-003': {
    id: 'APP-2026-003', name: 'Dorothy Martinez', initials: 'DM', facility: 'Cranberry Park at Milford',
    status: 'approved', date: '2/24/2026', priority: 'normal', source: 'Email',
    dob: '11/08/1945', phone: '(248) 555-0789', address: '890 Pine Road, Milford, MI 48381',
    insurance: 'Medicare Advantage - Humana', policyNumber: 'H1234567890',
    diagnosis: ['Mild Cognitive Impairment', 'Osteoarthritis'],
    medications: ['Celebrex 200mg', 'Aricept 10mg', 'Vitamin D 1000IU'],
    allergies: ['Aspirin'],
    physician: 'Dr. Michael Brown, DO', services: ['Assisted Living', 'Memory Support', 'Occupational Therapy'],
    documents: [
      { name: 'Complete_Application.pdf', type: 'Application', rawUrl: '/documents/raw-intake-scan.html', extractedUrl: '/documents/intake-form-APP-2026-001.html' },
      { name: 'Medical_History.pdf', type: 'Medical', rawUrl: '/documents/raw-medical-records.html', extractedUrl: '/documents/medical-records-APP-2026-001.html' },
      { name: 'Insurance_Card.pdf', type: 'Insurance', rawUrl: '/documents/raw-insurance-email.html', extractedUrl: '/documents/insurance-verification-APP-2026-001.html' }
    ],
    notes: 'All documentation complete. Family tour completed 2/22. Move-in scheduled for 3/1.',
    confidence: 96,
    aiSummary: '80-year-old female with mild cognitive impairment (MCI) and moderate osteoarthritis affecting mobility. Lives alone, family concerned about safety and medication compliance. Cognitively appropriate for assisted living with memory support services. Independent with most ADLs but needs supervision for medication management and meal preparation. Would benefit from structured daily activities and social engagement. OT recommended for joint protection strategies. Excellent candidate for assisted living - all documentation complete, insurance verified, family engaged in care planning.'
  }
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [applicationNotes, setApplicationNotes] = useState<{text: string; author: string; time: string}[]>([]);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{name: string; type: string; rawUrl: string; extractedUrl: string} | null>(null);
  const [docViewTab, setDocViewTab] = useState<'original' | 'extracted'>('original');
  
  const [apiApp, setApiApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExtraData, setShowExtraData] = useState(false);

  // Fetch from API first, fall back to mock data
  useEffect(() => {
    fetch(`${API_URL}/api/applications/${params.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setApiApp(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  // Use API data if available, otherwise fall back to mock
  const mockApp = mockApplications[params.id as string] || mockApplications['APP-2026-001'];
  
  // For API-sourced applications, create documents pointing to API endpoints
  const apiDocuments = apiApp ? [
    { 
      name: apiApp.raw_email_subject || 'Intake Document', 
      type: 'Application', 
      rawUrl: `${API_URL}/api/applications/${apiApp.id}/document/original`,
      extractedUrl: `${API_URL}/api/applications/${apiApp.id}/document/extracted`
    }
  ] : [];
  
  // Helper: use API value if present, otherwise null (NOT mock data) for real apps
  // This prevents fabricated data from appearing
  const apiValue = <T,>(apiVal: T | null | undefined, mockVal: T): T | null => {
    // For API apps, return API value (even if null) - don't fall back to mock
    return apiVal !== undefined ? (apiVal as T | null) : null;
  };

  const app = apiApp ? {
    ...mockApp,
    id: apiApp.id,
    name: apiApp.patient_name || 'Unknown Patient',
    initials: (apiApp.patient_name || 'UP').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
    facility: apiApp.facility || 'MCO Advantage',
    status: apiApp.status || 'pending',
    date: apiApp.created_at ? new Date(apiApp.created_at).toLocaleDateString() : mockApp.date,
    priority: apiApp.priority || 'normal',
    source: apiApp.source || 'Unknown',
    dob: apiApp.dob || null,
    phone: apiApp.phone || null,  // Don't fall back to mock - show null if not in original
    address: apiApp.address || null,  // Don't fall back to mock - show null if not in original
    insurance: apiApp.insurance || null,
    policyNumber: apiApp.policy_number || null,
    diagnosis: apiApp.diagnosis || [],
    medications: apiApp.medications || [],
    allergies: apiApp.allergies || [],
    physician: apiApp.physician || null,
    services: apiApp.services || [],
    confidence: apiApp.confidence_score || 50,
    aiSummary: apiApp.ai_summary || 'AI summary not available.',
    notes: apiApp.raw_text ? `Source: ${apiApp.source_email || 'Email'}\n\nOriginal content preview:\n${apiApp.raw_text.substring(0, 200)}...` : mockApp.notes,
    documents: apiDocuments.length > 0 ? apiDocuments : mockApp.documents,
    extraData: apiApp.extra_data ? (typeof apiApp.extra_data === 'string' ? JSON.parse(apiApp.extra_data) : apiApp.extra_data) : null
  } : mockApp;

  // Editable state for extracted data
  const [editedData, setEditedData] = useState({
    name: app.name,
    dob: app.dob,
    phone: app.phone,
    address: app.address,
    facility: app.facility,
    insurance: app.insurance,
    policyNumber: app.policyNumber,
    diagnosis: [...app.diagnosis],
    medications: [...app.medications],
    allergies: [...app.allergies],
    physician: app.physician,
    services: [...app.services],
    customFields: [] as {label: string; value: string}[]
  });

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleDecision = (type: string) => {
    setDecision(type);
    setShowModal(true);
  };

  const submitDecision = async () => {
    try {
      // Update status via API
      const response = await fetch(`${API_URL}/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          decision_notes: decisionNotes
        })
      });
      
      if (response.ok && apiApp) {
        setApiApp({ ...apiApp, status: decision });
      }
    } catch (error) {
      console.error('Error updating decision:', error);
    }
    
    setShowModal(false);
    router.push('/dashboard/applications');
  };

  const handleSaveEdits = async () => {
    try {
      // Save edits to API and auto-move to review status
      const response = await fetch(`${API_URL}/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedData,
          status: 'review' // Auto-move to Review tab after editing
        })
      });
      
      if (response.ok) {
        // Update local state
        if (apiApp) {
          setApiApp({ ...apiApp, status: 'review' });
        }
        setIsEditing(false);
      } else {
        // Still close editing even if API fails (mock data)
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      setIsEditing(false);
    }
  };

  const addCustomField = () => {
    if (newFieldLabel && newFieldValue) {
      setEditedData({
        ...editedData,
        customFields: [...editedData.customFields, { label: newFieldLabel, value: newFieldValue }]
      });
      setNewFieldLabel('');
      setNewFieldValue('');
      setShowAddField(false);
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      setApplicationNotes([
        { text: newNote, author: 'John Guiher', time: 'Just now' },
        ...applicationNotes
      ]);
      setNewNote('');
    }
  };

  const addArrayItem = (field: 'diagnosis' | 'medications' | 'allergies' | 'services', value: string) => {
    if (value.trim()) {
      setEditedData({
        ...editedData,
        [field]: [...editedData[field], value.trim()]
      });
    }
  };

  const removeArrayItem = (field: 'diagnosis' | 'medications' | 'allergies' | 'services', index: number) => {
    setEditedData({
      ...editedData,
      [field]: editedData[field].filter((_, i) => i !== index)
    });
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px' }}>{isEditing ? editedData.name : app.name}</h1>
              <span className={`status-badge status-${app.status}`}>
                {app.status === 'pending' && 'Pending'}
                {app.status === 'approved' && 'Approved'}
                {app.status === 'denied' && 'Denied'}
                {app.status === 'review' && 'Needs Review'}
              </span>
            </div>
            <p style={{ color: '#666' }}>{app.id} • {isEditing ? editedData.facility : app.facility}</p>
          </div>
        </div>

        {(app.status === 'pending' || app.status === 'review') && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => handleDecision('approved')} className="btn btn-success">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Approve
            </button>
            <button onClick={() => handleDecision('denied')} className="btn btn-danger">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Deny
            </button>
            <button onClick={() => handleDecision('review')} className="btn btn-warning">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Review
            </button>
          </div>
        )}
      </div>

      {/* AI Summary Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0a0f1a 0%, #060912 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'rgba(255,255,255,0.2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>AI Medical Summary</h3>
              <span style={{ 
                padding: '2px 8px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '10px', 
                fontSize: '11px' 
              }}>
                {app.confidence}% confidence
              </span>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.7, opacity: 0.95 }}>{app.aiSummary}</p>
          </div>
        </div>
      </div>

      {/* AI Confidence & Edit Banner */}
      <div style={{ 
        background: isEditing ? '#fef9c3' : 'linear-gradient(135deg, rgba(39,83,128,0.05) 0%, rgba(58,124,165,0.05) 100%)',
        border: isEditing ? '1px solid #fde047' : '1px solid rgba(39,83,128,0.2)',
        borderRadius: '12px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: isEditing ? '#fde047' : 'rgba(39,83,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke={isEditing ? '#854d0e' : '#0a0f1a'} strokeWidth="2" viewBox="0 0 24 24">
              {isEditing ? (
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              ) : (
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              )}
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: isEditing ? '#854d0e' : '#0a0f1a' }}>
              {isEditing ? 'Editing Mode' : 'AI Data Extraction'}
            </div>
            <div style={{ fontSize: '14px', color: isEditing ? '#92400e' : '#666' }}>
              {isEditing ? 'Make changes to any field below' : `Confidence: ${app.confidence}%`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isEditing ? (
            <>
              <button 
                onClick={() => setShowAddField(true)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                + Add Field
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdits}
                style={{ padding: '8px 16px', background: '#0a0f1a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ padding: '8px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
            >
              Edit Extracted Data
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Patient Info */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Patient Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Full Name</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.name} 
                    onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500 }}>{app.name}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Date of Birth</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.dob || ''} 
                    onChange={(e) => setEditedData({...editedData, dob: e.target.value})}
                    placeholder="MM/DD/YYYY"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500, color: app.dob ? 'inherit' : '#9ca3af', fontStyle: app.dob ? 'normal' : 'italic' }}>
                    {app.dob || 'Not provided'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Phone</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.phone || ''} 
                    onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500, color: app.phone ? 'inherit' : '#9ca3af', fontStyle: app.phone ? 'normal' : 'italic' }}>
                    {app.phone || 'Not provided'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Requested Facility</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.facility} 
                    onChange={(e) => setEditedData({...editedData, facility: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500 }}>{app.facility}</div>
                )}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Address</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.address || ''} 
                    onChange={(e) => setEditedData({...editedData, address: e.target.value})}
                    placeholder="Enter address"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500, color: app.address ? 'inherit' : '#9ca3af', fontStyle: app.address ? 'normal' : 'italic' }}>
                    {app.address || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Info */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Insurance Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Primary Insurance</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.insurance || ''} 
                    onChange={(e) => setEditedData({...editedData, insurance: e.target.value})}
                    placeholder="Enter insurance provider"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500, color: app.insurance ? 'inherit' : '#9ca3af', fontStyle: app.insurance ? 'normal' : 'italic' }}>
                    {app.insurance || 'Not provided'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Policy Number</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedData.policyNumber || ''} 
                    onChange={(e) => setEditedData({...editedData, policyNumber: e.target.value})}
                    placeholder="Enter policy number"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontWeight: 500, color: app.policyNumber ? 'inherit' : '#9ca3af', fontStyle: app.policyNumber ? 'normal' : 'italic' }}>
                    {app.policyNumber || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Medical Information
            </h2>
            
            {/* Diagnosis */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Diagnosis</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(isEditing ? editedData.diagnosis : app.diagnosis).map((d: string, i: number) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', 
                    background: '#fee2e2', 
                    color: '#991b1b', 
                    borderRadius: '20px', 
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {d}
                    {isEditing && (
                      <button onClick={() => removeArrayItem('diagnosis', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <svg width="14" height="14" fill="none" stroke="#991b1b" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <input 
                    type="text" 
                    placeholder="Add diagnosis..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('diagnosis', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ padding: '6px 12px', border: '1px dashed #e0e0e0', borderRadius: '20px', fontSize: '13px', width: '150px' }}
                  />
                )}
              </div>
            </div>

            {/* Medications */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Medications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(isEditing ? editedData.medications : app.medications).map((m: string, i: number) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', 
                    background: '#dbeafe', 
                    color: '#1e40af', 
                    borderRadius: '20px', 
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {m}
                    {isEditing && (
                      <button onClick={() => removeArrayItem('medications', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <svg width="14" height="14" fill="none" stroke="#1e40af" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <input 
                    type="text" 
                    placeholder="Add medication..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('medications', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ padding: '6px 12px', border: '1px dashed #e0e0e0', borderRadius: '20px', fontSize: '13px', width: '150px' }}
                  />
                )}
              </div>
            </div>

            {/* Allergies */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Allergies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(isEditing ? editedData.allergies : app.allergies).map((a: string, i: number) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', 
                    background: '#fef9c3', 
                    color: '#854d0e', 
                    borderRadius: '20px', 
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {a}
                    {isEditing && (
                      <button onClick={() => removeArrayItem('allergies', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <svg width="14" height="14" fill="none" stroke="#854d0e" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <input 
                    type="text" 
                    placeholder="Add allergy..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('allergies', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ padding: '6px 12px', border: '1px dashed #e0e0e0', borderRadius: '20px', fontSize: '13px', width: '150px' }}
                  />
                )}
              </div>
            </div>

            {/* Physician */}
            <div style={{ paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Referring Physician</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editedData.physician || ''} 
                  onChange={(e) => setEditedData({...editedData, physician: e.target.value})}
                  placeholder="Enter physician name"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ fontWeight: 500, color: app.physician ? 'inherit' : '#9ca3af', fontStyle: app.physician ? 'normal' : 'italic' }}>
                  {app.physician || 'Not provided'}
                </div>
              )}
            </div>

            {/* Services */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Requested Services</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(isEditing ? editedData.services : app.services).map((s: string, i: number) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', 
                    background: 'rgba(39,83,128,0.1)', 
                    color: '#0a0f1a', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {s}
                    {isEditing && (
                      <button onClick={() => removeArrayItem('services', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <svg width="14" height="14" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <input 
                    type="text" 
                    placeholder="Add service..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('services', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ padding: '6px 12px', border: '1px dashed #e0e0e0', borderRadius: '20px', fontSize: '13px', width: '150px' }}
                  />
                )}
              </div>
            </div>

            {/* Custom Fields */}
            {editedData.customFields.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>Additional Fields</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {editedData.customFields.map((field, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>{field.label}</div>
                      <div style={{ fontWeight: 500 }}>{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Application Details */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Application Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Submitted</span>
                <span style={{ fontWeight: 500 }}>{app.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Source</span>
                <span style={{ fontWeight: 500 }}>{app.source}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Priority</span>
                <span style={{ fontWeight: 500, color: app.priority === 'high' ? '#dc2626' : '#4a4a4a', textTransform: 'capitalize' }}>{app.priority}</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Documents ({app.documents.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {app.documents.map((doc, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setSelectedDoc(doc);
                    setDocViewTab('original');
                    setShowDocViewer(true);
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    background: '#f9f7f4', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f0ebe4'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f9f7f4'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{doc.type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#0a0f1a', fontWeight: 500 }}>View</span>
                    <svg width="18" height="18" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Extracted Data Section */}
          {app.extraData && Object.keys(app.extraData).length > 0 && (
            <div className="card">
              <button
                onClick={() => setShowExtraData(!showExtraData)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'rgba(39,83,128,0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <svg width="16" height="16" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Additional Extracted Data</h3>
                    <p style={{ fontSize: '13px', color: '#888', margin: '2px 0 0 0' }}>
                      {Object.keys(app.extraData).length} additional field(s) found
                    </p>
                  </div>
                </div>
                <svg 
                  width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ transform: showExtraData ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              
              {showExtraData && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    {Object.entries(app.extraData).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
                        return null;
                      }
                      
                      const label = key
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                        .trim();
                      
                      let displayValue: React.ReactNode = '';
                      if (Array.isArray(value)) {
                        displayValue = (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {value.map((item, i) => (
                              <span key={i} style={{ 
                                background: '#f0f0f0', 
                                padding: '4px 10px', 
                                borderRadius: '4px', 
                                fontSize: '13px' 
                              }}>
                                {String(item)}
                              </span>
                            ))}
                          </div>
                        );
                      } else if (typeof value === 'object') {
                        displayValue = <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>;
                      } else {
                        displayValue = <span style={{ color: '#333' }}>{String(value)}</span>;
                      }
                      
                      return (
                        <div key={key} style={{ padding: '12px', background: '#f9f7f4', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '14px' }}>{displayValue}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Notes</h3>
            
            {/* Add Note Input */}
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  resize: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                onClick={addNote}
                disabled={!newNote.trim()}
                style={{ 
                  marginTop: '8px',
                  padding: '8px 16px', 
                  background: newNote.trim() ? '#0a0f1a' : '#e0e0e0', 
                  color: newNote.trim() ? 'white' : '#888',
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: newNote.trim() ? 'pointer' : 'not-allowed', 
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {applicationNotes.map((note, i) => (
                <div key={i} style={{ padding: '12px', background: '#f9f7f4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#4a4a4a', marginBottom: '8px' }}>{note.text}</p>
                  <div style={{ fontSize: '12px', color: '#888' }}>{note.author} • {note.time}</div>
                </div>
              ))}
              {app.notes && (
                <div style={{ padding: '12px', background: '#f9f7f4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#4a4a4a', marginBottom: '8px' }}>{app.notes}</p>
                  <div style={{ fontSize: '12px', color: '#888' }}>System • On submission</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>
              {decision === 'approved' && 'Approve Application'}
              {decision === 'denied' && 'Deny Application'}
              {decision === 'review' && 'Mark for Review'}
            </h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {decision === 'approved' && 'This will approve the application and sync to CRM.'}
              {decision === 'denied' && 'Please provide a reason for denial.'}
              {decision === 'review' && 'This will flag the application for additional review.'}
            </p>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={4}
              placeholder={decision === 'denied' ? 'Reason for denial (required)...' : 'Notes (optional)...'}
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', resize: 'none', marginBottom: '24px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={submitDecision}
                disabled={decision === 'denied' && !decisionNotes}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white',
                  background: decision === 'approved' ? '#16a34a' : decision === 'denied' ? '#dc2626' : '#2563eb',
                  opacity: (decision === 'denied' && !decisionNotes) ? 0.5 : 1
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Field Modal */}
      {showAddField && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Add Custom Field</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Field Label</label>
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="e.g., Emergency Contact"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Field Value</label>
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="e.g., John Smith (248) 555-0100"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddField(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={addCustomField}
                disabled={!newFieldLabel || !newFieldValue}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white',
                  background: '#0a0f1a',
                  opacity: (newFieldLabel && newFieldValue) ? 1 : 0.5
                }}
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocViewer && selectedDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{selectedDoc.name}</h3>
                <p style={{ fontSize: '14px', color: '#666' }}>{selectedDoc.type} Document</p>
              </div>
              <button 
                onClick={() => setShowDocViewer(false)}
                style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '0', flexShrink: 0 }}>
              <button
                onClick={() => setDocViewTab('original')}
                style={{
                  padding: '16px 24px',
                  background: 'none',
                  border: 'none',
                  borderBottom: docViewTab === 'original' ? '3px solid #0a0f1a' : '3px solid transparent',
                  color: docViewTab === 'original' ? '#0a0f1a' : '#666',
                  fontWeight: docViewTab === 'original' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Original Document
              </button>
              <button
                onClick={() => setDocViewTab('extracted')}
                style={{
                  padding: '16px 24px',
                  background: 'none',
                  border: 'none',
                  borderBottom: docViewTab === 'extracted' ? '3px solid #0a0f1a' : '3px solid transparent',
                  color: docViewTab === 'extracted' ? '#0a0f1a' : '#666',
                  fontWeight: docViewTab === 'extracted' ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Extracted Data
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  background: docViewTab === 'extracted' ? '#0a0f1a' : '#e0e0e0', 
                  color: docViewTab === 'extracted' ? 'white' : '#666',
                  borderRadius: '10px' 
                }}>
                  AI
                </span>
              </button>
            </div>

            {/* Tab Description */}
            <div style={{ padding: '12px 24px', background: docViewTab === 'original' ? '#f9f7f4' : '#f0f9ff', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
              {docViewTab === 'original' ? (
                <p style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  This is the original document as received (scanned fax, email, or uploaded file)
                </p>
              ) : (
                <p style={{ fontSize: '13px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" fill="none" stroke="#0369a1" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  AI-extracted and structured data from the original document ({app.confidence}% confidence)
                </p>
              )}
            </div>

            {/* Document Frame */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <iframe
                src={docViewTab === 'original' ? selectedDoc.rawUrl : selectedDoc.extractedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`${selectedDoc.name} - ${docViewTab}`}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '13px', color: '#888' }}>
                Viewing: {docViewTab === 'original' ? 'Original submission' : 'AI-extracted data'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={docViewTab === 'original' ? selectedDoc.rawUrl : selectedDoc.extractedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  Open in New Tab
                </a>
                <button
                  onClick={() => setShowDocViewer(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#0a0f1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
