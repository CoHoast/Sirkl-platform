'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { 
  CheckIcon, 
  XMarkIcon,
  PencilIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  DocumentIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import '../../mobile.css';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mco-advantage-api-production.up.railway.app';

interface Application {
  id: string;
  patient_name: string;
  dob: string;
  phone: string;
  address: string;
  insurance: string;
  policy_number: string;
  diagnosis: string[];
  medications: string[];
  allergies: string[];
  physician: string;
  facility: string;
  services: string[];
  priority: string;
  source: string;
  created_at: string;
  confidence_score: number;
  ai_summary: string;
  status: string;
}

interface DocumentInfo {
  id: string;
  document_type: string;
  filename: string;
  mime_type: string;
  page_number: number;
  created_at: string;
}

// Fallback mock data
const getMockApplication = (id: string): Application => ({
  id,
  patient_name: 'Margaret Thompson',
  dob: '03/15/1943',
  phone: '(248) 555-0147',
  address: '4521 Maple Grove Dr, West Bloomfield, MI 48322',
  insurance: 'Medicare',
  policy_number: '1EG4-TE5-MK72',
  diagnosis: ['Dementia - Moderate', 'Hypertension', 'Type 2 Diabetes'],
  medications: ['Lisinopril 10mg daily', 'Metformin 500mg twice daily', 'Donepezil 10mg at bedtime'],
  allergies: ['Penicillin', 'Sulfa drugs'],
  physician: 'Dr. Sarah Chen',
  facility: 'Beaumont Health - Royal Oak',
  services: ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy'],
  priority: 'high',
  source: 'Hospital Referral',
  created_at: new Date().toISOString(),
  confidence_score: 95,
  ai_summary: 'Post-acute rehabilitation following hip replacement surgery. Patient requires PT/OT and skilled nursing care.',
  status: 'pending',
});

function ApplicationDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNewApplication = searchParams?.get('new') === 'true';
  
  const [app, setApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [currentDocPage, setCurrentDocPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string | string[]>>({});
  const [newListItemInputs, setNewListItemInputs] = useState<Record<string, string>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'document'>('details');
  const [showNewBanner, setShowNewBanner] = useState(isNewApplication || false);

  // Fetch application data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch application
        const appResponse = await fetch(`${API_URL}/api/applications/${id}`);
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setApp(appData);
        } else {
          // Fall back to mock data for demo
          setApp(getMockApplication(id));
        }

        // Fetch documents
        const docsResponse = await fetch(`${API_URL}/api/applications/${id}/documents`);
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setDocuments(docsData);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        setApp(getMockApplication(id));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Auto-dismiss new application banner
  useEffect(() => {
    if (showNewBanner) {
      const timer = setTimeout(() => setShowNewBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNewBanner]);

  // Loading state
  if (isLoading || !app) {
    return (
      <MobileLayout title="Application" showBack>
        <div className="mobile-section" style={{ paddingTop: 60, textAlign: 'center' }}>
          <div className="scan-processing-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Loading application...</p>
        </div>
      </MobileLayout>
    );
  }

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const handleFieldChange = (field: string, value: string | string[]) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const handleSave = async () => {
    if (Object.keys(editedFields).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    
    try {
      // When saving edits, also set status to "review" so it moves from Inbox to Review tab
      const updateData = {
        ...editedFields,
        status: 'review' // Move to Review tab after editing
      };

      const response = await fetch(`${API_URL}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        // Update local state with saved values
        setApp(prev => prev ? { ...prev, ...editedFields, status: 'review' } : prev);
        setEditedFields({});
        setNewListItemInputs({});
        setIsEditing(false);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else {
        console.error('Failed to save changes');
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitToCRM = async () => {
    if (!confirmChecked) return;
    
    setIsSubmitting(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    try {
      // First approve the application
      const response = await fetch(`${API_URL}/api/applications/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approved' })
      });
      
      if (response.ok) {
        // Success haptic
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 100, 10, 100, 10]);
        }
        
        // Navigate back
        router.push('/mobile');
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleApprove = () => {
    setConfirmChecked(false);
    setShowSubmitConfirm(true);
  };

  const handleDeny = () => {
    setConfirmChecked(false);
    setShowDenyConfirm(true);
  };

  const handleConfirmDeny = async () => {
    if (!confirmChecked) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/applications/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'denied' })
      });
      
      if (response.ok) {
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 100, 10]);
        }
        router.push('/mobile');
      } else {
        alert('Failed to deny. Please try again.');
      }
    } catch (error) {
      console.error('Error denying:', error);
      alert('Failed to deny. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowDenyConfirm(false);
    }
  };

  const renderEditableField = (label: string, field: string, value: string, multiline = false) => {
    const currentValue = editedFields[field] ?? value;
    
    return (
      <div className="mobile-form-group">
        <label className="mobile-label">{label}</label>
        {isEditing ? (
          multiline ? (
            <textarea
              className="mobile-textarea"
              value={currentValue}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              rows={3}
            />
          ) : (
            <input
              type="text"
              className="mobile-input"
              value={currentValue}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            />
          )
        ) : (
          <div className="mobile-field-value">{currentValue}</div>
        )}
      </div>
    );
  };

  const renderListField = (label: string, field: string, items: string[]) => {
    const currentItems: string[] = (editedFields[field] as string[]) ?? items;
    const newItemValue = newListItemInputs[field] || '';
    
    const handleAddItem = () => {
      if (newItemValue.trim()) {
        const updatedItems = [...currentItems, newItemValue.trim()];
        handleFieldChange(field, updatedItems);
        setNewListItemInputs(prev => ({ ...prev, [field]: '' }));
      }
    };
    
    const handleRemoveItem = (index: number) => {
      const updatedItems = currentItems.filter((_, i) => i !== index);
      handleFieldChange(field, updatedItems);
    };
    
    return (
      <div className="mobile-form-group">
        <label className="mobile-label">{label}</label>
        {isEditing ? (
          <>
            <div className="mobile-tags" style={{ marginBottom: currentItems.length > 0 ? 10 : 0 }}>
              {currentItems.map((item, i) => (
                <span key={i} className="mobile-tag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item}
                  <button
                    onClick={() => handleRemoveItem(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg style={{ width: 14, height: 14, color: '#ef4444' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="mobile-input"
                placeholder={`Add ${label.toLowerCase().replace('ies', 'y').replace(/s$/, '')}...`}
                value={newItemValue}
                onChange={(e) => setNewListItemInputs(prev => ({ ...prev, [field]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemValue.trim()}
                style={{
                  padding: '12px 16px',
                  background: newItemValue.trim() ? '#0a0f1a' : '#e5e7eb',
                  color: newItemValue.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: newItemValue.trim() ? 'pointer' : 'default',
                }}
              >
                Add
              </button>
            </div>
          </>
        ) : (
          <div className="mobile-tags">
            {currentItems.length > 0 ? (
              currentItems.map((item, i) => (
                <span key={i} className="mobile-tag">{item}</span>
              ))
            ) : (
              <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 14 }}>None listed</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileLayout 
      title={isEditing ? 'Edit Application' : 'Application'} 
      showBack 
      rightAction={
        activeTab === 'details' ? (
          isEditing ? (
            <button 
              className="mobile-icon-btn" 
              onClick={handleSave}
              disabled={isSaving}
              style={{ padding: 8 }}
            >
              {isSaving ? (
                <div style={{ width: 24, height: 24, border: '2px solid #d1d5db', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg style={{ width: 24, height: 24, color: '#16a34a' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ) : (
            <button 
              className="mobile-icon-btn" 
              onClick={() => setIsEditing(true)}
              style={{ padding: 8, background: 'rgba(39,83,128,0.1)', borderRadius: 8 }}
            >
              <svg style={{ width: 24, height: 24, color: '#0a0f1a' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          )
        ) : null
      }
    >
      {/* Tab Bar */}
      <div className="mobile-tab-bar-inline" style={{ 
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        marginTop: 0
      }}>
        <button 
          className={`mobile-tab-inline ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3H12m-.75 3h3.75" />
          </svg>
          <span>Details</span>
        </button>
        <button 
          className={`mobile-tab-inline ${activeTab === 'document' ? 'active' : ''}`}
          onClick={() => setActiveTab('document')}
        >
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span>Original Doc</span>
        </button>
      </div>

      {/* New Application Banner */}
      {showNewBanner && (
        <div className="new-app-banner">
          <CheckIcon className="w-5 h-5" />
          <span>Application created successfully!</span>
        </div>
      )}

      {/* Document Viewer Tab */}
      {activeTab === 'document' && (
        <div className="mobile-section" style={{ paddingTop: 16 }}>
          <div className="document-viewer-mobile">
            <div className="document-header-mobile">
              <span className="document-label">
                {app.source === 'Mobile Scan' ? 'Scanned Document' : 'Original Document'}
                {documents.length > 1 && ` (${currentDocPage + 1}/${documents.length})`}
              </span>
              <span className="document-date">Received {formatDate(app.created_at)}</span>
            </div>
            
            {/* Document Image or Fallback */}
            <div className="document-frame-mobile">
              {documents.length > 0 ? (
                <div className="scanned-doc-container">
                  {/* Actual scanned image */}
                  <img 
                    src={`${API_URL}/api/documents/${documents[currentDocPage].id}/image`}
                    alt={`Page ${currentDocPage + 1}`}
                    className="scanned-doc-image"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      borderRadius: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                  
                  {/* Page navigation for multi-page docs */}
                  {documents.length > 1 && (
                    <div className="doc-page-nav">
                      <button 
                        className="doc-page-btn"
                        onClick={() => setCurrentDocPage(p => Math.max(0, p - 1))}
                        disabled={currentDocPage === 0}
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <span className="doc-page-indicator">
                        {currentDocPage + 1} / {documents.length}
                      </span>
                      <button 
                        className="doc-page-btn"
                        onClick={() => setCurrentDocPage(p => Math.min(documents.length - 1, p + 1))}
                        disabled={currentDocPage === documents.length - 1}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : app.source === 'Mobile Scan' ? (
                <div className="no-doc-placeholder">
                  <PhotoIcon className="w-12 h-12" />
                  <p>Scanned image not available</p>
                </div>
              ) : (
                /* Fallback: Show mock document for email-sourced apps */
                <div className="mock-document">
                  <div className="mock-doc-header">
                    <div className="mock-stamp">RECEIVED</div>
                    <div className="mock-date">{formatDate(app.created_at)}</div>
                  </div>
                  <h3 className="mock-doc-title">PATIENT REFERRAL FORM</h3>
                  <div className="mock-doc-field">
                    <span className="mock-label">Patient Name:</span>
                    <span className="mock-value mock-handwritten">{app.patient_name}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">DOB:</span>
                    <span className="mock-value mock-handwritten">{app.dob}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">Phone:</span>
                    <span className="mock-value mock-handwritten">{app.phone}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">Address:</span>
                    <span className="mock-value mock-handwritten">{app.address}</span>
                  </div>
                  <div className="mock-doc-divider" />
                  <div className="mock-doc-field">
                    <span className="mock-label">Primary Insurance:</span>
                    <span className="mock-value mock-handwritten">{app.insurance}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">Policy #:</span>
                    <span className="mock-value mock-handwritten">{app.policy_number}</span>
                  </div>
                  <div className="mock-doc-divider" />
                  <div className="mock-doc-field">
                    <span className="mock-label">Diagnosis:</span>
                    <span className="mock-value mock-handwritten">{app.diagnosis?.join(', ')}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">Referring Physician:</span>
                    <span className="mock-value mock-handwritten">{app.physician}</span>
                  </div>
                  <div className="mock-doc-field">
                    <span className="mock-label">Referring Facility:</span>
                    <span className="mock-value mock-handwritten">{app.facility}</span>
                  </div>
                  <div className="mock-doc-footer">
                    <div className="mock-signature">
                      <div className="mock-sig-line"></div>
                      <span>Physician Signature</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="document-actions-mobile">
              <button className="doc-action-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Zoom In
              </button>
              <button className="doc-action-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <>
          {/* Save/Cancel buttons when editing - appears at top */}
          {isEditing && (
            <div className="mobile-section" style={{ paddingTop: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedFields({});
                    setNewListItemInputs({});
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* AI Summary Card */}
          <div className="mobile-section" style={{ paddingTop: 12 }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #0a0f1a 0%, #060912 100%)', 
              borderRadius: 16, 
              padding: 20,
              color: 'white'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                marginBottom: 12 
              }}>
                <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: 16 }}>AI Summary</span>
                <span style={{ 
                  marginLeft: 'auto', 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '4px 10px', 
                  borderRadius: 12, 
                  fontSize: 12, 
                  fontWeight: 500 
                }}>{app.confidence_score}% confidence</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: 0.95 }}>{app.ai_summary || 'No summary available'}</p>
            </div>
          </div>

          {/* Low Confidence Warning */}
          {app.confidence_score < 85 && (
            <div className="mobile-section">
              <div className="warning-banner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <span>Low confidence extraction - please verify all fields</span>
              </div>
            </div>
          )}

          {/* Source Badge */}
          {app.source === 'Mobile Scan' && (
            <div className="mobile-section">
              <div className="source-badge scan">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span>Created from mobile scan</span>
              </div>
            </div>
          )}

          {/* Patient Information */}
          <div className="mobile-section">
            <h3 className="mobile-section-title" style={{ fontSize: 15, color: '#6b7280', marginTop: 20 }}>
              Patient Information
            </h3>
            
            {renderEditableField('Patient Name', 'patient_name', app.patient_name || '')}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {renderEditableField('Date of Birth', 'dob', app.dob || '')}
              {renderEditableField('Phone', 'phone', app.phone || '')}
            </div>
            
            {renderEditableField('Address', 'address', app.address || '')}
          </div>

          {/* Insurance Information */}
          <div className="mobile-section">
            <h3 className="mobile-section-title" style={{ fontSize: 15, color: '#6b7280', marginTop: 20 }}>
              Insurance
            </h3>
            
            {renderEditableField('Primary Insurance', 'insurance', app.insurance || '')}
            {renderEditableField('Policy Number', 'policy_number', app.policy_number || '')}
          </div>

          {/* Medical Information */}
          <div className="mobile-section">
            <h3 className="mobile-section-title" style={{ fontSize: 15, color: '#6b7280', marginTop: 20 }}>
              Medical Information
            </h3>
            
            {renderListField('Diagnosis', 'diagnosis', app.diagnosis || [])}
            {renderListField('Medications', 'medications', app.medications || [])}
            {renderListField('Allergies', 'allergies', app.allergies || [])}
          </div>

          {/* Referral Information */}
          <div className="mobile-section">
            <h3 className="mobile-section-title" style={{ fontSize: 15, color: '#6b7280', marginTop: 20 }}>
              Referral
            </h3>
            
            {renderEditableField('Referring Physician', 'physician', app.physician || '')}
            {renderEditableField('Referring Facility', 'facility', app.facility || '')}
            {renderListField('Requested Services', 'services', app.services || [])}
          </div>

          {/* Notes Section */}
          <div className="mobile-section">
            <h3 className="mobile-section-title" style={{ fontSize: 15, color: '#6b7280', marginTop: 20 }}>
              Notes
            </h3>
            
            <div className="mobile-form-group">
              {isEditing ? (
                <textarea
                  className="mobile-textarea"
                  placeholder="Add notes about this application..."
                  value={editedFields['notes'] ?? (app as any).notes ?? ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={4}
                  style={{ minHeight: 120 }}
                />
              ) : (
                <div className="mobile-field-value" style={{ 
                  minHeight: 60, 
                  color: (app as any).notes ? '#1a1a1a' : '#9ca3af',
                  fontStyle: (app as any).notes ? 'normal' : 'italic'
                }}>
                  {(app as any).notes || 'No notes added. Tap the pencil icon to edit.'}
                </div>
              )}
            </div>
          </div>

          {/* Spacer for action bar */}
          <div style={{ paddingBottom: 120 }} />
        </>
      )}

      {/* Action Bar */}
      {!isEditing && (
        <div className="quick-actions-bar" style={{ 
          position: 'fixed', 
          bottom: 'calc(83px + env(safe-area-inset-bottom))',
          left: 0,
          right: 0,
        }}>
          {/* Show "Review" button for pending apps (in Inbox) */}
          {app.status === 'pending' && (
            <button 
              className="quick-action-btn"
              onClick={() => setShowReviewConfirm(true)}
              style={{
                background: '#f59e0b',
                color: 'white',
              }}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Review
            </button>
          )}
          <button className="quick-action-btn deny" onClick={handleDeny}>
            <XMarkIcon className="w-5 h-5" />
            Deny
          </button>
          <button className="quick-action-btn approve" onClick={handleApprove}>
            <CheckIcon className="w-5 h-5" />
            Approve
          </button>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="mobile-modal-overlay" onClick={() => { setShowSubmitConfirm(false); setConfirmChecked(false); }}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="mobile-modal-title" style={{ margin: 0 }}>Approve Application?</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{app?.patient_name || 'Unknown Patient'}</p>
              </div>
            </div>
            
            <p className="mobile-modal-text">
              This will approve the application and sync patient data to PointClickCare.
            </p>

            {/* Confirmation Checkbox */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 12, 
              padding: '12px 16px',
              background: '#f0fdf4',
              borderRadius: 10,
              marginBottom: 20,
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: '#16a34a' }}
              />
              <span style={{ fontSize: 14, color: '#374151' }}>
                I confirm that I want to <strong>approve</strong> this application for <strong>{app?.patient_name || 'this patient'}</strong>.
              </span>
            </label>
            
            <div className="mobile-modal-actions">
              <button 
                className="quick-action-btn review"
                onClick={() => { setShowSubmitConfirm(false); setConfirmChecked(false); }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="quick-action-btn approve"
                onClick={handleSubmitToCRM}
                disabled={isSubmitting || !confirmChecked}
                style={{ opacity: confirmChecked ? 1 : 0.5 }}
              >
                {isSubmitting ? (
                  <div className="btn-spinner" />
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Confirmation Modal */}
      {showDenyConfirm && (
        <div className="mobile-modal-overlay" onClick={() => { setShowDenyConfirm(false); setConfirmChecked(false); }}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XMarkIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="mobile-modal-title" style={{ margin: 0 }}>Deny Application?</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{app?.patient_name || 'Unknown Patient'}</p>
              </div>
            </div>
            
            <p className="mobile-modal-text">
              This will deny the application. This action cannot be undone.
            </p>

            {/* Confirmation Checkbox */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 12, 
              padding: '12px 16px',
              background: '#fef2f2',
              borderRadius: 10,
              marginBottom: 20,
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: '#dc2626' }}
              />
              <span style={{ fontSize: 14, color: '#374151' }}>
                I confirm that I want to <strong>deny</strong> this application for <strong>{app?.patient_name || 'this patient'}</strong>.
              </span>
            </label>
            
            <div className="mobile-modal-actions">
              <button 
                className="quick-action-btn review"
                onClick={() => { setShowDenyConfirm(false); setConfirmChecked(false); }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="quick-action-btn deny"
                onClick={handleConfirmDeny}
                disabled={isSubmitting || !confirmChecked}
                style={{ opacity: confirmChecked ? 1 : 0.5 }}
              >
                {isSubmitting ? (
                  <div className="btn-spinner" />
                ) : (
                  <>
                    <XMarkIcon className="w-5 h-5" />
                    Deny
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Confirmation Modal */}
      {showReviewConfirm && (
        <div className="mobile-modal-overlay" onClick={() => setShowReviewConfirm(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 20, height: 20, color: '#f59e0b' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="mobile-modal-title" style={{ margin: 0 }}>Send to Review?</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{app?.patient_name}</p>
              </div>
            </div>
            <p className="mobile-modal-text">
              This will move the application to the Review queue for further evaluation.
            </p>
            <div className="mobile-modal-actions">
              <button 
                className="quick-action-btn"
                onClick={() => setShowReviewConfirm(false)}
                disabled={isSubmitting}
                style={{ background: '#f3f4f6', color: '#374151' }}
              >
                Cancel
              </button>
              <button 
                className="quick-action-btn"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const response = await fetch(`${API_URL}/api/applications/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'review' })
                    });
                    if (response.ok) {
                      setApp(prev => prev ? { ...prev, status: 'review' } : prev);
                      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
                      setShowReviewConfirm(false);
                      router.push('/mobile/review');
                    } else {
                      alert('Failed to update. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error updating status:', error);
                    alert('Failed to update. Please try again.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                style={{ background: '#f59e0b', color: 'white' }}
              >
                {isSubmitting ? (
                  <div className="btn-spinner" />
                ) : (
                  <>
                    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Send to Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-summary-card {
          background: linear-gradient(135deg, #0a0f1a 0%, #060912 100%);
          border-radius: 12px;
          padding: 16px;
          color: white;
        }
        
        .ai-summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .ai-confidence {
          margin-left: auto;
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
        }
        
        .ai-summary-text {
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
          opacity: 0.95;
        }
        
        .warning-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 10px;
          font-size: 13px;
          color: #92400e;
          margin-top: 12px;
        }
        
        .mobile-field-value {
          font-size: 17px;
          color: #1a1a1a;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .mobile-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 0;
        }
        
        .mobile-tag {
          display: inline-block;
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
        }
        
        .mobile-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }
        
        .mobile-modal {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 16px;
          padding: 24px;
        }
        
        .mobile-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }
        
        .mobile-modal-text {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        
        .mobile-modal-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </MobileLayout>
  );
}

// Wrapper component with Suspense for useSearchParams
export default function MobileApplicationDetail() {
  return (
    <Suspense fallback={
      <MobileLayout title="Application" showBack>
        <div className="mobile-section" style={{ paddingTop: 60, textAlign: 'center' }}>
          <div className="scan-processing-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Loading application...</p>
        </div>
      </MobileLayout>
    }>
      <ApplicationDetailContent />
    </Suspense>
  );
}
