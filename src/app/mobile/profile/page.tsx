'use client';

import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import '../mobile.css';

// Inline SVG icons with explicit sizing (Heroicons don't respect Tailwind classes)
const BellIcon = () => (
  <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const ComputerIcon = () => (
  <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
  </svg>
);

const ShieldIcon = () => (
  <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const HelpIcon = () => (
  <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

const ChevronIcon = () => (
  <svg style={{ width: 18, height: 18, color: '#d1d5db' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const SignOutIcon = () => (
  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

export default function MobileProfile() {
  const router = useRouter();

  const handleSignOut = () => {
    router.push('/');
  };

  const handleSwitchToDesktop = () => {
    router.push('/dashboard');
  };

  const menuItems = [
    {
      icon: <BellIcon />,
      label: 'Notifications',
      value: 'On',
      onClick: () => {},
    },
    {
      icon: <ComputerIcon />,
      label: 'Switch to Desktop',
      subtitle: 'DOKit Mobile v1.0.0',
      onClick: handleSwitchToDesktop,
    },
    {
      icon: <ShieldIcon />,
      label: 'Security',
      onClick: () => {},
    },
    {
      icon: <HelpIcon />,
      label: 'Help & Support',
      onClick: () => {},
    },
  ];

  return (
    <MobileLayout title="Profile">
      {/* User Card */}
      <div className="mobile-section" style={{ paddingTop: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 20,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0a0f1a 0%, #060912 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 600,
            color: 'white',
            flexShrink: 0,
          }}>JW</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px 0' }}>John Guiher</h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 2px 0' }}>Admissions Director</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Dublin, OH</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mobile-section">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 16,
        }}>
          {[
            { value: '47', label: 'REVIEWED', sublabel: 'TODAY' },
            { value: '94%', label: 'APPROVAL', sublabel: 'RATE' },
            { value: '2.3m', label: 'AVG REVIEW', sublabel: 'TIME' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: 12,
              padding: '16px 12px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <span style={{ display: 'block', fontSize: 22, fontWeight: 700, color: '#0a0f1a', marginBottom: 4 }}>{stat.value}</span>
              <span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</span>
              <span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.sublabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mobile-section" style={{ marginTop: 24 }}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {menuItems.map((item, index) => (
            <button 
              key={index} 
              onClick={item.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                padding: 16,
                background: 'transparent',
                border: 'none',
                borderBottom: index < menuItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ color: '#6b7280', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 16, color: '#1a1a1a' }}>{item.label}</span>
                {item.subtitle && (
                  <span style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.subtitle}</span>
                )}
              </div>
              {item.value ? (
                <span style={{ fontSize: 14, color: '#9ca3af' }}>{item.value}</span>
              ) : (
                <ChevronIcon />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="mobile-section" style={{ marginTop: 24, paddingBottom: 120 }}>
        <button 
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: 16,
            background: 'white',
            border: '1px solid #fecaca',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 500,
            color: '#dc2626',
            cursor: 'pointer',
          }}
        >
          <SignOutIcon />
          Sign Out
        </button>
      </div>
    </MobileLayout>
  );
}
