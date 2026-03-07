import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// POST - Approve an extraction after human review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reviewed_by, review_notes, updated_fields } = body;

    // Get the extraction
    const extResult = await pool.query(
      'SELECT * FROM bill_extractions WHERE id = $1',
      [id]
    );

    if (extResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Extraction not found' },
        { status: 404 }
      );
    }

    const extraction = extResult.rows[0];

    // Update extraction status to completed
    await pool.query(`
      UPDATE bill_extractions
      SET status = 'completed',
          reviewed_at = NOW(),
          reviewed_by = $1,
          review_notes = $2,
          fields_needing_review = '[]',
          updated_at = NOW()
      WHERE id = $3
    `, [reviewed_by || 'system', review_notes || null, id]);

    // Update the bill status to ready_to_negotiate
    await pool.query(`
      UPDATE bills
      SET status = 'ready_to_negotiate',
          updated_at = NOW()
      WHERE id = $1
    `, [extraction.bill_id]);

    // If there are updated fields, update the bill
    if (updated_fields) {
      const updates: string[] = [];
      const values: (string | number)[] = [];
      let paramIndex = 1;

      if (updated_fields.member_name) {
        updates.push(`member_name = $${paramIndex++}`);
        values.push(updated_fields.member_name);
      }
      if (updated_fields.member_id) {
        updates.push(`member_id = $${paramIndex++}`);
        values.push(updated_fields.member_id);
      }
      if (updated_fields.provider_name) {
        updates.push(`provider_name = $${paramIndex++}`);
        values.push(updated_fields.provider_name);
      }
      if (updated_fields.provider_npi) {
        updates.push(`provider_npi = $${paramIndex++}`);
        values.push(updated_fields.provider_npi);
      }
      if (updated_fields.total_billed) {
        updates.push(`total_billed = $${paramIndex++}`);
        values.push(updated_fields.total_billed);
      }

      if (updates.length > 0) {
        values.push(extraction.bill_id);
        await pool.query(
          `UPDATE bills SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
          values
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Extraction approved',
      bill_id: extraction.bill_id,
      new_status: 'ready_to_negotiate'
    });

  } catch (error) {
    console.error('Approve extraction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve extraction' },
      { status: 500 }
    );
  }
}
