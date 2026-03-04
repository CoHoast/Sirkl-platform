'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MFAVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isRecoveryCode: useRecovery })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

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
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            🔐
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
            Two-Factor Authentication
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {useRecovery 
              ? 'Enter one of your recovery codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {/* Error Message */}
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

        {/* Verification Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              {useRecovery ? 'Recovery Code' : 'Verification Code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              required
              autoComplete="one-time-code"
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '0.5em',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder={useRecovery ? 'XXXX-XXXX' : '000000'}
              maxLength={useRecovery ? 9 : 6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={() => {
              setUseRecovery(!useRecovery);
              setCode('');
              setError('');
            }}
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
            {useRecovery ? 'Use authenticator app instead' : "Can't access your authenticator?"}
          </button>
        </form>

        {/* Back to Login */}
        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <a 
            href="/login" 
            style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}
          >
            ← Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
