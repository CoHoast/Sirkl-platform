import { NextRequest, NextResponse } from 'next/server';

// Backend API URL (Railway deployed or local)
const API_URL = process.env.MCO_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.claim) {
      return NextResponse.json(
        { error: 'No claim data provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Adjudicate] Processing claim: ${body.claim.claim_id}`);
    
    // Forward to Python backend
    const response = await fetch(`${API_URL}/api/adjudicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Adjudicate] Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        { error: 'Failed to adjudicate claim' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log(`[Adjudicate] Decision: ${result.decision}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Adjudicate] Error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
