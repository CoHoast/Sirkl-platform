// Phase 2D: Negotiation Settings API

import { NextRequest, NextResponse } from 'next/server';
import { rulesEngine } from '@/lib/rules/engine';

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

// Get client settings
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const settings = await rulesEngine.getClientSettings(parseInt(clientId));
    
    return NextResponse.json({
      success: true,
      settings
    });
    
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Update client settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    
    const settings = await rulesEngine.updateClientSettings(parseInt(clientId), body);
    
    return NextResponse.json({
      success: true,
      settings
    });
    
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
