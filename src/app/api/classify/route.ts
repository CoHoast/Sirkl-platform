import { NextRequest, NextResponse } from 'next/server';

// Backend API URL (Railway deployed or local)
const API_URL = process.env.MCO_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Create new FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file, file.name);
    
    console.log(`[Classify] Forwarding ${file.name} to backend...`);
    
    // Forward to Python backend
    const response = await fetch(`${API_URL}/api/classify`, {
      method: 'POST',
      body: backendFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Classify] Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        { error: 'Failed to classify document' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log(`[Classify] Success: ${result.document_code}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Classify] Error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
