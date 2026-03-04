import { NextRequest, NextResponse } from 'next/server';

// Shared application store (imported logic - in production use database)
// For now, we'll fetch from the parent route's in-memory store via internal call

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // In production, query database
  // For now, return mock data or fetch from parent
  const mockApplication = {
    id,
    applicationNumber: 'UR-2026-0847',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'review',
    aiConfidence: 72,
    aiSummary: 'Applicant has Type 2 Diabetes (controlled with medication). Recommend manual review.',
    applicant: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@email.com',
      phone: '(614) 555-0123',
    },
    // ... rest of application data
  };

  return NextResponse.json({ application: mockApplication });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const { status, reviewNotes, reviewedBy } = body;
  
  // In production, update database
  // For now, just acknowledge the update
  
  return NextResponse.json({
    success: true,
    applicationId: id,
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  });
}
