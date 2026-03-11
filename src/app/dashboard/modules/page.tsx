'use client';

import { useState } from 'react';

// Module categories with icons
const categories = {
  intake: { name: 'Intake', icon: '📥', color: '#0d9488' },
  claims: { name: 'Claims', icon: '⚖️', color: '#6366f1' },
  operations: { name: 'Operations', icon: '⚙️', color: '#f59e0b' },
  analytics: { name: 'Analytics', icon: '📊', color: '#8b5cf6' },
  integrations: { name: 'Integrations', icon: '🔌', color: '#ec4899' },
  admin: { name: 'Admin', icon: '🔒', color: '#64748b' },
};

// All available modules (The Paint Palette)
const moduleRegistry = [
  // Intake
  { id: 'application-intake', name: 'Application Intake', description: 'SNF/Healthcare application intake and review', icon: '📋', category: 'intake', price: 750, status: 'active' },
  { id: 'document-intake', name: 'Document Intake', description: 'AI-powered document processing and data extraction', icon: '📥', category: 'intake', price: 750, status: 'active' },
  { id: 'member-intake', name: 'Member Intake', description: 'New member application processing', icon: '👤', category: 'intake', price: 500, status: 'active' },
  
  // Claims
  { id: 'claims-adjudication', name: 'Claims Adjudication', description: 'Review and adjudicate healthcare claims', icon: '⚖️', category: 'claims', price: 1000, status: 'active' },
  { id: 'claims-repricing', name: 'Claims Repricing', description: 'Reprice medical claims against fee schedules', icon: '💰', category: 'claims', price: 750, status: 'active' },
  { id: 'bill-negotiator', name: 'Bill Negotiator', description: 'AI-powered medical bill analysis and negotiation', icon: '🏥', category: 'claims', price: 1000, status: 'active' },
  { id: 'provider-bills', name: 'Provider Bills', description: 'Process and manage provider billing', icon: '🧾', category: 'claims', price: 500, status: 'active' },
  { id: 'workers-comp', name: 'Workers Comp', description: 'Workers compensation claims processing', icon: '🦺', category: 'claims', price: 750, status: 'active' },
  
  // Operations
  { id: 'bed-management', name: 'Bed Management', description: 'Track bed availability across facilities', icon: '🛏️', category: 'operations', price: 500, status: 'active' },
  { id: 'scheduling', name: 'Scheduling', description: 'Appointment and resource scheduling', icon: '📅', category: 'operations', price: 500, status: 'active' },
  
  // Analytics
  { id: 'analytics', name: 'Analytics Dashboard', description: 'Reporting and business intelligence', icon: '📊', category: 'analytics', price: 250, status: 'active' },
  { id: 'audit-log', name: 'Audit Log', description: 'Activity tracking and compliance logging', icon: '📜', category: 'analytics', price: 100, status: 'active' },
  
  // Admin
  { id: 'team-management', name: 'Team Management', description: 'Manage users, roles, and permissions', icon: '👥', category: 'admin', price: 0, status: 'active' },
  { id: 'integrations', name: 'Integrations', description: 'Connect to external systems and APIs', icon: '🔌', category: 'integrations', price: 0, status: 'active' },
  { id: 'email-intake', name: 'Email Intake', description: 'Process documents received via email', icon: '📧', category: 'integrations', price: 250, status: 'active' },
];

