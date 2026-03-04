import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Webhook endpoint to receive processed documents
 * POST /api/webhook/intake
 * 
 * Receives: { document, extracted_data, confidence, processing_time_ms }
 * Stores in database and returns confirmation
 */

// In-memory store for quick viewing (also saves to DB)
const recentWebhookCalls: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const webhookData = {
      received_at: new Date().toISOString(),
      client_id: body.client_id || 1,
      document_type: body.document_type,
      original_filename: body.original_filename,
      s3_key: body.s3_key,
      confidence_score: body.confidence_score || body.confidence,
      extracted_data: body.extracted_data,
      processing_time_ms: body.processing_time_ms,
      source: body.source || 'ftp_intake',
      workflow_run_id: body.workflow_run_id
    };
    
    // Store in memory for quick access
    recentWebhookCalls.unshift(webhookData);
    if (recentWebhookCalls.length > 100) {
      recentWebhookCalls.pop();
    }
    
    // Also save to database
    let dbId = null;
    try {
      const result = await pool.query(`
        INSERT INTO documents (
          client_id, document_type, original_filename, s3_key,
          status, confidence_score, extracted_data, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `, [
        webhookData.client_id,
        webhookData.document_type,
        webhookData.original_filename,
        webhookData.s3_key,
        'processed',
        webhookData.confidence_score,
        JSON.stringify(webhookData.extracted_data)
      ]);
      dbId = result.rows[0]?.id;
    } catch (dbError) {
      console.error('DB save error:', dbError);
      // Continue anyway - webhook received
    }
    
    console.log(`📥 Webhook received: ${webhookData.document_type} - ${webhookData.original_filename}`);
    
    return NextResponse.json({
      success: true,
      message: 'Document received and processed',
      document_id: dbId,
      received_at: webhookData.received_at
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// GET endpoint to view recent webhook calls
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  
  return NextResponse.json({
    recent_calls: recentWebhookCalls.slice(0, limit),
    total_received: recentWebhookCalls.length
  });
}
