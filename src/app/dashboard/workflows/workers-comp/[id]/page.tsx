'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface FROIReport {
  id: number;
  client_id: number;
  report_number: string;
  employee_name: string;
  employee_ssn_last4: string;
  employer_name: string;
  employer_policy: string;
  injury_date: string;
  injury_description: string;
  cause_code: string;
  nature_code: string;
  body_part_code: string;
  ai_confidence: number;
  filing_deadline: string;
  status: string;
  submitted_at: string;
  created_at: string;
  client_name: string;
  extracted_data?: any;
}

export default function WorkersCompDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<FROIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEDIModal, setShowEDIModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FROIReport>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/db/workers-comp/${reportId}`);
        if (!response.ok) throw new Error('Report not found');
        const data = await response.json();
        setReport(data);
        setEditForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Generate IAIABC FROI EDI format
  const generateFROIEDI = () => {
    if (!report) return '';
    
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const injuryDate = report.injury_date ? report.injury_date.replace(/-/g, '') : '00000000';
    
    // IAIABC FROI EDI format (simplified representation)
    const edi = `ISA*00*          *00*          *ZZ*MCOADV         *ZZ*OHBWC          *${dateStr.substring(0,6)}*${dateStr.substring(6,10)}*U*00401*000000001*0*P*:~
