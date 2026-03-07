// Phase 2C: Communication Types

export type CommunicationType = 'fax' | 'email' | 'mail';
export type CommunicationStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced';
export type OfferLetterType = 'initial_offer' | 'counter_offer' | 'final_offer' | 'acceptance' | 'settlement_agreement';

export interface OfferLetterTemplate {
  id: string;
  name: string;
  type: OfferLetterType;
  subject: string;
  bodyTemplate: string;
  isDefault: boolean;
  variables: string[]; // Available merge fields
}

export interface OfferLetterData {
  // Organization info
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  orgLogo?: string;
  
  // Provider info
  providerName: string;
  providerNpi?: string;
  providerAddress: string;
  providerFax?: string;
  providerEmail?: string;
  
  // Patient/Member info
  patientName: string;
  memberId: string;
  dateOfService: string;
  
  // Bill details
  billId: string;
  originalAmount: number;
  fairMarketValue: number;
  offerAmount: number;
  offerPercentage: number; // % of original
  
  // Line items
  lineItems: {
    cptCode: string;
    description: string;
    billedAmount: number;
    medicareRate: number;
    offeredAmount: number;
  }[];
  
  // Negotiation info
  negotiationId: string;
  roundNumber: number;
  responseDeadline: string;
  
  // Offer terms
  paymentTerms: string;
  validUntil: string;
  
  // Contact info
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  
  // Generated date
  letterDate: string;
  
  // Optional custom note
  customMessage?: string;
  
  // Provider response portal (for autonomous negotiation)
  responseUrl?: string;
  responseToken?: string;
}

export interface CommunicationRecord {
  id: number;
  bill_id: number;
  negotiation_id: number;
  client_id: number;
  type: CommunicationType;
  status: CommunicationStatus;
  recipient: string; // fax number or email
  subject?: string;
  letter_type: OfferLetterType;
  letter_data: OfferLetterData;
  pdf_url?: string;
  tracking_id?: string; // External service ID
  sent_at?: Date;
  delivered_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SendOfferRequest {
  billId: number;
  negotiationId: number;
  method: CommunicationType;
  recipient: string;
  letterType: OfferLetterType;
  templateId?: string;
  customMessage?: string;
  ccEmails?: string[];
}

export interface SendOfferResponse {
  success: boolean;
  communicationId: number;
  trackingId?: string;
  error?: string;
}

// Phaxio-specific types
export interface PhaxioSendRequest {
  to: string;
  file: Buffer;
  filename: string;
  headerText?: string;
  callerId?: string;
}

export interface PhaxioSendResponse {
  success: boolean;
  faxId?: string;
  error?: string;
}

// Email-specific types
export interface EmailSendRequest {
  to: string;
  cc?: string[];
  subject: string;
  htmlBody: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}

export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Default templates - using {variable} syntax (single braces)
export const DEFAULT_TEMPLATES: OfferLetterTemplate[] = [
  {
    id: 'initial-standard',
    name: 'Standard Initial Offer',
    type: 'initial_offer',
    subject: 'Payment Offer - Patient: {patientName} - DOS: {dateOfService}',
    bodyTemplate: 'Dear {providerName},\n\nWe are writing regarding the medical bill for the patient and date of service referenced above. After careful review of the charges and comparison with fair market rates, we would like to offer the following settlement:\n\n**Original Bill Amount:** ${originalAmount}\n**Fair Market Value (Medicare x 150%):** ${fairMarketValue}\n**Our Offer:** ${offerAmount} ({offerPercentage}% of billed charges)\n\nThis offer represents a fair and prompt payment based on established Medicare rates. We believe this is reasonable compensation for the services rendered.\n\n**Payment Terms:** {paymentTerms}\n**Offer Valid Until:** {validUntil}\n\nTo accept this offer, please respond by fax or email to the contact information below. Upon acceptance, payment will be processed within the specified terms.\n\nIf you have any questions or would like to discuss this offer, please contact:\n{contactName}\nPhone: {contactPhone}\nEmail: {contactEmail}\n\nThank you for your consideration.\n\nSincerely,\n{orgName}',
    isDefault: true,
    variables: ['patientName', 'dateOfService', 'providerName', 'originalAmount', 'fairMarketValue', 'offerAmount', 'offerPercentage', 'lineItems', 'paymentTerms', 'validUntil', 'contactName', 'contactPhone', 'contactEmail', 'orgName']
  },
  {
    id: 'counter-response',
    name: 'Counter Offer Response',
    type: 'counter_offer',
    subject: 'Revised Payment Offer - Patient: {patientName} - DOS: {dateOfService}',
    bodyTemplate: 'Dear {providerName},\n\nThank you for your response to our initial offer. After reviewing your counter-proposal, we have revised our offer as follows:\n\n**Original Bill Amount:** ${originalAmount}\n**Your Counter:** ${counterAmount}\n**Our Revised Offer:** ${offerAmount}\n\nWe believe this revised offer represents a fair middle ground and reflects our commitment to resolving this matter promptly.\n\n**Payment Terms:** {paymentTerms}\n**Offer Valid Until:** {validUntil}\n\nPlease respond by the date above to proceed with settlement.\n\nSincerely,\n{orgName}\n{contactName}\n{contactPhone} | {contactEmail}',
    isDefault: true,
    variables: ['patientName', 'dateOfService', 'providerName', 'originalAmount', 'counterAmount', 'offerAmount', 'paymentTerms', 'validUntil', 'orgName', 'contactName', 'contactPhone', 'contactEmail']
  },
  {
    id: 'final-offer',
    name: 'Final Offer',
    type: 'final_offer',
    subject: 'FINAL OFFER - Patient: {patientName} - DOS: {dateOfService}',
    bodyTemplate: 'Dear {providerName},\n\nThis letter constitutes our final offer regarding the referenced medical bill.\n\n**Original Bill Amount:** ${originalAmount}\n**Final Offer:** ${offerAmount}\n\nThis is the maximum amount we are authorized to offer. If this offer is not accepted by {validUntil}, we will consider this matter unresolved and proceed accordingly.\n\nTo accept, please respond in writing by the deadline above.\n\nSincerely,\n{orgName}\n{contactName}\n{contactPhone} | {contactEmail}',
    isDefault: true,
    variables: ['patientName', 'dateOfService', 'providerName', 'originalAmount', 'offerAmount', 'validUntil', 'orgName', 'contactName', 'contactPhone', 'contactEmail']
  },
  {
    id: 'settlement-agreement',
    name: 'Settlement Agreement Confirmation',
    type: 'settlement_agreement',
    subject: 'Settlement Agreement Confirmation - Patient: {patientName}',
    bodyTemplate: 'Dear {providerName},\n\nThis letter confirms the settlement agreement reached for the referenced medical bill.\n\n**Settlement Details:**\n- Original Bill: ${originalAmount}\n- Settled Amount: ${settledAmount}\n- Savings: ${savingsAmount} ({savingsPercentage}%)\n\n**Payment Information:**\n- Payment Method: {paymentMethod}\n- Expected Payment Date: {paymentDate}\n\nPlease retain this letter for your records. Payment will be processed according to the terms above.\n\nIf you have any questions, please contact {contactName} at {contactPhone}.\n\nThank you for working with us to resolve this matter.\n\nSincerely,\n{orgName}',
    isDefault: true,
    variables: ['patientName', 'providerName', 'originalAmount', 'settledAmount', 'savingsAmount', 'savingsPercentage', 'paymentMethod', 'paymentDate', 'contactName', 'contactPhone', 'orgName']
  }
];
