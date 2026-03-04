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
        pb.*,
        c.name as client_name
      FROM provider_bills pb
      LEFT JOIN clients c ON pb.client_id = c.id
      WHERE pb.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Provider bill not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider bill', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
