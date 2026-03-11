'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moduleRegistry, DokitModule, ModuleCategory, calculateMonthlyPrice } from '@/modules/registry';

// Industry options
const industries = [
  { id: 'healthcare', name: 'Healthcare', types: [
    { id: 'tpa', name: 'TPA (Third Party Administrator)' },
    { id: 'healthshare', name: 'Healthshare Ministry' },
    { id: 'mco', name: 'MCO (Managed Care Organization)' },
    { id: 'snf', name: 'SNF (Skilled Nursing Facility)' },
    { id: 'hospital', name: 'Hospital / Health System' },
    { id: 'clinic', name: 'Clinic / Medical Practice' },
    { id: 'insurance', name: 'Insurance Company' },
  ]},
  { id: 'legal', name: 'Legal', types: [
    { id: 'law-firm', name: 'Law Firm' },
    { id: 'legal-services', name: 'Legal Services' },
  ]},
  { id: 'finance', name: 'Finance', types: [
    { id: 'accounting', name: 'Accounting Firm' },
    { id: 'financial-services', name: 'Financial Services' },
  ]},
  { id: 'other', name: 'Other', types: [
    { id: 'other', name: 'Other' },
  ]},
];

// Category display config
const categoryConfig: Record<ModuleCategory, { name: string; color: string; bgColor: string; icon: string }> = {
  intake: { name: 'Intake', color: '#059669', bgColor: '#ecfdf5', icon: '📥' },
  claims: { name: 'Claims', color: '#7c3aed', bgColor: '#f5f3ff', icon: '📋' },
  operations: { name: 'Operations', color: '#0284c7', bgColor: '#e0f2fe', icon: '⚙️' },
  analytics: { name: 'Analytics', color: '#ea580c', bgColor: '#fff7ed', icon: '📊' },
  integrations: { name: 'Integrations', color: '#4f46e5', bgColor: '#eef2ff', icon: '🔌' },
  admin: { name: 'Admin', color: '#64748b', bgColor: '#f8fafc', icon: '🔧' },
};

// Default modules that are always included
const defaultModules = ['team-management', 'audit-log'];

// Recommended modules by industry type
const recommendedModules: Record<string, string[]> = {
  'tpa': ['claims-adjudication', 'claims-repricing', 'bill-negotiator', 'provider-bills', 'analytics'],
  'healthshare': ['claims-adjudication', 'claims-repricing', 'member-intake', 'analytics'],
  'mco': ['claims-adjudication', 'workers-comp', 'analytics'],
  'snf': ['application-intake', 'document-intake', 'bed-management', 'analytics', 'email-intake'],
  'hospital': ['document-intake', 'scheduling', 'analytics'],
  'clinic': ['document-intake', 'scheduling', 'analytics'],
  'insurance': ['claims-adjudication', 'claims-repricing', 'analytics'],
};

