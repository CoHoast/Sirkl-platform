'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';

interface Application {
  id: string;
  applicationNumber: string;
  clientId: string;
  status: 'processing' | 'pending_review' | 'approved' | 'denied' | 'needs_info' | 'ai_processed';
  aiRecommendation: 'approve' | 'deny' | 'review' | 'APPROVE' | 'DENY' | 'REVIEW';
  aiConfidence: number;
  aiSummary: string;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: number;
  };
  coverage: {
    planType: 'individual' | 'couple' | 'family';
    monthlyAmount: number;
  };
  household: Array<{ firstName: string; lastName: string }>;
  flags: Array<{ type: 'info' | 'warning' | 'critical'; message: string }>;
  submittedAt: string;
  // Database fields
  applicantName?: string;
  applicantEmail?: string;
  applicantData?: any;
  eligibilityScore?: number;
  aiReasoning?: string;
  createdAt?: string;
}

// Mock data
const mockApplications: Application[] = [
  {
    id: '1',
    applicationNumber: 'UR-2026-0847',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'review',
    aiConfidence: 72,
    aiSummary: 'Applicant has Type 2 Diabetes (controlled). Recommend manual review.',
    applicant: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@email.com',
      phone: '(614) 555-0123',
      age: 40,
    },
    coverage: { planType: 'family', monthlyAmount: 549 },
    household: [
      { firstName: 'David', lastName: 'Johnson' },
      { firstName: 'Emma', lastName: 'Johnson' },
      { firstName: 'Lucas', lastName: 'Johnson' },
    ],
    flags: [{ type: 'warning', message: 'Pre-existing: Type 2 Diabetes (controlled)' }],
    submittedAt: '2026-02-26T14:30:00Z',
  },
  {
    id: '2',
    applicationNumber: 'UR-2026-0846',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'approve',
    aiConfidence: 94,
    aiSummary: 'Healthy applicant with no pre-existing conditions. Recommend auto-approval.',
    applicant: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@gmail.com',
      phone: '(216) 555-0456',
      age: 35,
    },
    coverage: { planType: 'individual', monthlyAmount: 195 },
    household: [],
    flags: [],
    submittedAt: '2026-02-26T13:15:00Z',
  },
  {
    id: '3',
    applicationNumber: 'UR-2026-0845',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'deny',
    aiConfidence: 89,
    aiSummary: 'Active cancer treatment. Outside sharing guidelines.',
    applicant: {
      firstName: 'Patricia',
      lastName: 'Williams',
      email: 'pwilliams@email.com',
      phone: '(440) 555-0789',
      age: 50,
    },
    coverage: { planType: 'couple', monthlyAmount: 425 },
    household: [{ firstName: 'Robert', lastName: 'Williams' }],
    flags: [{ type: 'critical', message: 'Active cancer treatment' }],
    submittedAt: '2026-02-26T11:00:00Z',
  },
  {
    id: '4',
    applicationNumber: 'UR-2026-0844',
    clientId: 'united_refuah',
    status: 'approved',
    aiRecommendation: 'approve',
    aiConfidence: 96,
    aiSummary: 'Family application, all members healthy.',
    applicant: {
      firstName: 'David',
      lastName: 'Martinez',
      email: 'dmartinez@email.com',
      phone: '(330) 555-0234',
      age: 43,
    },
    coverage: { planType: 'family', monthlyAmount: 549 },
    household: [
      { firstName: 'Maria', lastName: 'Martinez' },
      { firstName: 'Sofia', lastName: 'Martinez' },
      { firstName: 'Diego', lastName: 'Martinez' },
      { firstName: 'Isabella', lastName: 'Martinez' },
    ],
    flags: [],
    submittedAt: '2026-02-25T16:45:00Z',
  },
];

