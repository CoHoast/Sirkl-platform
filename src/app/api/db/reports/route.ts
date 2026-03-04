import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const clientId = searchParams.get('clientId');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (reportType) {
      case 'overview': {
        // Overall stats
        const overviewQuery = `
          SELECT 
            COUNT(*) as total_documents,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${days} days') as recent_documents,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_documents,
            COUNT(DISTINCT client_id) as active_clients,
            AVG(confidence_score) as avg_confidence
          FROM documents
          ${clientId ? 'WHERE client_id = $1' : ''}
        `;
        const overview = await pool.query(overviewQuery, clientId ? [clientId] : []);

        // Documents by type
        const byTypeQuery = `
          SELECT 
            document_type,
            COUNT(*) as count,
            AVG(confidence_score) as avg_confidence
          FROM documents
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          ${clientId ? 'AND client_id = $1' : ''}
          GROUP BY document_type
          ORDER BY count DESC
        `;
        const byType = await pool.query(byTypeQuery, clientId ? [clientId] : []);

        // Documents by day (last 30 days)
        const byDayQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM documents
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          ${clientId ? 'AND client_id = $1' : ''}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;
        const byDay = await pool.query(byDayQuery, clientId ? [clientId] : []);

        // Documents by client
        const byClientQuery = `
          SELECT 
            c.name as client_name,
            c.id as client_id,
            COUNT(d.id) as document_count,
            AVG(d.confidence_score) as avg_confidence
          FROM clients c
          LEFT JOIN documents d ON c.id = d.client_id AND d.created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY c.id, c.name
          ORDER BY document_count DESC
        `;
        const byClient = await pool.query(byClientQuery);

        return NextResponse.json({
          overview: overview.rows[0],
          byType: byType.rows,
          byDay: byDay.rows,
          byClient: byClient.rows,
        });
      }

      case 'documents': {
        // Detailed document list
        const docsQuery = `
          SELECT 
            d.id,
            d.document_type,
            d.original_filename,
            d.confidence_score,
            d.status,
            d.created_at,
            d.processed_at,
            c.name as client_name
          FROM documents d
          LEFT JOIN clients c ON d.client_id = c.id
          WHERE d.created_at >= NOW() - INTERVAL '${days} days'
          ${clientId ? 'AND d.client_id = $1' : ''}
          ORDER BY d.created_at DESC
          LIMIT 100
        `;
        const docs = await pool.query(docsQuery, clientId ? [clientId] : []);

        return NextResponse.json({ documents: docs.rows });
      }

      case 'webhooks': {
        // Webhook delivery stats
        const webhookQuery = `
          SELECT 
            status,
            COUNT(*) as count
          FROM webhook_queue
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          ${clientId ? 'AND client_id = $1' : ''}
          GROUP BY status
        `;
        const webhookStats = await pool.query(webhookQuery, clientId ? [clientId] : []);

        // Failed webhooks
        const failedQuery = `
          SELECT 
            wq.id,
            wq.document_id,
            wq.attempts,
            wq.last_error,
            wq.created_at,
            c.name as client_name
          FROM webhook_queue wq
          LEFT JOIN clients c ON wq.client_id = c.id
          WHERE wq.status = 'failed'
          ${clientId ? 'AND wq.client_id = $1' : ''}
          ORDER BY wq.created_at DESC
          LIMIT 50
        `;
        const failed = await pool.query(failedQuery, clientId ? [clientId] : []);

        return NextResponse.json({
          stats: webhookStats.rows,
          failed: failed.rows,
        });
      }

      case 'billing': {
        // Billing summary by month
        const billingQuery = `
          SELECT 
            billing_period,
            SUM(document_count) as total_docs,
            SUM(calculated_amount) as total_amount,
            COUNT(DISTINCT client_id) as client_count
          FROM monthly_usage
          GROUP BY billing_period
          ORDER BY billing_period DESC
          LIMIT 12
        `;
        const billing = await pool.query(billingQuery);

        return NextResponse.json({ billing: billing.rows });
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
