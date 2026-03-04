import { pool } from './db';

// Alert configuration
const ALERT_CONFIG = {
  adminEmail: 'chris@dokit.ai',
  fromEmail: 'alerts@dokit.ai', // Needs to be verified in SES
  enabled: process.env.ALERTS_ENABLED === 'true',
  sesRegion: 'us-east-1',
};

type AlertSeverity = 'info' | 'warning' | 'critical';

interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  details?: Record<string, any>;
  clientId?: number;
  documentId?: number;
}

/**
 * Send an alert email via SES (or log if SES not configured)
 */
export async function sendAlert(alert: AlertPayload): Promise<void> {
  const { title, message, severity, details, clientId, documentId } = alert;
  
  // Always log the alert
  console.log(`[ALERT ${severity.toUpperCase()}] ${title}: ${message}`);
  
  // Store in database for dashboard visibility
  try {
    await pool.query(`
      INSERT INTO alerts (title, message, severity, details, client_id, document_id, created_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'new')
    `, [title, message, severity, details ? JSON.stringify(details) : null, clientId, documentId]);
  } catch (e) {
    console.error('Failed to store alert:', e);
  }
  
  // Send email if configured
  if (ALERT_CONFIG.enabled && process.env.AWS_ACCESS_KEY_ID) {
    try {
      await sendAlertEmail(alert);
    } catch (e) {
      console.error('Failed to send alert email:', e);
    }
  }
}

/**
 * Send email via AWS SES
 */
async function sendAlertEmail(alert: AlertPayload): Promise<void> {
  // Dynamic import to avoid issues if aws-sdk not installed
  const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
  
  const client = new SESClient({
    region: ALERT_CONFIG.sesRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  
  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  }[alert.severity];
  
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#d97706' : '#2563eb'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">${severityEmoji} DOKit Alert: ${alert.title}</h1>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">${alert.message}</p>
        ${alert.details ? `
          <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase;">Details</h3>
            <pre style="margin: 0; font-size: 13px; color: #374151; white-space: pre-wrap;">${JSON.stringify(alert.details, null, 2)}</pre>
          </div>
        ` : ''}
        <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">
          Sent from DOKit Admin Dashboard • ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  const command = new SendEmailCommand({
    Source: ALERT_CONFIG.fromEmail,
    Destination: {
      ToAddresses: [ALERT_CONFIG.adminEmail],
    },
    Message: {
      Subject: {
        Data: `[${alert.severity.toUpperCase()}] DOKit: ${alert.title}`,
      },
      Body: {
        Html: {
          Data: htmlBody,
        },
        Text: {
          Data: `${alert.title}\n\n${alert.message}\n\n${alert.details ? JSON.stringify(alert.details, null, 2) : ''}`,
        },
      },
    },
  });
  
  await client.send(command);
}

// Pre-defined alert functions for common events

export async function alertWebhookFailed(clientId: number, documentId: number, error: string, attempts: number): Promise<void> {
  await sendAlert({
    title: 'Webhook Delivery Failed',
    message: `Failed to deliver webhook after ${attempts} attempts. Manual intervention may be required.`,
    severity: 'warning',
    details: { clientId, documentId, error, attempts },
    clientId,
    documentId,
  });
}

export async function alertProcessingFailed(clientId: number, documentId: number, error: string): Promise<void> {
  await sendAlert({
    title: 'Document Processing Failed',
    message: `A document failed to process and requires attention.`,
    severity: 'critical',
    details: { clientId, documentId, error },
    clientId,
    documentId,
  });
}

export async function alertHighErrorRate(clientId: number, errorRate: number, windowMinutes: number): Promise<void> {
  await sendAlert({
    title: 'High Error Rate Detected',
    message: `Error rate of ${errorRate.toFixed(1)}% detected in the last ${windowMinutes} minutes.`,
    severity: 'critical',
    details: { clientId, errorRate, windowMinutes },
    clientId,
  });
}

export async function alertClientApproachingLimit(clientId: number, clientName: string, currentDocs: number, tierLimit: number): Promise<void> {
  await sendAlert({
    title: 'Client Approaching Tier Limit',
    message: `${clientName} has processed ${currentDocs} documents, approaching their tier limit of ${tierLimit}.`,
    severity: 'info',
    details: { clientId, clientName, currentDocs, tierLimit, percentUsed: ((currentDocs / tierLimit) * 100).toFixed(1) },
    clientId,
  });
}

export async function alertWorkerError(workerName: string, error: string): Promise<void> {
  await sendAlert({
    title: `Worker Error: ${workerName}`,
    message: `The ${workerName} worker encountered an error.`,
    severity: 'critical',
    details: { workerName, error },
  });
}
