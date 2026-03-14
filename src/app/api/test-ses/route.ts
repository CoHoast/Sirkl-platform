import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// GET /api/test-ses?to=email@example.com - Test SES email sending
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get('to') || 'cguiher17@gmail.com';
  
  const ses = new SESClient({ 
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  });

  const fromEmail = process.env.SES_FROM_EMAIL || 'offers@dokit.ai';

  try {
    const cmd = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: '🎉 Sirkl Platform - SES Test Successful!' },
        Body: { 
          Text: { Data: 'If you receive this, SES is configured correctly. Ready for E2E testing!' },
          Html: { 
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">✅ Sirkl Platform - SES Test Successful</h2>
                <p>If you see this email, AWS SES is working correctly.</p>
                <p><strong>From:</strong> ${fromEmail}</p>
                <p><strong>To:</strong> ${to}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 14px;">Next step: Full E2E bill negotiation test!</p>
              </div>
            `
          }
        }
      }
    });

    const result = await ses.send(cmd);
    
    return NextResponse.json({
      success: true,
      messageId: result.MessageId,
      from: fromEmail,
      to: to
    });
  } catch (error: any) {
    console.error('SES Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.Code || error.name
    }, { status: 500 });
  }
}
