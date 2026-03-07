'use client';

import { useState, useEffect } from 'react';
import { useClient } from '@/context/ClientContext';

interface WorkflowSchedule {
  id: string;
  workflow_type: string;
  schedule_type: 'daily' | 'weekly' | 'monthly';
  schedule_time: string;
  schedule_day?: number; // 0-6 for weekly (Sunday=0), 1-31 for monthly
  enabled: boolean;
  input_source: {
    type: 'sftp' | 's3' | 'email';
    config: Record<string, any>;
  };
  output_destination: {
    webhook_url: string;
    auth_header?: string;
    include_original: boolean;
  };
  last_run?: string;
  next_run?: string;
  last_run_status?: 'success' | 'failed' | 'running';
  last_run_count?: number;
}

const WORKFLOW_TYPES = [
  { id: 'document_intake', name: 'Document Intake', description: 'Process incoming healthcare documents' },
  { id: 'claims_adjudication', name: 'Claims Adjudication', description: 'Evaluate and adjudicate claims' },
  { id: 'member_intake', name: 'Member Intake', description: 'Process new member applications' },
  { id: 'provider_bills', name: 'Provider Bill Processing', description: 'Process and reprice provider bills' },
  { id: 'workers_comp', name: 'Workers Comp FROI', description: 'Process injury reports' },
];