// Clients using each module (mock data - would come from API)
const moduleUsage: Record<string, string[]> = {
  'application-intake': ['Optalis'],
  'document-intake': ['Optalis', 'Solidarity'],
  'member-intake': ['Solidarity', 'United Refuah'],
  'claims-adjudication': ['Solidarity', 'United Refuah'],
  'claims-repricing': ['Solidarity', 'United Refuah'],
  'bill-negotiator': ['Solidarity', 'United Refuah'],
  'provider-bills': ['Solidarity'],
  'workers-comp': [],
  'bed-management': ['Optalis'],
  'scheduling': [],
  'analytics': ['Optalis', 'Solidarity', 'United Refuah'],
  'audit-log': ['Optalis', 'Solidarity', 'United Refuah'],
  'team-management': ['Optalis', 'Solidarity', 'United Refuah'],
  'integrations': ['Optalis', 'Solidarity'],
  'email-intake': ['Optalis', 'Solidarity'],
};

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredModules = moduleRegistry.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || module.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || module.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: moduleRegistry.length,
    active: moduleRegistry.filter(m => m.status === 'active').length,
    totalMRR: moduleRegistry.reduce((sum, m) => sum + (m.price * (moduleUsage[m.id]?.length || 0)), 0),
    categories: Object.keys(categories).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534' };
      case 'beta': return { bg: '#fef3c7', text: '#92400e' };
      case 'coming-soon': return { bg: '#e0e7ff', text: '#4338ca' };
      case 'deprecated': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            🎨 Module Palette
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            All available tools and workflows. Assign modules to clients to customize their dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          Add Module
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Modules', value: stats.total, color: '#0f172a', icon: '🧩' },
          { label: 'Active', value: stats.active, color: '#16a34a', icon: '✓' },
          { label: 'Categories', value: stats.categories, color: '#6366f1', icon: '📁' },
          { label: 'Est. MRR from Modules', value: `$${stats.totalMRR.toLocaleString()}`, color: '#059669', icon: '💰' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: '8px 16px',
            background: filterCategory === 'all' ? '#0f172a' : 'white',
            color: filterCategory === 'all' ? 'white' : '#64748b',
            border: '1px solid ' + (filterCategory === 'all' ? '#0f172a' : '#e2e8f0'),
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            style={{
              padding: '8px 16px',
              background: filterCategory === key ? cat.color : 'white',
              color: filterCategory === key ? 'white' : '#64748b',
              border: '1px solid ' + (filterCategory === key ? cat.color : '#e2e8f0'),
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Module Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredModules.map((module) => {
          const cat = categories[module.category as keyof typeof categories];
          const statusColor = getStatusColor(module.status);
          const clients = moduleUsage[module.id] || [];
          
          return (
            <div
              key={module.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Header */}
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #f1f5f9',
                background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}05 100%)`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{module.icon}</span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {module.name}
                      </h3>
                      <span style={{ 
                        fontSize: '11px', 
                        color: cat.color, 
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {cat.name}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: statusColor.bg,
                    color: statusColor.text,
                    textTransform: 'uppercase',
                  }}>
                    {module.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                  {module.description}
                </p>

                {/* Price & Usage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                      {module.price === 0 ? 'Included' : `$${module.price}`}
                    </span>
                    {module.price > 0 && <span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {clients.length} client{clients.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Clients using this module */}
                {clients.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {clients.map(client => (
                      <span 
                        key={client}
                        style={{
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#64748b',
                        }}
                      >
                        {client}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <button style={{
                  padding: '6px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#64748b',
                  cursor: 'pointer',
                }}>
                  Configure
                </button>
                <button style={{
                  padding: '6px 12px',
                  background: cat.color,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                }}>
                  Assign to Client
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔍</span>
          <p style={{ fontSize: '16px' }}>No modules match your search</p>
        </div>
      )}

      {/* Add Module Modal (placeholder) */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              Add New Module
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              New modules are created in code and registered in the module registry. 
              This UI is for reference — see <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>src/modules/README.md</code> for instructions.
            </p>
            
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Quick Steps:</p>
              <ol style={{ fontSize: '13px', color: '#64748b', paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '4px' }}>Copy <code>src/modules/_template</code></li>
                <li style={{ marginBottom: '4px' }}>Update module definition</li>
                <li style={{ marginBottom: '4px' }}>Add to registry</li>
                <li>Assign to clients</li>
              </ol>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
