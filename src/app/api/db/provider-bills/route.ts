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
        pb.id,
        pb.client_id,
        pb.provider_name,
        pb.provider_npi,
        pb.patient_name,
        pb.bill_type,
        pb.billed_amount,
        pb.allowed_amount,
        pb.savings_amount,
        pb.extracted_data,
        pb.flags,
        pb.status,
        pb.processed_at,
        pb.created_at,
        c.name as client_name
      FROM provider_bills pb
      LEFT JOIN clients c ON pb.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND pb.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND pb.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY pb.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM provider_bills WHERE 1=1`;
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
      bills: result.rows,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider bills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
