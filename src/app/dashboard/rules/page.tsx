'use client';

import { useState } from 'react';
import { useClient } from '@/context/ClientContext';
import Link from 'next/link';

export default function RulesPage() {
  const { selectedClient, updateRule } = useClient();
  const [filter, setFilter] = useState<'all' | 'approve' | 'deny' | 'review'>('all');

  if (!selectedClient) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#0a0f1a', marginBottom: '16px' }}>No Client Selected</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please select a client to manage adjudication rules.</p>
        <Link href="/dashboard" style={{ color: '#00d4ff' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  const rules = selectedClient.adjudicationRules || [];
  const filteredRules = filter === 'all' ? rules : rules.filter(r => r.action === filter);
  
  const approveCount = rules.filter(r => r.action === 'approve').length;
  const denyCount = rules.filter(r => r.action === 'deny').length;
  const reviewCount = rules.filter(r => r.action === 'review').length;

  const handleToggleRule = (ruleId: string, currentActive: boolean) => {
    updateRule(selectedClient.id, ruleId, { active: !currentActive });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return { bg: '#dcfce7', color: '#166534' };
      case 'deny': return { bg: '#fee2e2', color: '#991b1b' };
      case 'review': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
            {selectedClient.name}
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#00d4ff', fontWeight: 500 }}>Rules Engine</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Adjudication Rules</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Configure rules for automatic claims adjudication. Rules are evaluated in priority order (lowest number = highest priority).
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            background: filter === 'all' ? '#0a0f1a' : 'white', 
            color: filter === 'all' ? 'white' : '#0a0f1a',
            padding: '20px', 
            borderRadius: '12px', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '13px', color: filter === 'all' ? 'rgba(255,255,255,0.7)' : '#6b7280', marginBottom: '4px' }}>Total Rules</p>
          <p style={{ fontSize: '32px', fontWeight: 700 }}>{rules.length}</p>
        </button>
        <button 
          onClick={() => setFilter('approve')}
          style={{ 
            background: filter === 'approve' ? '#16a34a' : 'white', 
            color: filter === 'approve' ? 'white' : '#16a34a',
            padding: '20px', 
            borderRadius: '12px', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '13px', color: filter === 'approve' ? 'rgba(255,255,255,0.7)' : '#6b7280', marginBottom: '4px' }}>Auto-Approve</p>
          <p style={{ fontSize: '32px', fontWeight: 700 }}>{approveCount}</p>
        </button>
        <button 
          onClick={() => setFilter('deny')}
          style={{ 
            background: filter === 'deny' ? '#dc2626' : 'white', 
            color: filter === 'deny' ? 'white' : '#dc2626',
            padding: '20px', 
            borderRadius: '12px', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '13px', color: filter === 'deny' ? 'rgba(255,255,255,0.7)' : '#6b7280', marginBottom: '4px' }}>Auto-Deny</p>
          <p style={{ fontSize: '32px', fontWeight: 700 }}>{denyCount}</p>
        </button>
        <button 
          onClick={() => setFilter('review')}
          style={{ 
            background: filter === 'review' ? '#f59e0b' : 'white', 
            color: filter === 'review' ? 'white' : '#f59e0b',
            padding: '20px', 
            borderRadius: '12px', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '13px', color: filter === 'review' ? 'rgba(255,255,255,0.7)' : '#6b7280', marginBottom: '4px' }}>Needs Review</p>
          <p style={{ fontSize: '32px', fontWeight: 700 }}>{reviewCount}</p>
        </button>
      </div>

      {/* Rules List */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0f1a' }}>
            {filter === 'all' ? 'All Rules' : filter === 'approve' ? 'Auto-Approve Rules' : filter === 'deny' ? 'Auto-Deny Rules' : 'Review Rules'}
          </h2>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{filteredRules.length} rules</span>
        </div>

        <div>
          {filteredRules.sort((a, b) => a.priority - b.priority).map((rule, index) => {
            const actionColor = getActionColor(rule.action);
            return (
              <div 
                key={rule.id} 
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: index < filteredRules.length - 1 ? '1px solid #f0f0f0' : 'none',
                  opacity: rule.active ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: '#9ca3af',
                        background: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>
                        #{rule.priority}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: '4px',
                        background: actionColor.bg,
                        color: actionColor.color,
                        textTransform: 'uppercase',
                      }}>
                        {rule.action}
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0a0f1a' }}>{rule.name}</h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{rule.description}</p>
                    <div style={{ 
                      background: '#f9fafb', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#4b5563',
                    }}>
                      <span style={{ color: '#9ca3af' }}>Conditions:</span> {rule.conditions}
                    </div>
                  </div>
                  <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.active)}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        border: 'none',
                        background: rule.active ? '#00d4ff' : '#e5e7eb',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: rule.active ? '23px' : '3px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '24px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <svg width="24" height="24" fill="none" stroke="#0284c7" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0c4a6e', marginBottom: '4px' }}>How Rules Work</h4>
            <p style={{ fontSize: '13px', color: '#0369a1', lineHeight: 1.6 }}>
              Rules are evaluated in priority order. When a claim matches a rule's conditions, that action is taken and the AI generates a detailed note explaining why. 
              <strong> Auto-Deny</strong> rules are checked first (priority 11-30), then <strong>Auto-Approve</strong> rules (priority 1-10), 
              and finally <strong>Needs Review</strong> rules (priority 31+) catch anything that doesn't match clear criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
