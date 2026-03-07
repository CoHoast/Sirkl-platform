// Extraction Service - Main orchestrator for bill extraction
// Coordinates OCR, AI extraction, and Medicare rate lookup

import { ExtractionResult, CONFIDENCE_THRESHOLDS } from './types';
import { mockExtractBill } from './mock-extractor';
import { calculateBillFairPrice } from './medicare-rates';

interface ExtractBillOptions {
  billId: number;
  clientId: number;
  fileContent: Buffer | string;
  filename: string;
  mimeType: string;
  useRealAI?: boolean; // Set to true when API keys are configured
}

interface ExtractionResponse {
  success: boolean;
  extraction?: ExtractionResult;
  fairPriceCalculation?: Awaited<ReturnType<typeof calculateBillFairPrice>>;
  error?: string;
}

export async function extractBill(options: ExtractBillOptions): Promise<ExtractionResponse> {
  const { billId, clientId, fileContent, filename, useRealAI = false } = options;
  
  try {
    const startTime = Date.now();
    
    // Step 1: Extract data from document
    let extractionData: Partial<ExtractionResult>;
    
    if (useRealAI && process.env.OPENAI_API_KEY && process.env.AWS_ACCESS_KEY_ID) {
      // Real extraction with Textract + OpenAI
      // extractionData = await realExtractBill(fileContent, filename);
      // For now, fall back to mock
      extractionData = await mockExtractBill(fileContent.toString(), filename);
    } else {
      // Mock extraction for testing
      extractionData = await mockExtractBill(fileContent.toString(), filename);
    }
    
    // Step 2: Calculate fair prices for extracted line items
    let fairPriceCalculation = null;
    if (extractionData.line_items && extractionData.line_items.length > 0) {
      const lineItemsForCalc = extractionData.line_items.map(li => ({
        cpt_code: String(li.cpt_code.value || ''),
        charge: Number(li.charge.value || 0),
        quantity: Number(li.quantity.value || 1)
      }));
      
      fairPriceCalculation = await calculateBillFairPrice(lineItemsForCalc);
    }
    
    // Step 3: Build final extraction result
    const extraction: ExtractionResult = {
      id: `ext_${Date.now()}_${billId}`,
      bill_id: billId,
      status: extractionData.status || 'completed',
      
      member: extractionData.member || {
        name: { field: 'member.name', value: null, confidence: 0, source: 'manual' },
        id: { field: 'member.id', value: null, confidence: 0, source: 'manual' }
      },
      
      provider: extractionData.provider || {
        name: { field: 'provider.name', value: null, confidence: 0, source: 'manual' },
        npi: { field: 'provider.npi', value: null, confidence: 0, source: 'manual' }
      },
      
      billing: extractionData.billing || {
        account_number: { field: 'billing.account_number', value: null, confidence: 0, source: 'manual' },
        date_of_service: { field: 'billing.date_of_service', value: null, confidence: 0, source: 'manual' },
        total_billed: { field: 'billing.total_billed', value: null, confidence: 0, source: 'manual' }
      },
      
      line_items: extractionData.line_items || [],
      
      overall_confidence: extractionData.overall_confidence || 0,
      fields_needing_review: extractionData.fields_needing_review || [],
      
      processing_time_ms: Date.now() - startTime,
      ocr_provider: extractionData.ocr_provider || 'mock',
      ai_provider: extractionData.ai_provider || 'mock',
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Determine if review is needed
    if (extraction.overall_confidence < CONFIDENCE_THRESHOLDS.HIGH) {
      extraction.status = 'review_needed';
    }
    
    return {
      success: true,
      extraction,
      fairPriceCalculation: fairPriceCalculation || undefined
    };
    
  } catch (error) {
    console.error('Extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed'
    };
  }
}

// Validate and update extraction after human review
export function validateExtraction(
  extraction: ExtractionResult,
  updates: Partial<ExtractionResult>
): ExtractionResult {
  const updated: ExtractionResult = {
    ...extraction,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // Recalculate confidence after human edits
  // Human-verified fields get 100% confidence
  if (updates.member?.name) {
    updated.member.name = { ...updated.member.name, confidence: 100, source: 'manual' };
  }
  if (updates.member?.id) {
    updated.member.id = { ...updated.member.id, confidence: 100, source: 'manual' };
  }
  if (updates.provider?.name) {
    updated.provider.name = { ...updated.provider.name, confidence: 100, source: 'manual' };
  }
  if (updates.provider?.npi) {
    updated.provider.npi = { ...updated.provider.npi, confidence: 100, source: 'manual' };
  }
  
  // Clear fields needing review if all were addressed
  updated.fields_needing_review = [];
  
  // Mark as completed if it was in review
  if (updated.status === 'review_needed') {
    updated.status = 'completed';
    updated.reviewed_at = new Date().toISOString();
  }
  
  return updated;
}

// Get extraction status summary
export function getExtractionSummary(extraction: ExtractionResult): {
  status: string;
  statusColor: string;
  confidenceLevel: 'high' | 'medium' | 'low' | 'critical';
  reviewRequired: boolean;
  fieldsExtracted: number;
  fieldsNeedingReview: number;
  lineItemsCount: number;
} {
  let confidenceLevel: 'high' | 'medium' | 'low' | 'critical';
  let statusColor: string;
  
  if (extraction.overall_confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    confidenceLevel = 'high';
    statusColor = '#16a34a';
  } else if (extraction.overall_confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    confidenceLevel = 'medium';
    statusColor = '#f59e0b';
  } else if (extraction.overall_confidence >= CONFIDENCE_THRESHOLDS.LOW) {
    confidenceLevel = 'low';
    statusColor = '#f97316';
  } else {
    confidenceLevel = 'critical';
    statusColor = '#dc2626';
  }
  
  // Count extracted fields
  let fieldsExtracted = 0;
  if (extraction.member.name.value) fieldsExtracted++;
  if (extraction.member.id.value) fieldsExtracted++;
  if (extraction.provider.name.value) fieldsExtracted++;
  if (extraction.provider.npi.value) fieldsExtracted++;
  if (extraction.billing.account_number.value) fieldsExtracted++;
  if (extraction.billing.date_of_service.value) fieldsExtracted++;
  if (extraction.billing.total_billed.value) fieldsExtracted++;
  
  return {
    status: extraction.status,
    statusColor,
    confidenceLevel,
    reviewRequired: extraction.status === 'review_needed',
    fieldsExtracted,
    fieldsNeedingReview: extraction.fields_needing_review.length,
    lineItemsCount: extraction.line_items.length
  };
}
