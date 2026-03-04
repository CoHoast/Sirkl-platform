import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const result = await pool.query(`
      SELECT 
        id, client_id, integration_type, name, config, is_active, 
        last_sync, last_error, created_at, updated_at
      FROM client_integrations
      WHERE client_id = $1
      ORDER BY integration_type, name
    `, [clientId]);

    return NextResponse.json({ integrations: result.rows });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, integrationType, name, config } = await request.json();

    if (!clientId || !integrationType || !name) {
      return NextResponse.json({ error: 'Client ID, type, and name are required' }, { status: 400 });
    }

    const result = await pool.query(`
      INSERT INTO client_integrations (client_id, integration_type, name, config, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [clientId, integrationType, name, config ? JSON.stringify(config) : null]);

    return NextResponse.json({ integration: result.rows[0] });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, config, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    const result = await pool.query(`
      UPDATE client_integrations
      SET name = COALESCE($1, name),
          config = COALESCE($2, config),
          is_active = COALESCE($3, is_active),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, config ? JSON.stringify(config) : null, isActive, id]);

    return NextResponse.json({ integration: result.rows[0] });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM client_integrations WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }
}
