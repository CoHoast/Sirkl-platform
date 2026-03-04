import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyMFAToken, useRecoveryCode } from '@/lib/totp';
import { createSessionToken, updateLastLogin, logAuditEvent } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { code, isRecoveryCode } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = await cookies();
    const pendingUserId = cookieStore.get('dokit_mfa_pending')?.value;
    
    if (!pendingUserId) {
      return NextResponse.json(
        { success: false, error: 'MFA session expired. Please login again.' },
        { status: 401 }
      );
    }
    
    const userId = parseInt(pendingUserId);
    let isValid = false;
    
    if (isRecoveryCode) {
      isValid = await useRecoveryCode(userId, code);
      if (isValid) {
        await logAuditEvent('MFA_RECOVERY_USED', 'Recovery code used for login', userId);
      }
    } else {
      isValid = await verifyMFAToken(userId, code);
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 401 }
      );
    }
    
    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, name, role, must_change_password FROM admin_users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }
    
    const user = userResult.rows[0];
    
    // Create full session token with MFA verified
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      mfaVerified: true,
      mustChangePassword: user.must_change_password
    } as any);
    
    // Update cookies
    cookieStore.set('dokit_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/'
    });
    
    // Clear MFA pending cookie
    cookieStore.delete('dokit_mfa_pending');
    
    await updateLastLogin(userId);
    await logAuditEvent('MFA_VERIFIED', 'MFA verification successful', userId);
    
    return NextResponse.json({
      success: true,
      mustChangePassword: user.must_change_password
    });
    
  } catch (error) {
    console.error('MFA verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
