'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    // Check if password change is required
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.mustChangePassword) {
          setIsRequired(true);
        }
      });
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 12) errors.push('At least 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordErrors.length > 0) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      // Check if MFA needs to be set up, then redirect appropriately
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (!sessionData.mfaEnabled) {
        window.location.href = '/setup-mfa';
      } else {
        window.location.href = '/dashboard';
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
        maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: isRequired ? '#fef3c7' : '#f0fdf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px'
          }}>
            {isRequired ? '⚠️' : '🔑'}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
            {isRequired ? 'Change Your Password' : 'Update Password'}
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {isRequired 
              ? 'You must set a new secure password to continue'
              : 'Create a strong password for your account'}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${newPassword && passwordErrors.length > 0 ? '#fecaca' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            
            {/* Password Requirements */}
            {newPassword && (
              <div style={{ marginTop: '12px', fontSize: '13px' }}>
                <p style={{ color: '#6b7280', margin: '0 0 8px' }}>Password requirements:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {[
                    { check: newPassword.length >= 12, text: '12+ characters' },
                    { check: /[A-Z]/.test(newPassword), text: 'Uppercase letter' },
                    { check: /[a-z]/.test(newPassword), text: 'Lowercase letter' },
                    { check: /[0-9]/.test(newPassword), text: 'Number' },
                    { check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'Special character' },
                  ].map((req, i) => (
                    <div key={i} style={{ 
                      color: req.check ? '#16a34a' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {req.check ? '✓' : '○'} {req.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${confirmPassword && !passwordsMatch ? '#fecaca' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            {confirmPassword && !passwordsMatch && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordErrors.length > 0 || !passwordsMatch || !confirmPassword}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || passwordErrors.length > 0 || !passwordsMatch || !confirmPassword
                ? '#9ca3af'
                : 'linear-gradient(135deg, #2563eb, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || passwordErrors.length > 0 || !passwordsMatch || !confirmPassword
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {loading ? 'Changing password...' : 'Change Password'}
          </button>
        </form>

        {!isRequired && (
          <p style={{ textAlign: 'center', marginTop: '24px' }}>
            <a 
              href="/dashboard" 
              style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}
            >
              Cancel
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
