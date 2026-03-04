import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dokit-admin-secret-change-in-production-2026';
const SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  mfa_enabled: boolean;
  must_change_password: boolean;
  backup_email: string | null;
}

export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
  mfaVerified: boolean;
  exp: number;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

// Create JWT session token
export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  return jwt.sign({ ...payload, exp }, JWT_SECRET);
}

// Verify and decode session token
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Get current session from cookies
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('dokit_session')?.value;
  
  if (!token) return null;
  
  return verifySessionToken(token);
}

// Get current user from session
export async function getCurrentUser(): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session || !session.mfaVerified) return null;
  
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, mfa_enabled, must_change_password, backup_email FROM admin_users WHERE id = $1',
      [session.userId]
    );
    
    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch {
    return null;
  }
}

// Authenticate user with email/password
export async function authenticateUser(email: string, password: string): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
  requiresMfa?: boolean;
}> {
  try {
    // Check for account lockout
    const userResult = await pool.query(
      `SELECT id, email, password_hash, name, role, mfa_enabled, must_change_password, 
              backup_email, failed_login_attempts, locked_until
       FROM admin_users WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    const user = userResult.rows[0];
    
    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return { success: false, error: `Account locked. Try again in ${minutesLeft} minutes.` };
    }
    
    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    
    if (!passwordValid) {
      // Increment failed attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      
      if (newAttempts >= 5) {
        // Lock account for 15 minutes
        await pool.query(
          `UPDATE admin_users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '15 minutes' WHERE id = $2`,
          [newAttempts, user.id]
        );
        return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
      } else {
        await pool.query(
          'UPDATE admin_users SET failed_login_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
      }
      
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Reset failed attempts on successful login
    await pool.query(
      'UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfa_enabled: user.mfa_enabled,
        must_change_password: user.must_change_password,
        backup_email: user.backup_email
      },
      requiresMfa: user.mfa_enabled
    };
    
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Log audit event
export async function logAuditEvent(
  action: string,
  details: string,
  userId?: number,
  clientId?: number,
  options?: {
    entityType?: string;
    entityId?: number;
    ipAddress?: string;
    userAgent?: string;
    changes?: Record<string, any>;
  }
) {
  try {
    // Get user info if userId provided
    let userName = null;
    let userEmail = null;
    if (userId) {
      const userResult = await pool.query('SELECT name, email FROM admin_users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        userName = userResult.rows[0].name;
        userEmail = userResult.rows[0].email;
      }
    }
    
    await pool.query(
      `INSERT INTO audit_log (action, details, admin_user_id, user_name, user_email, client_id, entity_type, entity_id, ip_address, user_agent, changes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        action,
        details,
        userId || null,
        userName,
        userEmail,
        clientId || null,
        options?.entityType || null,
        options?.entityId || null,
        options?.ipAddress || null,
        options?.userAgent || null,
        options?.changes ? JSON.stringify(options.changes) : null
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// Update last login
export async function updateLastLogin(userId: number) {
  await pool.query(
    'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
}

// Change password
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get current hash
    const result = await pool.query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    // Verify current password
    const valid = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('. ') };
    }
    
    // Hash and save new password
    const newHash = await hashPassword(newPassword);
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
    
    await logAuditEvent('PASSWORD_CHANGED', 'User changed their password', userId);
    
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}
