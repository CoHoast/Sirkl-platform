import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        al.*,
        au.name as user_name,
        au.email as user_email,
        c.name as client_name
      FROM audit_log al
      LEFT JOIN admin_users au ON al.admin_user_id = au.id
      LEFT JOIN clients c ON al.client_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (action && action !== 'all') {
      query += ` AND al.action ILIKE $${paramIndex++}`;
      params.push(`%${action}%`);
    }

    if (clientId) {
      query += ` AND al.client_id = $${paramIndex++}`;
      params.push(clientId);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${paramIndex++}`;
      params.push(endDate + ' 23:59:59');
    }

    if (search) {
      query += ` AND (al.action ILIKE $${paramIndex} OR al.details ILIKE $${paramIndex} OR al.entity_type ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM audit_log al WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (action && action !== 'all') {
      countQuery += ` AND al.action ILIKE $${countParamIndex++}`;
      countParams.push(`%${action}%`);
    }
    if (clientId) {
      countQuery += ` AND al.client_id = $${countParamIndex++}`;
      countParams.push(clientId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days,
        COUNT(DISTINCT admin_user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as active_users_today,
        COUNT(*) FILTER (WHERE action ILIKE '%login%' AND created_at >= NOW() - INTERVAL '30 days') as logins_30_days
      FROM audit_log
    `);

    return NextResponse.json({
      logs: result.rows,
      total,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, entityType, entityId, details, clientId, userId, userEmail, userName, ipAddress, userAgent, metadata } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const result = await pool.query(`
      INSERT INTO audit_log (action, entity_type, entity_id, details, client_id, admin_user_id, user_email, user_name, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [action, entityType, entityId, details, clientId, userId, userEmail, userName, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]);

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
