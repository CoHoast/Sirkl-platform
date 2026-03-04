import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Export billing data as CSV for QuickBooks import
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const format = searchParams.get('format') || 'csv';

    // Get billing data for all clients for the period
    const result = await pool.query(`
      SELECT 
        c.name as client_name,
        c.contact_email as client_email,
        cb.billing_email,
        mu.billing_period,
        mu.document_count,
        mu.calculated_amount,
        mu.tier_breakdown,
        mu.finalized,
        cb.plan_name,
        cb.setup_fee,
        cb.setup_fee_paid
      FROM monthly_usage mu
      JOIN clients c ON mu.client_id = c.id
      LEFT JOIN client_billing cb ON c.id = cb.client_id
      WHERE mu.billing_period = $1
      ORDER BY c.name
    `, [period]);

    if (format === 'json') {
      return NextResponse.json({ 
        period,
        exportDate: new Date().toISOString(),
        clients: result.rows 
      });
    }

    // Generate CSV
    const headers = [
      'Client Name',
      'Billing Email',
      'Billing Period',
      'Plan Name',
      'Document Count',
      'Amount',
      'Setup Fee',
      'Setup Fee Paid',
      'Status',
    ];

    const rows = result.rows.map(row => [
      row.client_name,
      row.billing_email || row.client_email || '',
      row.billing_period,
      row.plan_name || 'Standard',
      row.document_count,
      row.calculated_amount,
      row.setup_fee || 0,
      row.setup_fee_paid ? 'Yes' : 'No',
      row.finalized ? 'Finalized' : 'Pending',
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dokit-billing-${period}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export billing data' }, { status: 500 });
  }
}

/**
 * Generate invoice data for a specific client
 */
export async function POST(request: Request) {
  try {
    const { clientId, period } = await request.json();

    if (!clientId || !period) {
      return NextResponse.json({ error: 'Client ID and period are required' }, { status: 400 });
    }

    // Get detailed invoice data
    const clientResult = await pool.query(`
      SELECT c.*, cb.*
      FROM clients c
      LEFT JOIN client_billing cb ON c.id = cb.client_id
      WHERE c.id = $1
    `, [clientId]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientResult.rows[0];

    const usageResult = await pool.query(`
      SELECT * FROM monthly_usage
      WHERE client_id = $1 AND billing_period = $2
    `, [clientId, period]);

    const usage = usageResult.rows[0];

    if (!usage) {
      return NextResponse.json({ error: 'No usage data for this period' }, { status: 404 });
    }

    // Build invoice data structure
    const invoice = {
      invoiceNumber: `INV-${period.replace('-', '')}-${String(clientId).padStart(4, '0')}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      client: {
        name: client.name,
        email: client.billing_email || client.contact_email,
        plan: client.plan_name || 'Standard',
      },
      billingPeriod: period,
      lineItems: [] as Array<{ description: string; quantity: number; unitPrice: number; total: number }>,
      subtotal: 0,
      total: 0,
    };

    // Add document processing charges based on tier breakdown
    if (usage.tier_breakdown && Array.isArray(usage.tier_breakdown)) {
      for (const tier of usage.tier_breakdown) {
        invoice.lineItems.push({
          description: `Document Processing - Tier ${tier.tier} (${tier.docs} docs @ $${tier.pricePerDoc}/doc)`,
          quantity: tier.docs,
          unitPrice: tier.pricePerDoc,
          total: tier.subtotal,
        });
      }
    } else {
      // Fallback to flat calculation
      invoice.lineItems.push({
        description: `Document Processing (${usage.document_count} documents)`,
        quantity: usage.document_count,
        unitPrice: parseFloat(usage.calculated_amount) / usage.document_count || 0,
        total: parseFloat(usage.calculated_amount),
      });
    }

    // Add setup fee if applicable
    if (client.setup_fee && !client.setup_fee_paid) {
      invoice.lineItems.push({
        description: 'One-time Setup Fee',
        quantity: 1,
        unitPrice: parseFloat(client.setup_fee),
        total: parseFloat(client.setup_fee),
      });
    }

    invoice.subtotal = invoice.lineItems.reduce((sum, item) => sum + item.total, 0);
    invoice.total = invoice.subtotal;

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
