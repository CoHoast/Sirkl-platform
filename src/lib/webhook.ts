import { pool } from './db';
import { alertWebhookFailed } from './alerts';

// Retry delays in minutes: 1, 5, 30, 120, 480 (8 hours)
const RETRY_DELAYS = [1, 5, 30, 120, 480];
const MAX_ATTEMPTS = 5;

interface WebhookPayload {
  documentId: number;
  clientId: number;
  documentType: string;
  extractedData: any;
  confidence: number;
  processedAt: string;
  s3Key?: string;
}

/**
 * Queue a webhook for delivery
 */
export async function queueWebhook(
  documentId: number,
  clientId: number,
  webhookUrl: string,
  payload: WebhookPayload
): Promise<number> {
  const result = await pool.query(`
    INSERT INTO webhook_queue (document_id, client_id, webhook_url, payload, status, next_attempt)
    VALUES ($1, $2, $3, $4, 'pending', NOW())
    RETURNING id
  `, [documentId, clientId, webhookUrl, JSON.stringify(payload)]);
  
  return result.rows[0].id;
}

/**
 * Attempt to deliver a webhook
 */
export async function deliverWebhook(queueId: number): Promise<{ success: boolean; error?: string }> {
  // Get queue item
  const queueResult = await pool.query(`
    SELECT wq.*, c.webhook_api_key
    FROM webhook_queue wq
    JOIN clients c ON wq.client_id = c.id
    WHERE wq.id = $1
  `, [queueId]);
  
  if (queueResult.rows.length === 0) {
    return { success: false, error: 'Queue item not found' };
  }
  
  const item = queueResult.rows[0];
  
  try {
    // Make the webhook request
    const response = await fetch(item.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': item.webhook_api_key || '',
        'X-DOKit-Timestamp': new Date().toISOString(),
      },
      body: JSON.stringify(item.payload),
    });
    
    if (response.ok) {
      // Success! Update queue and document
      await pool.query(`
        UPDATE webhook_queue 
        SET status = 'completed', completed_at = NOW(), last_attempt = NOW(), attempts = attempts + 1
        WHERE id = $1
      `, [queueId]);
      
      await pool.query(`
        UPDATE documents 
        SET webhook_status = 'delivered', webhook_completed_at = NOW(), webhook_attempts = webhook_attempts + 1
        WHERE id = $1
      `, [item.document_id]);
      
      // Log success
      await logWebhookEvent(item.document_id, item.client_id, 'delivered', null);
      
      return { success: true };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const newAttempts = item.attempts + 1;
    
    if (newAttempts >= MAX_ATTEMPTS) {
      // Max retries reached - mark as failed
      await pool.query(`
        UPDATE webhook_queue 
        SET status = 'failed', last_attempt = NOW(), last_error = $1, attempts = $2
        WHERE id = $3
      `, [errorMessage, newAttempts, queueId]);
      
      await pool.query(`
        UPDATE documents 
        SET webhook_status = 'failed', webhook_last_error = $1, webhook_attempts = $2, webhook_last_attempt = NOW()
        WHERE id = $3
      `, [errorMessage, newAttempts, item.document_id]);
      
      // Log failure
      await logWebhookEvent(item.document_id, item.client_id, 'failed', errorMessage);
      
      // Send alert for failed webhook
      await alertWebhookFailed(item.client_id, item.document_id, errorMessage, MAX_ATTEMPTS);
      
      return { success: false, error: `Max retries reached: ${errorMessage}` };
    } else {
      // Schedule retry
      const delayMinutes = RETRY_DELAYS[Math.min(newAttempts - 1, RETRY_DELAYS.length - 1)];
      
      await pool.query(`
        UPDATE webhook_queue 
        SET attempts = $1, last_attempt = NOW(), last_error = $2, 
            next_attempt = NOW() + INTERVAL '${delayMinutes} minutes'
        WHERE id = $3
      `, [newAttempts, errorMessage, queueId]);
      
      await pool.query(`
        UPDATE documents 
        SET webhook_status = 'retrying', webhook_last_error = $1, webhook_attempts = $2, webhook_last_attempt = NOW()
        WHERE id = $3
      `, [errorMessage, newAttempts, item.document_id]);
      
      // Log retry scheduled
      await logWebhookEvent(item.document_id, item.client_id, 'retry_scheduled', `Attempt ${newAttempts}/${MAX_ATTEMPTS}. Next retry in ${delayMinutes} minutes. Error: ${errorMessage}`);
      
      return { success: false, error: `Retry scheduled in ${delayMinutes} minutes: ${errorMessage}` };
    }
  }
}

/**
 * Process pending webhooks (called by cron/worker)
 */
export async function processPendingWebhooks(limit: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Get webhooks ready for delivery
  const result = await pool.query(`
    SELECT id FROM webhook_queue
    WHERE status = 'pending' AND next_attempt <= NOW()
    ORDER BY next_attempt ASC
    LIMIT $1
  `, [limit]);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const row of result.rows) {
    const deliveryResult = await deliverWebhook(row.id);
    if (deliveryResult.success) {
      succeeded++;
    } else {
      failed++;
    }
  }
  
  return { processed: result.rows.length, succeeded, failed };
}

/**
 * Get webhook queue status for a client
 */
export async function getWebhookQueueStatus(clientId?: number): Promise<{
  pending: number;
  retrying: number;
  failed: number;
  completed: number;
}> {
  let query = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'pending' AND attempts > 0) as retrying,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM webhook_queue
  `;
  
  const params: any[] = [];
  if (clientId) {
    query += ' WHERE client_id = $1';
    params.push(clientId);
  }
  
  const result = await pool.query(query, params);
  return {
    pending: parseInt(result.rows[0].pending),
    retrying: parseInt(result.rows[0].retrying),
    failed: parseInt(result.rows[0].failed),
    completed: parseInt(result.rows[0].completed),
  };
}

/**
 * Retry failed webhooks for a client
 */
export async function retryFailedWebhooks(clientId: number): Promise<number> {
  const result = await pool.query(`
    UPDATE webhook_queue
    SET status = 'pending', attempts = 0, next_attempt = NOW()
    WHERE client_id = $1 AND status = 'failed'
    RETURNING id
  `, [clientId]);
  
  return result.rowCount || 0;
}

/**
 * Log webhook event to audit log
 */
async function logWebhookEvent(documentId: number, clientId: number, status: string, details: string | null) {
  try {
    await pool.query(`
      INSERT INTO audit_log (action, entity_type, entity_id, details, client_id, created_at)
      VALUES ($1, 'webhook', $2, $3, $4, NOW())
    `, [`webhook_${status}`, documentId, details, clientId]);
  } catch (e) {
    // Don't fail if audit logging fails
    console.error('Failed to log webhook event:', e);
  }
}