export default function NewClientWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactName: '',
    contactEmail: '',
    industry: '',
    industryType: '',
    selectedModules: [...defaultModules] as string[],
    primaryColor: '#6366f1',
    logo: '',
    onboardingFee: '',
    monthlyFee: '',
  });

  const totalSteps = 4;
  const modules = Object.values(moduleRegistry);
  
  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<ModuleCategory, DokitModule[]>);

  const toggleModule = (moduleId: string) => {
    if (defaultModules.includes(moduleId)) return; // Can't toggle default modules
    
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId]
    }));
  };

  const applyRecommended = () => {
    const recommended = recommendedModules[formData.industryType] || [];
    setFormData(prev => ({
      ...prev,
      selectedModules: [...new Set([...defaultModules, ...recommended])]
    }));
  };

  const calculatedPrice = calculateMonthlyPrice(formData.selectedModules);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // In a real app, this would save to the database
      // For now, we'll just log and redirect
      console.log('Creating client:', formData);
      
      // You could save to API here:
      // await fetch('/api/db/clients', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // For now, redirect to clients list
      router.push('/dashboard/clients');
    } catch (err) {
      console.error('Failed to create client:', err);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name && formData.slug && formData.industry && formData.industryType;
      case 2: return formData.selectedModules.length > defaultModules.length;
      case 3: return formData.primaryColor;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/dashboard/clients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Clients
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          New Client Setup
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Step {step} of {totalSteps}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e2e8f0',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          {['Basic Info', 'Select Modules', 'Branding', 'Review'].map((label, i) => (
            <span key={i} style={{ fontSize: '13px', color: i + 1 <= step ? '#6366f1' : '#94a3b8', fontWeight: i + 1 === step ? 600 : 400 }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0' }}>
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="Acme Healthcare"
                  value={formData.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Subdomain (slug) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="acme"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px 0 0 8px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '14px',
                    color: '#64748b',
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
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="john@acme.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value, industryType: '' })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select industry...</option>
                  {industries.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>

              {formData.industry && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                    Industry Type *
                  </label>
                  <select
                    value={formData.industryType}
                    onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px',
                      outline: 'none',
                      background: 'white',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select type...</option>
                    {industries.find(i => i.id === formData.industry)?.types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Modules */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
                  Select Modules 🎨
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Choose the tools and workflows this client needs
                </p>
              </div>
              {recommendedModules[formData.industryType] && (
                <button
                  onClick={applyRecommended}
                  style={{
                    padding: '10px 16px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Recommended
                </button>
              )}
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Selected: </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {formData.selectedModules.length} modules
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Estimated: </span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                    ${calculatedPrice.toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>

            {Object.entries(modulesByCategory).map(([category, mods]) => (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: categoryConfig[category as ModuleCategory].color,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {categoryConfig[category as ModuleCategory].icon}
                  {categoryConfig[category as ModuleCategory].name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {mods.map(module => {
                    const isSelected = formData.selectedModules.includes(module.id);
                    const isDefault = defaultModules.includes(module.id);
                    
                    return (
                      <div
                        key={module.id}
                        onClick={() => !isDefault && toggleModule(module.id)}
                        style={{
                          padding: '14px',
                          border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          cursor: isDefault ? 'not-allowed' : 'pointer',
                          background: isSelected ? '#f5f3ff' : 'white',
                          opacity: isDefault ? 0.7 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>{module.icon}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                                {module.name}
                              </div>
                              {isDefault && (
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Always included</span>
                              )}
                            </div>
                          </div>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: isSelected ? 'none' : '2px solid #d1d5db',
                            background: isSelected ? '#6366f1' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isSelected && (
                              <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{module.description.slice(0, 40)}...</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: module.monthlyPrice ? '#059669' : '#94a3b8' }}>
                            {module.monthlyPrice ? `$${module.monthlyPrice}` : 'Free'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Branding */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Branding & Theme
            </h2>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Primary Brand Color
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{
                      width: '60px',
                      height: '60px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'monospace',
                      width: '140px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
                  Preview
                </label>
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  background: '#f8fafc'
                }}>
                  {/* Mock sidebar */}
                  <div style={{ display: 'flex' }}>
                    <div style={{ 
                      width: '200px', 
                      background: formData.primaryColor, 
                      padding: '20px',
                      minHeight: '200px'
                    }}>
                      <div style={{ 
                        fontWeight: 700, 
                        color: 'white', 
                        fontSize: '16px',
                        marginBottom: '24px'
                      }}>
                        {formData.name || 'Client Name'}
                      </div>
                      {['Dashboard', 'Documents', 'Settings'].map(item => (
                        <div key={item} style={{ 
                          padding: '10px 12px', 
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '14px',
                          borderRadius: '6px',
                          marginBottom: '4px'
                        }}>
                          {item}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, padding: '20px' }}>
                      <div style={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        padding: '16px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          Dashboard preview area
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#0f172a' }}>
              Review & Create
            </h2>

            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Basic Info */}
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Basic Info</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Company</span>
                    <span style={{ fontWeight: 600 }}>{formData.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Subdomain</span>
                    <span style={{ fontWeight: 600 }}>{formData.slug}.dokit.ai</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Industry</span>
                    <span style={{ fontWeight: 600 }}>{formData.industryType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Contact</span>
                    <span style={{ fontWeight: 600 }}>{formData.contactEmail || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Selected Modules */}
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                  Selected Modules ({formData.selectedModules.length})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.selectedModules.map(id => {
                    const module = moduleRegistry[id];
                    if (!module) return null;
                    return (
                      <span key={id} style={{
                        padding: '8px 12px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        {module.icon} {module.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '16px' }}>Pricing</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534' }}>Module Total</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>${calculatedPrice.toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#166534', marginBottom: '6px' }}>
                      Onboarding Fee (optional)
                    </label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={formData.onboardingFee}
                      onChange={(e) => setFormData({ ...formData, onboardingFee: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#166534', marginBottom: '6px' }}>
                      Monthly Fee Override (leave blank to use module total)
                    </label>
                    <input
                      type="number"
                      placeholder={calculatedPrice.toString()}
                      value={formData.monthlyFee}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{
            padding: '14px 24px',
            background: step === 1 ? '#f1f5f9' : 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            color: step === 1 ? '#94a3b8' : '#374151',
          }}
        >
          Back
        </button>
        
        {step < totalSteps ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            style={{
              padding: '14px 32px',
              background: canProceed() ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e2e8f0',
              color: canProceed() ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: canProceed() ? 'pointer' : 'not-allowed',
            }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '14px 32px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
