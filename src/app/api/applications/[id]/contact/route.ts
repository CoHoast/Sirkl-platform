import { NextRequest, NextResponse } from 'next/server';

interface ContactRequest {
  subject: string;
  message: string;
  staffId: string;
  staffName: string;
}

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  logoUrl: string;
  primaryColor: string;
  supportPhone: string;
  supportEmail: string;
}

// Client email configurations
const clientEmailConfigs: Record<string, EmailConfig> = {
  'united_refuah': {
    fromEmail: 'applications@unitedrefuah.org',
    fromName: 'United Refuah HealthShare',
    replyTo: 'support@unitedrefuah.org',
    logoUrl: 'https://unitedrefuah.org/images/UnitedRefuahLogo.svg',
    primaryColor: '#135c9f',
    supportPhone: '(440) 772-0700',
    supportEmail: 'support@unitedrefuah.org',
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: ContactRequest = await request.json();
  
  const { subject, message, staffId, staffName } = body;

  // Validate required fields
  if (!subject || !message) {
    return NextResponse.json(
      { error: 'Subject and message are required' },
      { status: 400 }
    );
  }

  try {
    // In production: Fetch application from database
    // const application = await db.applications.findById(id);
    
    // Mock application data
    const application = {
      id,
      clientId: 'united_refuah',
      applicant: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
      },
    };

    // Get client email config
    const emailConfig = clientEmailConfigs[application.clientId] || clientEmailConfigs['united_refuah'];

    // Build email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${emailConfig.primaryColor}; padding: 20px; text-align: center;">
          <img src="${emailConfig.logoUrl}" alt="${emailConfig.fromName}" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p>Dear ${application.applicant.firstName},</p>
          
          <div style="white-space: pre-wrap; line-height: 1.6;">
${message}
          </div>
          
          <p style="margin-top: 20px;">If you have any questions, please don't hesitate to reach out.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">
              Best regards,<br>
              <strong>${staffName || 'Member Services'}</strong><br>
              ${emailConfig.fromName}<br>
              ${emailConfig.supportPhone}
            </p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
Dear ${application.applicant.firstName},

${message}

If you have any questions, please don't hesitate to reach out.

Best regards,
${staffName || 'Member Services'}
${emailConfig.fromName}
${emailConfig.supportPhone}
    `;

    // In production: Send email via SendGrid, etc.
    // await sendEmail({
    //   to: application.applicant.email,
    //   from: emailConfig.fromEmail,
    //   replyTo: emailConfig.replyTo,
    //   subject,
    //   html: emailHtml,
    //   text: emailText,
    // });

    console.log(`[EMAIL] Contact email to ${application.applicant.email}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] From: ${staffName || 'Member Services'}`);

    // Log the communication in the application history
    // In production: Add to application communications log
    // await db.applicationCommunications.create({
    //   applicationId: id,
    //   type: 'outbound_email',
    //   subject,
    //   message,
    //   sentBy: staffId,
    //   sentAt: new Date(),
    // });

    return NextResponse.json({
      success: true,
      applicationId: id,
      emailSent: true,
      sentTo: application.applicant.email,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error sending contact email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET - Retrieve communication history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In production: Fetch from database
  // const communications = await db.applicationCommunications.findByApplicationId(id);

  const mockCommunications = [
    {
      id: '1',
      type: 'outbound_email',
      subject: 'Regarding Your Application',
      message: 'Thank you for your application. We need some additional information...',
      sentBy: 'admin@mcoadv.com',
      sentAt: '2026-02-26T15:30:00Z',
    },
  ];

  return NextResponse.json({
    applicationId: id,
    communications: mockCommunications,
  });
}