export default function ApplicationsPage() {
  const { selectedClient } = useClient();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'denied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Fetch real data from API
  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch('/api/db/applications');
        if (response.ok) {
          const data = await response.json();
          // Transform database format to UI format
          const transformedApps: Application[] = data.applications.map((app: any) => {
            const applicantData = app.applicantData || {};
            const applicant = applicantData.applicant || {};
            const coverage = applicantData.coverage || {};
            
            return {
              id: app.id,
              applicationNumber: `APP-${app.id.toString().padStart(4, '0')}`,
              clientId: 'test-client',
              status: app.status === 'ai_processed' ? 'pending_review' : app.status,
              aiRecommendation: (app.aiRecommendation || 'review').toLowerCase(),
              aiConfidence: app.eligibilityScore || 0,
              aiSummary: app.aiReasoning || 'No AI summary available',
              applicant: {
                firstName: applicant.firstName || app.applicantName?.split(' ')[0] || 'Unknown',
                lastName: applicant.lastName || app.applicantName?.split(' ')[1] || '',
                email: applicant.email || app.applicantEmail || '',
                phone: applicant.phone || '',
                age: applicant.age || 0,
              },
              coverage: {
                planType: coverage.planType?.toLowerCase() || 'individual',
                monthlyAmount: coverage.monthlyAmount || 0,
              },
              household: [],
              flags: applicantData.health?.preExistingConditions?.length > 0 
                ? applicantData.health.preExistingConditions.map((c: string) => ({ type: 'warning', message: c }))
                : [],
              submittedAt: app.createdAt || new Date().toISOString(),
            };
          });
          
          if (transformedApps.length > 0) {
            setApplications(transformedApps);
            setUseRealData(true);
          } else {
            setApplications(mockApplications);
            setUseRealData(false);
          }
        } else {
          setApplications(mockApplications);
          setUseRealData(false);
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        setApplications(mockApplications);
        setUseRealData(false);
      } finally {
        setLoading(false);
      }
    }
    
    fetchApplications();
  }, []);

  const filteredApps = applications.filter(app => {
    // Skip client filter for real database data (all apps belong to current view)
    // Only filter mock data by client
    if (!useRealData && selectedClient && app.clientId !== selectedClient.id.toLowerCase().replace(/ /g, '_')) {
      return false;
    }
    // Filter by status
    if (filter !== 'all' && app.status !== filter) {
      return false;
    }
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.applicant.firstName.toLowerCase().includes(query) ||
        app.applicant.lastName.toLowerCase().includes(query) ||
        app.applicationNumber.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const statusCounts = {
    all: applications.length,
    pending_review: applications.filter(a => a.status === 'pending_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    denied: applications.filter(a => a.status === 'denied').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return { bg: '#fef3c7', text: '#d97706', label: 'Pending Review' };
      case 'approved':
        return { bg: '#dcfce7', text: '#16a34a', label: 'Approved' };
      case 'denied':
        return { bg: '#fee2e2', text: '#dc2626', label: 'Denied' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  const getAIBadge = (rec: string, confidence: number) => {
    switch (rec) {
      case 'approve':
        return { bg: '#10b981', text: 'white', icon: '✓', label: `Approve (${confidence}%)` };
      case 'deny':
        return { bg: '#ef4444', text: 'white', icon: '✗', label: `Deny (${confidence}%)` };
      case 'review':
        return { bg: '#f59e0b', text: 'white', icon: '?', label: `Review (${confidence}%)` };
      default:
        return { bg: '#6b7280', text: 'white', icon: '•', label: 'Unknown' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDecision = async (appId: string, decision: 'approve' | 'deny') => {
    // In production: Call API
    setApplications(apps =>
      apps.map(app =>
        app.id === appId
          ? { ...app, status: decision === 'approve' ? 'approved' : 'denied' }
          : app
      )
    );
    setSelectedApp(null);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading applications...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
              Member Applications
            </h1>
            <p style={{ color: '#64748b', margin: '8px 0 0' }}>
              {selectedClient ? `Applications for ${selectedClient.name}` : 'All client applications'}
            </p>
          </div>
          {useRealData && (
            <span style={{
              padding: '6px 12px',
              background: '#dcfce7',
              color: '#16a34a',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              ✓ Live Data from Database
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Pending Review', value: statusCounts.pending_review, color: '#f59e0b' },
          { label: 'Approved', value: statusCounts.approved, color: '#10b981' },
          { label: 'Denied', value: statusCounts.denied, color: '#ef4444' },
          { label: 'Total', value: statusCounts.all, color: '#0a0f1a' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'pending_review', 'approved', 'denied'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                background: filter === status ? '#0a0f1a' : '#f3f4f6',
                color: filter === status ? 'white' : '#374151',
              }}
            >
              {status === 'all' ? 'All' :
               status === 'pending_review' ? `Pending (${statusCounts.pending_review})` :
               status === 'approved' ? 'Approved' : 'Denied'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            width: '250px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Applications List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {filteredApps.map((app, idx) => {
          const statusBadge = getStatusBadge(app.status);
          const aiBadge = getAIBadge(app.aiRecommendation, app.aiConfidence);

          return (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              style={{
                padding: '20px 24px',
                borderBottom: idx < filteredApps.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>
                      {app.applicant.firstName} {app.applicant.lastName}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: statusBadge.bg,
                      color: statusBadge.text,
                    }}>
                      {statusBadge.label}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: aiBadge.bg,
                      color: aiBadge.text,
                    }}>
                      AI: {aiBadge.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    <span>{app.applicationNumber}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{app.coverage.planType} Plan</span>
                    <span>•</span>
                    <span>{app.household.length + 1} {app.household.length === 0 ? 'member' : 'members'}</span>
                    <span>•</span>
                    <span>${app.coverage.monthlyAmount}/mo</span>
                    <span>•</span>
                    <span>{formatDate(app.submittedAt)}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    {app.aiSummary}
                  </p>

                  {app.flags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {app.flags.map((flag, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: flag.type === 'critical' ? '#fee2e2' :
                                       flag.type === 'warning' ? '#fef3c7' : '#dbeafe',
                            color: flag.type === 'critical' ? '#dc2626' :
                                  flag.type === 'warning' ? '#d97706' : '#2563eb',
                          }}
                        >
                          {flag.type === 'critical' && '⚠️ '}
                          {flag.message}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <svg width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          );
        })}

        {filteredApps.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: '16px', margin: 0 }}>No applications found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedApp(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '700px',
              maxHeight: '85vh',
              overflow: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  {selectedApp.applicant.firstName} {selectedApp.applicant.lastName}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                  {selectedApp.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* AI Summary */}
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🤖</span>
                  <span style={{ fontWeight: 600 }}>AI Analysis</span>
                  <span style={{
                    marginLeft: 'auto',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: getAIBadge(selectedApp.aiRecommendation, selectedApp.aiConfidence).bg,
                    color: 'white',
                  }}>
                    {selectedApp.aiRecommendation.toUpperCase()} ({selectedApp.aiConfidence}%)
                  </span>
                </div>
                <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
                  {selectedApp.aiSummary}
                </p>
              </div>

              {/* Applicant Info */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                APPLICANT INFORMATION
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Name</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {selectedApp.applicant.firstName} {selectedApp.applicant.lastName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Age</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedApp.applicant.age} years</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedApp.applicant.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedApp.applicant.phone}</div>
                </div>
              </div>

              {/* Coverage */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                COVERAGE DETAILS
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Plan Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                    {selectedApp.coverage.planType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Monthly Amount</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>${selectedApp.coverage.monthlyAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Members</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedApp.household.length + 1}</div>
                </div>
              </div>

              {/* Flags */}
              {selectedApp.flags.length > 0 && (
                <>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                    FLAGS
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {selectedApp.flags.map((flag, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: flag.type === 'critical' ? '#fef2f2' :
                                     flag.type === 'warning' ? '#fffbeb' : '#eff6ff',
                          border: `1px solid ${
                            flag.type === 'critical' ? '#fecaca' :
                            flag.type === 'warning' ? '#fde68a' : '#bfdbfe'
                          }`,
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>
                          {flag.type === 'critical' ? '⚠️ ' : flag.type === 'warning' ? '⚡ ' : 'ℹ️ '}
                          {flag.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              {selectedApp.status === 'pending_review' && (
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={() => handleDecision(selectedApp.id, 'approve')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: '#10b981',
                      color: 'white',
                    }}
                  >
                    ✓ Approve Application
                  </button>
                  <button
                    onClick={() => handleDecision(selectedApp.id, 'deny')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: '#ef4444',
                      color: 'white',
                    }}
                  >
                    ✗ Deny Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
