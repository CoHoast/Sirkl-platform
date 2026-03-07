// Extraction Types for Bill Negotiator

export interface ExtractedField {
  field: string;
  value: string | number | null;
  confidence: number; // 0-100
  source: 'ocr' | 'ai' | 'manual' | 'lookup';
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
}

export interface ExtractedLineItem {
  cpt_code: ExtractedField;
  description: ExtractedField;
  quantity: ExtractedField;
  charge: ExtractedField;
  units?: ExtractedField;
  modifier?: ExtractedField;
  service_date?: ExtractedField;
  confidence: number; // Average confidence of all fields
}

export interface ExtractionResult {
  id: string;
  bill_id: number;
  status: 'pending' | 'processing' | 'completed' | 'review_needed' | 'failed';
  
  // Extracted fields
  member: {
    name: ExtractedField;
    id: ExtractedField;
    dob?: ExtractedField;
    address?: ExtractedField;
  };
  
  provider: {
    name: ExtractedField;
    npi: ExtractedField;
    tax_id?: ExtractedField;
    address?: ExtractedField;
    phone?: ExtractedField;
    fax?: ExtractedField;
  };
  
  billing: {
    account_number: ExtractedField;
    invoice_number?: ExtractedField;
    date_of_service: ExtractedField;
    statement_date?: ExtractedField;
    due_date?: ExtractedField;
    total_billed: ExtractedField;
  };
  
  line_items: ExtractedLineItem[];
  
  // Confidence summary
  overall_confidence: number;
  fields_needing_review: string[];
  
  // Processing metadata
  raw_text?: string;
  processing_time_ms?: number;
  ocr_provider?: 'textract' | 'tesseract' | 'mock';
  ai_provider?: 'openai' | 'anthropic' | 'mock';
  
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface MedicareRate {
  cpt_code: string;
  description: string;
  facility_rate: number;
  non_facility_rate: number;
  limiting_charge: number;
  mac_locality: string;
  effective_date: string;
  source: 'cms_api' | 'cache' | 'estimate';
}

export interface FairPriceCalculation {
  cpt_code: string;
  billed_amount: number;
  medicare_rate: number;
  fair_price: number; // Medicare * multiplier
  multiplier: number;
  savings_potential: number;
  savings_percent: number;
}

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 85,      // Auto-approve
  MEDIUM: 60,    // Review recommended
  LOW: 40,       // Review required
  CRITICAL: 20   // Manual entry likely needed
};

export const EXTRACTION_FIELDS = [
  'member.name',
  'member.id',
  'provider.name',
  'provider.npi',
  'billing.account_number',
  'billing.date_of_service',
  'billing.total_billed',
  'line_items'
] as const;
