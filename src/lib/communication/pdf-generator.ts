// Phase 2C: PDF Generator for Offer Letters
// Mobile-responsive email templates using table-based layout

import { OfferLetterData, OfferLetterTemplate, DEFAULT_TEMPLATES } from './types';

// Template variable replacement - uses single braces {variableName}
function replaceVariables(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Simple variable replacement: {variableName}
  const simpleVarRegex = /\{(\w+)\}/g;
  result = result.replace(simpleVarRegex, (match, varName) => {
    const value = data[varName];
    if (value === undefined || value === null) return match; // Keep original if not found
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  });
  
  return result;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Generate mobile-responsive HTML email using tables
export function generateOfferLetterHTML(
  data: OfferLetterData,
  template?: OfferLetterTemplate
): string {
  const selectedTemplate = template || DEFAULT_TEMPLATES.find(t => t.type === 'initial_offer' && t.isDefault)!;
  
  // Prepare template data with formatted values
  const templateData = {
    ...data,
    originalAmount: formatCurrency(data.originalAmount),
    fairMarketValue: formatCurrency(data.fairMarketValue),
    offerAmount: formatCurrency(data.offerAmount),
    letterDate: formatDate(data.letterDate),
    dateOfService: formatDate(data.dateOfService),
    validUntil: formatDate(data.validUntil),
    responseDeadline: formatDate(data.responseDeadline),
    lineItems: data.lineItems.map(item => ({
      ...item,
      billedAmount: formatCurrency(item.billedAmount),
      medicareRate: formatCurrency(item.medicareRate),
      offeredAmount: formatCurrency(item.offeredAmount)
    }))
  };
  
  const letterBody = replaceVariables(selectedTemplate.bodyTemplate, templateData);
  const subject = replaceVariables(selectedTemplate.subject, templateData);
  
  // Mobile-responsive email HTML using tables (email-client compatible)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { padding: 0; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color: #ffffff; font-size: 22px; font-weight: bold;">${data.orgName}</td>
                </tr>
                <tr>
                  <td style="color: #e0e7ff; font-size: 13px; padding-top: 8px;">${data.orgAddress}</td>
                </tr>
                <tr>
                  <td style="color: #e0e7ff; font-size: 13px; padding-top: 4px;">Phone: ${data.orgPhone} | Email: ${data.orgEmail}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Date & Reference -->
          <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 14px; color: #64748b;">
                    <strong>Date:</strong> ${formatDate(data.letterDate)}<br>
                    <strong>Bill ID:</strong> ${data.billId}<br>
                    <strong>Negotiation #:</strong> ${data.negotiationId}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Recipient -->
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 15px; color: #0f172a; font-weight: bold; padding-bottom: 4px;">${data.providerName}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #64748b;">${data.providerAddress}</td>
                </tr>
                ${data.providerFax ? `<tr><td style="font-size: 14px; color: #64748b;">Fax: ${data.providerFax}</td></tr>` : ''}
                ${data.providerEmail ? `<tr><td style="font-size: 14px; color: #64748b;">Email: ${data.providerEmail}</td></tr>` : ''}
              </table>
            </td>
          </tr>
          
          <!-- Patient Reference Box -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f7ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 11px; color: #6366f1; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 12px;">Patient & Service Reference</td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="33%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                                <div style="font-size: 11px; color: #64748b;">Patient Name</div>
                                <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 2px;">${data.patientName}</div>
                              </td>
                              <td width="33%" style="padding: 8px; vertical-align: top; border-left: 1px solid #e2e8f0;">
                                <div style="font-size: 11px; color: #64748b;">Member ID</div>
                                <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 2px;">${data.memberId}</div>
                              </td>
                              <td width="34%" style="padding: 8px 0 8px 8px; vertical-align: top; border-left: 1px solid #e2e8f0;">
                                <div style="font-size: 11px; color: #64748b;">Date of Service</div>
                                <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 2px;">${formatDate(data.dateOfService)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Subject -->
          <tr>
            <td style="padding: 0 20px 16px;">
              <div style="font-size: 18px; font-weight: bold; color: #0f172a;">RE: ${subject}</div>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <div style="font-size: 14px; color: #374151; line-height: 1.6;">${letterBody.replace(/\n/g, '<br>')}</div>
            </td>
          </tr>
          
          ${data.lineItems.length > 0 ? `
          <!-- Line Items Table -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #6366f1;">
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600;">CPT</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600;">Description</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-align: right;">Billed</td>
                  <td style="padding: 10px 12px; color: white; font-size: 12px; font-weight: 600; text-align: right;">Offer</td>
                </tr>
                ${data.lineItems.map((item, i) => `
                <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="padding: 10px 12px; font-size: 13px; color: #374151; border-top: 1px solid #e2e8f0;">${item.cptCode}</td>
                  <td style="padding: 10px 12px; font-size: 13px; color: #374151; border-top: 1px solid #e2e8f0;">${item.description}</td>
                  <td style="padding: 10px 12px; font-size: 13px; color: #374151; border-top: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.billedAmount)}</td>
                  <td style="padding: 10px 12px; font-size: 13px; color: #6366f1; font-weight: 600; border-top: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.offeredAmount)}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Offer Summary -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f8f7ff 0%, #ede9fe 100%); border: 1px solid #c4b5fd; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px dashed #c4b5fd;">Original Billed:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; border-bottom: 1px dashed #c4b5fd;">${formatCurrency(data.originalAmount)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px dashed #c4b5fd;">Fair Market Value:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; border-bottom: 1px dashed #c4b5fd;">${formatCurrency(data.fairMarketValue)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 8px; font-size: 18px; font-weight: bold; color: #6366f1;">Our Offer (${data.offerPercentage}%):</td>
                        <td style="padding: 12px 0 8px; font-size: 18px; font-weight: bold; color: #6366f1; text-align: right;">${formatCurrency(data.offerAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${data.responseUrl ? `
          <!-- Response CTA -->
          <tr>
            <td style="padding: 0 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dcfce7; border: 2px solid #16a34a; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-size: 16px; font-weight: bold; color: #15803d; margin-bottom: 8px;">Respond to This Offer Online</div>
                    <div style="font-size: 14px; color: #166534; margin-bottom: 16px;">Accept, counter, or decline — quick and easy.</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: #16a34a; border-radius: 8px;">
                          <a href="${data.responseUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none;">Click Here to Respond</a>
                        </td>
                      </tr>
                    </table>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 16px; word-break: break-all;">${data.responseUrl}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Signature -->
          <tr>
            <td style="padding: 0 20px 24px;">
              <div style="font-size: 14px; color: #374151;">Sincerely,</div>
              <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 24px;">${data.contactName}</div>
              <div style="font-size: 14px; color: #64748b;">${data.orgName}</div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px;">CONFIDENTIAL</div>
              <div style="font-size: 11px; color: #94a3b8;">This communication contains confidential information intended only for the addressee.</div>
            </td>
          </tr>
          
        </table>
        <!-- End Main Container -->
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper -->
  
</body>
</html>
`;
}

// Generate plain text version for fax cover sheets
export function generateOfferLetterText(
  data: OfferLetterData,
  template?: OfferLetterTemplate
): string {
  const selectedTemplate = template || DEFAULT_TEMPLATES.find(t => t.type === 'initial_offer' && t.isDefault)!;
  
  const templateData = {
    ...data,
    originalAmount: formatCurrency(data.originalAmount),
    fairMarketValue: formatCurrency(data.fairMarketValue),
    offerAmount: formatCurrency(data.offerAmount),
    letterDate: formatDate(data.letterDate),
    dateOfService: formatDate(data.dateOfService),
    validUntil: formatDate(data.validUntil),
    lineItems: data.lineItems.map(item => ({
      ...item,
      billedAmount: formatCurrency(item.billedAmount),
      medicareRate: formatCurrency(item.medicareRate),
      offeredAmount: formatCurrency(item.offeredAmount)
    }))
  };
  
  const body = replaceVariables(selectedTemplate.bodyTemplate, templateData);
  const subject = replaceVariables(selectedTemplate.subject, templateData);
  
  return `
================================================================================
${data.orgName.toUpperCase()}
${data.orgAddress}
Phone: ${data.orgPhone} | Email: ${data.orgEmail}
================================================================================

Date: ${formatDate(data.letterDate)}
Bill ID: ${data.billId}
Negotiation #: ${data.negotiationId}

TO:
${data.providerName}
${data.providerAddress}
${data.providerFax ? `Fax: ${data.providerFax}` : ''}
${data.providerEmail ? `Email: ${data.providerEmail}` : ''}

--------------------------------------------------------------------------------
PATIENT: ${data.patientName}
MEMBER ID: ${data.memberId}
DATE OF SERVICE: ${formatDate(data.dateOfService)}
--------------------------------------------------------------------------------

RE: ${subject}

${body}

================================================================================
OFFER SUMMARY
--------------------------------------------------------------------------------
Original Billed Amount:      ${formatCurrency(data.originalAmount)}
Fair Market Value:           ${formatCurrency(data.fairMarketValue)}
Our Offer:                   ${formatCurrency(data.offerAmount)} (${data.offerPercentage}%)
================================================================================

${data.responseUrl ? `
RESPOND ONLINE: ${data.responseUrl}

` : ''}
CONFIDENTIAL - This communication is intended only for the addressee.
`;
}

// Get template by ID or type
export function getTemplate(idOrType: string): OfferLetterTemplate | undefined {
  return DEFAULT_TEMPLATES.find(t => t.id === idOrType || t.type === idOrType);
}

// List all available templates
export function listTemplates(): OfferLetterTemplate[] {
  return DEFAULT_TEMPLATES;
}
