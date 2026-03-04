'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupMFAPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'scan' | 'verify' | 'recovery'>('scan');
  const [savedRecoveryCodes, setSavedRecoveryCodes] = useState(false);

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      const res = await fetch('/api/auth/mfa/setup');
      const data = await res.json();

      if (data.alreadyEnabled) {
        router.push('/dashboard');
        return;
      }

      setQrCode(data.qrCode);
      setRecoveryCodes(data.recoveryCodes);
      setLoading(false);
    } catch (err) {
      setError('Failed to load MFA setup');
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Verification failed');
        setVerifying(false);
        return;
      }

      setStep('recovery');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setVerifying(false);
    }
  };

  const handleComplete = () => {
    router.push('/change-password');
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    alert('Recovery codes copied to clipboard!');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)'
      }}>
        <p style={{ color: 'white' }}>Loading MFA setup...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {step === 'scan' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
                Set Up Two-Factor Authentication
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Scan this QR code with your authenticator app
              </p>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  style={{ 
                    maxWidth: '200px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'white'
                  }} 
                />
              )}
            </div>

            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px', 
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Use <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP-compatible app
            </p>

            <button
              onClick={() => setStep('verify')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              I've scanned the QR code →
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
                Verify Setup
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  marginBottom: '24px',
                  boxSizing: 'border-box'
                }}
                placeholder="000000"
              />

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: verifying || code.length !== 6 ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                  marginBottom: '16px'
                }}
              >
                {verifying ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>

              <button
                type="button"
                onClick={() => setStep('scan')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ← Back to QR code
              </button>
            </form>
          </>
        )}

        {step === 'recovery' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px'
              }}>
                ✅
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
                MFA Enabled Successfully!
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Save these recovery codes in a secure place
              </p>
            </div>

            {/* Recovery Codes */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {recoveryCodes.map((code, i) => (
                  <div key={i} style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={copyRecoveryCodes}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              📋 Copy recovery codes
            </button>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={savedRecoveryCodes}
                  onChange={(e) => setSavedRecoveryCodes(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  I have saved my recovery codes in a secure location
                </span>
              </label>
            </div>

            <button
              onClick={handleComplete}
              disabled={!savedRecoveryCodes}
              style={{
                width: '100%',
                padding: '14px',
                background: savedRecoveryCodes ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: savedRecoveryCodes ? 'pointer' : 'not-allowed'
              }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
