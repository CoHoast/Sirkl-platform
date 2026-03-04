'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'next/navigation';

interface ProcessedBill {
  id: number;
  client_id: number;
  provider_name: string;
  provider_npi: string;
  patient_name: string;
  bill_type: string;
  billed_amount: string;
  allowed_amount: string;
  savings_amount: string;
  extracted_data: any;
  flags: any[];
  status: string;
  processed_at: string;
  created_at: string;
  client_name: string;
}

interface FeeScheduleEntry {
  id: string;
  cptCode: string;
  description: string;
  facilityRate: number;
  nonFacilityRate: number;
  modifier?: string;
}

interface RepricingRule {
  id: string;
  name: string;
  description: string;
  type: 'percent_of_billed' | 'percent_of_medicare' | 'fee_schedule' | 'contract_rate';
  value: number;
  appliesTo: 'in_network' | 'out_of_network' | 'all';
  priority: number;
  enabled: boolean;
}

interface ErrorDetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'auto_deny' | 'auto_adjust';
  enabled: boolean;
}

export default function ProviderBillsWorkflowPage() {
  const router = useRouter();
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'processed' | 'config' | 'documents' | 'repricing' | 'errors' | 'queue'>('processed');
  
  // Processed bills from database
  const [processedBills, setProcessedBills] = useState<ProcessedBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);

  const fetchBills = async () => {
    setBillsLoading(true);
    setBillsError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClient?.id) {
        params.append('clientId', selectedClient.id.toString());
      }
      const response = await fetch(`/api/db/provider-bills?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      setProcessedBills(data.bills || []);
    } catch (err) {
      setBillsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBillsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'processed') {
      fetchBills();
    }
  }, [activeTab, selectedClient]);

  // Intake Configuration
  const [intakeConfig, setIntakeConfig] = useState({
    emailIntake: 'bills@mco-advantage.com',
    ftpHost: 'ftp.mco-advantage.com',
    ftpPath: '/incoming/bills',
    ftpUsername: '',
    ftpPassword: '',
    outputApiEndpoint: 'https://api.mco-advantage.com/v1/bills/processed',
    outputApiKey: 'pk_live_xxxxxxxxxxxxx',
  });

  // Document Types
  const [documentTypes] = useState([
    { id: '1', name: 'CMS-1500', code: 'CMS1500', description: 'Professional claim form', extractionFields: ['Patient Name', 'Provider NPI', 'CPT Codes', 'ICD-10', 'Charges', 'DOS'] },
    { id: '2', name: 'UB-04', code: 'UB04', description: 'Institutional claim form', extractionFields: ['Patient Name', 'Facility NPI', 'Revenue Codes', 'DRG', 'Total Charges', 'Admission Date'] },
    { id: '3', name: 'Itemized Bill', code: 'ITEMIZED', description: 'Line-item hospital bill', extractionFields: ['Patient Name', 'Services', 'Unit Prices', 'Dates', 'Total'] },
    { id: '4', name: 'Invoice', code: 'INVOICE', description: 'Simple provider invoice', extractionFields: ['Provider', 'Patient', 'Service Description', 'Amount Due', 'Date'] },
    { id: '5', name: 'Superbill', code: 'SUPERBILL', description: 'Encounter form with codes', extractionFields: ['CPT Codes', 'ICD-10', 'Patient Responsibility', 'Provider'] },
  ]);

  // Repricing Rules
  const [repricingRules, setRepricingRules] = useState<RepricingRule[]>([
    { id: '1', name: 'In-Network Fee Schedule', description: 'Apply contracted fee schedule rates', type: 'fee_schedule', value: 0, appliesTo: 'in_network', priority: 1, enabled: true },
    { id: '2', name: 'OON - 60% of Billed', description: 'Allow 60% of billed charges for out-of-network', type: 'percent_of_billed', value: 60, appliesTo: 'out_of_network', priority: 2, enabled: true },
    { id: '3', name: 'Medicare + 50%', description: 'Allow 150% of Medicare rate', type: 'percent_of_medicare', value: 150, appliesTo: 'all', priority: 3, enabled: false },
  ]);

  // Error Detection Rules
  const [errorRules, setErrorRules] = useState<ErrorDetectionRule[]>([
    { id: '1', name: 'Exact Duplicate', description: 'Same provider, patient, date, CPT, and amount', severity: 'high', action: 'auto_deny', enabled: true },
    { id: '2', name: 'Same Day Same Code', description: 'Same CPT code billed twice on same day', severity: 'medium', action: 'flag', enabled: true },
    { id: '3', name: 'Previously Paid', description: 'This exact service was already paid', severity: 'high', action: 'auto_deny', enabled: true },
    { id: '4', name: 'Unbundling', description: 'Billing separate codes that should be bundled', severity: 'medium', action: 'flag', enabled: true },
    { id: '5', name: 'Upcoding', description: 'Higher-level code than documentation supports', severity: 'medium', action: 'flag', enabled: true },
    { id: '6', name: 'Invalid Code', description: 'CPT/ICD code doesn\'t exist or is inactive', severity: 'high', action: 'flag', enabled: true },
    { id: '7', name: 'Gender Mismatch', description: 'Gender-specific code for wrong gender', severity: 'high', action: 'flag', enabled: true },
    { id: '8', name: 'Excessive Units', description: 'Units exceed reasonable maximum', severity: 'medium', action: 'flag', enabled: true },
    { id: '9', name: 'Charge Outlier', description: 'Billed amount significantly above typical', severity: 'low', action: 'flag', enabled: true },
  ]);

  // Sample Queue Data
  const [queueItems] = useState([
    { id: '1', provider: 'Cleveland Clinic', patient: 'Sarah Johnson', docType: 'UB-04', billed: 12450, allowed: 7234, flags: 3, status: 'needs_review', received: '2026-02-26T14:30:00Z' },
    { id: '2', provider: 'Dr. Michael Chen, MD', patient: 'Robert Williams', docType: 'CMS-1500', billed: 385, allowed: 312, flags: 0, status: 'ready', received: '2026-02-26T13:15:00Z' },
    { id: '3', provider: 'Quest Diagnostics', patient: 'Ana Martinez', docType: 'CMS-1500', billed: 1245, allowed: 456, flags: 1, status: 'needs_review', received: '2026-02-26T11:00:00Z' },
    { id: '4', provider: 'Metro Hospital', patient: 'David Lee', docType: 'UB-04', billed: 45680, allowed: 28500, flags: 2, status: 'needs_review', received: '2026-02-25T16:45:00Z' },
    { id: '5', provider: 'Family Care Clinic', patient: 'Emma Thompson', docType: 'CMS-1500', billed: 275, allowed: 220, flags: 0, status: 'processed', received: '2026-02-25T10:20:00Z' },
  ]);

  const tabs = [
    { id: 'processed', label: `Processed Bills (${processedBills.length})`, icon: '📄' },
    { id: 'config', label: 'Integration Config', icon: '⚙️' },
    { id: 'documents', label: 'Document Types', icon: '📋' },
    { id: 'repricing', label: 'Repricing Rules', icon: '💰' },
    { id: 'errors', label: 'Error Detection', icon: '🚨' },
    { id: 'queue', label: 'Processing Queue', icon: '📥' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return { bg: '#fee2e2', text: '#dc2626' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706' };
      case 'low': return { bg: '#dbeafe', text: '#2563eb' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>💰</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            Provider Bill Processing
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: 0 }}>
          AI-powered bill extraction, repricing, and error detection for {selectedClient?.name || 'Test Client'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0'
      }}>
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

      {/* Processed Bills Tab */}
      {activeTab === 'processed' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processed Bills</h3>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span>
                Live Data
              </span>
            </div>
            <button
              onClick={fetchBills}
              disabled={billsLoading}
              style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: billsLoading ? 'wait' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {billsLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {billsError && (
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
              {billsError}
            </div>
          )}

          {billsLoading && processedBills.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              Loading bills...
            </div>
          ) : processedBills.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p>No bills processed yet</p>
              <p style={{ fontSize: '13px' }}>Process some provider bills to see them here</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Provider</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Patient</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Billed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Allowed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Savings</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedBills.map((bill) => {
                    const billed = parseFloat(bill.billed_amount) || 0;
                    const allowed = parseFloat(bill.allowed_amount) || 0;
                    const savings = parseFloat(bill.savings_amount) || 0;
                    const flags = Array.isArray(bill.flags) ? bill.flags : [];
                    
                    return (
                      <tr 
                        key={bill.id} 
                        style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                        onClick={() => router.push(`/dashboard/workflows/provider-bills/${bill.id}`)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>#{bill.id}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{bill.provider_name || 'Unknown'}</div>
                          {bill.provider_npi && <div style={{ fontSize: '12px', color: '#64748b' }}>NPI: {bill.provider_npi}</div>}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{bill.patient_name || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>
                            {bill.bill_type || 'Bill'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>{formatCurrency(billed)}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#16a34a' }}>{formatCurrency(allowed)}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: savings >= 0 ? '#16a34a' : '#dc2626' }}>
                          {formatCurrency(savings)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '9999px', 
                            fontSize: '12px', 
                            fontWeight: 500, 
                            background: bill.status === 'approve' ? '#dcfce7' : bill.status === 'review' ? '#fef3c7' : bill.status === 'deny' ? '#fee2e2' : '#f3f4f6',
                            color: bill.status === 'approve' ? '#16a34a' : bill.status === 'review' ? '#d97706' : bill.status === 'deny' ? '#dc2626' : '#6b7280',
                            textTransform: 'capitalize'
                          }}>
                            {bill.status || 'Processed'}
                          </span>
                          {flags.length > 0 && (
                            <span style={{ marginLeft: '8px', padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '9999px', fontSize: '11px' }}>
                              {flags.length} flags
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/workflows/provider-bills/${bill.id}`);
                            }}
                            style={{ padding: '6px 12px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {processedBills.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                <strong>Summary:</strong> {processedBills.length} bills | 
                Total Billed: {formatCurrency(processedBills.reduce((sum, b) => sum + (parseFloat(b.billed_amount) || 0), 0))} | 
                Total Allowed: {formatCurrency(processedBills.reduce((sum, b) => sum + (parseFloat(b.allowed_amount) || 0), 0))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Integration Config Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Intake Configuration */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00d4ff' }}>📥</span>
              Intake Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email Intake Address</label>
                <input type="email" value={intakeConfig.emailIntake} readOnly style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>FTP Host</label>
                <input type="text" value={intakeConfig.ftpHost} onChange={(e) => setIntakeConfig({ ...intakeConfig, ftpHost: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>FTP Path</label>
                <input type="text" value={intakeConfig.ftpPath} onChange={(e) => setIntakeConfig({ ...intakeConfig, ftpPath: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>FTP Username</label>
                <input type="text" value={intakeConfig.ftpUsername} onChange={(e) => setIntakeConfig({ ...intakeConfig, ftpUsername: e.target.value })} placeholder="Enter username" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* Output Configuration */}
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
              <button style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Types Tab */}
      {activeTab === 'documents' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Supported Document Types</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>AI automatically classifies and extracts data from these document types</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {documentTypes.map((doc) => (
              <div key={doc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{doc.name}</span>
                      <span style={{ padding: '2px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{doc.code}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>{doc.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {doc.extractionFields.map((field, i) => (
                        <span key={i} style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#475569' }}>{field}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repricing Rules Tab */}
      {activeTab === 'repricing' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Repricing Rules</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Configure how bills are repriced based on provider network status</p>
            </div>
            <button style={{ padding: '10px 20px', background: '#00d4ff', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              + Add Rule
            </button>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Rule Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Applies To</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {repricingRules.map((rule) => (
                  <tr key={rule.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{rule.priority}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{rule.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{rule.description}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>
                        {rule.type === 'percent_of_billed' ? `${rule.value}% of Billed` :
                         rule.type === 'percent_of_medicare' ? `${rule.value}% of Medicare` :
                         rule.type === 'fee_schedule' ? 'Fee Schedule' : 'Contract Rate'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', background: rule.appliesTo === 'in_network' ? '#dcfce7' : rule.appliesTo === 'out_of_network' ? '#fee2e2' : '#f3f4f6', color: rule.appliesTo === 'in_network' ? '#16a34a' : rule.appliesTo === 'out_of_network' ? '#dc2626' : '#6b7280', borderRadius: '4px', fontSize: '12px', textTransform: 'capitalize' }}>
                        {rule.appliesTo.replace('_', '-')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={rule.enabled} onChange={() => setRepricingRules(rules => rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '14px', color: rule.enabled ? '#16a34a' : '#64748b' }}>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Detection Tab */}
      {activeTab === 'errors' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Error Detection Rules</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Configure automatic detection of billing errors and anomalies</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {errorRules.map((rule) => {
              const severityColor = getSeverityColor(rule.severity);
              return (
                <div key={rule.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={rule.enabled} onChange={() => setErrorRules(rules => rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))} style={{ width: '18px', height: '18px' }} />
                    </label>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px', opacity: rule.enabled ? 1 : 0.5 }}>{rule.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', opacity: rule.enabled ? 1 : 0.5 }}>{rule.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: severityColor.bg, color: severityColor.text, textTransform: 'uppercase' }}>
                      {rule.severity}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>
                      {rule.action === 'auto_deny' ? 'Auto Deny' : rule.action === 'auto_adjust' ? 'Auto Adjust' : 'Flag for Review'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Processing Queue Tab */}
      {activeTab === 'queue' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Processing Queue</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Bills pending review and recently processed</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Needs Review (3)</button>
              <button style={{ padding: '8px 16px', background: '#0a0f1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>All</button>
            </div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Patient</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Billed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Allowed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Flags</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <td style={{ padding: '16px', fontWeight: 500, fontSize: '14px' }}>{item.provider}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{item.patient}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>{item.docType}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>{formatCurrency(item.billed)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#16a34a' }}>{formatCurrency(item.allowed)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {item.flags > 0 ? (
                        <span style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 }}>{item.flags}</span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>✓</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: item.status === 'ready' ? '#dcfce7' : item.status === 'needs_review' ? '#fef3c7' : '#f3f4f6', color: item.status === 'ready' ? '#16a34a' : item.status === 'needs_review' ? '#d97706' : '#6b7280' }}>
                        {item.status === 'ready' ? 'Ready' : item.status === 'needs_review' ? 'Needs Review' : 'Processed'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>{formatDate(item.received)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
              <strong>Today's Summary:</strong> 47 bills processed | $234,500 billed | $156,200 allowed | <strong>$78,300 savings (33%)</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
