import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// GET - Fetch all applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    
    let query = `
      SELECT 
        a.id,
        a.applicant_name,
        a.applicant_email,
        a.applicant_data,
        a.eligibility_score,
        a.ai_recommendation,
        a.ai_reasoning,
        a.status,
        a.decision,
        a.decided_by,
        a.decided_at,
        a.created_at,
        c.name as client_name
      FROM applications a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (clientId) {
      query += ` AND a.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Transform to match frontend expected format
    const applications = result.rows.map(row => ({
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
    }));
    
    return NextResponse.json({ applications, total: applications.length });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications', 
      details: error?.message || 'Unknown error',
      applications: [] 
    }, { status: 500 });
  }
}

// POST - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, applicantName, applicantEmail, applicantData } = body;
    
    const result = await pool.query(`
      INSERT INTO applications (client_id, applicant_name, applicant_email, applicant_data, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `, [clientId || 1, applicantName, applicantEmail, JSON.stringify(applicantData)]);
    
    return NextResponse.json({ id: result.rows[0].id, message: 'Application created' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
