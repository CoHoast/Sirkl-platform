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
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const { status, extracted_data } = body;
    
    let query = 'UPDATE documents SET ';
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (extracted_data) {
      updates.push(`extracted_data = $${paramIndex}`);
      values.push(JSON.stringify(extracted_data));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    query += updates.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
