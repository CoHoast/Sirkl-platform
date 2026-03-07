import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { extractBill } from '@/lib/extraction/extraction-service';
import { calculateBillFairPrice } from '@/lib/extraction/medicare-rates';

// POST - Trigger extraction for a bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bill_id, client_id, file_content, filename, mime_type } = body;

    if (!bill_id) {
      return NextResponse.json(
        { success: false, error: 'bill_id is required' },
        { status: 400 }
      );
    }

    // Get bill details
    const billResult = await pool.query(
      'SELECT * FROM bills WHERE id = $1',
      [bill_id]
    );

    if (billResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    const bill = billResult.rows[0];

    // Update bill status to analyzing
    await pool.query(
      `UPDATE bills SET status = 'analyzing', analyzed_at = NOW() WHERE id = $1`,
      [bill_id]
    );

    // Run extraction
    const extractionResult = await extractBill({
      billId: bill_id,
      clientId: client_id || bill.client_id,
      fileContent: file_content || '',
      filename: filename || `bill_${bill_id}.pdf`,
      mimeType: mime_type || 'application/pdf'
    });

    if (!extractionResult.success || !extractionResult.extraction) {
      // Update bill status to failed
      await pool.query(
        `UPDATE bills SET status = 'failed', notes = $1 WHERE id = $2`,
        [extractionResult.error || 'Extraction failed', bill_id]
      );

      return NextResponse.json(
        { success: false, error: extractionResult.error || 'Extraction failed' },
        { status: 500 }
      );
    }

    const extraction = extractionResult.extraction;
    const fairPrice = extractionResult.fairPriceCalculation;

    // Store extraction result
    await pool.query(`
      INSERT INTO bill_extractions (
        bill_id, extraction_id, status, overall_confidence,
        extracted_data, fair_price_data, 
        fields_needing_review, processing_time_ms,
        ocr_provider, ai_provider, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (bill_id) DO UPDATE SET
        extraction_id = $2,
        status = $3,
        overall_confidence = $4,
        extracted_data = $5,
        fair_price_data = $6,
        fields_needing_review = $7,
        processing_time_ms = $8,
        ocr_provider = $9,
        ai_provider = $10,
        updated_at = NOW()
    `, [
      bill_id,
      extraction.id,
      extraction.status,
      extraction.overall_confidence,
      JSON.stringify(extraction),
      JSON.stringify(fairPrice),
      JSON.stringify(extraction.fields_needing_review),
      extraction.processing_time_ms,
      extraction.ocr_provider,
      extraction.ai_provider
    ]);

    // Update bill with extracted data
    const newStatus = extraction.status === 'review_needed' ? 'analyzing' : 'ready_to_negotiate';
    
    await pool.query(`
      UPDATE bills SET
        status = $1,
        member_name = COALESCE($2, member_name),
        member_id = COALESCE($3, member_id),
        provider_name = COALESCE($4, provider_name),
        provider_npi = COALESCE($5, provider_npi),
        total_billed = COALESCE($6, total_billed),
        medicare_rate = $7,
        fair_price = $8,
        line_items = COALESCE($9, line_items),
        date_of_service = COALESCE($10, date_of_service),
        updated_at = NOW()
      WHERE id = $11
    `, [
      newStatus,
      extraction.member.name.value,
      extraction.member.id.value,
      extraction.provider.name.value,
      extraction.provider.npi.value,
      extraction.billing.total_billed.value,
      fairPrice?.total_medicare || null,
      fairPrice?.total_fair_price || null,
      JSON.stringify(extraction.line_items.map(li => ({
        cpt_code: li.cpt_code.value,
        description: li.description.value,
        quantity: li.quantity.value,
        charge: li.charge.value
      }))),
      extraction.billing.date_of_service.value,
      bill_id
    ]);

    return NextResponse.json({
      success: true,
      extraction: {
        id: extraction.id,
        status: extraction.status,
        overall_confidence: extraction.overall_confidence,
        fields_needing_review: extraction.fields_needing_review,
        processing_time_ms: extraction.processing_time_ms
      },
      fair_price: fairPrice,
      bill_status: newStatus
    });

  } catch (error) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { success: false, error: 'Extraction failed' },
      { status: 500 }
    );
  }
}

// GET - Get extraction results for a bill
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');

    if (!billId) {
      return NextResponse.json(
        { success: false, error: 'billId is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      SELECT * FROM bill_extractions WHERE bill_id = $1
    `, [billId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No extraction found for this bill' },
        { status: 404 }
      );
    }

    const extraction = result.rows[0];

    return NextResponse.json({
      success: true,
      extraction: {
        ...extraction,
        extracted_data: extraction.extracted_data,
        fair_price_data: extraction.fair_price_data
      }
    });

  } catch (error) {
    console.error('Get extraction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get extraction' },
      { status: 500 }
    );
  }
}
