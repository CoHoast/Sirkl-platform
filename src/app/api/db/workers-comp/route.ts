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
        wc.id,
        wc.client_id,
        wc.report_number,
        wc.employee_name,
        wc.employee_ssn_last4,
        wc.employer_name,
        wc.employer_policy,
        wc.injury_date,
        wc.injury_description,
        wc.cause_code,
        wc.nature_code,
        wc.body_part_code,
        wc.ai_confidence,
        wc.filing_deadline,
        wc.status,
        wc.submitted_at,
        wc.created_at,
        c.name as client_name
      FROM workers_comp_froi wc
      LEFT JOIN clients c ON wc.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND wc.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND wc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY wc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM workers_comp_froi WHERE 1=1`;
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
      reports: result.rows,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers comp reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
