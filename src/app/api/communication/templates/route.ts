// Phase 2C: Offer Letter Templates API

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    
    let query = `
      SELECT * FROM offer_letter_templates 
      WHERE is_active = true 
      AND (client_id IS NULL ${clientId ? 'OR client_id = $1' : ''})
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (clientId) {
      params.push(clientId);
      paramIndex++;
    }
    
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
    }
    
    query += ' ORDER BY is_default DESC, name ASC';
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      templates: result.rows
    });
    
  } catch (error: any) {
    console.error('List templates error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Create custom template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, name, type, subjectTemplate, bodyTemplate, variables } = body;
    
    if (!name || !type || !subjectTemplate || !bodyTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    const result = await pool.query(`
      INSERT INTO offer_letter_templates 
        (client_id, name, type, subject_template, body_template, variables)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [clientId || null, name, type, subjectTemplate, bodyTemplate, JSON.stringify(variables || [])]);
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
