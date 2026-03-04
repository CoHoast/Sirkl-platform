import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'new';
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as client_name,
        au.name as acknowledged_by_name
      FROM alerts a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN admin_users au ON a.acknowledged_by = au.id
      WHERE ($1 = 'all' OR a.status = $1)
      ORDER BY 
        CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        a.created_at DESC
      LIMIT $2
    `, [status, limit]);

    // Get counts by status
    const countsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'new') as new_count,
        COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'new') as critical_count
      FROM alerts
    `);

    return NextResponse.json({
      alerts: result.rows,
      counts: countsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, action, userId } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Alert ID and action are required' }, { status: 400 });
    }

    if (action === 'acknowledge') {
      await pool.query(`
        UPDATE alerts 
        SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
        WHERE id = $2
      `, [userId, id]);
    } else if (action === 'resolve') {
      await pool.query(`
        UPDATE alerts SET status = 'resolved' WHERE id = $1
      `, [id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
