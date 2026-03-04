import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// POST - Retry all failed emails
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  try {
    let query = `
      UPDATE email_intake 
      SET 
        status = 'pending',
        error_message = NULL,
        retry_count = retry_count + 1,
        last_retry_at = NOW(),
        updated_at = NOW()
      WHERE status = 'failed'
    `;

    if (clientId && clientId !== 'all') {
      query += ` AND client_id = ${parseInt(clientId)}`;
    }

    query += ' RETURNING id';

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      count: result.rowCount,
      message: `${result.rowCount} email(s) queued for retry`
    });
  } catch (error) {
    console.error('Error retrying emails:', error);
    return NextResponse.json({ error: 'Failed to retry emails' }, { status: 500 });
  }
}
