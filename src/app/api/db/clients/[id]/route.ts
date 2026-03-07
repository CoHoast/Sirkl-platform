import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET single client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    const result = await pool.query(`
      SELECT 
        c.*,
        (SELECT stats_data FROM client_stats WHERE client_id = c.id ORDER BY stat_date DESC LIMIT 1) as latest_stats
      FROM clients c
      WHERE c.id = $1
    `, [clientId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const client = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      contactEmail: row.contact_email,
      notes: row.notes,
      webhookUrl: row.webhook_url,
      dashboardType: row.dashboard_type || 'standard',
      customDashboardUrl: row.custom_dashboard_url,
      statsApiEndpoint: row.stats_api_endpoint,
      lastStatsSync: row.last_stats_sync,
      connectionStatus: row.connection_status || 'disconnected',
      products: row.products || [],
      branding: row.branding || {},
      latestStats: row.latest_stats || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT - Update client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);
    const body = await request.json();

    const {
      name,
      slug,
      status,
      contactEmail,
      notes,
      dashboardType,
      customDashboardUrl,
      statsApiEndpoint,
      statsApiKey,
      products,
      branding
    } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (contactEmail !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(contactEmail);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (dashboardType !== undefined) {
      updates.push(`dashboard_type = $${paramCount++}`);
      values.push(dashboardType);
    }
    if (customDashboardUrl !== undefined) {
      updates.push(`custom_dashboard_url = $${paramCount++}`);
      values.push(customDashboardUrl);
    }
    if (statsApiEndpoint !== undefined) {
      updates.push(`stats_api_endpoint = $${paramCount++}`);
      values.push(statsApiEndpoint);
      // Reset connection status when endpoint changes
      updates.push(`connection_status = 'pending'`);
    }
    if (statsApiKey !== undefined) {
      updates.push(`stats_api_key = $${paramCount++}`);
      values.push(statsApiKey);
    }
    if (products !== undefined) {
      updates.push(`products = $${paramCount++}`);
      values.push(JSON.stringify(products));
    }
    if (branding !== undefined) {
      updates.push(`branding = $${paramCount++}`);
      values.push(JSON.stringify(branding));
    }

    updates.push('updated_at = NOW()');
    values.push(clientId);

    const result = await pool.query(`
      UPDATE clients 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: result.rows[0], success: true });
  } catch (error: any) {
    console.error('Error updating client:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A client with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE - Delete client
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    // Delete related data first (cascading should handle this, but being explicit)
    await pool.query('DELETE FROM client_stats WHERE client_id = $1', [clientId]);
    await pool.query('DELETE FROM client_products WHERE client_id = $1', [clientId]);
    
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [clientId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: clientId });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
