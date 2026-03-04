import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get document type with identifiers and fields
    const typeResult = await pool.query(`
      SELECT * FROM document_types WHERE id = $1
    `, [id]);

    if (typeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    }

    const identifiersResult = await pool.query(`
      SELECT id, identifier_type, value, created_at
      FROM document_identifiers
      WHERE document_type_id = $1
      ORDER BY identifier_type, value
    `, [id]);

    const fieldsResult = await pool.query(`
      SELECT id, field_name, field_key, field_type, format, is_required, description, display_order, created_at, updated_at
      FROM extraction_fields
      WHERE document_type_id = $1
      ORDER BY display_order, field_name
    `, [id]);

    return NextResponse.json({
      documentType: typeResult.rows[0],
      identifiers: identifiersResult.rows,
      fields: fieldsResult.rows
    });
  } catch (error) {
    console.error('Error fetching document type:', error);
    return NextResponse.json({ error: 'Failed to fetch document type' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, isActive } = await request.json();

    const result = await pool.query(`
      UPDATE document_types
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          is_active = COALESCE($3, is_active),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, description, isActive, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ documentType: result.rows[0] });
  } catch (error) {
    console.error('Error updating document type:', error);
    return NextResponse.json({ error: 'Failed to update document type' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's a system type
    const checkResult = await pool.query('SELECT is_system FROM document_types WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    }
    if (checkResult.rows[0].is_system) {
      return NextResponse.json({ error: 'Cannot delete system document types' }, { status: 400 });
    }

    await pool.query('DELETE FROM document_types WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document type:', error);
    return NextResponse.json({ error: 'Failed to delete document type' }, { status: 500 });
  }
}
