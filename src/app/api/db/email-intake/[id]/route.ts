import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET - Single email details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(`
      SELECT 
        ei.*,
        c.name as client_name
      FROM email_intake ei
      LEFT JOIN clients c ON ei.client_id = c.id
      WHERE ei.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}

// PATCH - Update email (mark as processing, update status, retry)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    // Handle retry action
    if (data.action === 'retry') {
      const result = await pool.query(`
        UPDATE email_intake 
        SET 
          status = 'pending',
          error_message = NULL,
          retry_count = retry_count + 1,
          last_retry_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      return NextResponse.json({ 
        success: true, 
        email: result.rows[0],
        message: 'Email queued for retry'
      });
    }

    // Handle status update
    if (data.status) {
      const updates: string[] = ['status = $2', 'updated_at = NOW()'];
      const values: any[] = [id, data.status];
      let paramIndex = 3;

      if (data.status === 'processing') {
        updates.push('processing_started_at = NOW()');
      }
      if (data.status === 'processed') {
        updates.push('processing_completed_at = NOW()');
        if (data.patient_name) {
          updates.push(`patient_name = $${paramIndex}`);
          values.push(data.patient_name);
          paramIndex++;
        }
        if (data.confidence_score) {
          updates.push(`confidence_score = $${paramIndex}`);
          values.push(data.confidence_score);
          paramIndex++;
        }
        if (data.application_id) {
          updates.push(`application_id = $${paramIndex}`);
          values.push(data.application_id);
          paramIndex++;
        }
        if (data.extracted_data) {
          updates.push(`extracted_data = $${paramIndex}`);
          values.push(JSON.stringify(data.extracted_data));
          paramIndex++;
        }
      }
      if (data.status === 'failed' && data.error_message) {
        updates.push(`error_message = $${paramIndex}`);
        values.push(data.error_message);
        paramIndex++;
      }

      const result = await pool.query(`
        UPDATE email_intake 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `, values);

      return NextResponse.json(result.rows[0]);
    }

    return NextResponse.json({ error: 'No valid action or status provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}

// DELETE - Delete email record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await pool.query('DELETE FROM email_intake WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
  }
}
