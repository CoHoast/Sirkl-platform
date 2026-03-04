import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET - List all emails with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const status = searchParams.get('status');
  const days = searchParams.get('days') || '7';
  const limit = searchParams.get('limit') || '100';

  try {
    let query = `
      SELECT 
        ei.*,
        c.name as client_name
      FROM email_intake ei
      LEFT JOIN clients c ON ei.client_id = c.id
      WHERE ei.received_at > NOW() - INTERVAL '${parseInt(days)} days'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId && clientId !== 'all') {
      query += ` AND ei.client_id = $${paramIndex}`;
      params.push(parseInt(clientId));
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND ei.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY ei.received_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'processed') as processed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) as total,
        AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) as avg_confidence
      FROM email_intake
      WHERE received_at > NOW() - INTERVAL '${parseInt(days)} days'
      ${clientId && clientId !== 'all' ? `AND client_id = ${parseInt(clientId)}` : ''}
    `;
    const stats = await pool.query(statsQuery);

    return NextResponse.json({
      emails: result.rows,
      stats: stats.rows[0],
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching email intake:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// POST - Add new email (for webhook/worker)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await pool.query(`
      INSERT INTO email_intake (
        client_id, message_id, from_email, from_name, subject,
        body_text, body_html, attachments, s3_key, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.client_id,
      data.message_id,
      data.from_email,
      data.from_name,
      data.subject,
      data.body_text,
      data.body_html,
      JSON.stringify(data.attachments || []),
      data.s3_key,
      'pending'
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating email intake:', error);
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
  }
}
