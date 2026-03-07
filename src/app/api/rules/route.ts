// Phase 2D: Negotiation Rules API

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RULE_TEMPLATES } from '@/lib/rules/types';

// List rules for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'clientId is required'
      }, { status: 400 });
    }
    
    let query = `
      SELECT * FROM negotiation_rules 
      WHERE client_id = $1
    `;
    
    if (!includeInactive) {
      query += ` AND is_active = true`;
    }
    
    query += ` ORDER BY priority ASC, created_at DESC`;
    
    const result = await pool.query(query, [clientId]);
    
    return NextResponse.json({
      success: true,
      rules: result.rows,
      templates: RULE_TEMPLATES
    });
    
  } catch (error: any) {
    console.error('List rules error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Create a new rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clientId, name, description, ruleType, priority,
      conditions, conditionLogic, action
    } = body;
    
    if (!clientId || !name || !ruleType || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: clientId, name, ruleType, action'
      }, { status: 400 });
    }
    
    const result = await pool.query(`
      INSERT INTO negotiation_rules (
        client_id, name, description, rule_type, priority,
        conditions, condition_logic, action, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      clientId, name, description || null, ruleType, priority || 100,
      JSON.stringify(conditions || []), conditionLogic || 'and', JSON.stringify(action)
    ]);
    
    return NextResponse.json({
      success: true,
      rule: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Create rule error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
