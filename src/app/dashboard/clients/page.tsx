'use client';

import { useState, useEffect } from 'react';

interface ClientStats {
  totalDocuments: number;
  documentsToday: number;
  documentsThisWeek: number;
  documentsThisMonth: number;
  totalBilled?: number;
  totalRepriced?: number;
  totalSavings?: number;
  activeWorkflows: number;
}

interface Client {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'pending';
  contactEmail: string | null;
  dashboardType: 'standard' | 'custom';
  customDashboardUrl: string | null;
  statsApiEndpoint: string | null;
  lastStatsSync: string | null;
  connectionStatus: 'connected' | 'pending' | 'error' | 'disconnected';
  products: string[];
  createdAt: string;
  updatedAt: string;
  stats: ClientStats;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'custom'>('all');
  const [newClient, setNewClient] = useState({ 
    name: '', 
    slug: '', 
    contactEmail: '', 
    notes: '',
    dashboardType: 'custom' as 'standard' | 'custom',
    customDashboardUrl: '',
    statsApiEndpoint: ''
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/db/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
      if (data.needsMigration) {
        setNeedsMigration(true);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      const res = await fetch('/api/db/clients/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNeedsMigration(false);
        fetchClients();
      }
    } catch (err) {
      console.error('Migration failed:', err);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.slug) {
      setError('Name and slug are required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/db/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create client');
        setSaving(false);
        return;
      }
      
      setShowAddModal(false);
      setNewClient({ name: '', slug: '', contactEmail: '', notes: '', dashboardType: 'custom', customDashboardUrl: '', statsApiEndpoint: '' });
      fetchClients();
    } catch (err) {
      setError('Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!showConfigModal) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/db/clients/${showConfigModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customDashboardUrl: showConfigModal.customDashboardUrl,
          statsApiEndpoint: showConfigModal.statsApiEndpoint,
          dashboardType: showConfigModal.dashboardType,
        })
      });
      
      if (res.ok) {
        setShowConfigModal(null);
        fetchClients();
      }
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setSaving(false);
    }
  };

  const syncStats = async (clientId: number) => {
    setSyncing(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}/sync-stats`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchClients();
      } else {
        console.error('Sync failed:', data.error);
      }
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setSyncing(null);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || client.dashboardType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534' };
      case 'inactive': return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return { bg: '#dcfce7', text: '#166534', icon: '●' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e', icon: '○' };
      case 'error': return { bg: '#fee2e2', text: '#991b1b', icon: '✕' };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: '○' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalStats = {
    clients: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    custom: clients.filter(c => c.dashboardType === 'custom').length,
    connected: clients.filter(c => c.connectionStatus === 'connected').length,
    totalSavings: clients.reduce((sum, c) => sum + (c.stats.totalSavings || 0), 0),
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e5e7eb', 
            borderTopColor: '#6366f1', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading clients...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Migration Banner */}
      {needsMigration && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #fcd34d', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontWeight: 600, color: '#92400e' }}>Database migration needed</p>
            <p style={{ fontSize: '14px', color: '#a16207' }}>New custom dashboard features require a database update.</p>
          </div>
          <button
            onClick={runMigration}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Run Migration
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Clients</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Manage client accounts and monitor their usage</p>
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
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Clients', value: totalStats.clients, color: '#0f172a' },
          { label: 'Active', value: totalStats.active, color: '#16a34a' },
          { label: 'Custom Dashboards', value: totalStats.custom, color: '#6366f1' },
          { label: 'Connected', value: totalStats.connected, color: '#22c55e' },
          { label: 'Total Savings', value: formatCurrency(totalStats.totalSavings), color: '#059669' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search clients..."
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
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'custom', 'standard'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '10px 16px',
                background: filterType === type ? '#6366f1' : 'white',
                color: filterType === type ? 'white' : '#64748b',
                border: '1px solid ' + (filterType === type ? '#6366f1' : '#e2e8f0'),
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Client</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Connection</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Activity</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Savings</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  {searchQuery ? 'No clients match your search' : 'No clients yet. Add your first client to get started.'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const statusColor = getStatusColor(client.status);
                const connColor = getConnectionColor(client.connectionStatus);
                return (
                  <tr key={client.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: client.dashboardType === 'custom' 
                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}>
                          {client.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <a 
                            href={`/dashboard/clients/${client.id}`}
                            style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px', textDecoration: 'none', display: 'block' }}
                          >
                            {client.name}
                          </a>
                          <p style={{ fontSize: '13px', color: '#64748b' }}>{client.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: client.dashboardType === 'custom' ? '#f5f3ff' : '#f1f5f9',
                        color: client.dashboardType === 'custom' ? '#6366f1' : '#64748b',
                        textTransform: 'capitalize',
                      }}>
                        {client.dashboardType}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {client.dashboardType === 'custom' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: connColor.bg,
                          color: connColor.text,
                        }}>
                          {connColor.icon} {client.connectionStatus}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a' }}>{client.stats.documentsToday} today</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{client.stats.totalDocuments.toLocaleString()} total</p>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {client.stats.totalSavings ? (
                        <p style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(client.stats.totalSavings)}</p>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {client.dashboardType === 'custom' && (
                          <>
                            <button
                              onClick={() => syncStats(client.id)}
                              disabled={syncing === client.id}
                              title="Sync Stats"
                              style={{
                                padding: '6px 10px',
                                background: syncing === client.id ? '#e2e8f0' : '#ecfdf5',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: syncing === client.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <svg width="16" height="16" fill="none" stroke={syncing === client.id ? '#94a3b8' : '#059669'} strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setShowConfigModal(client)}
                              title="Configure Connection"
                              style={{
                                padding: '6px 10px',
                                background: '#f5f3ff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="16" height="16" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </button>
                          </>
                        )}
                        <a 
                          href={`/dashboard/clients/${client.id}`}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6366f1',
                            cursor: 'pointer',
                            textDecoration: 'none',
                          }}
                        >
                          Manage
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
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
            maxHeight: '90vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#0f172a' }}>Add New Client</h2>
            
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Dashboard Type Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Dashboard Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['custom', 'standard'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewClient({ ...newClient, dashboardType: type })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: newClient.dashboardType === type ? '#6366f1' : 'white',
                      color: newClient.dashboardType === type ? 'white' : '#64748b',
                      border: '1px solid ' + (newClient.dashboardType === type ? '#6366f1' : '#e2e8f0'),
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {type === 'custom' ? 'Custom Dashboard' : 'Standard DOKit'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                {newClient.dashboardType === 'custom' 
                  ? 'Client has their own white-label dashboard that we connect to'
                  : 'Client uses the standard DOKit dashboard'}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Client Name *</label>
              <input
                type="text"
                placeholder="Solidarity HealthShare"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Slug *</label>
              <input
                type="text"
                placeholder="solidarity"
                value={newClient.slug}
                onChange={(e) => setNewClient({ ...newClient, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Contact Email</label>
              <input
                type="email"
                placeholder="admin@solidarity.org"
                value={newClient.contactEmail}
                onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {newClient.dashboardType === 'custom' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Custom Dashboard URL</label>
                  <input
                    type="url"
                    placeholder="https://solidarity-dashboard.up.railway.app"
                    value={newClient.customDashboardUrl}
                    onChange={(e) => setNewClient({ ...newClient, customDashboardUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Stats API Endpoint</label>
                  <input
                    type="url"
                    placeholder="https://solidarity-dashboard.up.railway.app/api/stats"
                    value={newClient.statsApiEndpoint}
                    onChange={(e) => setNewClient({ ...newClient, statsApiEndpoint: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Endpoint that returns aggregated stats (no PHI). Can be configured later.
                  </p>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddModal(false); setError(''); }}
                style={{
                  padding: '12px 20px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddClient}
                disabled={saving}
                style={{
                  padding: '12px 20px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Connection Modal */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowConfigModal(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
              Configure Connection
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{showConfigModal.name}</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Dashboard URL</label>
              <input
                type="url"
                placeholder="https://client-dashboard.example.com"
                value={showConfigModal.customDashboardUrl || ''}
                onChange={(e) => setShowConfigModal({ ...showConfigModal, customDashboardUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Stats API Endpoint</label>
              <input
                type="url"
                placeholder="https://client-dashboard.example.com/api/stats"
                value={showConfigModal.statsApiEndpoint || ''}
                onChange={(e) => setShowConfigModal({ ...showConfigModal, statsApiEndpoint: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                This endpoint should return JSON with stats like totalProcessed, totalBilled, totalSavings, etc.
              </p>
            </div>

            {showConfigModal.lastStatsSync && (
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                Last synced: {new Date(showConfigModal.lastStatsSync).toLocaleString()}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfigModal(null)}
                style={{
                  padding: '12px 20px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateConfig}
                disabled={saving}
                style={{
                  padding: '12px 20px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
