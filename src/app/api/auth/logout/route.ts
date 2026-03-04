import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logAuditEvent } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dokit-admin-secret-change-in-production-2026';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('dokit_session')?.value;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        await logAuditEvent('LOGOUT', 'User logged out', decoded.userId);
      } catch {
        // Token invalid, still clear cookies
      }
    }
    
    // Clear all auth cookies
    cookieStore.delete('dokit_session');
    cookieStore.delete('dokit_mfa_pending');
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Still return success
  }
}
