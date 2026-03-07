import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Get all clients with custom dashboard support fields
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.status,
        c.contact_email,
        c.dashboard_type,
        c.custom_dashboard_url,
        c.stats_api_endpoint,
        c.last_stats_sync,
        c.connection_status,
        c.products,
        c.branding,
        c.created_at,
        c.updated_at
      FROM clients c
      ORDER BY c.name ASC
    `);

    // Get latest stats for custom dashboard clients
    const statsResult = await pool.query(`
      SELECT DISTINCT ON (client_id) 
        client_id, stats_data, synced_at
      FROM client_stats
      ORDER BY client_id, stat_date DESC
    `);

    const statsMap = new Map(
      statsResult.rows.map(row => [row.client_id, row.stats_data])
    );

    const clients = result.rows.map(row => {
      const cachedStats = statsMap.get(row.id) || {};
      
      // For custom dashboards, use cached stats; for standard, use default
      const stats = row.dashboard_type === 'custom' ? {
        totalDocuments: cachedStats.totalProcessed || 0,
        documentsToday: cachedStats.processedToday || 0,
        documentsThisWeek: cachedStats.processedThisWeek || 0,
        documentsThisMonth: cachedStats.processedThisMonth || 0,
        totalBilled: cachedStats.totalBilled || 0,
        totalRepriced: cachedStats.totalRepriced || 0,
        totalSavings: cachedStats.totalSavings || 0,
        activeWorkflows: Object.keys(cachedStats.custom || {}).length || 1,
        ...cachedStats
      } : {
        totalDocuments: 0,
        documentsToday: 0,
        documentsThisWeek: 0,
        documentsThisMonth: 0,
        totalApplications: 0,
        totalClaims: 0,
        activeWorkflows: 5
      };

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status || 'active',
        contactEmail: row.contact_email,
        dashboardType: row.dashboard_type || 'standard',
        customDashboardUrl: row.custom_dashboard_url,
        statsApiEndpoint: row.stats_api_endpoint,
        lastStatsSync: row.last_stats_sync,
        connectionStatus: row.connection_status || 'disconnected',
        products: row.products || [],
        branding: row.branding || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        stats
      };
    });

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error('Error fetching clients:', error?.message || error);
    // If the new columns don't exist yet, fall back to basic query
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      try {
        const fallbackResult = await pool.query(`
          SELECT id, name, slug, status, contact_email, created_at, updated_at
          FROM clients ORDER BY name ASC
        `);
        const clients = fallbackResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          status: row.status || 'active',
          contactEmail: row.contact_email,
          dashboardType: 'standard',
          connectionStatus: 'disconnected',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          stats: { totalDocuments: 0, documentsToday: 0, documentsThisWeek: 0, documentsThisMonth: 0, activeWorkflows: 0 }
        }));
        return NextResponse.json({ clients, needsMigration: true });
      } catch {
        // Fall through to error
      }
    }
    return NextResponse.json({ 
      error: 'Failed to fetch clients', 
      details: error?.message || 'Unknown error',
      dbConfigured: !!process.env.DATABASE_URL 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      name, 
      slug, 
      contactEmail, 
      notes, 
      webhookUrl, 
      s3InputPrefix, 
      s3OutputPrefix,
      // New custom dashboard fields
      dashboardType,
      customDashboardUrl,
      statsApiEndpoint,
      products,
      branding
    } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Generate API keys
    const crypto = await import('crypto');
    const webhookApiKey = crypto.randomBytes(32).toString('base64url');
    const statsApiKey = crypto.randomBytes(32).toString('base64url');

    const result = await pool.query(`
      INSERT INTO clients (
        name, slug, status, contact_email, notes, 
        webhook_url, webhook_api_key, s3_input_prefix, s3_output_prefix,
        dashboard_type, custom_dashboard_url, stats_api_endpoint, stats_api_key,
        products, branding, connection_status
      )
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      name, 
      slug, 
      contactEmail || null, 
      notes || null, 
      webhookUrl || null, 
      webhookApiKey, 
      s3InputPrefix || `${slug}/incoming/`, 
      s3OutputPrefix || `${slug}/processed/`,
      dashboardType || 'standard',
      customDashboardUrl || null,
      statsApiEndpoint || null,
      statsApiKey,
      JSON.stringify(products || []),
      JSON.stringify(branding || {}),
      dashboardType === 'custom' ? 'pending' : 'disconnected'
    ]);

    return NextResponse.json({ 
      client: result.rows[0], 
      webhookApiKey,
      statsApiKey: dashboardType === 'custom' ? statsApiKey : undefined
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A client with this slug already exists' }, { status: 400 });
    }
    // If new columns don't exist, fall back to basic insert
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database needs migration. Run POST /api/db/clients/migrate first.' 
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