GS*WC*MCOADV*OHBWC*${dateStr.substring(0,8)}*${dateStr.substring(8,12)}*1*X*004010~
ST*148*0001~
BGN*11*${report.report_number || 'FROI' + report.id}*${dateStr.substring(0,8)}~
REF*FJ*${report.employer_policy || 'UNKNOWN'}~
DTP*431*D8*${injuryDate}~
NM1*70*1*${(report.employee_name || 'UNKNOWN').split(',')[0]?.toUpperCase() || 'UNKNOWN'}*${(report.employee_name || '').split(',')[1]?.trim().toUpperCase() || ''}****SY*${report.employee_ssn_last4 ? '***-**-' + report.employee_ssn_last4 : 'UNKNOWN'}~
NM1*31*2*${(report.employer_name || 'UNKNOWN').toUpperCase()}~
CLP*${report.body_part_code || '00'}*${report.nature_code || '00'}*${report.cause_code || '00'}~
NTE*ADD*${(report.injury_description || 'No description').substring(0, 80).toUpperCase()}~
SE*10*0001~
GE*1*1~
IEA*1*000000001~`;

    return edi;
  };

  // Generate PDF content (opens print dialog)
  const handleDownloadPDF = () => {
    if (!report) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FROI Report - ${report.report_number || report.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0a0f1a; border-bottom: 2px solid #00d4ff; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .badge-yellow { background: #fef3c7; color: #d97706; }
          .section { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .field { margin-bottom: 12px; }
          .field label { color: #64748b; font-size: 12px; display: block; margin-bottom: 4px; }
          .field value { color: #0a0f1a; font-weight: 500; }
          .codes { display: flex; gap: 20px; margin: 15px 0; }
          .code-box { padding: 8px 16px; border-radius: 8px; text-align: center; }
          .description { padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>First Report of Injury (FROI)</h1>
          <span class="badge ${report.ai_confidence >= 90 ? 'badge-green' : 'badge-yellow'}">
            ${report.ai_confidence >= 90 ? 'EDI Ready' : 'Needs Review'} (${report.ai_confidence}%)
          </span>
        </div>
        
        <p><strong>Report Number:</strong> ${report.report_number || 'FROI-' + report.id}</p>
        <p><strong>Created:</strong> ${formatDateTime(report.created_at)}</p>
        
        <h2>Employee Information</h2>
        <div class="section">
          <div class="grid">
            <div class="field">
              <label>Employee Name</label>
              <value>${report.employee_name || 'N/A'}</value>
            </div>
            <div class="field">
              <label>SSN (Last 4)</label>
              <value>${report.employee_ssn_last4 ? '***-**-' + report.employee_ssn_last4 : 'N/A'}</value>
            </div>
          </div>
        </div>
        
        <h2>Employer Information</h2>
        <div class="section">
          <div class="grid">
            <div class="field">
              <label>Employer Name</label>
              <value>${report.employer_name || 'N/A'}</value>
            </div>
            <div class="field">
              <label>Policy Number</label>
              <value>${report.employer_policy || 'N/A'}</value>
            </div>
          </div>
        </div>
        
        <h2>Injury Details</h2>
        <div class="section">
          <div class="field">
            <label>Date of Injury</label>
            <value>${formatDate(report.injury_date)}</value>
          </div>
          
          <div class="codes">
            <div class="code-box" style="background: #f0f9ff;">
              <label style="color: #64748b; font-size: 11px;">Cause Code</label>
              <div style="font-weight: bold; color: #0369a1;">${report.cause_code || 'N/A'}</div>
            </div>
            <div class="code-box" style="background: #fef3c7;">
              <label style="color: #64748b; font-size: 11px;">Nature Code</label>
              <div style="font-weight: bold; color: #92400e;">${report.nature_code || 'N/A'}</div>
            </div>
            <div class="code-box" style="background: #fee2e2;">
              <label style="color: #64748b; font-size: 11px;">Body Part</label>
              <div style="font-weight: bold; color: #dc2626;">${report.body_part_code || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field">
            <label>Description of Injury</label>
            <div class="description">${report.injury_description || 'No description provided'}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Generated by DOKit Claims Platform</p>
          <p>AI Confidence Score: ${report.ai_confidence}% | Status: ${report.status || 'Pending'}</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/db/workers-comp/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      const updated = await response.json();
      setReport(updated);
      setShowEditModal(false);
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download EDI file
  const downloadEDI = () => {
    const edi = generateFROIEDI();
    const blob = new Blob([edi], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FROI_${report?.report_number || report?.id}_${new Date().toISOString().split('T')[0]}.edi`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading FROI details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Report not found'}</p>
        <button onClick={() => router.push('/dashboard/workflows/workers-comp')} style={{ color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Workers Comp
        </button>
      </div>
    );
  }

  const confidence = report.ai_confidence || 0;
  const isEDIReady = confidence >= 90;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/workflows/workers-comp')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
        >
          ← Back to Workers Comp
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>
              FROI Report: {report.report_number || `#${report.id}`}
            </h1>
            <p style={{ color: '#64748b' }}>
              Created {formatDateTime(report.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 600,
              background: isEDIReady ? '#dcfce7' : '#fef3c7',
              color: isEDIReady ? '#16a34a' : '#d97706'
            }}>
              {isEDIReady ? '✓ EDI Ready' : '⚠ Needs Review'}
            </span>
            <span style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 600,
              background: report.status === 'submit' ? '#dcfce7' : report.status === 'review' ? '#fef3c7' : '#fee2e2',
              color: report.status === 'submit' ? '#16a34a' : report.status === 'review' ? '#d97706' : '#dc2626',
              textTransform: 'capitalize'
            }}>
              {report.status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>AI Confidence</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: confidence >= 90 ? '#16a34a' : confidence >= 70 ? '#d97706' : '#dc2626' }}>
            {confidence}%
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Injury Date</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0a0f1a' }}>{formatDate(report.injury_date)}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Body Part</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0a0f1a' }}>{report.body_part_code || 'N/A'}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Filing Deadline</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: report.filing_deadline ? '#dc2626' : '#64748b' }}>
            {report.filing_deadline ? formatDate(report.filing_deadline) : 'Not Set'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Employee Information */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> Employee Information
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Employee Name</p>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{report.employee_name || 'Unknown'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>SSN (Last 4)</p>
              <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                {report.employee_ssn_last4 ? `***-**-${report.employee_ssn_last4}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Employer Information */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span> Employer Information
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Employer Name</p>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{report.employer_name || 'Unknown'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Policy Number</p>
              <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>{report.employer_policy || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Injury Details */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏥</span> Injury Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Cause Code</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '14px' }}>
              {report.cause_code || 'N/A'}
            </span>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Nature Code</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '14px' }}>
              {report.nature_code || 'N/A'}
            </span>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Body Part Code</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '14px' }}>
              {report.body_part_code || 'N/A'}
            </span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Injury Description</p>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {report.injury_description || 'No description provided'}
            </p>
          </div>
        </div>
      </div>

      {/* EDI Preview */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📤</span> OBWC EDI Submission
        </h3>
        {isEDIReady ? (
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <p style={{ color: '#166534', fontWeight: 500, marginBottom: '8px' }}>✓ This report is ready for EDI submission to Ohio BWC</p>
            <p style={{ color: '#166534', fontSize: '14px' }}>All required fields are complete with {confidence}% confidence.</p>
            <button style={{ marginTop: '12px', padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
              Submit to OBWC
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ color: '#92400e', fontWeight: 500, marginBottom: '8px' }}>⚠ This report needs review before submission</p>
            <p style={{ color: '#92400e', fontSize: '14px' }}>
              AI confidence is {confidence}%. Please review and complete missing fields.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button 
          onClick={() => setShowEditModal(true)}
          style={{ padding: '12px 24px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Edit Report
        </button>
        <button 
          onClick={handleDownloadPDF}
          style={{ padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          Download PDF
        </button>
        <button 
          onClick={() => setShowEDIModal(true)}
          style={{ padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          View EDI Format
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Edit FROI Report</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Employee Name</label>
                  <input
                    type="text"
                    value={editForm.employee_name || ''}
                    onChange={(e) => setEditForm({...editForm, employee_name: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>SSN (Last 4)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editForm.employee_ssn_last4 || ''}
                    onChange={(e) => setEditForm({...editForm, employee_ssn_last4: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Employer Name</label>
                  <input
                    type="text"
                    value={editForm.employer_name || ''}
                    onChange={(e) => setEditForm({...editForm, employer_name: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Policy Number</label>
                  <input
                    type="text"
                    value={editForm.employer_policy || ''}
                    onChange={(e) => setEditForm({...editForm, employer_policy: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Injury Date</label>
                <input
                  type="date"
                  value={formatDateForInput(editForm.injury_date || '')}
                  onChange={(e) => setEditForm({...editForm, injury_date: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Cause Code</label>
                  <input
                    type="text"
                    value={editForm.cause_code || ''}
                    onChange={(e) => setEditForm({...editForm, cause_code: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Nature Code</label>
                  <input
                    type="text"
                    value={editForm.nature_code || ''}
                    onChange={(e) => setEditForm({...editForm, nature_code: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Body Part Code</label>
                  <input
                    type="text"
                    value={editForm.body_part_code || ''}
                    onChange={(e) => setEditForm({...editForm, body_part_code: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Injury Description</label>
                <textarea
                  rows={4}
                  value={editForm.injury_description || ''}
                  onChange={(e) => setEditForm({...editForm, injury_description: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDI Modal */}
      {showEDIModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>IAIABC FROI EDI Format</h2>
              <button onClick={() => setShowEDIModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
              This is the EDI format that will be submitted to Ohio BWC (OBWC) for this First Report of Injury.
            </p>
            
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {generateFROIEDI()}
              </pre>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => copyToClipboard(generateFROIEDI())}
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={downloadEDI}
                style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Download .edi File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
