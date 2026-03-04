import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { changePassword, createSessionToken } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dokit-admin-secret-change-in-production-2026';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current and new passwords are required' },
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
      mfaVerified: boolean;
    };
    
    const result = await changePassword(decoded.userId, currentPassword, newPassword);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
    // Create new session without mustChangePassword flag
    const newToken = createSessionToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      mfaVerified: decoded.mfaVerified
    });
    
    cookieStore.set('dokit_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 });
  }
}
