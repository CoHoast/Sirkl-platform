import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      configured: !!process.env.DATABASE_URL,
      urlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    }
  };

  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    checks.database.connected = true;
    checks.database.time = result.rows[0].time;
    checks.database.name = result.rows[0].db;
  } catch (error: any) {
    checks.database.connected = false;
    checks.database.error = error?.message || 'Unknown error';
    checks.status = 'degraded';
  }

  return NextResponse.json(checks);
}
