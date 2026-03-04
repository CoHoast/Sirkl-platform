import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// GET - Fetch single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as client_name
      FROM applications a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id.toString(),
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      applicantData: row.applicant_data,
      eligibilityScore: row.eligibility_score,
      aiRecommendation: row.ai_recommendation,
      aiReasoning: row.ai_reasoning,
      status: row.status,
      decision: row.decision,
      decidedBy: row.decided_by,
      decidedAt: row.decided_at,
      createdAt: row.created_at,
      clientName: row.client_name,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// PATCH - Update application (decision)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision, decidedBy, status } = body;
    
    const result = await pool.query(`
      UPDATE applications 
      SET 
        decision = COALESCE($1, decision),
        decided_by = COALESCE($2, decided_by),
        decided_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE decided_at END,
        status = COALESCE($3, status)
      WHERE id = $4
      RETURNING id
    `, [decision, decidedBy, status, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Application updated', id });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
