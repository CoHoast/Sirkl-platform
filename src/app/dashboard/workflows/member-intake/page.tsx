'use client';

import React, { useState } from 'react';
import { useClient } from '@/context/ClientContext';

interface EligibilityRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'approve' | 'deny' | 'review';
  priority: number;
  enabled: boolean;
}

interface EmailTemplate {
  id: string;
  type: 'approval' | 'denial' | 'contact' | 'request_info';
  subject: string;
  body: string;
}

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  logoUrl: string;
  primaryColor: string;
  supportPhone: string;
  supportEmail: string;
}

export default function MemberIntakeWorkflowPage() {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState<'config' | 'rules' | 'emails'>('config');
  
  // Webhook & API Configuration
  const [webhookUrl, setWebhookUrl] = useState('https://api.mco-advantage.com/v1/applications/ingest');
  const [apiKey, setApiKey] = useState('ur_live_sk_xxxxxxxxxxxxx');
  
  // Email Configuration (white-label for United Refuah)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    fromEmail: 'applications@unitedrefuah.org',
    fromName: 'United Refuah HealthShare',
    replyTo: 'support@unitedrefuah.org',
    logoUrl: 'https://unitedrefuah.org/logo.png',
    primaryColor: '#135c9f',
    supportPhone: '(440) 772-0700',
    supportEmail: 'support@unitedrefuah.org',
  });
  
  // Eligibility Rules
  const [rules, setRules] = useState<EligibilityRule[]>([
    {
      id: '1',
      name: 'Age Requirement',
      description: 'Primary applicant must be 18 or older',
      condition: 'applicant.age >= 18',
      action: 'review',
      priority: 1,
      enabled: true,
    },
    {
      id: '2',
      name: 'Statement of Beliefs',
      description: 'Must accept Statement of Beliefs',
      condition: 'applicant.statementOfBeliefs === true',
      action: 'deny',
      priority: 2,
      enabled: true,
    },
    {
      id: '3',
      name: 'Coverage Gap Check',
      description: 'Coverage gap must be 63 days or less',
      condition: 'applicant.coverageGapDays <= 63',
      action: 'review',
      priority: 3,
      enabled: true,
    },
    {
      id: '4',
      name: 'Active Cancer',
      description: 'Auto-deny if currently in active cancer treatment',
      condition: 'applicant.hasActiveCancer === true',
      action: 'deny',
      priority: 10,
      enabled: true,
    },
    {
      id: '5',
      name: 'Tobacco Use',
      description: 'Flag tobacco users for review',
      condition: 'applicant.tobaccoUse === true',
      action: 'review',
      priority: 15,
      enabled: true,
    },
    {
      id: '6',
      name: 'Healthy Applicant',
      description: 'Auto-approve if no pre-existing conditions and no flags',
      condition: 'applicant.preExistingConditions.length === 0 && applicant.flags.length === 0',
      action: 'approve',
      priority: 100,
      enabled: true,
    },
  ]);
  
  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      type: 'approval',
      subject: 'Welcome to United Refuah HealthShare - Application Approved!',
      body: `Dear {{applicant.firstName}},

Great news! Your application for United Refuah HealthShare membership has been approved.

MEMBERSHIP DETAILS
------------------
Member ID: {{member.id}}
Plan Type: {{member.planType}}
Monthly Share Amount: \${{member.monthlyAmount}}
Effective Date: {{member.effectiveDate}}

NEXT STEPS
----------
1. Your first monthly share of \${{member.monthlyAmount}} will be processed on {{member.firstPaymentDate}}
2. Your member cards will be mailed within 5-7 business days
3. Access your member portal at: https://members.unitedrefuah.org

Welcome to our community!

In Service,
United Refuah HealthShare
{{config.supportPhone}}`,
    },
    {
      id: '2',
      type: 'denial',
      subject: 'United Refuah HealthShare - Application Status',
      body: `Dear {{applicant.firstName}},

Thank you for your interest in United Refuah HealthShare. After careful review of your application, we regret to inform you that we are unable to offer membership at this time.

REASON FOR DECISION
-------------------
{{denial.reason}}

{{denial.details}}

APPEAL PROCESS
--------------
If you believe this decision was made in error or have additional information to provide, you may submit an appeal within 30 days by contacting:

{{config.supportEmail}}
{{config.supportPhone}}

We wish you the best in finding the right healthcare solution for your needs.

Sincerely,
United Refuah HealthShare`,
    },
    {
      id: '3',
      type: 'request_info',
      subject: 'United Refuah HealthShare - Additional Information Needed',
      body: `Dear {{applicant.firstName}},

Thank you for your application to United Refuah HealthShare. To complete our review, we need the following additional information:

INFORMATION REQUESTED
---------------------
{{#each requestedItems}}
• {{this.description}}
{{/each}}

HOW TO SUBMIT
-------------
You can submit this information by:
1. Replying to this email with attachments
2. Uploading at: https://apply.unitedrefuah.org/upload/{{application.id}}

Please submit within 14 days to avoid delays in processing your application.

Thank you,
United Refuah HealthShare
{{config.supportPhone}}`,
    },
    {
      id: '4',
      type: 'contact',
      subject: 'Message from United Refuah HealthShare',
      body: `Dear {{applicant.firstName}},

{{message.body}}

If you have any questions, please don't hesitate to reach out.

Best regards,
{{staff.name}}
United Refuah HealthShare
{{config.supportPhone}}`,
    },
  ]);
  
  const [editingRule, setEditingRule] = useState<EligibilityRule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const tabs = [
    { id: 'config', label: 'Integration Config', icon: '⚙️' },
    { id: 'rules', label: 'Eligibility Rules', icon: '📋' },
    { id: 'emails', label: 'Email Templates', icon: '📧' },
  ];

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'approve': return { bg: '#dcfce7', text: '#16a34a' };
      case 'deny': return { bg: '#fee2e2', text: '#dc2626' };
      case 'review': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>👥</span>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', margin: 0 }}>
            Member Intake Workflow
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: 0 }}>
          Configure application processing for {selectedClient?.name || 'United Refuah HealthShare'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === tab.id ? '#00d4ff' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Webhook Configuration */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00d4ff' }}>🔗</span>
              Webhook Configuration
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Configure the webhook URL for receiving application submissions from the client's website.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Webhook URL (for client's website form)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    style={{
                      padding: '10px 16px',
                      background: '#0a0f1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  API Key
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    value={apiKey}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f8fafc',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                    style={{
                      padding: '10px 16px',
                      background: '#0a0f1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Copy
                  </button>
                  <button
                    style={{
                      padding: '10px 16px',
                      background: 'white',
                      color: '#0a0f1a',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #bae6fd',
            }}>
              <p style={{ fontSize: '13px', color: '#0369a1', margin: 0 }}>
                <strong>Integration Instructions:</strong> Add this webhook URL to the client's website application form. 
                When a user submits their application, it will be sent here for AI analysis and processing.
              </p>
            </div>
          </div>

          {/* Email Configuration (White-Label) */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00d4ff' }}>📧</span>
              Email Branding (White-Label)
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Configure how automated emails appear to applicants. Emails will be sent on behalf of the client's brand.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  From Email
                </label>
                <input
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  From Name
                </label>
                <input
                  type="text"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Reply-To Email
                </label>
                <input
                  type="email"
                  value={emailConfig.replyTo}
                  onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Logo URL
                </label>
                <input
                  type="url"
                  value={emailConfig.logoUrl}
                  onChange={(e) => setEmailConfig({ ...emailConfig, logoUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Brand Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={emailConfig.primaryColor}
                    onChange={(e) => setEmailConfig({ ...emailConfig, primaryColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '42px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={emailConfig.primaryColor}
                    onChange={(e) => setEmailConfig({ ...emailConfig, primaryColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={emailConfig.supportPhone}
                  onChange={(e) => setEmailConfig({ ...emailConfig, supportPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Email Preview */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
                Email Preview
              </label>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: emailConfig.primaryColor,
                  padding: '20px',
                  textAlign: 'center' as const,
                }}>
                  <div style={{
                    background: 'white',
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    {emailConfig.fromName}
                  </div>
                </div>
                <div style={{ padding: '20px', background: 'white' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>
                    From: {emailConfig.fromName} &lt;{emailConfig.fromEmail}&gt;
                  </p>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Dear Applicant, your application has been received...
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 20px',
                  background: '#00d4ff',
                  color: '#0a0f1a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Save Email Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Eligibility Rules</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
                Configure rules that determine automatic approval, denial, or review status
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRule({
                  id: String(Date.now()),
                  name: '',
                  description: '',
                  condition: '',
                  action: 'review',
                  priority: rules.length + 1,
                  enabled: true,
                });
                setShowRuleModal(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#00d4ff',
                color: '#0a0f1a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + Add Rule
            </button>
          </div>

          <div style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Rule Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Condition</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.sort((a, b) => a.priority - b.priority).map((rule, index) => {
                  const actionColors = getActionBadgeColor(rule.action);
                  return (
                    <tr key={rule.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                        {rule.priority}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{rule.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{rule.description}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <code style={{ 
                          fontSize: '12px', 
                          background: '#f1f5f9', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}>
                          {rule.condition}
                        </code>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: actionColors.bg,
                          color: actionColors.text,
                          textTransform: 'uppercase',
                        }}>
                          {rule.action}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => {
                              setRules(rules.map(r => 
                                r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                              ));
                            }}
                            style={{ marginRight: '8px' }}
                          />
                          <span style={{ fontSize: '14px', color: rule.enabled ? '#16a34a' : '#64748b' }}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            marginRight: '8px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            border: '1px solid #fee2e2',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#dc2626',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            background: '#fefce8', 
            borderRadius: '8px',
            border: '1px solid #fef08a',
          }}>
            <p style={{ fontSize: '13px', color: '#854d0e', margin: 0 }}>
              <strong>Rule Evaluation Order:</strong> Rules are evaluated by priority (lowest first). 
              The first matching rule determines the action. If no rules match, the application goes to manual review.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'emails' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Email Templates</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
                Customize automated emails sent to applicants
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {emailTemplates.map((template) => (
              <div
                key={template.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: template.type === 'approval' ? '#dcfce7' : 
                                   template.type === 'denial' ? '#fee2e2' : 
                                   template.type === 'request_info' ? '#fef3c7' : '#e0f2fe',
                        color: template.type === 'approval' ? '#16a34a' : 
                               template.type === 'denial' ? '#dc2626' : 
                               template.type === 'request_info' ? '#d97706' : '#0369a1',
                        textTransform: 'uppercase',
                      }}>
                        {template.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                      {template.subject}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      {template.body.substring(0, 150)}...
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowTemplateModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            background: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #bae6fd',
          }}>
            <p style={{ fontSize: '13px', color: '#0369a1', margin: 0 }}>
              <strong>Available Variables:</strong> Use {'{{applicant.firstName}}'}, {'{{applicant.lastName}}'}, 
              {'{{member.id}}'}, {'{{member.planType}}'}, {'{{config.supportPhone}}'}, etc. in your templates.
            </p>
          </div>
        </div>
      )}

      {/* Rule Edit Modal */}
      {showRuleModal && editingRule && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>
              {editingRule.id ? 'Edit Rule' : 'Add Rule'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Rule Name
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g., Age Requirement"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Brief description of what this rule checks"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Condition (JavaScript expression)
                </label>
                <input
                  type="text"
                  value={editingRule.condition}
                  onChange={(e) => setEditingRule({ ...editingRule, condition: e.target.value })}
                  placeholder="e.g., applicant.age >= 18"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                    Action
                  </label>
                  <select
                    value={editingRule.action}
                    onChange={(e) => setEditingRule({ ...editingRule, action: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="approve">Auto Approve</option>
                    <option value="deny">Auto Deny</option>
                    <option value="review">Flag for Review</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                    Priority
                  </label>
                  <input
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowRuleModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rules.find(r => r.id === editingRule.id)) {
                    setRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
                  } else {
                    setRules([...rules, editingRule]);
                  }
                  setShowRuleModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#00d4ff',
                  color: '#0a0f1a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Edit Modal */}
      {showTemplateModal && editingTemplate && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>
              Edit {editingTemplate.type.replace('_', ' ')} Template
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Email Body
                </label>
                <textarea
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEmailTemplates(emailTemplates.map(t => 
                    t.id === editingTemplate.id ? editingTemplate : t
                  ));
                  setShowTemplateModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#00d4ff',
                  color: '#0a0f1a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
