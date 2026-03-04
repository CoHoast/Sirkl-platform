'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'next/navigation';

interface ProcessedFROI {
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
}

interface FROIReport {
  id: string;
  reportNumber: string;
  employee: { firstName: string; lastName: string; ssn: string };
  employer: { name: string; policyNumber: string };
  injury: { date: string; time: string; location: string; description: string };
  aiCodes: { cause: string; nature: string; bodyPart: string; confidence: number };
  status: 'processing' | 'pending_review' | 'ready_to_submit' | 'submitted' | 'accepted' | 'rejected';
  filingDeadline: string;
  flags: Array<{ type: 'info' | 'warning' | 'critical'; message: string }>;
  receivedAt: string;
}

interface StateConfig {
  id: string;
  state: string;
  stateName: string;
  bureauName: string;
  ediEndpoint: string;
  filingDeadlineDays: number;
  enabled: boolean;
}

export default function WorkersCompWorkflowPage() {
  const router = useRouter();
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'processed' | 'config' | 'froi' | 'sroi' | 'edi' | 'queue'>('processed');

  // Processed FROIs from database
  const [processedFROIs, setProcessedFROIs] = useState<ProcessedFROI[]>([]);
  const [froisLoading, setFroisLoading] = useState(false);
  const [froisError, setFroisError] = useState<string | null>(null);

  const fetchFROIs = async () => {
    setFroisLoading(true);
    setFroisError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClient?.id) {
        params.append('clientId', selectedClient.id.toString());
      }
      const response = await fetch(`/api/db/workers-comp?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch FROI reports');
      const data = await response.json();
      setProcessedFROIs(data.reports || []);
    } catch (err) {
      setFroisError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFroisLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'processed') {
      fetchFROIs();
    }
  }, [activeTab, selectedClient]);

  // Intake Configuration
  const [intakeConfig, setIntakeConfig] = useState({
    emailIntake: 'froi@mco-advantage.com',
    faxNumber: '1-800-555-FROI',
    ftpHost: 'ftp.mco-advantage.com',
    ftpPath: '/incoming/workers-comp',
    outputApiEndpoint: 'https://api.mco-advantage.com/v1/workers-comp/processed',
    outputApiKey: 'pk_live_xxxxxxxxxxxxx',
  });

  // State Configurations
  const [stateConfigs, setStateConfigs] = useState<StateConfig[]>([
    { id: '1', state: 'OH', stateName: 'Ohio', bureauName: 'OBWC (Ohio Bureau of Workers\' Compensation)', ediEndpoint: 'edi.ohiobwc.com', filingDeadlineDays: 7, enabled: true },
    { id: '2', state: 'PA', stateName: 'Pennsylvania', bureauName: 'PA Bureau of Workers\' Compensation', ediEndpoint: 'edi.dli.pa.gov', filingDeadlineDays: 7, enabled: false },
    { id: '3', state: 'IN', stateName: 'Indiana', bureauName: 'Indiana Workers\' Compensation Board', ediEndpoint: 'edi.in.gov/wcb', filingDeadlineDays: 7, enabled: false },
    { id: '4', state: 'MI', stateName: 'Michigan', bureauName: 'Michigan WDCA', ediEndpoint: 'edi.michigan.gov/wdca', filingDeadlineDays: 14, enabled: false },
  ]);

  // IAIABC Code Mappings
  const [causeCodes] = useState([
    { code: '10', description: 'Struck by object' },
    { code: '25', description: 'Fall on same level' },
    { code: '26', description: 'Fall to lower level' },
    { code: '31', description: 'Overexertion - lifting' },
    { code: '40', description: 'Motor vehicle accident' },
    { code: '50', description: 'Repetitive motion' },
    { code: '52', description: 'Strain/sprain' },
    { code: '60', description: 'Caught in/between' },
    { code: '84', description: 'Slip (no fall)' },
    { code: '97', description: 'Other' },
  ]);

  const [natureCodes] = useState([
    { code: '10', description: 'Amputation' },
    { code: '20', description: 'Burn' },
    { code: '30', description: 'Contusion' },
    { code: '40', description: 'Cut/laceration' },
    { code: '52', description: 'Fracture' },
    { code: '53', description: 'Dislocation' },
    { code: '60', description: 'Strain/sprain' },
    { code: '70', description: 'Hernia' },
    { code: '73', description: 'Carpal tunnel' },
    { code: '90', description: 'Other' },
  ]);

  const [bodyPartCodes] = useState([
    { code: '10', description: 'Head' },
    { code: '15', description: 'Eye(s)' },
    { code: '20', description: 'Neck' },
    { code: '30', description: 'Upper back' },
    { code: '31', description: 'Lower back' },
    { code: '33', description: 'Shoulder' },
    { code: '35', description: 'Arm' },
    { code: '37', description: 'Wrist' },
    { code: '38', description: 'Hand' },
    { code: '39', description: 'Finger(s)' },
    { code: '50', description: 'Leg' },
    { code: '53', description: 'Knee' },
    { code: '56', description: 'Ankle' },
    { code: '57', description: 'Foot' },
  ]);

  // SROI Transaction Types
  const [sroiTypes] = useState([
    { code: '02', description: 'Change in Benefit/Payment', useCase: 'Benefit amount changed' },
    { code: '04', description: 'Return to Work', useCase: 'Employee returned to work' },
    { code: 'IP', description: 'Initial Payment', useCase: 'First compensation payment' },
    { code: 'EP', description: 'Subsequent Payment', useCase: 'Ongoing payments' },
    { code: 'FN', description: 'Final Payment', useCase: 'Last payment, claim closing' },
    { code: 'CA', description: 'Claim Amendment', useCase: 'Correct previous submission' },
    { code: 'RB', description: 'Reinstatement of Benefits', useCase: 'Benefits restarted' },
    { code: 'CB', description: 'Cancellation of Benefits', useCase: 'Benefits stopped' },
    { code: 'NT', description: 'Denial', useCase: 'Claim denied' },
  ]);

  // Sample Queue Data
  const [queueItems] = useState<FROIReport[]>([
    {
      id: '1',
      reportNumber: 'FROI-2026-00847',
      employee: { firstName: 'John', lastName: 'Smith', ssn: '***-**-4521' },
      employer: { name: 'Acme Manufacturing Inc.', policyNumber: '1234567-000' },
      injury: { date: '2026-02-25', time: '10:30', location: 'Warehouse Building A', description: 'Employee was lifting heavy box when he felt sharp pain in lower back' },
      aiCodes: { cause: '31', nature: '60', bodyPart: '31', confidence: 94 },
      status: 'pending_review',
      filingDeadline: '2026-03-04',
      flags: [{ type: 'warning', message: 'Wage rate missing' }],
      receivedAt: '2026-02-26T14:30:00Z',
    },
    {
      id: '2',
      reportNumber: 'FROI-2026-00846',
      employee: { firstName: 'Maria', lastName: 'Garcia', ssn: '***-**-7832' },
      employer: { name: 'ABC Construction', policyNumber: '2345678-000' },
      injury: { date: '2026-02-26', time: '14:15', location: 'Job site - 123 Main St', description: 'Fall from ladder approximately 8 feet, landed on right arm' },
      aiCodes: { cause: '26', nature: '52', bodyPart: '35', confidence: 97 },
      status: 'ready_to_submit',
      filingDeadline: '2026-03-05',
      flags: [],
      receivedAt: '2026-02-26T15:30:00Z',
    },
    {
      id: '3',
      reportNumber: 'SROI-2026-00123',
      employee: { firstName: 'Robert', lastName: 'Williams', ssn: '***-**-9156' },
      employer: { name: 'Columbus Steel Works', policyNumber: '3456789-000' },
      injury: { date: '2026-01-15', time: '08:45', location: 'Production floor', description: 'Return to work - modified duty' },
      aiCodes: { cause: '60', nature: '40', bodyPart: '38', confidence: 92 },
      status: 'submitted',
      filingDeadline: '2026-02-28',
      flags: [],
      receivedAt: '2026-02-25T09:00:00Z',
    },
    {
      id: '4',
      reportNumber: 'FROI-2026-00845',
      employee: { firstName: 'Susan', lastName: 'Lee', ssn: '***-**-3345' },
      employer: { name: 'Metro Delivery', policyNumber: '4567890-000' },
      injury: { date: '2026-02-24', time: '16:20', location: 'Delivery vehicle', description: 'Motor vehicle accident while making delivery' },
      aiCodes: { cause: '40', nature: '30', bodyPart: '20', confidence: 89 },
      status: 'accepted',
      filingDeadline: '2026-03-03',
      flags: [],
      receivedAt: '2026-02-24T17:00:00Z',
    },
  ]);

  const tabs = [
    { id: 'processed', label: `Processed FROIs (${processedFROIs.length})`, icon: '📄' },
    { id: 'config', label: 'Integration Config', icon: '⚙️' },
    { id: 'froi', label: 'FROI Settings', icon: '📋' },
    { id: 'sroi', label: 'SROI Settings', icon: '📊' },
    { id: 'edi', label: 'EDI / State Bureaus', icon: '🏛️' },
    { id: 'queue', label: 'Processing Queue', icon: '📥' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing': return { bg: '#dbeafe', text: '#2563eb', label: 'Processing' };
      case 'pending_review': return { bg: '#fef3c7', text: '#d97706', label: 'Pending Review' };
      case 'ready_to_submit': return { bg: '#dcfce7', text: '#16a34a', label: 'Ready to Submit' };
      case 'submitted': return { bg: '#e0e7ff', text: '#4f46e5', label: 'Submitted' };
      case 'accepted': return { bg: '#dcfce7', text: '#16a34a', label: 'Accepted' };
      case 'rejected': return { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            Workers Comp FROI/SROI
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: 0 }}>
          AI-powered injury report processing with OBWC EDI integration for {selectedClient?.name || 'Test Client'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === tab.id ? '#00d4ff' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Processed FROIs Tab */}
      {activeTab === 'processed' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processed FROI Reports</h3>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span>
                Live Data
              </span>
            </div>
            <button
              onClick={fetchFROIs}
              disabled={froisLoading}
              style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: froisLoading ? 'wait' : 'pointer', fontSize: '14px' }}
            >
              {froisLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {froisError && (
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
              {froisError}
            </div>
          )}

          {froisLoading && processedFROIs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading reports...</div>
          ) : processedFROIs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>No FROI reports processed yet</p>
              <p style={{ fontSize: '13px' }}>Process some injury reports to see them here</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Report #</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Employee</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Employer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Injury Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Body Part</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>AI Score</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedFROIs.map((froi) => (
                    <tr 
                      key={froi.id} 
                      style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onClick={() => router.push(`/dashboard/workflows/workers-comp/${froi.id}`)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{froi.report_number || `FROI-${froi.id}`}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{froi.employee_name || 'Unknown'}</div>
                        {froi.employee_ssn_last4 && <div style={{ fontSize: '12px', color: '#64748b' }}>SSN: ***-**-{froi.employee_ssn_last4}</div>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px' }}>{froi.employer_name || 'Unknown'}</div>
                        {froi.employer_policy && <div style={{ fontSize: '12px', color: '#64748b' }}>Policy: {froi.employer_policy}</div>}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{froi.injury_date ? new Date(froi.injury_date).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '12px' }}>
                          {froi.body_part_code || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: froi.ai_confidence >= 90 ? '#16a34a' : froi.ai_confidence >= 70 ? '#d97706' : '#dc2626' 
                        }}>
                          {froi.ai_confidence || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '9999px', 
                          fontSize: '12px', 
                          fontWeight: 500,
                          background: froi.status === 'submit' ? '#dcfce7' : froi.status === 'review' ? '#fef3c7' : '#fee2e2',
                          color: froi.status === 'submit' ? '#16a34a' : froi.status === 'review' ? '#d97706' : '#dc2626',
                          textTransform: 'capitalize'
                        }}>
                          {froi.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/workflows/workers-comp/${froi.id}`);
                          }}
                          style={{ padding: '6px 12px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {processedFROIs.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                <strong>Summary:</strong> {processedFROIs.length} FROI reports | 
                Ready to Submit: {processedFROIs.filter(f => f.status === 'submit').length} | 
                Needs Review: {processedFROIs.filter(f => f.status === 'review').length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Integration Config Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00d4ff' }}>📥</span>
              Intake Channels
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email Intake</label>
                <input type="email" value={intakeConfig.emailIntake} readOnly style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Fax Number</label>
                <input type="text" value={intakeConfig.faxNumber} readOnly style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>FTP Host</label>
                <input type="text" value={intakeConfig.ftpHost} onChange={(e) => setIntakeConfig({ ...intakeConfig, ftpHost: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>FTP Path</label>
                <input type="text" value={intakeConfig.ftpPath} onChange={(e) => setIntakeConfig({ ...intakeConfig, ftpPath: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00d4ff' }}>📤</span>
              Output Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>API Endpoint</label>
                <input type="url" value={intakeConfig.outputApiEndpoint} onChange={(e) => setIntakeConfig({ ...intakeConfig, outputApiEndpoint: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>API Key</label>
                <input type="password" value={intakeConfig.outputApiKey} onChange={(e) => setIntakeConfig({ ...intakeConfig, outputApiKey: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* FROI Settings Tab */}
      {activeTab === 'froi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AI-Powered Code Mapping</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Our AI automatically maps injury descriptions to IAIABC codes with confidence scoring
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {/* Cause Codes */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#0369a1' }}>Cause of Injury Codes</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  {causeCodes.map((code) => (
                    <div key={code.code} style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0369a1', minWidth: '30px' }}>{code.code}</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{code.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nature Codes */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#7c3aed' }}>Nature of Injury Codes</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  {natureCodes.map((code) => (
                    <div key={code.code} style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#7c3aed', minWidth: '30px' }}>{code.code}</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{code.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Part Codes */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#059669' }}>Body Part Codes</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  {bodyPartCodes.map((code) => (
                    <div key={code.code} style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#059669', minWidth: '30px' }}>{code.code}</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{code.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '20px', border: '1px solid #bae6fd' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#0369a1' }}>💡 How AI Code Mapping Works</h4>
            <p style={{ fontSize: '13px', color: '#0c4a6e', margin: 0, lineHeight: 1.6 }}>
              When a FROI is received, our AI analyzes the injury description and automatically suggests the most appropriate IAIABC codes. 
              For example, "Employee was lifting heavy box when he felt sharp pain in lower back" would map to:
              <br /><br />
              <strong>Cause:</strong> 31 (Overexertion - lifting) • <strong>Nature:</strong> 60 (Strain/sprain) • <strong>Body Part:</strong> 31 (Lower back)
              <br /><br />
              Each mapping includes a confidence score. Low-confidence mappings are flagged for human review.
            </p>
          </div>
        </div>
      )}

      {/* SROI Settings Tab */}
      {activeTab === 'sroi' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>SROI Transaction Types</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            Subsequent Report of Injury (SROI) transactions for status updates throughout the claim lifecycle
          </p>
          
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Code</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Transaction Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Use Case</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sroiTypes.map((type) => (
                  <tr key={type.code} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>{type.code}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{type.description}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '14px' }}>{type.useCase}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDI / State Bureaus Tab */}
      {activeTab === 'edi' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>State Bureau EDI Connections</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Configure EDI submission to state workers' compensation bureaus</p>
            </div>
            <button style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              + Add State
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {stateConfigs.map((config) => (
              <div key={config.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: config.enabled ? '#0a0f1a' : '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.enabled ? 'white' : '#6b7280', fontWeight: 700, fontSize: '16px' }}>
                      {config.state}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 600 }}>{config.stateName}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{config.bureauName}</p>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={config.enabled} 
                      onChange={() => setStateConfigs(configs => configs.map(c => c.id === config.id ? { ...c, enabled: !c.enabled } : c))} 
                      style={{ width: '18px', height: '18px', marginRight: '8px' }} 
                    />
                    <span style={{ fontSize: '14px', color: config.enabled ? '#16a34a' : '#64748b' }}>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                
                {config.enabled && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>EDI Endpoint</span>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{config.ediEndpoint}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Filing Deadline</span>
                      <div style={{ fontSize: '14px' }}>{config.filingDeadlineDays} days</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Connection Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                        <span style={{ fontSize: '14px', color: '#16a34a' }}>Connected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Queue Tab */}
      {activeTab === 'queue' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processing Queue</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>FROI and SROI reports pending review or submission</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Pending (2)</button>
              <button style={{ padding: '8px 16px', background: '#0a0f1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>All</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queueItems.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const daysLeft = getDaysUntilDeadline(item.filingDeadline);
              
              return (
                <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.reportNumber}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: statusBadge.bg, color: statusBadge.text }}>{statusBadge.label}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', background: item.aiCodes.confidence >= 90 ? '#dcfce7' : '#fef3c7', color: item.aiCodes.confidence >= 90 ? '#16a34a' : '#d97706' }}>
                          AI: {item.aiCodes.confidence}% confidence
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                        <span><strong>Employee:</strong> {item.employee.firstName} {item.employee.lastName}</span>
                        <span><strong>Employer:</strong> {item.employer.name}</span>
                        <span><strong>Injury Date:</strong> {formatDate(item.injury.date)}</span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {item.injury.description}
                      </p>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>
                          Cause: {item.aiCodes.cause}
                        </span>
                        <span style={{ padding: '4px 8px', background: '#faf5ff', color: '#7c3aed', borderRadius: '4px', fontSize: '12px' }}>
                          Nature: {item.aiCodes.nature}
                        </span>
                        <span style={{ padding: '4px 8px', background: '#f0fdf4', color: '#059669', borderRadius: '4px', fontSize: '12px' }}>
                          Body: {item.aiCodes.bodyPart}
                        </span>
                        {item.flags.map((flag, i) => (
                          <span key={i} style={{ padding: '4px 8px', background: flag.type === 'critical' ? '#fee2e2' : '#fef3c7', color: flag.type === 'critical' ? '#dc2626' : '#d97706', borderRadius: '4px', fontSize: '12px' }}>
                            ⚠️ {flag.message}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Filing Deadline</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: daysLeft <= 2 ? '#dc2626' : daysLeft <= 5 ? '#d97706' : '#16a34a' }}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue!'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{formatDate(item.filingDeadline)}</div>
                      
                      {item.status === 'ready_to_submit' && (
                        <button style={{ marginTop: '12px', padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          Submit to OBWC
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
              <strong>⚠️ Compliance Alert:</strong> 2 reports pending review with filing deadlines within 5 days. Ohio requires FROI submission within 7 days of employer knowledge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
