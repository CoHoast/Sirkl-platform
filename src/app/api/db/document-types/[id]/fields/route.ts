import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fieldName, fieldKey, fieldType, format, isRequired, description, displayOrder } = await request.json();

    if (!fieldName || !fieldKey) {
      return NextResponse.json({ error: 'Field name and key are required' }, { status: 400 });
    }

    const result = await pool.query(`
      INSERT INTO extraction_fields (document_type_id, field_name, field_key, field_type, format, is_required, description, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, fieldName, fieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_'), fieldType || 'string', format || null, isRequired || false, description || null, displayOrder || 0]);

    return NextResponse.json({ field: result.rows[0] });
  } catch (error) {
    console.error('Error adding field:', error);
    return NextResponse.json({ error: 'Failed to add field' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    
    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    const { fieldName, fieldKey, fieldType, format, isRequired, description, displayOrder } = await request.json();

    const result = await pool.query(`
      UPDATE extraction_fields
      SET field_name = COALESCE($1, field_name),
          field_key = COALESCE($2, field_key),
          field_type = COALESCE($3, field_type),
          format = $4,
          is_required = COALESCE($5, is_required),
          description = $6,
          display_order = COALESCE($7, display_order),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [fieldName, fieldKey, fieldType, format, isRequired, description, displayOrder, fieldId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json({ field: result.rows[0] });
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM extraction_fields WHERE id = $1', [fieldId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 });
  }
}
