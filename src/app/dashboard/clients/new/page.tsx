'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Industry types
const industries = [
  { id: 'healthcare', name: 'Healthcare', types: [
    { id: 'snf', name: 'Skilled Nursing Facility (SNF)' },
    { id: 'healthshare', name: 'Healthshare' },
    { id: 'tpa', name: 'Third Party Administrator (TPA)' },
    { id: 'mco', name: 'Managed Care Organization (MCO)' },
    { id: 'hospital', name: 'Hospital / Health System' },
    { id: 'clinic', name: 'Clinic / Practice' },
  ]},
  { id: 'legal', name: 'Legal', types: [
    { id: 'law-firm', name: 'Law Firm' },
    { id: 'insurance-defense', name: 'Insurance Defense' },
  ]},
  { id: 'finance', name: 'Finance', types: [
    { id: 'accounting', name: 'Accounting Firm' },
    { id: 'insurance', name: 'Insurance Company' },
  ]},
  { id: 'other', name: 'Other', types: [
    { id: 'custom', name: 'Custom / Other' },
  ]},
];

// Module categories
const moduleCategories = [
  { id: 'intake', name: 'Intake & Processing', icon: '📥', color: '#0d9488' },
  { id: 'claims', name: 'Claims & Billing', icon: '⚖️', color: '#6366f1' },
  { id: 'operations', name: 'Operations', icon: '⚙️', color: '#f59e0b' },
  { id: 'analytics', name: 'Analytics & Reporting', icon: '📊', color: '#8b5cf6' },
];

// All modules
const allModules = [
  // Intake
  { id: 'application-intake', name: 'Application Intake', category: 'intake', price: 750, icon: '📋', description: 'SNF/Healthcare application intake and review', recommended: ['snf'] },
  { id: 'document-intake', name: 'Document Intake', category: 'intake', price: 750, icon: '📥', description: 'AI-powered document processing', recommended: ['healthshare', 'tpa', 'mco'] },
  { id: 'member-intake', name: 'Member Intake', category: 'intake', price: 500, icon: '👤', description: 'New member applications', recommended: ['healthshare'] },
  
  // Claims
  { id: 'claims-adjudication', name: 'Claims Adjudication', category: 'claims', price: 1000, icon: '⚖️', description: 'Review and adjudicate claims', recommended: ['healthshare', 'tpa', 'mco'] },
  { id: 'claims-repricing', name: 'Claims Repricing', category: 'claims', price: 750, icon: '💰', description: 'Reprice against fee schedules', recommended: ['healthshare', 'tpa'] },
  { id: 'bill-negotiator', name: 'Bill Negotiator', category: 'claims', price: 1000, icon: '🏥', description: 'AI bill analysis & negotiation', recommended: ['healthshare', 'tpa'] },
  { id: 'provider-bills', name: 'Provider Bills', category: 'claims', price: 500, icon: '🧾', description: 'Provider billing management', recommended: ['tpa', 'mco'] },
  { id: 'workers-comp', name: 'Workers Comp', category: 'claims', price: 750, icon: '🦺', description: 'Workers comp processing', recommended: [] },
  
  // Operations
  { id: 'bed-management', name: 'Bed Management', category: 'operations', price: 500, icon: '🛏️', description: 'Bed availability tracking', recommended: ['snf', 'hospital'] },
  { id: 'scheduling', name: 'Scheduling', category: 'operations', price: 500, icon: '📅', description: 'Appointment scheduling', recommended: ['clinic'] },
  
  // Analytics
  { id: 'analytics', name: 'Analytics Dashboard', category: 'analytics', price: 250, icon: '📊', description: 'Reports & insights', recommended: ['all'] },
  { id: 'audit-log', name: 'Audit Log', category: 'analytics', price: 100, icon: '📜', description: 'Compliance logging', recommended: ['all'] },
];

// Always included modules
const includedModules = ['team-management', 'integrations'];

