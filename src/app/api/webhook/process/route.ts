import { NextResponse } from 'next/server';
import { processPendingWebhooks, getWebhookQueueStatus, retryFailedWebhooks } from '@/lib/webhook';

// Process pending webhooks (called by cron or manually)
export async function POST(request: Request) {
  try {
    const { action, clientId, limit } = await request.json().catch(() => ({}));
    
    if (action === 'retry-failed' && clientId) {
      // Retry all failed webhooks for a client
      const count = await retryFailedWebhooks(clientId);
      return NextResponse.json({ success: true, retriedCount: count });
    }
    
    // Default: process pending webhooks
    const result = await processPendingWebhooks(limit || 10);
    
    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} webhooks: ${result.succeeded} succeeded, ${result.failed} failed/retrying`
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process webhooks' }, { status: 500 });
  }
}

// Get webhook queue status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    const status = await getWebhookQueueStatus(clientId ? parseInt(clientId) : undefined);
    
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Webhook status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get webhook status' }, { status: 500 });
  }
}
