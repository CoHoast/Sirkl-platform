// Phase 2D: Process Bill Through Rules Engine

import { NextRequest, NextResponse } from 'next/server';
import { rulesEngine } from '@/lib/rules/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId } = body;
    
    if (!billId) {
      return NextResponse.json({
        success: false,
        error: 'billId is required'
      }, { status: 400 });
    }
    
    const result = await rulesEngine.processBill(billId);
    
    return NextResponse.json({
      success: result.errors.length === 0,
      executed: result.executed,
      errors: result.errors
    });
    
  } catch (error: any) {
    console.error('Process bill error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
