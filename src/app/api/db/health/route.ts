import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const startTime = Date.now();
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      status: 'error',
      error: 'DATABASE_URL not configured',
      env_check: 'missing'
    });
  }
  
  // Mask the password in the URL for logging
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':****@');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as count FROM applications');
    client.release();
    await pool.end();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      applications_count: result.rows[0].count,
      response_time_ms: Date.now() - startTime,
      connection_string: maskedUrl
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      code: error.code,
      connection_string: maskedUrl,
      response_time_ms: Date.now() - startTime
    });
  }
}
