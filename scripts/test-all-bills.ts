/**
 * Test all bills through extraction + fair price calculation
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_BASE = 'https://sirkl-platform-production.up.railway.app';

interface ExtractionResult {
  filename: string;
  success: boolean;
  provider?: string;
  email?: string;
  totalBilled?: number;
  fairPrice?: number;
  maxAcceptable?: number;
  potentialSavings?: number;
  savingsPercent?: number;
  error?: string;
}

async function extractBill(filepath: string): Promise<any> {
  const fileBuffer = fs.readFileSync(filepath);
  const filename = path.basename(filepath);
  
  // Create form data
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename,
    contentType: 'image/png',
  });

  const response = await fetch(`${API_BASE}/api/bill-negotiator/extract`, {
    method: 'POST',
    body: formData as any,
    headers: formData.getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Extraction failed: ${response.status}`);
  }

  return response.json();
}

async function calculateFairPrice(lineItems: any[]): Promise<any> {
  const formatted = lineItems.map(item => ({
    cptCode: item.cpt_code?.value || item.cptCode,
    description: item.description?.value || item.description || '',
    units: item.quantity?.value || item.units || 1,
    billedAmount: item.charge?.value || item.billedAmount || 0,
  }));

  const response = await fetch(`${API_BASE}/api/bill-negotiator/calculate-fair-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineItems: formatted, state: 'CO' }),
  });

  if (!response.ok) {
    throw new Error(`Calculation failed: ${response.status}`);
  }

  return response.json();
}

async function testBill(filepath: string): Promise<ExtractionResult> {
  const filename = path.basename(filepath);
  
  try {
    // Extract
    console.log(`\n📄 Processing ${filename}...`);
    const extraction = await extractBill(filepath);
    
    if (!extraction.success) {
      throw new Error('Extraction returned success=false');
    }

    const data = extraction.data;
    const provider = data.provider?.name?.value || 'Unknown';
    const email = data.provider?.email?.value || 'Not found';
    const totalBilled = data.billing?.total_billed?.value || 0;
    const lineItems = data.line_items || [];

    console.log(`   Provider: ${provider}`);
    console.log(`   Email: ${email}`);
    console.log(`   Billed: $${totalBilled.toLocaleString()}`);

    // Calculate fair price
    if (lineItems.length > 0) {
      const pricing = await calculateFairPrice(lineItems);
      const summary = pricing.summary;

      console.log(`   Fair Price: $${summary.totalFairPrice.toLocaleString()}`);
      console.log(`   Savings: $${summary.totalPotentialSavings.toLocaleString()} (${summary.potentialSavingsPercent.toFixed(0)}%)`);

      return {
        filename,
        success: true,
        provider,
        email,
        totalBilled,
        fairPrice: summary.totalFairPrice,
        maxAcceptable: summary.totalMaxAcceptable,
        potentialSavings: summary.totalPotentialSavings,
        savingsPercent: summary.potentialSavingsPercent,
      };
    } else {
      return {
        filename,
        success: true,
        provider,
        email,
        totalBilled,
        error: 'No line items found',
      };
    }

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      filename,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  const billsDir = path.join(process.cwd(), 'test-bills');
  const files = fs.readdirSync(billsDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  console.log(`\n🏥 SIRKL Bill Negotiator - E2E Test`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Testing ${files.length} bills against production API\n`);

  const results: ExtractionResult[] = [];

  for (const file of files) {
    const result = await testBill(path.join(billsDir, file));
    results.push(result);
  }

  // Summary
  console.log(`\n\n═══════════════════════════════════════`);
  console.log(`📊 SUMMARY`);
  console.log(`═══════════════════════════════════════\n`);

  const successful = results.filter(r => r.success && r.fairPrice);
  const totalBilled = successful.reduce((sum, r) => sum + (r.totalBilled || 0), 0);
  const totalFairPrice = successful.reduce((sum, r) => sum + (r.fairPrice || 0), 0);
  const totalSavings = successful.reduce((sum, r) => sum + (r.potentialSavings || 0), 0);

  console.log(`Bills Processed:  ${results.length}`);
  console.log(`Successful:       ${successful.length}`);
  console.log(`Failed:           ${results.length - successful.length}`);
  console.log(`\n💰 FINANCIALS:`);
  console.log(`Total Billed:     $${totalBilled.toLocaleString()}`);
  console.log(`Total Fair Price: $${totalFairPrice.toLocaleString()}`);
  console.log(`Total Savings:    $${totalSavings.toLocaleString()} (${((totalSavings/totalBilled)*100).toFixed(0)}%)`);

  console.log(`\n📋 DETAIL:\n`);
  console.log(`| Bill | Provider | Billed | Fair Price | Savings |`);
  console.log(`|------|----------|--------|------------|---------|`);
  
  for (const r of results) {
    if (r.success && r.fairPrice) {
      const providerShort = (r.provider || '').substring(0, 20);
      console.log(`| ${r.filename.slice(0,20)} | ${providerShort} | $${(r.totalBilled||0).toLocaleString()} | $${r.fairPrice.toLocaleString()} | ${r.savingsPercent?.toFixed(0)}% |`);
    }
  }

  // Write results to JSON
  fs.writeFileSync(
    path.join(process.cwd(), 'test-bills', 'results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log(`\n✅ Results saved to test-bills/results.json`);
}

main().catch(console.error);
