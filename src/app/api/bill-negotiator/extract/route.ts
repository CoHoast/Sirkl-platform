import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Extraction prompt for medical bills
const EXTRACTION_PROMPT = `You are a medical bill data extraction expert. Extract all relevant information from this medical bill image and return it as structured JSON.

Return this exact structure:
{
  "provider": {
    "name": { "value": "Provider Name", "confidence": 95 },
    "npi": { "value": "1234567890", "confidence": 90 },
    "address": { "value": "Full Address", "confidence": 85 },
    "phone": { "value": "(xxx) xxx-xxxx", "confidence": 80 },
    "fax": { "value": "(xxx) xxx-xxxx", "confidence": 75 },
    "tax_id": { "value": "xx-xxxxxxx", "confidence": 85 }
  },
  "member": {
    "name": { "value": "Patient Full Name", "confidence": 95 },
    "id": { "value": "Member ID", "confidence": 90 },
    "dob": { "value": "MM/DD/YYYY", "confidence": 85 },
    "account_number": { "value": "Account #", "confidence": 80 }
  },
  "service": {
    "date_of_service": { "value": "MM/DD/YYYY", "confidence": 90 },
    "place_of_service": { "value": "22 - Outpatient", "confidence": 85 }
  },
  "billing": {
    "total_billed": { "value": 1234.56, "confidence": 95 },
    "adjustments": { "value": 0, "confidence": 80 },
    "amount_due": { "value": 1234.56, "confidence": 90 }
  },
  "diagnosis_codes": [
    { "code": "M17.11", "description": "Primary osteoarthritis, right knee", "confidence": 90 }
  ],
  "line_items": [
    {
      "cpt_code": { "value": "73721", "confidence": 95 },
      "description": { "value": "MRI knee w/o contrast", "confidence": 90 },
      "date": { "value": "MM/DD/YYYY", "confidence": 85 },
      "quantity": { "value": 1, "confidence": 95 },
      "charge": { "value": 1234.56, "confidence": 95 }
    }
  ],
  "document_type": "medical_bill",
  "form_type": "UB04" | "HCFA_1500" | "INVOICE" | "STATEMENT",
  "extraction_notes": "Any relevant notes about data quality or missing fields"
}

Rules:
- Confidence is 0-100 based on how clearly visible/readable the value is
- If a field is not found, omit it or set value to null with confidence 0
- For charges/amounts, extract as numbers (not strings)
- Include ALL line items found on the bill
- Include ALL diagnosis codes found
- If multiple pages, this may be one page of a multi-page document`;

// Convert PDF buffer to PNG images using pdf-lib and sharp
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Dynamic imports
    const { PDFDocument } = await import('pdf-lib');
    const sharp = (await import('sharp')).default;
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`[Extract] PDF has ${pageCount} pages`);
    
    // For each page, we need to render it to an image
    // pdf-lib doesn't render directly, so we'll use a different approach
    // We'll use pdf2pic or puppeteer
    
    // Fallback: Try to extract text and create a simple representation
    // For now, let's try using the file directly as base64 if it's small
    // and see if we can use Textract or another service
    
  } catch (error) {
    console.error('[Extract] PDF conversion error:', error);
  }
  
  return images;
}

// Use Puppeteer to render PDF pages to images
async function renderPdfWithPuppeteer(pdfBuffer: Buffer): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // We'll create a data URL and render it
    const base64 = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    // For server-side, we need a different approach
    // Let's use pdf-to-png-converter or similar
    const { fromBuffer } = await import('pdf2pic');
    
    const options = {
      density: 150,
      saveFilename: "page",
      savePath: "/tmp",
      format: "png",
      width: 1200,
      height: 1600
    };
    
    const convert = fromBuffer(pdfBuffer, options);
    const pageCount = 1; // We'll process first page for now
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        const result = await convert(i, { responseType: "base64" });
        if (result.base64) {
          images.push(result.base64);
        }
      } catch (pageError) {
        console.error(`[Extract] Error converting page ${i}:`, pageError);
      }
    }
  } catch (error) {
    console.error('[Extract] Puppeteer render error:', error);
  }
  
  return images;
}

// Main extraction function
async function extractFromImage(imageBase64: string, mimeType: string = 'image/png'): Promise<any> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: 'Extract all data from this medical bill. Return valid JSON only.',
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.1,
  });
  
  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

// Handle image files directly
async function processImageFile(buffer: Buffer, mimeType: string): Promise<any> {
  const base64 = buffer.toString('base64');
  return await extractFromImage(base64, mimeType);
}

// Handle PDF files - convert to images first
async function processPdfFile(buffer: Buffer): Promise<any> {
  // Try using pdf2pic first
  try {
    const { fromBuffer } = await import('pdf2pic');
    
    const options = {
      density: 200,
      format: "png",
      width: 1600,
      height: 2100
    };
    
    const convert = fromBuffer(buffer, options);
    const result = await convert(1, { responseType: "base64" });
    
    if (result.base64) {
      console.log('[Extract] Successfully converted PDF page to image');
      return await extractFromImage(result.base64, 'image/png');
    }
  } catch (pdf2picError) {
    console.log('[Extract] pdf2pic not available, trying alternative method');
  }
  
  // Alternative: Use sharp to convert PDF (requires graphicsmagick/imagemagick)
  try {
    const sharp = (await import('sharp')).default;
    const pngBuffer = await sharp(buffer, { density: 200 })
      .png()
      .toBuffer();
    
    const base64 = pngBuffer.toString('base64');
    return await extractFromImage(base64, 'image/png');
  } catch (sharpError) {
    console.log('[Extract] Sharp PDF conversion not available');
  }
  
  // Last resort: Send as-is and let GPT try (won't work but gives error feedback)
  throw new Error('PDF conversion failed - please upload as JPEG or PNG image instead');
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured', code: 'NO_API_KEY' },
        { status: 500 }
      );
    }
    
    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded', code: 'NO_FILE' },
        { status: 400 }
      );
    }
    
    // Check file type
    const mimeType = file.type.toLowerCase();
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Supported: JPEG, PNG, GIF, WebP, PDF`, code: 'UNSUPPORTED_TYPE' },
        { status: 400 }
      );
    }
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[Extract] Processing ${file.name} (${mimeType}, ${buffer.length} bytes)`);
    
    let extractedData: any;
    
    // Process based on file type
    if (mimeType === 'application/pdf') {
      extractedData = await processPdfFile(buffer);
    } else {
      extractedData = await processImageFile(buffer, mimeType);
    }
    
    // Add metadata
    extractedData._meta = {
      filename: file.name,
      fileType: mimeType,
      fileSize: buffer.length,
      extractedAt: new Date().toISOString(),
      model: 'gpt-4o',
    };
    
    return NextResponse.json({
      success: true,
      data: extractedData,
    });
    
  } catch (error: any) {
    console.error('[Extract] Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Extraction failed',
        code: 'EXTRACTION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    notes: 'For best results with PDFs, consider uploading as high-resolution JPEG/PNG images',
  });
}
