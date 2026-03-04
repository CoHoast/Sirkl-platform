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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('clientId');
  const documentType = searchParams.get('documentType');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = `
      SELECT 
        d.id,
        d.client_id,
        d.document_type,
        d.original_filename,
        d.s3_key,
        d.status,
        d.confidence_score,
        d.extracted_data,
        d.processed_at,
        d.created_at,
        c.name as client_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND d.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    if (documentType && documentType !== 'all') {
      query += ` AND d.document_type = $${paramIndex}`;
      params.push(documentType);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM documents WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (clientId && clientId !== 'all') {
      countQuery += ` AND client_id = $${countParamIndex}`;
      countParams.push(parseInt(clientId));
      countParamIndex++;
    }

    if (documentType && documentType !== 'all') {
      countQuery += ` AND document_type = $${countParamIndex}`;
      countParams.push(documentType);
      countParamIndex++;
    }

    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      documents: result.rows,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
