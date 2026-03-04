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
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    let query = `
      SELECT 
        wr.id,
        wr.client_id,
        wr.workflow_type,
        wr.status,
        wr.started_at,
        wr.completed_at,
        wr.total_documents,
        wr.successful_documents,
        wr.failed_documents,
        wr.document_breakdown,
        wr.mco_delivery_status,
        wr.mco_delivered_at,
        wr.error_message,
        wr.created_at,
        c.name as client_name,
        EXTRACT(EPOCH FROM (COALESCE(wr.completed_at, NOW()) - wr.started_at)) as duration_seconds
      FROM workflow_runs wr
      LEFT JOIN clients c ON wr.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND wr.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    query += ` ORDER BY wr.started_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return NextResponse.json({
      runs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
