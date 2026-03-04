import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { identifierType, value } = await request.json();

    if (!identifierType || !value) {
      return NextResponse.json({ error: 'Identifier type and value are required' }, { status: 400 });
    }

    const result = await pool.query(`
      INSERT INTO document_identifiers (document_type_id, identifier_type, value)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, identifierType, value]);

    return NextResponse.json({ identifier: result.rows[0] });
  } catch (error) {
    console.error('Error adding identifier:', error);
    return NextResponse.json({ error: 'Failed to add identifier' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const identifierId = searchParams.get('identifierId');

    if (!identifierId) {
      return NextResponse.json({ error: 'Identifier ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM document_identifiers WHERE id = $1', [identifierId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting identifier:', error);
    return NextResponse.json({ error: 'Failed to delete identifier' }, { status: 500 });
  }
}