export default function NewClientWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [client, setClient] = useState({
    name: '',
    slug: '',
    contactName: '',
    contactEmail: '',
    industry: '',
    industryType: '',
    selectedModules: [] as string[],
    primaryColor: '#6366f1',
    onboardingFee: '',
    monthlyFee: '',
  });

  const totalSteps = 4;
  
  const selectedIndustry = industries.find(i => i.id === client.industry);
  
  // Calculate monthly price from selected modules
  const calculateMonthly = () => {
    return allModules
      .filter(m => client.selectedModules.includes(m.id))
      .reduce((sum, m) => sum + m.price, 0);
  };

  // Get recommended modules based on industry type
  const getRecommendedModules = () => {
    if (!client.industryType) return [];
    return allModules
      .filter(m => m.recommended.includes(client.industryType) || m.recommended.includes('all'))
      .map(m => m.id);
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    setClient(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId]
    }));
  };

  // Select recommended modules
  const selectRecommended = () => {
    setClient(prev => ({
      ...prev,
      selectedModules: getRecommendedModules()
    }));
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to API (mock for now)
      console.log('Saving client:', client);
      
      // Would actually call API here
      // await fetch('/api/db/clients', { method: 'POST', body: JSON.stringify(client) });
      
      // Redirect to clients page
      router.push('/dashboard/clients');
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const canProgress = () => {
    switch (step) {
      case 1: return client.name && client.slug && client.contactEmail;
      case 2: return client.industry && client.industryType;
      case 3: return client.selectedModules.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          New Client Setup
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Configure a new client with their modules and branding
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', marginBottom: '40px' }}>
        {[
          { num: 1, name: 'Basics' },
          { num: 2, name: 'Industry' },
          { num: 3, name: 'Modules' },
          { num: 4, name: 'Branding' },
        ].map((s, i) => (
          <div key={s.num} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: step >= s.num ? '#6366f1' : '#e2e8f0',
              color: step >= s.num ? 'white' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
            }}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '14px', 
              fontWeight: step === s.num ? 600 : 400,
              color: step === s.num ? '#0f172a' : '#64748b',
            }}>
              {s.name}
            </span>
            {i < 3 && (
              <div style={{ 
                flex: 1, 
                height: '2px', 
                background: step > s.num ? '#6366f1' : '#e2e8f0',
                marginLeft: '16px',
                marginRight: '16px',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        padding: '32px',
        marginBottom: '24px',
      }}>
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  placeholder="Acme Healthcare"
                  value={client.name}
                  onChange={(e) => setClient({ 
                    ...client, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Subdomain *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="acme"
                    value={client.slug}
                    onChange={(e) => setClient({ ...client, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px 0 0 8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    borderRadius: '0 8px 8px 0',
                    color: '#64748b',
                    fontSize: '14px',
                  }}>
                    .dokit.ai
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={client.contactName}
                    onChange={(e) => setClient({ ...client, contactName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    placeholder="john@acme.com"
                    value={client.contactEmail}
                    onChange={(e) => setClient({ ...client, contactEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Industry & Type
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
                Industry
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {industries.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => setClient({ ...client, industry: ind.id, industryType: '' })}
                    style={{
                      padding: '16px',
                      background: client.industry === ind.id ? '#6366f1' : 'white',
                      color: client.industry === ind.id ? 'white' : '#374151',
                      border: '1px solid ' + (client.industry === ind.id ? '#6366f1' : '#e2e8f0'),
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {ind.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedIndustry && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
                  Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedIndustry.types.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setClient({ ...client, industryType: type.id })}
                      style={{
                        padding: '16px',
                        background: client.industryType === type.id ? '#6366f1' : 'white',
                        color: client.industryType === type.id ? 'white' : '#374151',
                        border: '1px solid ' + (client.industryType === type.id ? '#6366f1' : '#e2e8f0'),
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3: Modules */}
        {step === 3 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Select Modules
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Choose the tools and workflows for this client
                </p>
              </div>
              {client.industryType && (
                <button
                  onClick={selectRecommended}
                  style={{
                    padding: '8px 16px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  ✨ Select Recommended
                </button>
              )}
            </div>

            {/* Module Categories */}
            {moduleCategories.map(cat => {
              const categoryModules = allModules.filter(m => m.category === cat.id);
              const recommended = getRecommendedModules();
              
              return (
                <div key={cat.id} style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: cat.color, 
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {cat.icon} {cat.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {categoryModules.map(module => {
                      const isSelected = client.selectedModules.includes(module.id);
                      const isRecommended = recommended.includes(module.id);
                      
                      return (
                        <div
                          key={module.id}
                          onClick={() => toggleModule(module.id)}
                          style={{
                            padding: '16px',
                            background: isSelected ? `${cat.color}10` : 'white',
                            border: `2px solid ${isSelected ? cat.color : '#e2e8f0'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '20px' }}>{module.icon}</span>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{module.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isRecommended && (
                                <span style={{ 
                                  padding: '2px 6px', 
                                  background: '#fef3c7', 
                                  color: '#92400e',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                }}>
                                  REC
                                </span>
                              )}
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: `2px solid ${isSelected ? cat.color : '#d1d5db'}`,
                                background: isSelected ? cat.color : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                            {module.description}
                          </p>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: cat.color }}>
                            ${module.price}/mo
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  {client.selectedModules.length} modules selected
                </span>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  + Team Management & Integrations (included)
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                  ${calculateMonthly().toLocaleString()}
                </span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>/mo</span>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Branding & Pricing */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Branding & Pricing
            </h2>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Brand Color */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Primary Brand Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={client.primaryColor}
                    onChange={(e) => setClient({ ...client, primaryColor: e.target.value })}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={client.primaryColor}
                    onChange={(e) => setClient({ ...client, primaryColor: e.target.value })}
                    style={{
                      width: '120px',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <div style={{
                    flex: 1,
                    height: '40px',
                    background: client.primaryColor,
                    borderRadius: '8px',
                  }} />
                </div>
              </div>

              {/* Pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Onboarding Fee
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                    <input
                      type="number"
                      placeholder={`Suggested: ${Math.round(calculateMonthly() * 5)}`}
                      value={client.onboardingFee}
                      onChange={(e) => setClient({ ...client, onboardingFee: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 28px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Monthly Fee
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                    <input
                      type="number"
                      placeholder={`Module cost: ${calculateMonthly()}`}
                      value={client.monthlyFee}
                      onChange={(e) => setClient({ ...client, monthlyFee: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 28px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '12px', 
                padding: '24px',
                border: '1px solid #e2e8f0',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px' }}>
                  SUMMARY
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Client</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{client.name || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Subdomain</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{client.slug || '—'}.dokit.ai</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Industry</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                      {selectedIndustry?.name} / {selectedIndustry?.types.find(t => t.id === client.industryType)?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Modules</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{client.selectedModules.length} selected</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Onboarding</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                      ${client.onboardingFee || calculateMonthly() * 5}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Monthly</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                      ${client.monthlyFee || calculateMonthly()}/mo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/dashboard/clients')}
          style={{
            padding: '12px 24px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        
        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProgress()}
            style={{
              padding: '12px 24px',
              background: canProgress() ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e2e8f0',
              color: canProgress() ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: canProgress() ? 'pointer' : 'not-allowed',
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creating...' : '🚀 Create Client'}
          </button>
        )}
      </div>
    </div>
  );
}
