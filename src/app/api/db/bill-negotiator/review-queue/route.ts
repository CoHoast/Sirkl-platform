import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET - List items in review queue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status') || 'review_needed';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT 
        e.*,
        b.member_name as bill_member_name,
        b.provider_name as bill_provider_name,
        b.total_billed as bill_total_billed,
        b.client_id,
        c.name as client_name
      FROM bill_extractions e
      JOIN bills b ON e.bill_id = b.id
      LEFT JOIN clients c ON b.client_id = c.id
      WHERE e.status = $1
    `;
    const params: (string | number)[] = [status];
    let paramIndex = 2;

    if (clientId) {
      query += ` AND b.client_id = $${paramIndex++}`;
      params.push(parseInt(clientId));
    }

    query += ` ORDER BY e.created_at ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Get count of pending items
    let countQuery = `
      SELECT COUNT(*) as count
      FROM bill_extractions e
      JOIN bills b ON e.bill_id = b.id
      WHERE e.status = 'review_needed'
    `;
    if (clientId) {
      countQuery += ` AND b.client_id = ${parseInt(clientId)}`;
    }
    const countResult = await pool.query(countQuery);

    return NextResponse.json({
      success: true,
      items: result.rows,
      pending_count: parseInt(countResult.rows[0]?.count || '0'),
      total: result.rows.length
    });

  } catch (error) {
    console.error('Review queue error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}
