import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET - Email intake stats for health widget
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  try {
    const clientFilter = clientId && clientId !== 'all' 
      ? `AND client_id = ${parseInt(clientId)}` 
      : '';

    // Overall stats
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'processed') as processed_total,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_total,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_total,
        COUNT(*) as total,
        AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) as avg_confidence
      FROM email_intake
      WHERE 1=1 ${clientFilter}
    `;
    const stats = await pool.query(statsQuery);

    // Today's stats
    const todayQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'processed') as processed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) as total
      FROM email_intake
      WHERE received_at > NOW() - INTERVAL '24 hours'
      ${clientFilter}
    `;
    const today = await pool.query(todayQuery);

    // Last email received
    const lastEmailQuery = `
      SELECT received_at, subject, from_email, status
      FROM email_intake
      WHERE 1=1 ${clientFilter}
      ORDER BY received_at DESC
      LIMIT 1
    `;
    const lastEmail = await pool.query(lastEmailQuery);

    // Per-client breakdown
    const perClientQuery = `
      SELECT 
        c.id as client_id,
        c.name as client_name,
        COUNT(*) FILTER (WHERE ei.status = 'processed') as processed,
        COUNT(*) FILTER (WHERE ei.status = 'failed') as failed,
        COUNT(*) FILTER (WHERE ei.status = 'pending') as pending,
        COUNT(*) as total
      FROM clients c
      LEFT JOIN email_intake ei ON c.id = ei.client_id AND ei.received_at > NOW() - INTERVAL '7 days'
      GROUP BY c.id, c.name
      HAVING COUNT(ei.id) > 0
      ORDER BY total DESC
    `;
    const perClient = await pool.query(perClientQuery);

    // Hourly volume (last 24 hours)
    const hourlyQuery = `
      SELECT 
        DATE_TRUNC('hour', received_at) as hour,
        COUNT(*) as count
      FROM email_intake
      WHERE received_at > NOW() - INTERVAL '24 hours'
      ${clientFilter}
      GROUP BY DATE_TRUNC('hour', received_at)
      ORDER BY hour
    `;
    const hourly = await pool.query(hourlyQuery);

    // Calculate health status
    const failedRecent = today.rows[0]?.failed || 0;
    const pendingRecent = today.rows[0]?.pending || 0;
    let healthStatus = 'healthy';
    let healthColor = 'green';
    
    if (failedRecent > 5 || pendingRecent > 20) {
      healthStatus = 'degraded';
      healthColor = 'yellow';
    }
    if (failedRecent > 10 || pendingRecent > 50) {
      healthStatus = 'unhealthy';
      healthColor = 'red';
    }

    // Calculate time since last email
    let lastEmailAgo = 'No emails';
    if (lastEmail.rows[0]) {
      const received = new Date(lastEmail.rows[0].received_at);
      const now = new Date();
      const diffMs = now.getTime() - received.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) lastEmailAgo = 'Just now';
      else if (diffMins < 60) lastEmailAgo = `${diffMins} min ago`;
      else if (diffMins < 1440) lastEmailAgo = `${Math.floor(diffMins / 60)} hours ago`;
      else lastEmailAgo = `${Math.floor(diffMins / 1440)} days ago`;
    }

    return NextResponse.json({
      overall: stats.rows[0],
      today: today.rows[0],
      lastEmail: lastEmail.rows[0] || null,
      lastEmailAgo,
      perClient: perClient.rows,
      hourly: hourly.rows,
      health: {
        status: healthStatus,
        color: healthColor
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
