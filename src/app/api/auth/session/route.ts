import { NextResponse } from 'next/server';
import { getCurrentUser, getSession } from '@/lib/auth';
import { getMFAStatus } from '@/lib/totp';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    
    const mfaStatus = await getMFAStatus(user.id);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      mfaEnabled: mfaStatus.enabled,
      mfaVerified: session.mfaVerified,
      mustChangePassword: user.must_change_password,
      recoveryCodesRemaining: mfaStatus.recoveryCodesRemaining
    });
    
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
