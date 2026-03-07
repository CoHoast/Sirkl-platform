import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface ExternalStats {
  // Generic stats that any custom dashboard should provide
  totalProcessed?: number;
  processedToday?: number;
  processedThisWeek?: number;
  processedThisMonth?: number;
  
  // Financial stats (for claims/billing products)
  totalBilled?: number;
  totalRepriced?: number;
  totalSavings?: number;
  savingsPercent?: number;
  
  // Status breakdowns
  statusCounts?: Record<string, number>;
  
  // Product-specific stats (the dashboard can send whatever it wants)
  custom?: Record<string, any>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    // Get client's custom dashboard config
    const clientResult = await pool.query(`
      SELECT 
        id, name, dashboard_type, stats_api_endpoint, stats_api_key, custom_dashboard_url
      FROM clients 
      WHERE id = $1
    `, [clientId]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientResult.rows[0];

    if (client.dashboard_type !== 'custom') {
      return NextResponse.json({ 
        error: 'Client uses standard dashboard, no sync needed' 
      }, { status: 400 });
    }

    if (!client.stats_api_endpoint) {
      return NextResponse.json({ 
        error: 'No stats API endpoint configured for this client' 
      }, { status: 400 });
    }

    // Fetch stats from the custom dashboard
    let externalStats: ExternalStats;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (client.stats_api_key) {
        headers['Authorization'] = `Bearer ${client.stats_api_key}`;
        headers['X-API-Key'] = client.stats_api_key;
      }

      const response = await fetch(client.stats_api_endpoint, {
        method: 'GET',
        headers,
        // 10 second timeout
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      externalStats = await response.json();
    } catch (fetchError: any) {
      // Update connection status to failed
      await pool.query(`
        UPDATE clients 
        SET connection_status = 'error', updated_at = NOW()
        WHERE id = $1
      `, [clientId]);

      return NextResponse.json({ 
        error: 'Failed to fetch stats from custom dashboard',
        details: fetchError?.message
      }, { status: 502 });
    }

    // Store the stats
    await pool.query(`
      INSERT INTO client_stats (client_id, stat_date, stats_data, synced_at)
      VALUES ($1, CURRENT_DATE, $2, NOW())
      ON CONFLICT (client_id, stat_date) 
      DO UPDATE SET stats_data = $2, synced_at = NOW()
    `, [clientId, JSON.stringify(externalStats)]);

    // Update client's last sync time and connection status
    await pool.query(`
      UPDATE clients 
      SET last_stats_sync = NOW(), connection_status = 'connected', updated_at = NOW()
      WHERE id = $1
    `, [clientId]);

    return NextResponse.json({ 
      success: true, 
      stats: externalStats,
      syncedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Stats sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync stats', 
      details: error?.message 
    }, { status: 500 });
  }
}

// GET - Retrieve cached stats for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get recent stats
    const statsResult = await pool.query(`
      SELECT stat_date, stats_data, synced_at
      FROM client_stats
      WHERE client_id = $1 AND stat_date >= CURRENT_DATE - $2
      ORDER BY stat_date DESC
    `, [clientId, days]);

    // Get client info
    const clientResult = await pool.query(`
      SELECT 
        id, name, dashboard_type, custom_dashboard_url, 
        last_stats_sync, connection_status
      FROM clients WHERE id = $1
    `, [clientId]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientResult.rows[0];
    const stats = statsResult.rows;

    // Calculate aggregates from most recent stats
    const latestStats = stats.length > 0 ? stats[0].stats_data : {};

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        dashboardType: client.dashboard_type,
        customDashboardUrl: client.custom_dashboard_url,
        lastSync: client.last_stats_sync,
        connectionStatus: client.connection_status,
      },
      latestStats,
      history: stats.map(s => ({
        date: s.stat_date,
        stats: s.stats_data,
        syncedAt: s.synced_at
      }))
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats', 
      details: error?.message 
    }, { status: 500 });
  }
}
