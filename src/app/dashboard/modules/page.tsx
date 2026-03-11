'use client';

import { useState, useMemo } from 'react';
import { moduleRegistry, DokitModule, ModuleCategory, getModulesByCategory, getActiveModules } from '@/modules/registry';

// Category display config
const categoryConfig: Record<ModuleCategory, { name: string; color: string; bgColor: string; icon: string }> = {
  intake: { name: 'Intake', color: '#059669', bgColor: '#ecfdf5', icon: '📥' },
  claims: { name: 'Claims', color: '#7c3aed', bgColor: '#f5f3ff', icon: '📋' },
  operations: { name: 'Operations', color: '#0284c7', bgColor: '#e0f2fe', icon: '⚙️' },
  analytics: { name: 'Analytics', color: '#ea580c', bgColor: '#fff7ed', icon: '📊' },
  integrations: { name: 'Integrations', color: '#4f46e5', bgColor: '#eef2ff', icon: '🔌' },
  admin: { name: 'Admin', color: '#64748b', bgColor: '#f8fafc', icon: '🔧' },
};

const statusConfig = {
  active: { color: '#16a34a', bg: '#dcfce7', label: 'Active' },
  beta: { color: '#d97706', bg: '#fef3c7', label: 'Beta' },
  'coming-soon': { color: '#6366f1', bg: '#e0e7ff', label: 'Coming Soon' },
  deprecated: { color: '#dc2626', bg: '#fee2e2', label: 'Deprecated' },
};

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all');
  const [selectedModule, setSelectedModule] = useState<DokitModule | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const modules = Object.values(moduleRegistry);
  const categories: (ModuleCategory | 'all')[] = ['all', 'intake', 'claims', 'operations', 'analytics', 'integrations', 'admin'];

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, selectedCategory]);

  const stats = useMemo(() => ({
    total: modules.length,
    active: modules.filter(m => m.status === 'active').length,
    beta: modules.filter(m => m.status === 'beta').length,
    comingSoon: modules.filter(m => m.status === 'coming-soon').length,
    totalMonthlyValue: modules.reduce((sum, m) => sum + (m.monthlyPrice || 0), 0),
  }), [modules]);

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'Included';
    return `$${price}/mo`;
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Module Palette 🎨
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            All available tools and workflows that can be assigned to clients
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Modules', value: stats.total, color: '#0f172a' },
          { label: 'Active', value: stats.active, color: '#16a34a' },
          { label: 'Beta', value: stats.beta, color: '#d97706' },
          { label: 'Coming Soon', value: stats.comingSoon, color: '#6366f1' },
          { label: 'Total Value', value: `$${stats.totalMonthlyValue.toLocaleString()}/mo`, color: '#059669' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            maxWidth: '400px',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 16px',
                background: selectedCategory === cat ? '#6366f1' : 'white',
                color: selectedCategory === cat ? 'white' : '#64748b',
                border: '1px solid ' + (selectedCategory === cat ? '#6366f1' : '#e2e8f0'),
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {cat !== 'all' && <span>{categoryConfig[cat].icon}</span>}
              {cat === 'all' ? 'All' : categoryConfig[cat].name}
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredModules.map((module) => {
          const catConfig = categoryConfig[module.category];
          const statConfig = statusConfig[module.status];
          
          return (
            <div
              key={module.id}
              onClick={() => setSelectedModule(module)}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#c7d2fe';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Card Header */}
              <div style={{ 
                padding: '20px', 
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: catConfig.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {module.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {module.name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: catConfig.bgColor,
                      color: catConfig.color,
                      textTransform: 'uppercase',
                    }}>
                      {catConfig.name}
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: statConfig.bg,
                  color: statConfig.color,
                }}>
                  {statConfig.label}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                  {module.description}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {module.routes.length} route{module.routes.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: module.monthlyPrice ? '#059669' : '#94a3b8' }}>
                    {formatPrice(module.monthlyPrice)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <p>No modules match your search</p>
        </div>
      )}

      {/* Module Detail Modal */}
      {selectedModule && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setSelectedModule(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            margin: '20px',
            maxHeight: '90vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: categoryConfig[selectedModule.category].bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}>
                  {selectedModule.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {selectedModule.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: categoryConfig[selectedModule.category].bgColor,
                      color: categoryConfig[selectedModule.category].color,
                    }}>
                      {categoryConfig[selectedModule.category].name}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: statusConfig[selectedModule.status].bg,
                      color: statusConfig[selectedModule.status].color,
                    }}>
                      {statusConfig[selectedModule.status].label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                style={{
                  padding: '8px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Description</h4>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  {selectedModule.description}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Routes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedModule.routes.map((route, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                    }}>
                      <span style={{ fontSize: '14px', color: '#0f172a' }}>{route.name}</span>
                      <code style={{ fontSize: '13px', color: '#64748b', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
                        {route.path}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {selectedModule.permissions && selectedModule.permissions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Permissions</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedModule.permissions.map((perm, i) => (
                      <span key={i} style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#475569',
                        fontFamily: 'monospace',
                      }}>
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
              }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Monthly Price</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: selectedModule.monthlyPrice ? '#059669' : '#94a3b8' }}>
                    {formatPrice(selectedModule.monthlyPrice)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Module ID</p>
                  <code style={{ fontSize: '14px', color: '#6366f1', fontWeight: 600 }}>
                    {selectedModule.id}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal (Placeholder) */}
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
              To add a new module, create it in the codebase:
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <code style={{ fontSize: '13px', color: '#334155', display: 'block', lineHeight: 1.6 }}>
                1. Copy src/modules/_template/<br/>
                2. Edit the module definition<br/>
                3. Add to src/modules/registry/index.ts<br/>
                4. Assign to clients via config
              </code>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              See src/modules/README.md for detailed instructions.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                width: '100%',
                padding: '12px',
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