const SCHEDULE_FREQUENCIES = [
  { id: 'daily', name: 'Daily', description: 'Run once every day' },
  { id: 'weekly', name: 'Weekly', description: 'Run once every week' },
  { id: 'monthly', name: 'Monthly', description: 'Run once every month' },
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkflowSchedulingPage() {
  const { selectedClient } = useClient();
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkflowSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    workflow_type: 'document_intake',
    schedule_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    schedule_time: '09:00',
    schedule_day: 1,
    enabled: true,
    input_type: 's3' as 'sftp' | 's3' | 'email',
    s3_bucket: 'mco-advantage-documents',
    s3_prefix: 'test-intake/incoming/',
    sftp_host: '',
    sftp_port: '22',
    sftp_user: '',
    sftp_password: '',
    sftp_path: '/incoming',
    webhook_url: 'https://mcoadvantagedashboard-production.up.railway.app/api/webhook/intake',
    auth_header: '',
    include_original: true,
  });

  useEffect(() => {
    if (selectedClient) {
      loadSchedules();
    }
  }, [selectedClient]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/workflow-schedules?client_id=${selectedClient?.id}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
    setLoading(false);
  };

  const saveSchedule = async () => {
    const schedule: Partial<WorkflowSchedule> = {
      workflow_type: formData.workflow_type,
      schedule_type: formData.schedule_type,
      schedule_time: formData.schedule_time,
      schedule_day: formData.schedule_type === 'daily' ? undefined : formData.schedule_day,
      enabled: formData.enabled,
      input_source: {
        type: formData.input_type,
        config: formData.input_type === 's3' 
          ? { bucket: formData.s3_bucket, prefix: formData.s3_prefix }
          : formData.input_type === 'sftp'
          ? { host: formData.sftp_host, port: formData.sftp_port, user: formData.sftp_user, path: formData.sftp_path }
          : {}
      },
      output_destination: {
        webhook_url: formData.webhook_url,
        auth_header: formData.auth_header || undefined,
        include_original: formData.include_original,
      }
    };

    try {
      const res = await fetch('/api/db/workflow-schedules', {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schedule,
          id: editingSchedule?.id,
          client_id: selectedClient?.id
        })
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setEditingSchedule(null);
        loadSchedules();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const toggleSchedule = async (schedule: WorkflowSchedule) => {
    try {
      await fetch('/api/db/workflow-schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: schedule.id,
          client_id: selectedClient?.id,
          enabled: !schedule.enabled
        })
      });
      loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const runNow = async (schedule: WorkflowSchedule) => {
    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: schedule.id,
          client_id: selectedClient?.id
        })
      });
      
      if (res.ok) {
        alert('Workflow started! Check the Recent Runs section for progress.');
        loadSchedules();
      }
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  };

  const formatNextRun = (schedule: WorkflowSchedule) => {
    const now = new Date();
    const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (schedule.schedule_type === 'daily') {
      if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
    } else if (schedule.schedule_type === 'weekly') {
      const targetDay = schedule.schedule_day || 0;
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && nextRun <= now)) {
        daysUntil += 7;
      }
      nextRun.setDate(nextRun.getDate() + daysUntil);
    } else if (schedule.schedule_type === 'monthly') {
      nextRun.setDate(schedule.schedule_day || 1);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    }
    
    return nextRun.toLocaleString();
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#275380',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  if (!selectedClient) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>
            Please select a client to configure workflow schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Workflow Scheduling
          </h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Configure automated workflow runs for {selectedClient.name}
          </p>
        </div>
        <button style={buttonStyle} onClick={() => setShowAddModal(true)}>
          + Add Schedule
        </button>
      </div>

      {/* Existing Schedules */}
      {loading ? (
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading schedules...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📅</p>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No schedules configured
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Set up automated workflow runs to process documents on a schedule.
            </p>
            <button style={buttonStyle} onClick={() => setShowAddModal(true)}>
              Create Your First Schedule
            </button>
          </div>
        </div>
      ) : (
        <div>
          {schedules.map((schedule) => {
            const workflowInfo = WORKFLOW_TYPES.find(w => w.id === schedule.workflow_type);
            return (
              <div key={schedule.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {workflowInfo?.name || schedule.workflow_type}
                      </h3>
                      <span style={{
                        backgroundColor: schedule.enabled ? '#dcfce7' : '#f3f4f6',
                        color: schedule.enabled ? '#166534' : '#6b7280',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {schedule.enabled ? '🟢 Active' : '⏸️ Paused'}
                      </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px 0' }}>
                      {workflowInfo?.description}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Schedule</p>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          {schedule.schedule_type === 'daily' && `Daily at ${schedule.schedule_time}`}
                          {schedule.schedule_type === 'weekly' && `${DAYS_OF_WEEK[schedule.schedule_day || 0]}s at ${schedule.schedule_time}`}
                          {schedule.schedule_type === 'monthly' && `${schedule.schedule_day}${['st','nd','rd'][((schedule.schedule_day||1)-1)%10] || 'th'} of month at ${schedule.schedule_time}`}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Input Source</p>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          {schedule.input_source.type.toUpperCase()}
                          {schedule.input_source.type === 's3' && `: ${schedule.input_source.config.prefix}`}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Next Run</p>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          {schedule.enabled ? formatNextRun(schedule) : 'Paused'}
                        </p>
                      </div>
                    </div>
                    
                    {schedule.last_run && (
                      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          Last run: {new Date(schedule.last_run).toLocaleString()} 
                          {schedule.last_run_status === 'success' && ` ✓ ${schedule.last_run_count} docs processed`}
                          {schedule.last_run_status === 'failed' && ' × Failed'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                    <button 
                      style={{ ...secondaryButtonStyle, padding: '8px 16px' }}
                      onClick={() => runNow(schedule)}
                    >
                      ▶️ Run Now
                    </button>
                    <button 
                      style={{ ...secondaryButtonStyle, padding: '8px 16px' }}
                      onClick={() => toggleSchedule(schedule)}
                    >
                      {schedule.enabled ? '⏸️ Pause' : '▶️ Enable'}
                    </button>
                    <button 
                      style={{ ...secondaryButtonStyle, padding: '8px 16px' }}
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setFormData({
                          workflow_type: schedule.workflow_type,
                          schedule_type: schedule.schedule_type,
                          schedule_time: schedule.schedule_time,
                          schedule_day: schedule.schedule_day || 1,
                          enabled: schedule.enabled,
                          input_type: schedule.input_source.type,
                          s3_bucket: schedule.input_source.config.bucket || 'mco-advantage-documents',
                          s3_prefix: schedule.input_source.config.prefix || '',
                          sftp_host: schedule.input_source.config.host || '',
                          sftp_port: schedule.input_source.config.port || '22',
                          sftp_user: schedule.input_source.config.user || '',
                          sftp_password: '',
                          sftp_path: schedule.input_source.config.path || '',
                          webhook_url: schedule.output_destination.webhook_url,
                          auth_header: schedule.output_destination.auth_header || '',
                          include_original: schedule.output_destination.include_original,
                        });
                        setShowAddModal(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={modalOverlayStyle} onClick={() => { setShowAddModal(false); setEditingSchedule(null); }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>
            
            {/* Workflow Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Workflow Type</label>
              <select 
                style={inputStyle}
                value={formData.workflow_type}
                onChange={(e) => setFormData({...formData, workflow_type: e.target.value})}
              >
                {WORKFLOW_TYPES.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
            </div>

            {/* Schedule Frequency */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Frequency</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {SCHEDULE_FREQUENCIES.map(freq => (
                  <button
                    key={freq.id}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: formData.schedule_type === freq.id ? '2px solid #275380' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: formData.schedule_type === freq.id ? '#eff6ff' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFormData({...formData, schedule_type: freq.id as any})}
                  >
                    <p style={{ fontWeight: '600', margin: '0 0 4px 0' }}>{freq.name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{freq.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Day (for weekly/monthly) */}
            {formData.schedule_type === 'weekly' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Day of Week</label>
                <select 
                  style={inputStyle}
                  value={formData.schedule_day}
                  onChange={(e) => setFormData({...formData, schedule_day: parseInt(e.target.value)})}
                >
                  {DAYS_OF_WEEK.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.schedule_type === 'monthly' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Day of Month</label>
                <select 
                  style={inputStyle}
                  value={formData.schedule_day}
                  onChange={(e) => setFormData({...formData, schedule_day: parseInt(e.target.value)})}
                >
                  {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Time */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Time</label>
              <input 
                type="time"
                style={inputStyle}
                value={formData.schedule_time}
                onChange={(e) => setFormData({...formData, schedule_time: e.target.value})}
              />
            </div>

            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            {/* Input Source */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📥 Input Source</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Source Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['s3', 'sftp', 'email'].map(type => (
                  <button
                    key={type}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: formData.input_type === type ? '2px solid #275380' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: formData.input_type === type ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                    onClick={() => setFormData({...formData, input_type: type as any})}
                  >
                    {type === 's3' && '☁️ S3'}
                    {type === 'sftp' && 'SFTP'}
                    {type === 'email' && '📧 Email'}
                  </button>
                ))}
              </div>
            </div>

            {formData.input_type === 's3' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>S3 Bucket</label>
                  <input 
                    style={inputStyle}
                    value={formData.s3_bucket}
                    onChange={(e) => setFormData({...formData, s3_bucket: e.target.value})}
                    placeholder="mco-advantage-documents"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Folder Path (Prefix)</label>
                  <input 
                    style={inputStyle}
                    value={formData.s3_prefix}
                    onChange={(e) => setFormData({...formData, s3_prefix: e.target.value})}
                    placeholder="test-intake/incoming/"
                  />
                </div>
              </>
            )}

            {formData.input_type === 'sftp' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>SFTP Host</label>
                    <input 
                      style={inputStyle}
                      value={formData.sftp_host}
                      onChange={(e) => setFormData({...formData, sftp_host: e.target.value})}
                      placeholder="ftp.example.com"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Port</label>
                    <input 
                      style={inputStyle}
                      value={formData.sftp_port}
                      onChange={(e) => setFormData({...formData, sftp_port: e.target.value})}
                      placeholder="22"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Username</label>
                    <input 
                      style={inputStyle}
                      value={formData.sftp_user}
                      onChange={(e) => setFormData({...formData, sftp_user: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input 
                      type="password"
                      style={inputStyle}
                      value={formData.sftp_password}
                      onChange={(e) => setFormData({...formData, sftp_password: e.target.value})}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Remote Path</label>
                  <input 
                    style={inputStyle}
                    value={formData.sftp_path}
                    onChange={(e) => setFormData({...formData, sftp_path: e.target.value})}
                    placeholder="/incoming"
                  />
                </div>
              </>
            )}

            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            {/* Output Destination */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📤 Output Destination</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Webhook URL</label>
              <input 
                style={inputStyle}
                value={formData.webhook_url}
                onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                placeholder="https://api.example.com/intake"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Authorization Header (optional)</label>
              <input 
                style={inputStyle}
                value={formData.auth_header}
                onChange={(e) => setFormData({...formData, auth_header: e.target.value})}
                placeholder="Bearer sk_live_xxxxx"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={formData.include_original}
                  onChange={(e) => setFormData({...formData, include_original: e.target.checked})}
                />
                <span style={{ fontSize: '14px' }}>Include original document in webhook payload</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                style={secondaryButtonStyle}
                onClick={() => { setShowAddModal(false); setEditingSchedule(null); }}
              >
                Cancel
              </button>
              <button style={buttonStyle} onClick={saveSchedule}>
                {editingSchedule ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
