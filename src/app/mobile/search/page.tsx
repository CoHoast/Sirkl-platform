'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import '../mobile.css';

// Inline SVG icons with explicit sizing
const SearchIcon = ({ size = 20, color = '#9ca3af' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const ClockIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XCircleIcon = ({ size = 20, color = '#9ca3af' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CheckCircleIcon = ({ size = 24, color = '#16a34a' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XMarkIcon = ({ size = 24, color = '#dc2626' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const BuildingIcon = ({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg style={{ width: size, height: size, color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
  </svg>
);

// Mock search results
const allApplications = [
  { id: 'APP-2026-001', patientName: 'Margaret Thompson', status: 'pending', facility: 'Beaumont Health', date: 'Today' },
  { id: 'APP-2026-002', patientName: 'Robert Williams', status: 'review', facility: 'Providence Hospital', date: 'Today' },
  { id: 'APP-2026-003', patientName: 'Dorothy Martinez', status: 'approved', facility: 'DMC', date: 'Yesterday' },
  { id: 'APP-2026-004', patientName: 'James Wilson', status: 'pending', facility: 'Henry Ford', date: 'Today' },
  { id: 'APP-2026-005', patientName: 'Mary Johnson', status: 'approved', facility: 'St. John Hospital', date: '2 days ago' },
  { id: 'APP-2026-006', patientName: 'Richard Brown', status: 'denied', facility: 'Beaumont Dearborn', date: '3 days ago' },
  { id: 'APP-2026-007', patientName: 'Patricia Davis', status: 'approved', facility: 'Providence Hospital', date: '1 week ago' },
];

const recentSearches = ['Thompson', 'Medicare', 'Beaumont'];

export default function MobileSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof allApplications>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setHasSearched(true);
    
    if (searchQuery.trim()) {
      const filtered = allApplications.filter(app => 
        app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon size={24} color="#16a34a" />;
      case 'denied': return <XMarkIcon size={24} color="#dc2626" />;
      case 'review': return <ClockIcon size={24} color="#f59e0b" />;
      default: return <ClockIcon size={24} color="#6b7280" />;
    }
  };

  return (
    <MobileLayout title="Search">
      {/* Search Bar */}
      <div className="mobile-section" style={{ paddingTop: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 50,
          padding: '0 16px',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <SearchIcon size={20} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search patients, facilities, IDs..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              height: '100%',
              fontSize: 17,
              color: '#1a1a1a',
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />
          {query && (
            <button 
              onClick={clearSearch}
              style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <XCircleIcon size={20} color="#9ca3af" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      {!hasSearched && (
        <div className="mobile-section">
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: '20px 0 12px 0',
          }}>Recent Searches</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {recentSearches.map((term, index) => (
              <button 
                key={index}
                onClick={() => handleSearch(term)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 20,
                  fontSize: 14,
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <ClockIcon size={14} color="#9ca3af" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="mobile-section">
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: '20px 0 12px 0',
          }}>
            {results.length} Result{results.length !== 1 ? 's' : ''}
          </h3>
          
          {results.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              {results.map((app, index) => (
                <button
                  key={app.id}
                  onClick={() => router.push(`/mobile/application/${app.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: index < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {getStatusIcon(app.status)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: '#1a1a1a' }}>
                      {app.patientName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                      <BuildingIcon size={12} />
                      {app.facility} • {app.date}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{app.id}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                margin: '0 auto 16px', 
                background: '#f3f4f6', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SearchIcon size={28} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No results found</h3>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
}
