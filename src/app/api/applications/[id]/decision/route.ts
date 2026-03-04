import { NextRequest, NextResponse } from 'next/server';

interface DecisionRequest {
  decision: 'approve' | 'deny' | 'request_info';
  reason?: string;
  staffId: string;
  staffNotes?: string;
  sendEmail?: boolean;
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

// Client email configurations (in production, fetch from database)
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

// Email templates
const emailTemplates = {
  approval: (applicant: any, member: any, config: EmailConfig) => ({
    subject: `Welcome to ${config.fromName} - Application Approved!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${config.primaryColor}; padding: 20px; text-align: center;">
          <img src="${config.logoUrl}" alt="${config.fromName}" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h1 style="color: ${config.primaryColor}; margin-bottom: 20px;">Welcome to ${config.fromName}!</h1>
          <p>Dear ${applicant.firstName},</p>
          <p>Great news! Your application for ${config.fromName} membership has been <strong>approved</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${config.primaryColor};">Membership Details</h3>
            <table style="width: 100%;">
              <tr><td style="padding: 5px 0;"><strong>Member ID:</strong></td><td>${member.id}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Plan Type:</strong></td><td style="text-transform: capitalize;">${member.planType}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Monthly Share:</strong></td><td>$${member.monthlyAmount}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Effective Date:</strong></td><td>${member.effectiveDate}</td></tr>
            </table>
          </div>
          
          <h3 style="color: ${config.primaryColor};">Next Steps</h3>
          <ol>
            <li>Your first monthly share of $${member.monthlyAmount} will be processed on ${member.firstPaymentDate}</li>
            <li>Your member cards will be mailed within 5-7 business days</li>
            <li>Access your member portal at: <a href="${member.portalUrl}" style="color: ${config.primaryColor};">${member.portalUrl}</a></li>
          </ol>
          
          <p>Welcome to our community! We're honored to share your healthcare journey.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">In Service,<br><strong>${config.fromName}</strong><br>${config.supportPhone}</p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to ${config.fromName}!

Dear ${applicant.firstName},

Great news! Your application has been approved.

MEMBERSHIP DETAILS
------------------
Member ID: ${member.id}
Plan Type: ${member.planType}
Monthly Share: $${member.monthlyAmount}
Effective Date: ${member.effectiveDate}

NEXT STEPS
----------
1. Your first monthly share will be processed on ${member.firstPaymentDate}
2. Your member cards will be mailed within 5-7 business days
3. Access your member portal at: ${member.portalUrl}

Welcome to our community!

In Service,
${config.fromName}
${config.supportPhone}
    `,
  }),

  denial: (applicant: any, denial: any, config: EmailConfig) => ({
    subject: `${config.fromName} - Application Status`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${config.primaryColor}; padding: 20px; text-align: center;">
          <img src="${config.logoUrl}" alt="${config.fromName}" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h1 style="color: #333; margin-bottom: 20px;">Application Status Update</h1>
          <p>Dear ${applicant.firstName},</p>
          <p>Thank you for your interest in ${config.fromName}. After careful review of your application, we regret to inform you that we are unable to offer membership at this time.</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">Reason for Decision</h3>
            <p style="margin-bottom: 0;">${denial.reason}</p>
            ${denial.details ? `<p style="margin-top: 10px; color: #666; font-size: 14px;">${denial.details}</p>` : ''}
          </div>
          
          <h3 style="color: ${config.primaryColor};">Appeal Process</h3>
          <p>If you believe this decision was made in error or have additional information to provide, you may submit an appeal within 30 days by contacting:</p>
          <p>
            Email: <a href="mailto:${config.supportEmail}" style="color: ${config.primaryColor};">${config.supportEmail}</a><br>
            Phone: ${config.supportPhone}
          </p>
          
          <p>We wish you the best in finding the right healthcare solution for your needs.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">Sincerely,<br><strong>${config.fromName}</strong><br>Member Services</p>
          </div>
        </div>
      </div>
    `,
    text: `
${config.fromName} - Application Status

Dear ${applicant.firstName},

Thank you for your interest in ${config.fromName}. After careful review of your application, we regret to inform you that we are unable to offer membership at this time.

REASON FOR DECISION
-------------------
${denial.reason}

${denial.details || ''}

APPEAL PROCESS
--------------
If you believe this decision was made in error, you may submit an appeal within 30 days by contacting:

Email: ${config.supportEmail}
Phone: ${config.supportPhone}

We wish you the best in finding the right healthcare solution.

Sincerely,
${config.fromName}
Member Services
    `,
  }),
};

// Denial reason mappings
const denialReasons: Record<string, { reason: string; details: string }> = {
  'statement_of_beliefs': {
    reason: 'Statement of Beliefs not accepted',
    details: 'Our healthshare community is built upon shared beliefs and values. Acceptance of the Statement of Beliefs is required for membership.',
  },
  'active_cancer': {
    reason: 'Active cancer treatment',
    details: 'We are unable to share in costs related to pre-existing conditions that are currently under active treatment. We recommend exploring options through your state healthcare marketplace at healthcare.gov.',
  },
  'coverage_gap': {
    reason: 'Coverage gap exceeds guidelines',
    details: 'Our guidelines require continuous coverage or a gap of no more than 63 days. Your application showed a coverage gap that exceeds this limit.',
  },
  'pre_existing_severe': {
    reason: 'Pre-existing condition assessment',
    details: 'Based on your current health status, we are unable to provide appropriate coverage at this time.',
  },
  'age_requirement': {
    reason: 'Age requirement not met',
    details: 'The primary applicant must be at least 18 years of age.',
  },
  'incomplete_application': {
    reason: 'Incomplete application',
    details: 'Required information was missing from your application. You may reapply with a complete application.',
  },
  'other': {
    reason: 'Application not approved',
    details: 'Please contact our member services team for more information about this decision.',
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: DecisionRequest = await request.json();
  
  const { decision, reason, staffId, staffNotes, sendEmail = true } = body;

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
      coverage: {
        planType: 'family',
        monthlyAmount: 549,
        requestedStartDate: '2026-03-01',
      },
    };

    // Get client email config
    const emailConfig = clientEmailConfigs[application.clientId] || clientEmailConfigs['united_refuah'];

    // Process decision
    let emailData;
    let newStatus: string;

    if (decision === 'approve') {
      newStatus = 'approved';
      
      // Generate member data
      const memberId = `UR-${Date.now().toString().slice(-6)}`;
      const effectiveDate = application.coverage.requestedStartDate;
      const firstPaymentDate = effectiveDate; // Same as effective date
      
      // Prepare approval email
      emailData = emailTemplates.approval(
        application.applicant,
        {
          id: memberId,
          planType: application.coverage.planType,
          monthlyAmount: application.coverage.monthlyAmount,
          effectiveDate,
          firstPaymentDate,
          portalUrl: 'https://members.unitedrefuah.org',
        },
        emailConfig
      );

      // In production: Create member record
      // await db.members.create({ ... });
      
    } else if (decision === 'deny') {
      newStatus = 'denied';
      
      // Get denial details
      const denialInfo = reason ? denialReasons[reason] || denialReasons['other'] : denialReasons['other'];
      
      // Prepare denial email
      emailData = emailTemplates.denial(
        application.applicant,
        {
          reason: denialInfo.reason,
          details: staffNotes || denialInfo.details,
        },
        emailConfig
      );
      
    } else {
      // request_info
      newStatus = 'needs_info';
      // Email would be sent separately via /contact route
    }

    // In production: Update application status
    // await db.applications.update(id, { status: newStatus, ... });

    // Send email if requested
    let emailSent = false;
    if (sendEmail && emailData) {
      // In production: Use email service (SendGrid, etc.)
      // await sendEmail({
      //   to: application.applicant.email,
      //   from: emailConfig.fromEmail,
      //   ...emailData
      // });
      
      console.log(`[EMAIL] Would send ${decision} email to ${application.applicant.email}`);
      console.log(`[EMAIL] Subject: ${emailData.subject}`);
      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      applicationId: id,
      decision,
      newStatus,
      emailSent,
      reviewedBy: staffId,
      reviewedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error processing decision:', error);
    return NextResponse.json(
      { error: 'Failed to process decision' },
      { status: 500 }
    );
  }
}
