import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  max: 5
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = `
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
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND cl.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND cl.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY cl.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM claims WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (clientId && clientId !== 'all') {
      countQuery += ` AND client_id = $${countParamIndex}`;
      countParams.push(parseInt(clientId));
      countParamIndex++;
    }

    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      claims: result.rows,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
