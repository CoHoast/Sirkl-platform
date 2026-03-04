import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const billingPeriod = searchParams.get('period');

    let query = `
      SELECT 
        bc.*,
        c.name as client_name
      FROM billing_charges bc
      JOIN clients c ON bc.client_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (clientId) {
      query += ` AND bc.client_id = $${paramIndex++}`;
      params.push(clientId);
    }

    if (billingPeriod) {
      query += ` AND bc.billing_period = $${paramIndex++}`;
      params.push(billingPeriod);
    }

    query += ' ORDER BY bc.created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json({ charges: result.rows });
  } catch (error) {
    console.error('Error fetching charges:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      clientId, 
      billingPeriod, 
      chargeType, 
      description, 
      quantity, 
      unitPrice,
      status,
      invoiceNumber,
      notes 
    } = await request.json();

    if (!clientId || !billingPeriod || !chargeType || !unitPrice) {
      return NextResponse.json({ 
        error: 'Client ID, billing period, charge type, and unit price are required' 
      }, { status: 400 });
    }

    const totalAmount = (quantity || 1) * unitPrice;

    const result = await pool.query(`
      INSERT INTO billing_charges (
        client_id, billing_period, charge_type, description, 
        quantity, unit_price, total_amount, status, invoice_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      clientId, billingPeriod, chargeType, description || null,
      quantity || 1, unitPrice, totalAmount, status || 'pending', 
      invoiceNumber || null, notes || null
    ]);

    return NextResponse.json({ charge: result.rows[0] });
  } catch (error) {
    console.error('Error creating charge:', error);
    return NextResponse.json({ error: 'Failed to create charge' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, paidDate, invoiceNumber, invoiceDate, notes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Charge ID is required' }, { status: 400 });
    }

    const result = await pool.query(`
      UPDATE billing_charges
      SET status = COALESCE($1, status),
          paid_date = $2,
          invoice_number = COALESCE($3, invoice_number),
          invoice_date = $4,
          notes = $5
      WHERE id = $6
      RETURNING *
    `, [status, paidDate, invoiceNumber, invoiceDate, notes, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Charge not found' }, { status: 404 });
    }

    return NextResponse.json({ charge: result.rows[0] });
  } catch (error) {
    console.error('Error updating charge:', error);
    return NextResponse.json({ error: 'Failed to update charge' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Charge ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM billing_charges WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting charge:', error);
    return NextResponse.json({ error: 'Failed to delete charge' }, { status: 500 });
  }
}
