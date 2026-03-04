import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;

  try {
    const result = await pool.query(`
      SELECT 
        cl.id,
        cl.client_id,
        cl.claim_number,
        cl.member_id,
        cl.provider_npi,
        cl.date_of_service,
        cl.cpt_codes,
        cl.icd_codes,
        cl.billed_amount,
        cl.allowed_amount,
        cl.claim_data,
        cl.ai_decision,
        cl.ai_reasoning,
        cl.status,
        cl.processed_at,
        cl.created_at,
        c.name as client_name
      FROM claims cl
      LEFT JOIN clients c ON cl.client_id = c.id
      WHERE cl.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Transform the data to include nested claim_data details
    const row = result.rows[0];
    const claimData = typeof row.claim_data === 'string' 
      ? JSON.parse(row.claim_data) 
      : row.claim_data;

    const transformed = {
      ...row,
      // Extract from claim_data for easier access
      patient_name: claimData?.claim?.member_name || null,
      patient_dob: claimData?.claim?.member_dob || null,
      provider_name: claimData?.claim?.provider_name || null,
      diagnosis_codes: row.icd_codes || [],
      procedure_codes: row.cpt_codes || [],
      claim_amount: row.billed_amount,
      decision: row.ai_decision,
      decision_confidence: claimData?.adjudication?.confidence 
        ? Math.round(claimData.adjudication.confidence * 100) 
        : null,
      decision_reasoning: row.ai_reasoning,
      adjudication_rules: claimData?.adjudication?.rule_applied || null,
      flags: claimData?.adjudication?.flags || [],
      payment_recommendation: claimData?.adjudication?.payment_recommendation || null,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const { status, ai_decision, ai_reasoning } = body;
    
    let query = 'UPDATE claims SET ';
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (ai_decision) {
      updates.push(`ai_decision = $${paramIndex}`);
      values.push(ai_decision);
      paramIndex++;
    }

    if (ai_reasoning) {
      updates.push(`ai_reasoning = $${paramIndex}`);
      values.push(ai_reasoning);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    query += updates.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update claim', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
