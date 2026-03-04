'use client';

import { useEffect, useState } from 'react';

// Generate QR code URL using Google Charts API (no dependencies needed)
const getQRCodeUrl = (url: string, size: number = 200) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=00d4ff`;
};

// Modal component
const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 28px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          background: 'white',
          borderRadius: '20px 20px 0 0',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div style={{ padding: '28px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// SVG Icons for features
const FeatureIcons = {
  palette: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z"/></svg>,
  sparkles: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>,
  mobile: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>,
  bolt: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>,
  email: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>,
  upload: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></svg>,
  camera: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/></svg>,
  chart: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>,
  users: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>,
  clipboard: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>,
  link: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>,
  document: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>,
  lock: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>,
  calendar: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>,
  cloud: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/></svg>,
  phone: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>,
  inbox: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"/></svg>,
  pencil: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>,
  check: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>,
  shield: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>,
  bell: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>,
  user: <svg width="20" height="20" fill="none" stroke="#0a0f1a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>,
};

// Feature list item
const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d0e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>{title}</h4>
      <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
  </div>
);

// Section divider
const SectionTitle = ({ children }: { children: string }) => (
  <h3 style={{ 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#0a0f1a', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px',
    marginTop: '28px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e8f4f8',
  }}>
    {children}
  </h3>
);

// Button component
const DemoButton = ({ 
  href, 
  onClick, 
  children, 
  primary = false 
}: { 
  href?: string; 
  onClick?: () => void; 
  children: React.ReactNode; 
  primary?: boolean;
}) => {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    width: '100%',
    ...(primary ? {
      background: '#0a0f1a',
      color: 'white',
    } : {
      background: '#f0f4f8',
      color: '#0a0f1a',
    }),
  };
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export default function DemoLauncherPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [activeModal, setActiveModal] = useState<'marketing' | 'dashboard' | 'mobile' | null>(null);
  
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const DEMO_LINKS = {
    marketing: 'https://mco-advantage-marketing-production.up.railway.app',
    dashboard: 'https://mco-advantage-production.up.railway.app/dashboard',
    mobile: 'https://mco-advantage-production.up.railway.app/mobile',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f6f3 0%, #e8e4df 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginBottom: '48px' 
      }}>
        <img 
          src="https://www.mcoadvantage.com/wp-content/uploads/2023/03/mco-advantage_logonav.webp" 
          alt="MCO Advantage Health & Rehabilitation"
          style={{ height: '56px', width: 'auto', display: 'block' }}
        />
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(39, 83, 128, 0.08)',
          border: '1px solid rgba(39, 83, 128, 0.15)',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#0a0f1a',
          marginTop: '16px',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Product Demo
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 600,
          color: '#1a1a1a',
          textAlign: 'center',
          marginTop: '24px',
          marginBottom: '8px',
          lineHeight: 1.4
        }}>
          AI-Powered Admissions Platform
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          maxWidth: '500px',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: 0,
        }}>
          Automated document intake and processing for healthcare admissions
        </p>
        
        {currentTime && (
          <p style={{ fontSize: '13px', color: '#999', marginTop: '16px', margin: '16px 0 0' }}>
            {currentTime}
          </p>
        )}
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        
        {/* Marketing Site Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '480px',
        }}>
          <div style={{
            borderRadius: '12px',
            marginBottom: '20px',
            overflow: 'hidden',
            height: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}>
            <img 
              src="/demo-previews/marketing-preview.jpg" 
              alt="Marketing Website Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#1a1a1a' }}>
            Marketing Website
          </h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, flex: 1 }}>
            Modern, user-friendly public website for prospective patients and families.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <DemoButton href={DEMO_LINKS.marketing} primary>
              <span>Visit Site</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </DemoButton>
            <DemoButton onClick={() => setActiveModal('marketing')}>
              <span>More Info</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </DemoButton>
          </div>
        </div>

        {/* Dashboard Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '480px',
        }}>
          <div style={{
            borderRadius: '12px',
            marginBottom: '20px',
            overflow: 'hidden',
            height: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}>
            <img 
              src="/demo-previews/dashboard-preview.jpg" 
              alt="Dashboard Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }}
            />
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#1a1a1a' }}>
            Desktop Dashboard
          </h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, flex: 1 }}>
            AI-powered document intake and processing for admissions coordinators.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <DemoButton href={DEMO_LINKS.dashboard} primary>
              <span>Open Dashboard</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </DemoButton>
            <DemoButton onClick={() => setActiveModal('dashboard')}>
              <span>More Info</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </DemoButton>
          </div>
        </div>

        {/* Mobile App Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '480px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#1a1a1a', textAlign: 'center' }}>
            Mobile Web App
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: 1.6, textAlign: 'center' }}>
            On-the-go application review for field staff.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            background: '#f9f7f4',
            borderRadius: '16px',
            flex: 1,
            justifyContent: 'center',
          }}>
            <img 
              src={getQRCodeUrl(DEMO_LINKS.mobile, 140)}
              alt="Scan to open mobile app"
              style={{ width: '140px', height: '140px', borderRadius: '8px' }}
            />
            <p style={{ fontSize: '12px', color: '#888', marginTop: '12px', textAlign: 'center' }}>
              Scan with your phone camera
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <DemoButton href={DEMO_LINKS.mobile} primary>
              <span>Open App</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </DemoButton>
            <DemoButton onClick={() => setActiveModal('mobile')}>
              <span>More Info</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </DemoButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '48px',
        paddingTop: '32px',
        borderTop: '1px solid #e0ddd8'
      }}>
        <p style={{ fontSize: '13px', color: '#888' }}>
          Demo Environment • Powered by DOKit AI Platform
        </p>
        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
          Questions? Contact your sales representative
        </p>
      </div>

      {/* Marketing Website Modal */}
      <InfoModal 
        isOpen={activeModal === 'marketing'} 
        onClose={() => setActiveModal(null)}
        title="Marketing Website"
      >
        {/* Screenshot Preview */}
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <img 
            src="/demo-previews/marketing-preview.jpg" 
            alt="Marketing Website Preview"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        
        <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.7, marginBottom: '20px' }}>
          We&apos;ve completely redesigned the MCO Advantage public-facing website with a modern, clean, and welcoming aesthetic that reflects your commitment to exceptional patient care.
        </p>
        
        <SectionTitle>What We&apos;ve Built</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.palette}
          title="Modern Visual Design"
          description="Clean, professional layout with MCO Advantage brand colors. High-quality imagery, intuitive navigation, and mobile-responsive design that looks beautiful on any device."
        />
        
        <FeatureItem 
          icon={FeatureIcons.sparkles}
          title="Enhanced User Experience"
          description="Streamlined navigation with clear calls-to-action. Visitors can easily find care services, locations, and contact information without confusion."
        />
        
        <FeatureItem 
          icon={FeatureIcons.mobile}
          title="Mobile-First Approach"
          description="Fully responsive design optimized for smartphones and tablets. Families researching care options on the go will have a seamless experience."
        />
        
        <FeatureItem 
          icon={FeatureIcons.bolt}
          title="Fast & Accessible"
          description="Optimized for speed and accessibility compliance. Quick load times and clear typography ensure all visitors can access your information."
        />
        
        <SectionTitle>Key Improvements</SectionTitle>
        
        <ul style={{ paddingLeft: '20px', color: '#555', lineHeight: 1.8 }}>
          <li>Hero section highlighting &quot;Exceptional Care Since 1992&quot;</li>
          <li>Clear service categories (Skilled Nursing, Rehabilitation, etc.)</li>
          <li>Prominent &quot;Find a Location&quot; and &quot;Schedule a Tour&quot; buttons</li>
          <li>Statistics showcasing 30+ care communities and 100+ years leadership</li>
          <li>Modern imagery conveying warmth and professionalism</li>
          <li>Streamlined footer with quick links and contact information</li>
        </ul>
        
        <div style={{ 
          marginTop: '28px', 
          padding: '16px 20px', 
          background: '#f0f9ff', 
          borderRadius: '12px',
          borderLeft: '4px solid #0a0f1a'
        }}>
          <p style={{ fontSize: '14px', color: '#0a0f1a', margin: 0, fontWeight: 500 }}>
            💡 The redesigned website positions MCO Advantage as a modern, trustworthy healthcare provider while maintaining the warmth and compassion families are looking for.
          </p>
        </div>
      </InfoModal>

      {/* Dashboard Modal */}
      <InfoModal 
        isOpen={activeModal === 'dashboard'} 
        onClose={() => setActiveModal(null)}
        title="Desktop Dashboard"
      >
        {/* Screenshot Preview */}
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <img 
            src="/demo-previews/dashboard-preview.jpg" 
            alt="Dashboard Preview"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        
        <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.7, marginBottom: '20px' }}>
          The MCO Advantage Admissions Dashboard is a <strong>white-labeled AI-powered platform</strong> custom-built specifically for MCO Advantage workflows. Powered by DOKit technology, it automates document intake and processing to save your team hours of manual data entry.
        </p>
        
        <SectionTitle>AI Document Intake</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.email}
          title="Dedicated Email Intake"
          description="Forward referral documents to intake@mco-advantage.dokit.ai. Our system automatically processes incoming emails, extracts attachments, and queues them for AI analysis—no manual uploading required."
        />
        
        <FeatureItem 
          icon={FeatureIcons.upload}
          title="Manual Upload Option"
          description="Drag and drop documents directly into the dashboard. Supports PDFs, images, faxes, and scanned documents in any common format."
        />
        
        <FeatureItem 
          icon={FeatureIcons.camera}
          title="Mobile Scan & Submit"
          description="Field staff can photograph documents with their phone and submit directly through the mobile app—perfect for intake coordinators on the go."
        />
        
        <SectionTitle>Multi-Step AI Analysis</SectionTitle>
        
        <div style={{ 
          padding: '20px', 
          background: '#f9f7f4', 
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a0f1a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>1</div>
            <div>
              <strong>AI Document Analysis</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>Advanced AI analyzes the document image and extracts all patient data fields</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a0f1a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>2</div>
            <div>
              <strong>Confidence Scoring</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>Each extraction receives a confidence score. If below 85%, automatic re-analysis is triggered</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>✓</div>
            <div>
              <strong>Ready for Review</strong>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>High-confidence extractions are queued for human review; flagged items get extra attention</p>
            </div>
          </div>
        </div>
        
        <SectionTitle>Dashboard Features</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.chart}
          title="Real-Time Analytics"
          description="Track pending reviews, approvals, denials, and approval rates at a glance. Monitor application volume and team productivity."
        />
        
        <FeatureItem 
          icon={FeatureIcons.users}
          title="Role-Based Access Control"
          description="Administrators, Managers, and Reviewers each have tailored permissions. Control who can approve, edit, or view sensitive data."
        />
        
        <FeatureItem 
          icon={FeatureIcons.clipboard}
          title="Application Management"
          description="View, edit, approve, or deny applications. Side-by-side document viewer shows original document alongside extracted data."
        />
        
        <FeatureItem 
          icon={FeatureIcons.link}
          title="PointClickCare Integration"
          description="One-click sync approved patient data directly to your PointClickCare system—eliminating double data entry."
        />
        
        <FeatureItem 
          icon={FeatureIcons.document}
          title="Audit Trail & Reports"
          description="Complete audit log of all actions for compliance. Generate reports on processing times, approval rates, and volume trends."
        />
        
        <SectionTitle>Security & Compliance</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.lock}
          title="HIPAA Compliant"
          description="End-to-end encryption, secure authentication, and comprehensive audit logging meet healthcare data protection requirements."
        />
        
        <FeatureItem 
          icon={FeatureIcons.calendar}
          title="30-Day Data Retention"
          description="Patient data is retained for 30 days for processing and review, then automatically purged. Export approved records to your systems before retention period ends."
        />
        
        <FeatureItem 
          icon={FeatureIcons.cloud}
          title="Dedicated Infrastructure"
          description="Your MCO Advantage instance runs on isolated, dedicated infrastructure—not shared with other organizations. Your data stays yours."
        />
        
        <div style={{ 
          marginTop: '28px', 
          padding: '16px 20px', 
          background: '#f0fdf4', 
          borderRadius: '12px',
          borderLeft: '4px solid #16a34a'
        }}>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0, fontWeight: 500 }}>
            ⚡ Average processing time: Under 2 minutes from document receipt to review-ready status
          </p>
        </div>
      </InfoModal>

      {/* Mobile App Modal */}
      <InfoModal 
        isOpen={activeModal === 'mobile'} 
        onClose={() => setActiveModal(null)}
        title="Mobile Web App"
      >
        {/* iPhone Mockups - Pre-made images */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '12px',
          marginBottom: '28px',
          padding: '32px 16px',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow effects */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '30%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(39,83,128,0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '20%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(90,159,212,0.2) 0%, transparent 70%)',
            transform: 'translate(50%, -50%)',
          }}></div>
          
          {/* iPhone 1 - Inbox */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, transform: 'rotate(-3deg)' }}>
            <img 
              src="/demo-previews/mockup-inbox.png" 
              alt="Inbox Screen"
              style={{ width: '130px', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '12px', fontWeight: 500 }}>Inbox</p>
          </div>
          
          {/* iPhone 2 - Detail (Center, larger) */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <img 
              src="/demo-previews/mockup-detail.png" 
              alt="Application Detail Screen"
              style={{ width: '150px', height: 'auto', filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginTop: '12px', fontWeight: 600 }}>Application Detail</p>
          </div>
          
          {/* iPhone 3 - Scan */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, transform: 'rotate(3deg)' }}>
            <img 
              src="/demo-previews/mockup-scan.png" 
              alt="Scan Document Screen"
              style={{ width: '130px', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '12px', fontWeight: 500 }}>Scan</p>
          </div>
        </div>
        
        <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.7, marginBottom: '20px' }}>
          The MCO Advantage Mobile App is a <strong>Progressive Web App (PWA)</strong> that works just like a native iOS or Android app—without requiring app store downloads. Perfect for field staff, intake coordinators on the move, and anyone who needs to review applications away from their desk.
        </p>
        
        <SectionTitle>Native-Like Experience</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.phone}
          title="Add to Home Screen"
          description="Users can save the app to their phone's home screen and launch it just like any native app. Full-screen experience with no browser chrome."
        />
        
        <FeatureItem 
          icon={FeatureIcons.bolt}
          title="Instant Access"
          description="No app store downloads, no updates to install. Open the link once, add to home screen, and you're ready to go. Works offline for viewing cached data."
        />
        
        <FeatureItem 
          icon={FeatureIcons.sparkles}
          title="Touch-Optimized Interface"
          description="Large touch targets, swipe gestures, and mobile-first design. Every interaction is optimized for fingertips, not mouse clicks."
        />
        
        <SectionTitle>On-the-Go Features</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.inbox}
          title="Inbox & Review Queues"
          description="New applications appear in the Inbox. Once reviewed or edited, they move to the Review queue. Clear separation keeps work organized."
        />
        
        <FeatureItem 
          icon={FeatureIcons.pencil}
          title="Full Editing Capabilities"
          description="Edit any field on an application—patient info, diagnoses, medications, allergies, insurance details. Add or remove items from lists."
        />
        
        <FeatureItem 
          icon={FeatureIcons.camera}
          title="Document Scanning"
          description="Use your phone's camera to scan new documents. Multi-page support for longer referrals. Scanned docs go straight to AI processing."
        />
        
        <FeatureItem 
          icon={FeatureIcons.check}
          title="Approve or Deny"
          description="Make decisions right from your phone. Approved applications sync to PointClickCare. Denied applications are logged with reasons."
        />
        
        <SectionTitle>Access & Security</SectionTitle>
        
        <FeatureItem 
          icon={FeatureIcons.user}
          title="Role-Based Permissions"
          description="Same permission levels as the desktop dashboard. Reviewers can view and edit; Managers can approve; Admins have full access."
        />
        
        <FeatureItem 
          icon={FeatureIcons.shield}
          title="Secure Authentication"
          description="Protected login with the same credentials as the desktop dashboard. Session timeouts for security on shared or lost devices."
        />
        
        <FeatureItem 
          icon={FeatureIcons.bell}
          title="Push Notifications"
          description="Get notified when new applications arrive or when items need urgent attention. Stay responsive even when away from your desk."
        />
        
        <SectionTitle>How to Install</SectionTitle>
        
        <div style={{ 
          padding: '20px', 
          background: '#f9f7f4', 
          borderRadius: '12px',
          marginBottom: '12px'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '12px', color: '#1a1a1a' }}>iPhone / iPad:</p>
          <ol style={{ paddingLeft: '20px', margin: 0, color: '#555', lineHeight: 1.8 }}>
            <li>Open the mobile app link in Safari</li>
            <li>Tap the Share button (square with arrow)</li>
            <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
            <li>Tap &quot;Add&quot; to confirm</li>
          </ol>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#f9f7f4', 
          borderRadius: '12px'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '12px', color: '#1a1a1a' }}>Android:</p>
          <ol style={{ paddingLeft: '20px', margin: 0, color: '#555', lineHeight: 1.8 }}>
            <li>Open the mobile app link in Chrome</li>
            <li>Tap the three-dot menu</li>
            <li>Tap &quot;Add to Home screen&quot;</li>
            <li>Tap &quot;Add&quot; to confirm</li>
          </ol>
        </div>
        
        <div style={{ 
          marginTop: '28px', 
          padding: '16px 20px', 
          background: '#fef3c7', 
          borderRadius: '12px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ fontSize: '14px', color: '#92400e', margin: 0, fontWeight: 500 }}>
            📱 Pro tip: Add the app to your home screen for the best experience—it will open full-screen without browser bars!
          </p>
        </div>
      </InfoModal>
    </div>
  );
}
