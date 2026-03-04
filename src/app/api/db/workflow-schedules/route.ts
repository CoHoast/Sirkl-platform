import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Workflow Schedules API
 * Manages scheduled workflow configurations
 */

// GET - List schedules for a client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    
    const result = await pool.query(`
      SELECT 
        id,
        client_id,
        workflow_type,
        schedule_type,
        schedule_time,
        schedule_day,
        enabled,
        input_source,
        output_destination,
        last_run,
        next_run,
        last_run_status,
        last_run_count,
        created_at,
        updated_at
      FROM workflow_schedules
      WHERE ($1::int IS NULL OR client_id = $1)
      ORDER BY created_at DESC
    `, [clientId || null]);
    
    return NextResponse.json({ schedules: result.rows });
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return NextResponse.json({ schedules: [], message: 'Table not created yet' });
    }
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const result = await pool.query(`
      INSERT INTO workflow_schedules (
        client_id,
        workflow_type,
        schedule_type,
        schedule_time,
        schedule_day,
        enabled,
        input_source,
        output_destination
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      body.client_id,
      body.workflow_type,
      body.schedule_type,
      body.schedule_time,
      body.schedule_day,
      body.enabled ?? true,
      JSON.stringify(body.input_source),
      JSON.stringify(body.output_destination)
    ]);
    
    return NextResponse.json({ schedule: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update schedule
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // If only toggling enabled status
    if (body.id && body.enabled !== undefined && Object.keys(body).length <= 3) {
      const result = await pool.query(`
        UPDATE workflow_schedules 
        SET enabled = $1, updated_at = NOW()
        WHERE id = $2 AND client_id = $3
        RETURNING *
      `, [body.enabled, body.id, body.client_id]);
      
      return NextResponse.json({ schedule: result.rows[0] });
    }
    
    // Full update
    const result = await pool.query(`
      UPDATE workflow_schedules SET
        workflow_type = COALESCE($1, workflow_type),
        schedule_type = COALESCE($2, schedule_type),
        schedule_time = COALESCE($3, schedule_time),
        schedule_day = $4,
        enabled = COALESCE($5, enabled),
        input_source = COALESCE($6, input_source),
        output_destination = COALESCE($7, output_destination),
        updated_at = NOW()
      WHERE id = $8 AND client_id = $9
      RETURNING *
    `, [
      body.workflow_type,
      body.schedule_type,
      body.schedule_time,
      body.schedule_day,
      body.enabled,
      body.input_source ? JSON.stringify(body.input_source) : null,
      body.output_destination ? JSON.stringify(body.output_destination) : null,
      body.id,
      body.client_id
    ]);
    
    return NextResponse.json({ schedule: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove schedule
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientId = searchParams.get('client_id');
    
    await pool.query(`
      DELETE FROM workflow_schedules 
      WHERE id = $1 AND client_id = $2
    `, [id, clientId]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
