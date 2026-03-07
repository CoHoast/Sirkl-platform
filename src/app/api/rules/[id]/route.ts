// Phase 2D: Individual Rule API

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a single rule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const result = await pool.query(`
      SELECT * FROM negotiation_rules WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Rule not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      rule: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Get rule error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Update a rule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Build dynamic update
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'name', 'description', 'rule_type', 'priority', 'is_active',
      'conditions', 'condition_logic', 'action'
    ];
    
    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (body[camelField] !== undefined || body[field] !== undefined) {
        let value = body[camelField] ?? body[field];
        
        // JSON stringify objects
        if (field === 'conditions' || field === 'action') {
          value = JSON.stringify(value);
        }
        
        updates.push(`${field} = $${paramIndex++}`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const result = await pool.query(`
      UPDATE negotiation_rules 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Rule not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      rule: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Update rule error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Delete a rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const result = await pool.query(`
      DELETE FROM negotiation_rules WHERE id = $1 RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Rule not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rule deleted'
    });
    
  } catch (error: any) {
    console.error('Delete rule error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
