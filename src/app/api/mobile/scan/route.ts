import { NextRequest, NextResponse } from 'next/server';

// Backend API URL (Railway deployed or local)
const API_URL = process.env.OPTALIS_API_URL || 'https://mco-advantage-api-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Collect all images from the form data
    const images: File[] = [];
    
    // Handle multiple image fields (image_0, image_1, etc.)
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        images.push(value);
      }
    }
    
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }
    
    // Create new FormData to send to backend
    const backendFormData = new FormData();
    images.forEach((image, index) => {
      backendFormData.append('images', image, image.name || `scan_${index}.jpg`);
    });
    
    console.log(`[Mobile Scan] Forwarding ${images.length} image(s) to backend...`);
    
    // Forward to Python backend
    const response = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      body: backendFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Mobile Scan] Backend error: ${response.status} - ${errorText}`);
      
      let errorMessage = 'Failed to process document';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.error || errorMessage;
      } catch {
        // Use default error message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log(`[Mobile Scan] Success: ${result.applicationId} - ${result.patientName}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Mobile Scan] Error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
