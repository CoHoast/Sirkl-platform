'use client';

import { useState, useEffect } from 'react';

interface BillingConfig {
  id: number;
  client_id: number;
  client_name: string;
  client_slug: string;
  client_status: string;
  plan_name: string;
  billing_type: string;
  price_per_document: string;
  monthly_minimum: string;
  monthly_cap: string;
  setup_fee: string;
  setup_fee_paid: boolean;
  billing_email: string;
  billing_notes: string;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  total_documents: number;
  documents_this_month: number;
}

interface BillingCharge {
  id: number;
  client_id: number;
  client_name: string;
  billing_period: string;
  charge_type: string;
  description: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  status: string;
  invoice_number: string;
  invoice_date: string;
  paid_date: string;
  notes: string;
  created_at: string;
}

export default function BillingPage() {
  const [billingConfigs, setBillingConfigs] = useState<BillingConfig[]>([]);
  const [charges, setCharges] = useState<BillingCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'charges' | 'usage'>('plans');
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [calculatingUsage, setCalculatingUsage] = useState(false);
  
  // Edit modal
  const [editingClient, setEditingClient] = useState<BillingConfig | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Add charge modal
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [newCharge, setNewCharge] = useState({
    clientId: '',
    billingPeriod: new Date().toISOString().slice(0, 7),
    chargeType: 'document_processing',
    description: '',
    quantity: 1,
    unitPrice: '',
    notes: ''
  });

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const [configRes, chargesRes] = await Promise.all([
        fetch('/api/db/billing'),
        fetch('/api/db/billing/charges')
      ]);
      const configData = await configRes.json();
      const chargesData = await chargesRes.json();
      setBillingConfigs(configData.billingConfigs || []);
      setCharges(chargesData.charges || []);
    } catch (err) {
      console.error('Failed to fetch billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageSummary = async () => {
    try {
      const res = await fetch(`/api/db/billing/calculate?action=summary&period=${selectedPeriod}`);
      const data = await res.json();
      setUsageSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const calculateAllUsage = async () => {
    setCalculatingUsage(true);
    try {
      await fetch('/api/db/billing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate-all', billingPeriod: selectedPeriod })
      });
      await fetchUsageSummary();
    } catch (err) {
      console.error('Failed to calculate:', err);
    } finally {
      setCalculatingUsage(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  useEffect(() => {
    if (activeTab === 'usage') {
      fetchUsageSummary();
    }
  }, [activeTab, selectedPeriod]);

  const handleSaveConfig = async () => {
    if (!editingClient) return;
    try {
      const res = await fetch('/api/db/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: editingClient.client_id,
          ...editForm
        })
      });
      if (res.ok) {
        setEditingClient(null);
        fetchBilling();
      }
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleAddCharge = async () => {
    if (!newCharge.clientId || !newCharge.unitPrice) return;
    try {
      const res = await fetch('/api/db/billing/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharge)
      });
      if (res.ok) {
        setShowAddCharge(false);
        setNewCharge({
          clientId: '',
          billingPeriod: new Date().toISOString().slice(0, 7),
          chargeType: 'document_processing',
          description: '',
          quantity: 1,
          unitPrice: '',
          notes: ''
        });
        fetchBilling();
      }
    } catch (err) {
      console.error('Failed to add charge:', err);
    }
  };

  const handleMarkPaid = async (chargeId: number) => {
    try {
      await fetch('/api/db/billing/charges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chargeId, status: 'paid', paidDate: new Date().toISOString().slice(0, 10) })
      });
      fetchBilling();
    } catch (err) {
      console.error('Failed to update charge:', err);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const calculateMonthlyEstimate = (config: BillingConfig) => {
    const docsThisMonth = config.documents_this_month || 0;
    const pricePerDoc = parseFloat(config.price_per_document) || 0;
    const estimate = docsThisMonth * pricePerDoc;
    const minimum = parseFloat(config.monthly_minimum) || 0;
    return Math.max(estimate, minimum);
  };

  const chargeTypes = [
    { value: 'document_processing', label: 'Document Processing' },
    { value: 'setup_fee', label: 'Setup Fee' },
    { value: 'monthly_minimum', label: 'Monthly Minimum' },
    { value: 'overage', label: 'Overage Charge' },
    { value: 'support', label: 'Support Services' },
    { value: 'custom', label: 'Custom Charge' },
  ];

  const billingTypes = [
    { value: 'per_document', label: 'Per Document' },
    { value: 'monthly_flat', label: 'Monthly Flat Rate' },
    { value: 'tiered', label: 'Tiered Volume' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#6b7280' }}>Loading billing data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Billing Management</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Manage client billing plans and track charges</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Active Clients</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{billingConfigs.filter(c => c.is_active).length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Est. Monthly Revenue</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
            {formatCurrency(billingConfigs.reduce((sum, c) => sum + calculateMonthlyEstimate(c), 0))}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Pending Charges</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#d97706' }}>
            {formatCurrency(charges.filter(c => c.status === 'pending').reduce((sum, c) => sum + parseFloat(c.total_amount), 0))}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Docs This Month</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#00d4ff' }}>
            {billingConfigs.reduce((sum, c) => sum + (c.documents_this_month || 0), 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'plans', label: 'Client Plans', icon: '📋' },
          { id: 'charges', label: 'Charges & Invoices', icon: '💰' },
          { id: 'usage', label: 'Usage & Tiers', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500,
              color: activeTab === tab.id ? '#00d4ff' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Client Plans Tab */}
      {activeTab === 'plans' && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Client</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Plan</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Price/Doc</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Monthly Min</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Docs (Month)</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Est. Revenue</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingConfigs.map(config => (
                <tr key={config.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontWeight: 600, color: '#0a0f1a', marginBottom: '2px' }}>{config.client_name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{config.billing_email || 'No billing email'}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}>{config.plan_name}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(config.price_per_document)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(config.monthly_minimum)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500 }}>{config.documents_this_month || 0}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{formatCurrency(calculateMonthlyEstimate(config))}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setEditingClient(config);
                        setEditForm({
                          planName: config.plan_name,
                          billingType: config.billing_type,
                          pricePerDocument: config.price_per_document,
                          monthlyMinimum: config.monthly_minimum,
                          monthlyCap: config.monthly_cap,
                          setupFee: config.setup_fee,
                          setupFeePaid: config.setup_fee_paid,
                          billingEmail: config.billing_email,
                          billingNotes: config.billing_notes,
                          contractStart: config.contract_start?.slice(0, 10),
                          contractEnd: config.contract_end?.slice(0, 10),
                          isActive: config.is_active
                        });
                      }}
                      style={{ padding: '6px 12px', background: 'rgba(0,212,255,0.1)', border: 'none', borderRadius: '6px', color: '#00b8e6', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Edit Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowAddCharge(true)}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Charge
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {charges.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                <p>No charges recorded yet</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Client</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Period</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Type</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Amount</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map(charge => (
                    <tr key={charge.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 500 }}>{charge.client_name}</td>
                      <td style={{ padding: '16px 20px', color: '#6b7280' }}>{charge.billing_period}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '13px' }}>{chargeTypes.find(t => t.value === charge.charge_type)?.label || charge.charge_type}</span>
                        {charge.description && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{charge.description}</p>}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(charge.total_amount)}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: charge.status === 'paid' ? '#dcfce7' : charge.status === 'invoiced' ? '#dbeafe' : '#fef3c7',
                          color: charge.status === 'paid' ? '#166534' : charge.status === 'invoiced' ? '#1d4ed8' : '#92400e'
                        }}>
                          {charge.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {charge.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(charge.id)}
                            style={{ padding: '6px 12px', background: '#dcfce7', border: 'none', borderRadius: '6px', color: '#166534', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Usage & Tiers Tab */}
      {activeTab === 'usage' && (
        <div>
          {/* Period Selector & Calculate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontWeight: 500 }}>Billing Period:</label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={calculateAllUsage}
              disabled={calculatingUsage}
              style={{
                padding: '10px 20px',
                background: calculatingUsage ? '#9ca3af' : 'linear-gradient(135deg, #00d4ff, #00b8e6)',
                color: '#0a0f1a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: calculatingUsage ? 'not-allowed' : 'pointer'
              }}
            >
              {calculatingUsage ? 'Calculating...' : '🔄 Recalculate All'}
            </button>
          </div>

          {/* Tier Structure Info */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Standard Tier Structure</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { tier: 1, range: '0-500', price: '$3.00' },
                { tier: 2, range: '501-1,500', price: '$2.50' },
                { tier: 3, range: '1,501-3,500', price: '$2.00' },
                { tier: 4, range: '3,501-7,500', price: '$1.50' },
                { tier: 5, range: '7,501-15,000', price: '$1.25' },
                { tier: 6, range: '15,001-30,000', price: '$1.00' },
                { tier: 7, range: '30,001-50,000', price: '$0.80' },
                { tier: 8, range: '50,001+', price: '$0.65' },
              ].map(t => (
                <div key={t.tier} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tier {t.tier}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0a0f1a' }}>{t.price}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{t.range} docs</div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Summary */}
          {usageSummary && (
            <>
              {/* Totals */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Documents ({selectedPeriod})</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{usageSummary.totals?.totalDocuments?.toLocaleString() || 0}</p>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Billable Amount</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(usageSummary.totals?.totalAmount || 0)}</p>
                </div>
              </div>

              {/* Per-Client Breakdown */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Client</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Documents</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Amount</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageSummary.clients?.map((client: any) => (
                      <tr key={client.clientId} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 500 }}>{client.clientName}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>{client.documentCount.toLocaleString()}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{formatCurrency(client.calculatedAmount)}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: client.finalized ? '#dcfce7' : '#fef3c7',
                            color: client.finalized ? '#166534' : '#92400e'
                          }}>
                            {client.finalized ? 'Finalized' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!usageSummary && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              <p>Select a billing period and click "Recalculate All" to see usage breakdown</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingClient(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', margin: '20px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Edit Billing - {editingClient.client_name}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Plan Name</label>
                <input type="text" value={editForm.planName || ''} onChange={e => setEditForm({ ...editForm, planName: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Billing Type</label>
                <select value={editForm.billingType || 'per_document'} onChange={e => setEditForm({ ...editForm, billingType: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                  {billingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Price Per Document ($)</label>
                <input type="number" step="0.01" value={editForm.pricePerDocument || ''} onChange={e => setEditForm({ ...editForm, pricePerDocument: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Monthly Minimum ($)</label>
                <input type="number" step="0.01" value={editForm.monthlyMinimum || ''} onChange={e => setEditForm({ ...editForm, monthlyMinimum: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Monthly Cap ($)</label>
                <input type="number" step="0.01" value={editForm.monthlyCap || ''} onChange={e => setEditForm({ ...editForm, monthlyCap: e.target.value })} placeholder="No cap" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Setup Fee ($)</label>
                <input type="number" step="0.01" value={editForm.setupFee || ''} onChange={e => setEditForm({ ...editForm, setupFee: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Billing Email</label>
                <input type="email" value={editForm.billingEmail || ''} onChange={e => setEditForm({ ...editForm, billingEmail: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Contract Start</label>
                <input type="date" value={editForm.contractStart || ''} onChange={e => setEditForm({ ...editForm, contractStart: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Contract End</label>
                <input type="date" value={editForm.contractEnd || ''} onChange={e => setEditForm({ ...editForm, contractEnd: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Notes</label>
                <textarea value={editForm.billingNotes || ''} onChange={e => setEditForm({ ...editForm, billingNotes: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.setupFeePaid || false} onChange={e => setEditForm({ ...editForm, setupFeePaid: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px' }}>Setup Fee Paid</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.isActive !== false} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px' }}>Active</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setEditingClient(null)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveConfig} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Charge Modal */}
      {showAddCharge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddCharge(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', margin: '20px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add Billing Charge</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Client *</label>
                <select value={newCharge.clientId} onChange={e => setNewCharge({ ...newCharge, clientId: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                  <option value="">Select client...</option>
                  {billingConfigs.map(c => <option key={c.client_id} value={c.client_id}>{c.client_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Billing Period *</label>
                  <input type="month" value={newCharge.billingPeriod} onChange={e => setNewCharge({ ...newCharge, billingPeriod: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Charge Type *</label>
                  <select value={newCharge.chargeType} onChange={e => setNewCharge({ ...newCharge, chargeType: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                    {chargeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Description</label>
                <input type="text" value={newCharge.description} onChange={e => setNewCharge({ ...newCharge, description: e.target.value })} placeholder="e.g., 150 documents processed" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Quantity</label>
                  <input type="number" value={newCharge.quantity} onChange={e => setNewCharge({ ...newCharge, quantity: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Unit Price ($) *</label>
                  <input type="number" step="0.01" value={newCharge.unitPrice} onChange={e => setNewCharge({ ...newCharge, unitPrice: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              {newCharge.quantity && newCharge.unitPrice && (
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Total: </span>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#0a0f1a' }}>{formatCurrency(newCharge.quantity * parseFloat(newCharge.unitPrice || '0'))}</span>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Notes</label>
                <textarea value={newCharge.notes} onChange={e => setNewCharge({ ...newCharge, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowAddCharge(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddCharge} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add Charge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
