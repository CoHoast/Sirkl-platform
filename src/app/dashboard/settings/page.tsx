'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newApplication: true,
    statusChange: true,
    dailyDigest: false
  });

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: '#4a4a4a' }}>Manage your account and notification preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        {/* Settings Nav */}
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['Profile', 'Notifications', 'Security', 'Integrations', 'Team'].map((item, i) => (
              <a
                key={item}
                href="#"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: i === 1 ? 'white' : '#4a4a4a',
                  background: i === 1 ? '#0a0f1a' : 'transparent',
                  fontWeight: i === 1 ? 500 : 400
                }}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Section */}
          <div className="card">
            <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Profile Information</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#0a0f1a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 600
              }}>
                JW
              </div>
              <div>
                <button style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}>
                  Upload Photo
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}>
                  Remove
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>First Name</label>
                <input
                  type="text"
                  defaultValue="Jennifer"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Last Name</label>
                <input
                  type="text"
                  defaultValue="Walsh"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Email</label>
                <input
                  type="email"
                  defaultValue="john.guiher@mco-advantage.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Role</label>
                <input
                  type="text"
                  defaultValue="Admissions Director"
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    background: '#f9f7f4',
                    color: '#666',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="card">
            <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Notification Preferences</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '16px' }}>Channels</h3>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Text message alerts for urgent items' },
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{item.desc}</div>
                  </div>
                  <label style={{ position: 'relative', width: '48px', height: '28px' }}>
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: notifications[item.key as keyof typeof notifications] ? '#0a0f1a' : '#e0e0e0',
                      borderRadius: '28px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '22px',
                        width: '22px',
                        left: notifications[item.key as keyof typeof notifications] ? '23px' : '3px',
                        bottom: '3px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '16px' }}>Events</h3>
              {[
                { key: 'newApplication', label: 'New Applications', desc: 'When a new application is submitted' },
                { key: 'statusChange', label: 'Status Changes', desc: 'When application status is updated' },
                { key: 'dailyDigest', label: 'Daily Digest', desc: 'Summary of daily activity at 8am' },
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{item.desc}</div>
                  </div>
                  <label style={{ position: 'relative', width: '48px', height: '28px' }}>
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: notifications[item.key as keyof typeof notifications] ? '#0a0f1a' : '#e0e0e0',
                      borderRadius: '28px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '22px',
                        width: '22px',
                        left: notifications[item.key as keyof typeof notifications] ? '23px' : '3px',
                        bottom: '3px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ border: '1px solid #fecaca' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#dc2626' }}>Danger Zone</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>Irreversible actions for your account</p>
            <button style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #dc2626',
              color: '#dc2626',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
