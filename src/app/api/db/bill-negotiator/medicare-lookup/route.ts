import { NextRequest, NextResponse } from 'next/server';
import { getMedicareRate, calculateFairPrice, lookupMedicareRates, calculateBillFairPrice } from '@/lib/extraction/medicare-rates';

// GET - Look up Medicare rates for CPT codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cptCode = searchParams.get('cptCode');
    const cptCodes = searchParams.get('cptCodes'); // comma-separated

    if (!cptCode && !cptCodes) {
      return NextResponse.json(
        { success: false, error: 'cptCode or cptCodes parameter required' },
        { status: 400 }
      );
    }

    if (cptCode) {
      // Single code lookup
      const rate = await getMedicareRate(cptCode);
      
      if (!rate) {
        return NextResponse.json({
          success: true,
          found: false,
          cpt_code: cptCode,
          message: 'Medicare rate not found for this CPT code'
        });
      }

      return NextResponse.json({
        success: true,
        found: true,
        rate
      });
    }

    if (cptCodes) {
      // Multiple codes lookup
      const codes = cptCodes.split(',').map(c => c.trim());
      const rates = await lookupMedicareRates(codes);

      return NextResponse.json({
        success: true,
        rates,
        found_count: Object.values(rates).filter(r => r !== null).length,
        total_count: codes.length
      });
    }

  } catch (error) {
    console.error('Medicare lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to lookup Medicare rates' },
      { status: 500 }
    );
  }
}

// POST - Calculate fair price for a bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpt_code, billed_amount, is_facility, line_items } = body;

    // Single CPT code calculation
    if (cpt_code && billed_amount !== undefined) {
      const calculation = await calculateFairPrice(
        cpt_code,
        billed_amount,
        is_facility !== false
      );

      if (!calculation) {
        return NextResponse.json({
          success: true,
          found: false,
          message: 'Could not calculate fair price - Medicare rate not found'
        });
      }

      return NextResponse.json({
        success: true,
        calculation
      });
    }

    // Full bill calculation with multiple line items
    if (line_items && Array.isArray(line_items)) {
      const result = await calculateBillFairPrice(
        line_items,
        is_facility !== false
      );

      return NextResponse.json({
        success: true,
        ...result
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either cpt_code+billed_amount or line_items required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Fair price calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate fair price' },
      { status: 500 }
    );
  }
}
