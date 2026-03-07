// Mock Extractor - Simulates AI extraction for testing
// Replace with real Textract + OpenAI when keys are provided

import { ExtractionResult, ExtractedField, ExtractedLineItem, CONFIDENCE_THRESHOLDS } from './types';

// Sample data patterns for realistic mock extraction
const SAMPLE_PROVIDERS = [
  { name: 'Memorial Hospital', npi: '1234567890' },
  { name: 'City Medical Center', npi: '0987654321' },
  { name: 'Valley Health System', npi: '5678901234' },
  { name: 'Regional Medical Associates', npi: '4321098765' },
];

const SAMPLE_CPT_CODES = [
  { code: '99213', desc: 'Office visit, established patient, low complexity', charge: 150 },
  { code: '99214', desc: 'Office visit, established patient, moderate complexity', charge: 225 },
  { code: '99215', desc: 'Office visit, established patient, high complexity', charge: 325 },
  { code: '99283', desc: 'Emergency dept visit, moderate severity', charge: 450 },
  { code: '99284', desc: 'Emergency dept visit, high severity', charge: 750 },
  { code: '99285', desc: 'Emergency dept visit, high severity with threat to life', charge: 1200 },
  { code: '36415', desc: 'Venipuncture', charge: 35 },
  { code: '80053', desc: 'Comprehensive metabolic panel', charge: 85 },
  { code: '85025', desc: 'Complete blood count (CBC)', charge: 45 },
  { code: '71046', desc: 'Chest X-ray, 2 views', charge: 275 },
  { code: '72148', desc: 'MRI lumbar spine without contrast', charge: 1500 },
  { code: '73721', desc: 'MRI joint lower extremity', charge: 1350 },
  { code: '27447', desc: 'Total knee replacement', charge: 45000 },
  { code: '43239', desc: 'Upper GI endoscopy with biopsy', charge: 2500 },
];

function randomConfidence(min: number = 50, max: number = 98): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createField(value: string | number, minConfidence: number = 60): ExtractedField {
  const confidence = randomConfidence(minConfidence, 98);
  return {
    field: '',
    value,
    confidence,
    source: confidence > 80 ? 'ai' : 'ocr'
  };
}

function generateLineItems(count: number = 3): ExtractedLineItem[] {
  const items: ExtractedLineItem[] = [];
  const usedCodes = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let cpt = SAMPLE_CPT_CODES[Math.floor(Math.random() * SAMPLE_CPT_CODES.length)];
    
    // Avoid duplicates
    while (usedCodes.has(cpt.code) && usedCodes.size < SAMPLE_CPT_CODES.length) {
      cpt = SAMPLE_CPT_CODES[Math.floor(Math.random() * SAMPLE_CPT_CODES.length)];
    }
    usedCodes.add(cpt.code);
    
    const quantity = Math.random() > 0.8 ? 2 : 1;
    const chargeVariation = cpt.charge * (0.9 + Math.random() * 0.3); // ±15% variation
    
    items.push({
      cpt_code: createField(cpt.code, 75),
      description: createField(cpt.desc, 70),
      quantity: createField(quantity, 90),
      charge: createField(Math.round(chargeVariation), 85),
      confidence: randomConfidence(70, 95)
    });
  }
  
  return items;
}

export async function mockExtractBill(
  fileContent: string | Buffer,
  filename: string
): Promise<Partial<ExtractionResult>> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const provider = SAMPLE_PROVIDERS[Math.floor(Math.random() * SAMPLE_PROVIDERS.length)];
  const lineItemCount = 2 + Math.floor(Math.random() * 4); // 2-5 line items
  const lineItems = generateLineItems(lineItemCount);
  
  // Calculate total from line items
  const totalBilled = lineItems.reduce((sum, item) => {
    const charge = typeof item.charge.value === 'number' ? item.charge.value : 0;
    const qty = typeof item.quantity.value === 'number' ? item.quantity.value : 1;
    return sum + (charge * qty);
  }, 0);
  
  // Generate member info
  const memberNames = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Maria Garcia', 'William Brown'];
  const memberName = memberNames[Math.floor(Math.random() * memberNames.length)];
  const memberId = `MEM-${100000 + Math.floor(Math.random() * 900000)}`;
  
  // Generate dates
  const serviceDate = new Date();
  serviceDate.setDate(serviceDate.getDate() - Math.floor(Math.random() * 30));
  
  // Calculate overall confidence
  const allConfidences = [
    ...lineItems.map(li => li.confidence),
    randomConfidence(70, 95), // member
    randomConfidence(75, 98), // provider
    randomConfidence(80, 98), // billing
  ];
  const overallConfidence = Math.round(
    allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
  );
  
  // Determine fields needing review
  const fieldsNeedingReview: string[] = [];
  if (overallConfidence < CONFIDENCE_THRESHOLDS.HIGH) {
    if (Math.random() > 0.5) fieldsNeedingReview.push('member.id');
    if (Math.random() > 0.6) fieldsNeedingReview.push('provider.npi');
    if (Math.random() > 0.7) fieldsNeedingReview.push('line_items');
  }
  
  return {
    status: overallConfidence >= CONFIDENCE_THRESHOLDS.HIGH ? 'completed' : 'review_needed',
    
    member: {
      name: { ...createField(memberName, 80), field: 'member.name' },
      id: { ...createField(memberId, 70), field: 'member.id' },
    },
    
    provider: {
      name: { ...createField(provider.name, 85), field: 'provider.name' },
      npi: { ...createField(provider.npi, 80), field: 'provider.npi' },
    },
    
    billing: {
      account_number: { ...createField(`ACC-${Date.now()}`, 75), field: 'billing.account_number' },
      date_of_service: { ...createField(serviceDate.toISOString().split('T')[0], 85), field: 'billing.date_of_service' },
      total_billed: { ...createField(Math.round(totalBilled), 90), field: 'billing.total_billed' },
    },
    
    line_items: lineItems,
    overall_confidence: overallConfidence,
    fields_needing_review: fieldsNeedingReview,
    
    processing_time_ms: 1500 + Math.floor(Math.random() * 1000),
    ocr_provider: 'mock',
    ai_provider: 'mock',
  };
}

// Export extraction status messages
export const EXTRACTION_STATUS_MESSAGES = {
  pending: 'Waiting to be processed',
  processing: 'AI is analyzing the document',
  completed: 'Extraction complete, ready for negotiation',
  review_needed: 'Some fields need human verification',
  failed: 'Extraction failed, manual entry required'
};
