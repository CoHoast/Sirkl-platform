import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Get all document types with their identifiers and field counts
    const result = await pool.query(`
      SELECT 
        dt.id,
        dt.name,
        dt.slug,
        dt.description,
        dt.is_system,
        dt.is_active,
        dt.created_at,
        dt.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', di.id,
              'type', di.identifier_type,
              'value', di.value
            )
          ) FILTER (WHERE di.id IS NOT NULL),
          '[]'
        ) as identifiers,
        COUNT(DISTINCT ef.id) as field_count
      FROM document_types dt
      LEFT JOIN document_identifiers di ON dt.id = di.document_type_id
      LEFT JOIN extraction_fields ef ON dt.id = ef.document_type_id
      GROUP BY dt.id
      ORDER BY dt.is_system DESC, dt.name ASC
    `);

    return NextResponse.json({ documentTypes: result.rows });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug, description } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const result = await pool.query(`
      INSERT INTO document_types (name, slug, description, is_system)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `, [name, slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), description || null]);

    return NextResponse.json({ documentType: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating document type:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A document type with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create document type' }, { status: 500 });
  }
}
