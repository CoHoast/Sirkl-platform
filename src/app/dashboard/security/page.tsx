'use client';

import { useState } from 'react';

export default function SecurityPage() {
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleEnable2FA = () => {
    if (verificationCode === '123456') {
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      alert('Two-factor authentication enabled successfully!');
    } else {
      alert('Invalid code. For demo, use: 123456');
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Security Settings</h1>
        <p style={{ color: '#4a4a4a' }}>Manage your account security and authentication methods</p>
      </div>

      <div style={{ maxWidth: '800px' }}>
        {/* 2FA Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: twoFactorEnabled ? '#dcfce7' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="none" stroke={twoFactorEnabled ? '#16a34a' : '#dc2626'} strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Two-Factor Authentication</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {twoFactorEnabled 
                    ? 'Your account is protected with 2FA' 
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              background: twoFactorEnabled ? '#dcfce7' : '#fee2e2',
              color: twoFactorEnabled ? '#166534' : '#991b1b'
            }}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!twoFactorEnabled && (
            <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg width="24" height="24" fill="none" stroke="#ca8a04" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Security Recommendation</div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    Two-factor authentication is required for all users handling patient data. Please enable 2FA to comply with HIPAA security requirements.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {!twoFactorEnabled ? (
              <button onClick={() => setShowSetup2FA(true)} className="btn btn-primary">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Enable Two-Factor Authentication
              </button>
            ) : (
              <>
                <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  View Recovery Codes
                </button>
                <button style={{ padding: '10px 20px', background: 'white', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  Disable 2FA
                </button>
              </>
            )}
          </div>
        </div>

        {/* Data Retention Policy Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="none" stroke="#1e40af" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Data Retention Policy</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>HIPAA-compliant short-term data storage</p>
              </div>
            </div>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              background: '#dcfce7',
              color: '#166534'
            }}>
              Compliant
            </span>
          </div>

          <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg width="24" height="24" fill="none" stroke="#1e40af" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <div>
                <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '8px' }}>Short-Term Data Storage Model</div>
                <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                  To minimize Protected Health Information (PHI) exposure and maintain HIPAA compliance, 
                  this platform uses a short-term retention model. Application data is stored only as long 
                  as necessary for processing, after which it is automatically and permanently deleted from our systems.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Retention Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9f7f4', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" fill="none" stroke="#854d0e" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Pending & Review Applications</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>Applications awaiting decision</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#0a0f1a' }}>30</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>days</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9f7f4', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" fill="none" stroke="#166534" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Approved & Denied Applications</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>Applications synced to your CRM</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#0a0f1a' }}>7</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>days</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f9f7f4', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>What Happens After Retention Period:</div>
            <ul style={{ fontSize: '13px', color: '#666', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><strong>Automatic deletion</strong> — All application data is permanently removed from our servers</li>
              <li><strong>No recovery</strong> — Deleted data cannot be restored after the retention period</li>
              <li><strong>Audit trail preserved</strong> — Basic audit logs (action, timestamp, user) are retained for compliance</li>
              <li><strong>CRM sync</strong> — Approved applications are exported to your CRM before deletion</li>
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px' }}>
            <svg width="20" height="20" fill="none" stroke="#92400e" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div style={{ fontSize: '13px', color: '#92400e' }}>
              <strong>Important:</strong> Applications not processed within 30 days will be automatically deleted. 
              Review the Applications page to see countdown timers for each application.
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(39,83,128,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Password</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>Last changed 30 days ago</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Current Password</label>
              <input type="password" placeholder="Enter current password" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>New Password</label>
              <input type="password" placeholder="Enter new password" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Confirm New Password</label>
              <input type="password" placeholder="Confirm new password" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f9f7f4', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Password Requirements:</div>
            <ul style={{ fontSize: '13px', color: '#666', margin: 0, paddingLeft: '20px' }}>
              <li>At least 12 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character</li>
            </ul>
          </div>

          <button className="btn btn-primary">Update Password</button>
        </div>

        {/* Session Management */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(39,83,128,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Active Sessions</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>Manage devices where you&apos;re signed in</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { device: 'Chrome on MacOS', location: 'Bloomfield Hills, MI', time: 'Current session', current: true },
              { device: 'Safari on iPhone', location: 'Detroit, MI', time: '2 hours ago', current: false },
              { device: 'Chrome on Windows', location: 'Grand Rapids, MI', time: '1 day ago', current: false },
            ].map((session, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9f7f4', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {session.device}
                      {session.current && <span style={{ fontSize: '11px', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '10px' }}>Current</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{session.location} • {session.time}</div>
                  </div>
                </div>
                {!session.current && (
                  <button style={{ padding: '6px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#dc2626' }}>
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          <button style={{ marginTop: '16px', padding: '10px 20px', background: 'white', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            Sign Out All Other Sessions
          </button>
        </div>

        {/* Audit Log */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(39,83,128,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="none" stroke="#0a0f1a" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Security Audit Log</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>Recent security-related activity</p>
              </div>
            </div>
            <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              Download Full Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { action: 'Successful login', time: '2 minutes ago', ip: '192.168.1.100' },
              { action: 'Password changed', time: '30 days ago', ip: '192.168.1.100' },
              { action: 'New device added', time: '45 days ago', ip: '10.0.0.50' },
              { action: 'Failed login attempt', time: '60 days ago', ip: '203.0.113.50' },
            ].map((log, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{log.action}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>{log.time}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#888', fontFamily: 'monospace' }}>{log.ip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {showSetup2FA && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Set Up Two-Factor Authentication</h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>Scan this QR code with your authenticator app</p>
            
            {/* Fake QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '180px', 
                height: '180px', 
                background: '#f9f7f4', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid #e0e0e0'
              }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <rect fill="#1a1a1a" width="10" height="10" x="10" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="20" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="30" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="40" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="50" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="60" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="70" y="10"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="10" y="20"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="70" y="20"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="90" y="20"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="110" y="20"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="10" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="30" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="40" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="50" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="70" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="100" y="30"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="120" y="30"/>
                  {/* More QR pattern... simplified for demo */}
                  <rect fill="#1a1a1a" width="10" height="10" x="10" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="20" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="30" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="40" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="50" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="60" y="70"/>
                  <rect fill="#1a1a1a" width="10" height="10" x="70" y="70"/>
                </svg>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f9f7f4', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Or enter this code manually:</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '2px' }}>JBSW Y3DP EHPK 3PXP</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Enter verification code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  fontSize: '24px', 
                  textAlign: 'center', 
                  letterSpacing: '8px',
                  fontFamily: 'monospace',
                  outline: 'none', 
                  boxSizing: 'border-box' 
                }}
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                For demo, enter: 123456
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowSetup2FA(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={handleEnable2FA}
                disabled={verificationCode.length !== 6}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', background: '#0a0f1a', opacity: verificationCode.length === 6 ? 1 : 0.5 }}
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
