import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id, email, name, role, mfa_enabled, 
        last_login, created_at, 
        CASE WHEN last_login > NOW() - INTERVAL '1 day' THEN 'active'
             WHEN last_login > NOW() - INTERVAL '7 days' THEN 'recent'
             ELSE 'inactive' END as activity_status
      FROM admin_users
      ORDER BY name ASC
    `);

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);

    const result = await pool.query(`
      INSERT INTO admin_users (email, name, role, password_hash, must_change_password, mfa_enabled)
      VALUES ($1, $2, $3, $4, true, false)
      RETURNING id, email, name, role
    `, [email, name, role || 'admin', passwordHash]);

    // In production, you would send an email with the temp password
    // For now, return it in the response (only shown once)
    return NextResponse.json({
      user: result.rows[0],
      tempPassword, // Only return this once! User must change on first login
      message: 'User created. They must change their password on first login.'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, role, resetPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (resetPassword) {
      // Generate new temporary password
      const tempPassword = crypto.randomBytes(12).toString('base64url');
      const passwordHash = await hashPassword(tempPassword);

      await pool.query(`
        UPDATE admin_users 
        SET password_hash = $1, must_change_password = true, updated_at = NOW()
        WHERE id = $2
      `, [passwordHash, id]);

      return NextResponse.json({ tempPassword, message: 'Password reset. User must change on next login.' });
    }

    // Update user details
    await pool.query(`
      UPDATE admin_users 
      SET name = COALESCE($1, name), role = COALESCE($2, role), updated_at = NOW()
      WHERE id = $3
    `, [name, role, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow deleting yourself (would need session info)
    // For now, just prevent deleting the last admin
    const adminCount = await pool.query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin'");
    const userRole = await pool.query('SELECT role FROM admin_users WHERE id = $1', [id]);
    
    if (userRole.rows[0]?.role === 'super_admin' && parseInt(adminCount.rows[0].count) <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last super admin' }, { status: 400 });
    }

    await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
