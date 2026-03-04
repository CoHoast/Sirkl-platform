'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  mfa_enabled: boolean;
  last_login: string;
  created_at: string;
  activity_status: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'admin' });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/db/team');
      const data = await res.json();
      setMembers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) {
      setError('Email and name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/db/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }
      setTempPassword(data.tempPassword);
      fetchTeam();
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('Reset password for this user?')) return;
    try {
      const res = await fetch('/api/db/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, resetPassword: true })
      });
      const data = await res.json();
      if (res.ok && data.tempPassword) {
        alert(`New temporary password: ${data.tempPassword}\n\nUser must change this on next login.`);
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/db/team?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return { bg: '#dbeafe', text: '#1d4ed8' };
    if (role === 'admin') return { bg: '#dcfce7', text: '#166534' };
    return { bg: '#f3f4f6', text: '#4b5563' };
  };

  const getActivityColor = (status: string) => {
    if (status === 'active') return '#16a34a';
    if (status === 'recent') return '#d97706';
    return '#9ca3af';
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#6b7280' }}>Loading team...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a', marginBottom: '8px' }}>Team Management</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Manage admin users and access</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setTempPassword(null); setError(''); setNewUser({ email: '', name: '', role: 'admin' }); }}
          style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          + Add User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Users</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#0a0f1a' }}>{members.length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>MFA Enabled</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{members.filter(m => m.mfa_enabled).length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Active Today</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#00d4ff' }}>{members.filter(m => m.activity_status === 'active').length}</p>
        </div>
      </div>

      {/* Team List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>User</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Role</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>MFA</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Last Login</th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => {
              const roleColor = getRoleColor(member.role);
              return (
                <tr key={member.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0a0f1a, #1a2332)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#00d4ff', fontWeight: 600, fontSize: '14px'
                      }}>
                        {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: '#0a0f1a', marginBottom: '2px' }}>{member.name}</p>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>{member.email}</p>
                      </div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getActivityColor(member.activity_status), marginLeft: '8px' }} title={member.activity_status} />
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: roleColor.bg, color: roleColor.text }}>
                      {member.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    {member.mfa_enabled ? (
                      <span style={{ color: '#16a34a' }}>✓ Enabled</span>
                    ) : (
                      <span style={{ color: '#d97706' }}>⚠ Not Set</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '14px' }}>{formatDate(member.last_login)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleResetPassword(member.id)} style={{ padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Reset Password</button>
                      <button onClick={() => handleDeleteUser(member.id)} style={{ padding: '6px 12px', background: '#fef2f2', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '450px', margin: '20px' }} onClick={e => e.stopPropagation()}>
            {tempPassword ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#16a34a' }}>✓ User Created!</h2>
                <p style={{ marginBottom: '16px', color: '#374151' }}>Share this temporary password with the user. They must change it on first login.</p>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '18px', textAlign: 'center', fontWeight: 600 }}>
                  {tempPassword}
                </div>
                <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '24px' }}>⚠️ This password will not be shown again!</p>
                <button onClick={() => setShowAddModal(false)} style={{ width: '100%', padding: '12px', background: '#0a0f1a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Add Team Member</h2>
                {error && <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>{error}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Name *</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Smith" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email *</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@dokit.ai" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="viewer">Viewer (Read Only)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAddUser} disabled={saving} style={{ padding: '10px 20px', background: saving ? '#9ca3af' : 'linear-gradient(135deg, #00d4ff, #00b8e6)', color: '#0a0f1a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Creating...' : 'Create User'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
