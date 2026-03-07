// Phase 2C: Preview Offer Letter API

import { NextRequest, NextResponse } from 'next/server';
import { buildLetterData } from '@/lib/communication/service';
import { generateOfferLetterHTML, getTemplate } from '@/lib/communication/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId, negotiationId, offerAmount, templateId, letterType } = body;
    
    if (!billId || !offerAmount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: billId, offerAmount'
      }, { status: 400 });
    }
    
    // Build letter data
    const letterData = await buildLetterData(
      billId,
      negotiationId || 0,
      offerAmount,
      0 // Client ID will be fetched from bill
    );
    
    // Get template
    const template = templateId ? getTemplate(templateId) : getTemplate(letterType || 'initial_offer');
    
    // Generate HTML preview
    const htmlContent = generateOfferLetterHTML(letterData, template);
    
    return NextResponse.json({
      success: true,
      html: htmlContent,
      letterData
    });
    
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
