'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { 
  ClockIcon,
  BuildingOffice2Icon,
  UserIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import '../mobile.css';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mco-advantage-api-production.up.railway.app';

interface Application {
  id: string;
  patient_name: string;
  dob: string;
  phone: string;
  address: string;
  insurance: string;
  policy_number: string;
  diagnosis: string[];
  medications: string[];
  allergies: string[];
  physician: string;
  facility: string;
  services: string[];
  priority: string;
  source: string;
  status: string;
  created_at: string;
  confidence_score: number;
  ai_summary: string;
}

export default function MobileReview() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch applications in review status
  const fetchApplications = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const response = await fetch(`${API_URL}/api/applications?status=review&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  // Format relative time
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <MobileLayout>
        <div className="mobile-section" style={{ paddingTop: 60, textAlign: 'center' }}>
          <div className="scan-processing-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Loading applications...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Section Header */}
      <div className="mobile-section">
        <div className="mobile-section-header">
          <h2 className="mobile-section-title">Needs Review</h2>
          <button 
            className="mobile-section-action"
            onClick={() => fetchApplications(true)}
            disabled={isRefreshing}
          >
            <ArrowPathIcon 
              className={`w-5 h-5 inline mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {applications.length > 0 && (
        <div className="mobile-section">
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: '#fef3c7',
            borderRadius: 10,
            fontSize: 13,
            color: '#92400e',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>These applications have low AI confidence and need manual verification.</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {applications.length === 0 && (
        <div className="mobile-empty">
          <CheckCircleIcon className="mobile-empty-icon" />
          <h3 className="mobile-empty-title">All caught up!</h3>
          <p className="mobile-empty-text">No applications currently need review.</p>
        </div>
      )}

      {/* Applications List */}
      <div className="app-list">
        {applications.map((app) => {
          const age = calculateAge(app.dob);
          
          return (
            <div 
              key={app.id} 
              className="app-card-container"
              onClick={() => router.push(`/mobile/application/${app.id}`)}
            >
              <div className="app-card" style={{ cursor: 'pointer' }}>
                {/* Low Confidence Badge */}
                <div 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    background: '#fef2f2',
                    color: '#dc2626',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  Low Confidence ({app.confidence_score}%)
                </div>
                
                <div className="app-card-header" style={{ marginTop: 10 }}>
                  <h3 className="app-card-patient">{app.patient_name || 'Unknown Patient'}</h3>
                  <span className={`app-card-priority ${app.priority || 'high'}`}>
                    {app.priority || 'high'}
                  </span>
                </div>
                
                <div className="app-card-meta">
                  <span className="app-card-meta-item">
                    <UserIcon className="w-4 h-4" />
                    {age ? `${age}` : '?'} • {app.insurance || 'Unknown'}
                  </span>
                  <span className="app-card-meta-item">
                    <BuildingOffice2Icon className="w-4 h-4" />
                    {app.facility || 'Unknown Facility'}
                  </span>
                </div>
                
                <p className="app-card-summary">{app.ai_summary || 'No summary available - needs manual review'}</p>
                
                <div className="app-card-footer">
                  <span className="app-card-source">{app.source || 'Unknown'}</span>
                  <span className="app-card-time">
                    <ClockIcon className="w-3 h-3 inline mr-1" />
                    {formatTime(app.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}
