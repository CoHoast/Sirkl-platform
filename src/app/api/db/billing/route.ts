import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = `
      SELECT 
        cb.*,
        c.name as client_name,
        c.slug as client_slug,
        c.status as client_status,
        COALESCE(doc_count.total, 0) as total_documents,
        COALESCE(doc_count.this_month, 0) as documents_this_month
      FROM client_billing cb
      JOIN clients c ON cb.client_id = c.id
      LEFT JOIN (
        SELECT 
          client_id,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month
        FROM documents
        GROUP BY client_id
      ) doc_count ON c.id = doc_count.client_id
    `;

    const params: any[] = [];
    if (clientId) {
      query += ' WHERE cb.client_id = $1';
      params.push(clientId);
    }

    query += ' ORDER BY c.name ASC';

    const result = await pool.query(query, params);

    return NextResponse.json({ billingConfigs: result.rows });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json({ error: 'Failed to fetch billing' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { 
      clientId, 
      planName, 
      billingType, 
      pricePerDocument, 
      monthlyMinimum,
      monthlyCap,
      setupFee,
      setupFeePaid,
      billingEmail,
      billingNotes,
      contractStart,
      contractEnd,
      isActive
    } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Upsert billing config
    const result = await pool.query(`
      INSERT INTO client_billing (
        client_id, plan_name, billing_type, price_per_document, monthly_minimum,
        monthly_cap, setup_fee, setup_fee_paid, billing_email, billing_notes,
        contract_start, contract_end, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (client_id) DO UPDATE SET
        plan_name = COALESCE($2, client_billing.plan_name),
        billing_type = COALESCE($3, client_billing.billing_type),
        price_per_document = COALESCE($4, client_billing.price_per_document),
        monthly_minimum = $5,
        monthly_cap = $6,
        setup_fee = $7,
        setup_fee_paid = COALESCE($8, client_billing.setup_fee_paid),
        billing_email = $9,
        billing_notes = $10,
        contract_start = $11,
        contract_end = $12,
        is_active = COALESCE($13, client_billing.is_active),
        updated_at = NOW()
      RETURNING *
    `, [
      clientId, planName, billingType, pricePerDocument, monthlyMinimum,
      monthlyCap, setupFee, setupFeePaid, billingEmail, billingNotes,
      contractStart, contractEnd, isActive
    ]);

    return NextResponse.json({ billing: result.rows[0] });
  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json({ error: 'Failed to update billing' }, { status: 500 });
  }
}
