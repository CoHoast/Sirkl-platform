'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClient } from '@/context/ClientContext';

interface LineItem {
  cpt_code: string;
  description: string;
  quantity: number;
  charge: number;
}

export default function NewBillPage() {
  const router = useRouter();
  const { selectedClient } = useClient();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    member_id: '',
    member_name: '',
    provider_name: '',
    provider_npi: '',
    account_number: '',
    date_of_service: '',
    total_billed: '',
    notes: ''
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { cpt_code: '', description: '', quantity: 1, charge: 0 }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
    
    // Auto-calculate total
    const total = updated.reduce((sum, item) => sum + (item.charge * item.quantity), 0);
    setFormData(prev => ({ ...prev, total_billed: total.toString() }));
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { cpt_code: '', description: '', quantity: 1, charge: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const updated = lineItems.filter((_, i) => i !== index);
      setLineItems(updated);
      
      // Recalculate total
      const total = updated.reduce((sum, item) => sum + (item.charge * item.quantity), 0);
      setFormData(prev => ({ ...prev, total_billed: total.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }
    
    if (!formData.member_name || !formData.provider_name || !formData.total_billed) {
      alert('Please fill in required fields: Member Name, Provider Name, and Total Billed');
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        client_id: selectedClient.id,
        member_id: formData.member_id || `M-${Date.now()}`,
        member_name: formData.member_name,
        provider_name: formData.provider_name,
        provider_npi: formData.provider_npi,
        account_number: formData.account_number || `ACC-${Date.now()}`,
        date_of_service: formData.date_of_service || new Date().toISOString().split('T')[0],
        total_billed: parseFloat(formData.total_billed),
        line_items: lineItems.filter(li => li.cpt_code || li.description),
        notes: formData.notes,
        status: 'received'
      };
      
      const res = await fetch('/api/db/bill-negotiator/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create bill');
      }
      
      const data = await res.json();
      router.push(`/dashboard/bill-negotiator/bills/${data.id}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert(error instanceof Error ? error.message : 'Failed to create bill');
    }
    
    setLoading(false);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Link href="/dashboard/bill-negotiator" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
            Bill Negotiator
          </Link>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <Link href="/dashboard/bill-negotiator/bills" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
            Bills
          </Link>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#6366f1', fontWeight: 500, fontSize: '14px' }}>New</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Add New Bill
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Enter bill details to start the negotiation process
        </p>
      </div>

      {!selectedClient && (
        <div style={{
          padding: '16px 20px',
          background: '#fef3c7',
          borderRadius: '10px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span style={{ color: '#92400e', fontWeight: 500 }}>Please select a client from the dropdown before adding a bill.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Member & Provider Section */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Member & Provider Information</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Member Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="member_name"
                  value={formData.member_name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Member ID
                </label>
                <input
                  type="text"
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleChange}
                  placeholder="M-12345"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Provider Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="provider_name"
                  value={formData.provider_name}
                  onChange={handleChange}
                  placeholder="ABC Medical Center"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Provider NPI
                </label>
                <input
                  type="text"
                  name="provider_npi"
                  value={formData.provider_npi}
                  onChange={handleChange}
                  placeholder="1234567890"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bill Details Section */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Bill Details</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="ACC-12345"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Date of Service
                </label>
                <input
                  type="date"
                  name="date_of_service"
                  value={formData.date_of_service}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                  Total Billed <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                  <input
                    type="number"
                    name="total_billed"
                    value={formData.total_billed}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 28px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Line Items (Optional)</h2>
            <button
              type="button"
              onClick={addLineItem}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4"/>
              </svg>
              Add Line
            </button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 120px 40px', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>CPT Code</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Description</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Qty</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Charge</span>
              <span></span>
            </div>
            {lineItems.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 120px 40px', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={item.cpt_code}
                  onChange={(e) => handleLineItemChange(index, 'cpt_code', e.target.value)}
                  placeholder="99213"
                  style={{
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  placeholder="Office visit"
                  style={{
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  style={{
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="number"
                  value={item.charge || ''}
                  onChange={(e) => handleLineItemChange(index, 'charge', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  style={{
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  style={{
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: lineItems.length === 1 ? '#f8fafc' : '#fee2e2',
                    cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke={lineItems.length === 1 ? '#94a3b8' : '#dc2626'} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', color: '#64748b', marginRight: '16px' }}>Total:</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(formData.total_billed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Notes</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes about this bill..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link
            href="/dashboard/bill-negotiator/bills"
            style={{
              padding: '14px 28px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              background: 'white',
              color: '#374151',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !selectedClient}
            style={{
              padding: '14px 28px',
              background: loading || !selectedClient ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading || !selectedClient ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Create Bill
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
