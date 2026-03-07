// Phase 2C: Communication History API

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = `
      SELECT 
        bc.*,
        b.member_name,
        b.provider_name,
        b.total_billed
      FROM bill_communications bc
      JOIN bills b ON bc.bill_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (billId) {
      query += ` AND bc.bill_id = $${paramIndex++}`;
      params.push(billId);
    }
    
    if (clientId) {
      query += ` AND bc.client_id = $${paramIndex++}`;
      params.push(clientId);
    }
    
    if (status) {
      query += ` AND bc.status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ` ORDER BY bc.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM bill_communications bc WHERE 1=1
    `;
    const countParams: any[] = [];
    let countIndex = 1;
    
    if (billId) {
      countQuery += ` AND bc.bill_id = $${countIndex++}`;
      countParams.push(billId);
    }
    if (clientId) {
      countQuery += ` AND bc.client_id = $${countIndex++}`;
      countParams.push(clientId);
    }
    if (status) {
      countQuery += ` AND bc.status = $${countIndex}`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    return NextResponse.json({
      success: true,
      communications: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      }
    });
    
  } catch (error: any) {
    console.error('Communication history error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
