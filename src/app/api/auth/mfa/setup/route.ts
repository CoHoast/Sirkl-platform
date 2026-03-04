import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { setupMFA, verifyAndEnableMFA, getMFAStatus } from '@/lib/totp';
import { createSessionToken, logAuditEvent } from '@/lib/auth';
import { pool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dokit-admin-secret-change-in-production-2026';

// GET - Get MFA setup info (QR code)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('dokit_session')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;
    
    // Check if MFA is already enabled
    const status = await getMFAStatus(userId);
    if (status.enabled) {
      return NextResponse.json({ 
        success: true, 
        alreadyEnabled: true,
        recoveryCodesRemaining: status.recoveryCodesRemaining
      });
    }
    
    // Generate MFA setup
    const { qrCode, recoveryCodes } = await setupMFA(userId);
    
    return NextResponse.json({
      success: true,
      qrCode,
      recoveryCodes,
      alreadyEnabled: false
    });
    
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to setup MFA' }, { status: 500 });
  }
}

// POST - Verify and enable MFA
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = await cookies();
    const token = cookieStore.get('dokit_session')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: number; 
      email: string; 
      role: string;
      mustChangePassword?: boolean;
    };
    
    const isValid = await verifyAndEnableMFA(decoded.userId, code);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }
    
    // Get current must_change_password status
    const userResult = await pool.query(
      'SELECT must_change_password FROM admin_users WHERE id = $1',
      [decoded.userId]
    );
    const mustChangePassword = userResult.rows[0]?.must_change_password || false;
    
    // Create new session with MFA verified
    const newToken = createSessionToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      mfaVerified: true,
      mustChangePassword
    } as any);
    
    cookieStore.set('dokit_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/'
    });
    
    await logAuditEvent('MFA_ENABLED', 'MFA has been enabled for the account', decoded.userId);
    
    return NextResponse.json({ 
      success: true,
      mustChangePassword
    });
    
  } catch (error) {
    console.error('MFA enable error:', error);
    return NextResponse.json({ success: false, error: 'Failed to enable MFA' }, { status: 500 });
  }
}
