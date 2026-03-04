'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ProviderBill {
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

export default function ProviderBillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const [bill, setBill] = useState<ProviderBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await fetch(`/api/db/provider-bills/${billId}`);
        if (!response.ok) throw new Error('Bill not found');
        const data = await response.json();
        setBill(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  const formatCurrency = (amount: string | number | null) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === null || isNaN(num || 0)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading bill details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Bill not found'}</p>
        <button onClick={() => router.push('/dashboard/workflows/provider-bills')} style={{ color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Provider Bills
        </button>
      </div>
    );
  }

  const extractedData = bill.extracted_data || {};
  const flags = Array.isArray(bill.flags) ? bill.flags : [];
  const billed = parseFloat(bill.billed_amount) || 0;
  const allowed = parseFloat(bill.allowed_amount) || 0;
  const savings = parseFloat(bill.savings_amount) || 0;
  const savingsPercent = billed > 0 ? ((savings / billed) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/dashboard/workflows/provider-bills')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
        >
          ← Back to Provider Bills
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>
              Provider Bill #{bill.id}
            </h1>
            <p style={{ color: '#64748b' }}>
              Processed {formatDate(bill.processed_at || bill.created_at)}
            </p>
          </div>
          <span style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: 600,
            background: bill.status === 'approve' ? '#dcfce7' : bill.status === 'deny' ? '#fee2e2' : '#fef3c7',
            color: bill.status === 'approve' ? '#16a34a' : bill.status === 'deny' ? '#dc2626' : '#d97706',
            textTransform: 'capitalize'
          }}>
            {bill.status || 'Review'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Billed Amount</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a0f1a' }}>{formatCurrency(billed)}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Allowed Amount</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(allowed)}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Savings</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: savings >= 0 ? '#16a34a' : '#dc2626' }}>
            {formatCurrency(savings)} <span style={{ fontSize: '14px', fontWeight: 500 }}>({savingsPercent}%)</span>
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Flags</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: flags.length > 0 ? '#dc2626' : '#16a34a' }}>
            {flags.length} {flags.length === 1 ? 'Flag' : 'Flags'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Provider & Patient Info */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏥</span> Provider Information
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Provider Name</p>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{bill.provider_name || 'Unknown'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>NPI</p>
              <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>{bill.provider_npi || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Bill Type</p>
              <p style={{ fontSize: '14px' }}>{bill.bill_type || 'N/A'}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> Patient Information
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Patient Name</p>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{bill.patient_name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚩</span> Flags & Warnings
          </h3>
          {flags.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#f0fdf4', borderRadius: '8px' }}>
              <p style={{ color: '#16a34a', fontWeight: 500 }}>✓ No flags detected</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {flags.map((flag: any, i: number) => (
                <div key={i} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: flag.severity === 'error' ? '#fef2f2' : flag.severity === 'warning' ? '#fef3c7' : '#f0f9ff',
                  border: `1px solid ${flag.severity === 'error' ? '#fecaca' : flag.severity === 'warning' ? '#fde68a' : '#bfdbfe'}`
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: flag.severity === 'error' ? '#dc2626' : flag.severity === 'warning' ? '#d97706' : '#2563eb',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {flag.severity || 'Info'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#374151' }}>{flag.message || JSON.stringify(flag)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Extracted Data */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span> AI Extracted Data
        </h3>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', overflow: 'auto', maxHeight: '400px' }}>
          <pre style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
