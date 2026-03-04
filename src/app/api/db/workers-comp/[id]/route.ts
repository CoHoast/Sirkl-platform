import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  max: 5
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const result = await pool.query(`
      SELECT 
        wc.*,
        c.name as client_name
      FROM workers_comp_froi wc
      LEFT JOIN clients c ON wc.client_id = c.id
      WHERE wc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'FROI report not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FROI report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  try {
    // Allowed fields for update
    const allowedFields = [
      'employee_name', 'employee_ssn_last4', 'employer_name', 'employer_policy',
      'injury_date', 'injury_description', 'cause_code', 'nature_code', 
      'body_part_code', 'status', 'filing_deadline'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const query = `
      UPDATE workers_comp_froi 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'FROI report not found' }, { status: 404 });
    }

    // Re-fetch with client name
    const fullResult = await pool.query(`
      SELECT wc.*, c.name as client_name
      FROM workers_comp_froi wc
      LEFT JOIN clients c ON wc.client_id = c.id
      WHERE wc.id = $1
    `, [id]);

    return NextResponse.json(fullResult.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update FROI report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
