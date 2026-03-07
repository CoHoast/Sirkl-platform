// Phase 2C: Phaxio Webhook Handler

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { communicationService } from '@/lib/communication/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook for debugging
    console.log('Phaxio webhook received:', JSON.stringify(body, null, 2));
    
    const { fax_id, status, direction, recipient_number } = body;
    
    // Store webhook payload
    const webhookResult = await pool.query(`
      INSERT INTO communication_webhooks (provider, event_type, payload, received_at)
      VALUES ('phaxio', $1, $2, NOW())
      RETURNING id
    `, [status, JSON.stringify(body)]);
    
    // Find communication by tracking ID
    const commResult = await pool.query(`
      SELECT id FROM bill_communications WHERE tracking_id = $1
    `, [fax_id?.toString()]);
    
    if (commResult.rows.length > 0) {
      const communicationId = commResult.rows[0].id;
      
      // Map Phaxio status to our status
      let commStatus: string;
      switch (status) {
        case 'success':
          commStatus = 'delivered';
          break;
        case 'failure':
        case 'cancelled':
          commStatus = 'failed';
          break;
        case 'queued':
        case 'pendingbatch':
          commStatus = 'pending';
          break;
        case 'inprogress':
          commStatus = 'sending';
          break;
        default:
          commStatus = 'sent';
      }
      
      // Update communication status
      await pool.query(`
        UPDATE bill_communications 
        SET status = $1, 
            delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
            error_message = CASE WHEN $1 = 'failed' THEN $2 ELSE error_message END,
            updated_at = NOW()
        WHERE id = $3
      `, [commStatus, body.error_message || null, communicationId]);
      
      // Update webhook with communication link
      await pool.query(`
        UPDATE communication_webhooks SET communication_id = $1, processed = true WHERE id = $2
      `, [communicationId, webhookResult.rows[0].id]);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Phaxio webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
