/**
 * Create Bill Images from HTML Templates
 * Run with: npx tsx scripts/create-bill-images.ts
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const bills = [
  {
    id: 1,
    provider: {
      name: "Mountain View Orthopedic Associates",
      npi: "1234567890",
      taxId: "84-1234567",
      address: "1250 Medical Center Dr, Suite 300, Denver, CO 80202",
      phone: "(303) 555-0142",
      fax: "(303) 555-0143",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "John Smith", memberId: "SHN-2024-001234", dob: "05/15/1975", accountNumber: "ACC-78901" },
    serviceDate: "02/15/2026",
    lineItems: [
      { cpt: "29881", description: "Arthroscopy, knee, surgical; with meniscectomy", charge: 8500.00 },
      { cpt: "29876", description: "Arthroscopy, knee, synovectomy, major", charge: 4000.00 }
    ],
    diagnosis: [{ code: "M23.21", description: "Derangement of anterior horn of medial meniscus" }],
    totalBilled: 12500.00
  },
  {
    id: 2,
    provider: {
      name: "Rocky Mountain Cardiology Center",
      npi: "2345678901",
      taxId: "84-2345678",
      address: "5600 Heart Way, Suite 100, Boulder, CO 80301",
      phone: "(720) 555-0234",
      fax: "(720) 555-0235",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Sarah Johnson", memberId: "SHN-2024-002345", dob: "08/22/1968", accountNumber: "ACC-89012" },
    serviceDate: "02/18/2026",
    lineItems: [
      { cpt: "93015", description: "Cardiovascular stress test", charge: 1800.00 },
      { cpt: "93306", description: "Echocardiography, complete", charge: 2400.00 }
    ],
    diagnosis: [{ code: "I25.10", description: "Atherosclerotic heart disease" }],
    totalBilled: 4200.00
  },
  {
    id: 3,
    provider: {
      name: "Advanced Imaging Center of Colorado",
      npi: "3456789012",
      taxId: "84-3456789",
      address: "890 Radiology Blvd, Aurora, CO 80012",
      phone: "(303) 555-0345",
      fax: "(303) 555-0346",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Michael Williams", memberId: "SHN-2024-003456", dob: "11/30/1982", accountNumber: "ACC-90123" },
    serviceDate: "02/20/2026",
    lineItems: [
      { cpt: "72148", description: "MRI lumbar spine without contrast", charge: 2800.00 },
      { cpt: "72149", description: "MRI lumbar spine with contrast", charge: 1000.00 }
    ],
    diagnosis: [{ code: "M54.5", description: "Low back pain" }],
    totalBilled: 3800.00
  },
  {
    id: 4,
    provider: {
      name: "Colorado Surgical Partners",
      npi: "4567890123",
      taxId: "84-4567890",
      address: "2100 Surgery Lane, Lakewood, CO 80228",
      phone: "(720) 555-0456",
      fax: "(720) 555-0457",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Emily Davis", memberId: "SHN-2024-004567", dob: "03/08/1990", accountNumber: "ACC-01234" },
    serviceDate: "02/22/2026",
    lineItems: [
      { cpt: "47562", description: "Laparoscopic cholecystectomy", charge: 18000.00 },
      { cpt: "49320", description: "Laparoscopy, abdomen, surgical", charge: 6000.00 },
      { cpt: "47563", description: "Lap cholecystectomy with cholangiography", charge: 4000.00 }
    ],
    diagnosis: [{ code: "K80.00", description: "Calculus of gallbladder with acute cholecystitis" }],
    totalBilled: 28000.00
  },
  {
    id: 5,
    provider: {
      name: "Denver Emergency Physicians",
      npi: "5678901234",
      taxId: "84-5678901",
      address: "4500 Emergency Dr, Denver, CO 80205",
      phone: "(303) 555-0567",
      fax: "(303) 555-0568",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Robert Brown", memberId: "SHN-2024-005678", dob: "07/14/1955", accountNumber: "ACC-12345" },
    serviceDate: "02/25/2026",
    lineItems: [
      { cpt: "99284", description: "Emergency dept visit, level 4", charge: 1500.00 },
      { cpt: "71046", description: "Radiologic examination, chest, 2 views", charge: 350.00 },
      { cpt: "36415", description: "Venipuncture", charge: 50.00 },
      { cpt: "85025", description: "Complete blood count", charge: 200.00 }
    ],
    diagnosis: [{ code: "J18.9", description: "Pneumonia, unspecified organism" }],
    totalBilled: 2100.00
  },
  {
    id: 6,
    provider: {
      name: "Peak Anesthesia Services",
      npi: "6789012345",
      taxId: "84-6789012",
      address: "3200 Anesthesia Way, Colorado Springs, CO 80907",
      phone: "(719) 555-0678",
      fax: "(719) 555-0679",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Jennifer Martinez", memberId: "SHN-2024-006789", dob: "12/03/1978", accountNumber: "ACC-23456" },
    serviceDate: "02/22/2026",
    lineItems: [
      { cpt: "00740", description: "Anesthesia for upper GI procedures", charge: 3500.00 },
      { cpt: "99100", description: "Anesthesia for patient of extreme age", charge: 500.00 },
      { cpt: "01996", description: "Daily hospital management", charge: 1500.00 }
    ],
    diagnosis: [{ code: "K80.00", description: "Calculus of gallbladder with acute cholecystitis" }],
    totalBilled: 5500.00
  },
  {
    id: 7,
    provider: {
      name: "Colorado Physical Therapy",
      npi: "7890123456",
      taxId: "84-7890123",
      address: "750 Rehab Center Pkwy, Fort Collins, CO 80525",
      phone: "(970) 555-0789",
      fax: "(970) 555-0790",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "David Lee", memberId: "SHN-2024-007890", dob: "04/25/1985", accountNumber: "ACC-34567" },
    serviceDate: "02/01/2026",
    lineItems: [
      { cpt: "97161", description: "PT evaluation, low complexity", charge: 250.00 },
      { cpt: "97110", description: "Therapeutic exercises, 6 units", charge: 900.00 },
      { cpt: "97140", description: "Manual therapy, 4 units", charge: 650.00 }
    ],
    diagnosis: [{ code: "M23.21", description: "Derangement of meniscus" }],
    totalBilled: 1800.00
  },
  {
    id: 8,
    provider: {
      name: "Skin Health Dermatology",
      npi: "8901234567",
      taxId: "84-8901234",
      address: "1100 Skin Care Lane, Pueblo, CO 81004",
      phone: "(719) 555-0890",
      fax: "(719) 555-0891",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Amanda Wilson", memberId: "SHN-2024-008901", dob: "09/17/1992", accountNumber: "ACC-45678" },
    serviceDate: "03/01/2026",
    lineItems: [
      { cpt: "11102", description: "Tangential biopsy of skin", charge: 350.00 },
      { cpt: "11602", description: "Excision, malignant lesion", charge: 600.00 }
    ],
    diagnosis: [{ code: "D22.9", description: "Melanocytic nevi, unspecified" }],
    totalBilled: 950.00
  },
  {
    id: 9,
    provider: {
      name: "Digestive Health Associates",
      npi: "9012345678",
      taxId: "84-9012345",
      address: "2400 GI Center Way, Greeley, CO 80634",
      phone: "(970) 555-0901",
      fax: "(970) 555-0902",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Christopher Taylor", memberId: "SHN-2024-009012", dob: "06/28/1960", accountNumber: "ACC-56789" },
    serviceDate: "03/03/2026",
    lineItems: [
      { cpt: "45378", description: "Colonoscopy, diagnostic", charge: 3200.00 },
      { cpt: "45380", description: "Colonoscopy with biopsy", charge: 1800.00 },
      { cpt: "45385", description: "Colonoscopy with polypectomy", charge: 1200.00 }
    ],
    diagnosis: [{ code: "K63.5", description: "Polyp of colon" }],
    totalBilled: 6200.00
  },
  {
    id: 10,
    provider: {
      name: "Neurology Specialists",
      npi: "0123456789",
      taxId: "84-0123456",
      address: "800 Brain Center Dr, Longmont, CO 80501",
      phone: "(303) 555-0012",
      fax: "(303) 555-0013",
      email: "cguiher17@gmail.com"
    },
    patient: { name: "Patricia Anderson", memberId: "SHN-2024-010123", dob: "02/10/1972", accountNumber: "ACC-67890" },
    serviceDate: "03/05/2026",
    lineItems: [
      { cpt: "95886", description: "Needle EMG, 2 extremities", charge: 1600.00 },
      { cpt: "95910", description: "Nerve conduction studies", charge: 800.00 }
    ],
    diagnosis: [{ code: "G56.00", description: "Carpal tunnel syndrome" }],
    totalBilled: 2400.00
  }
];

function generateBillHtml(bill: typeof bills[0]): string {
  const lineItemsHtml = bill.lineItems.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${item.cpt}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">$${item.charge.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: white; color: #333; }
    .header { border-bottom: 4px solid #1e40af; padding-bottom: 20px; margin-bottom: 25px; }
    .provider-name { font-size: 28px; color: #1e40af; font-weight: bold; margin-bottom: 5px; }
    .statement-title { font-size: 16px; color: #666; text-transform: uppercase; letter-spacing: 2px; }
    .contact-box { background: #f8fafc; padding: 15px; margin-top: 15px; border-radius: 8px; font-size: 13px; }
    .contact-row { margin: 4px 0; }
    .contact-label { color: #1e40af; font-weight: bold; }
    .grid { display: flex; gap: 30px; margin: 25px 0; }
    .info-box { flex: 1; background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; }
    .box-title { font-size: 12px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: bold; }
    .info-row { margin: 8px 0; font-size: 14px; }
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
    th:last-child { text-align: right; }
    .total-box { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
    .total-row.final { border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px; margin-top: 10px; }
    .total-amount { font-size: 32px; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="provider-name">${bill.provider.name}</div>
    <div class="statement-title">Patient Statement / Invoice</div>
    <div class="contact-box">
      <div class="contact-row">${bill.provider.address}</div>
      <div class="contact-row">
        <span class="contact-label">Phone:</span> ${bill.provider.phone} &nbsp;|&nbsp;
        <span class="contact-label">Fax:</span> ${bill.provider.fax}
      </div>
      <div class="contact-row">
        <span class="contact-label">Email:</span> ${bill.provider.email}
      </div>
      <div class="contact-row">
        <span class="contact-label">NPI:</span> ${bill.provider.npi} &nbsp;|&nbsp;
        <span class="contact-label">Tax ID:</span> ${bill.provider.taxId}
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="info-box">
      <div class="box-title">Patient Information</div>
      <div class="info-row"><span class="info-label">Name:</span> <span class="info-value">${bill.patient.name}</span></div>
      <div class="info-row"><span class="info-label">Member ID:</span> <span class="info-value">${bill.patient.memberId}</span></div>
      <div class="info-row"><span class="info-label">DOB:</span> <span class="info-value">${bill.patient.dob}</span></div>
      <div class="info-row"><span class="info-label">Account:</span> <span class="info-value">${bill.patient.accountNumber}</span></div>
    </div>
    <div class="info-box">
      <div class="box-title">Service Details</div>
      <div class="info-row"><span class="info-label">Date of Service:</span> <span class="info-value">${bill.serviceDate}</span></div>
      <div class="info-row"><span class="info-label">Statement Date:</span> <span class="info-value">${new Date().toLocaleDateString()}</span></div>
      <div class="info-row" style="margin-top: 12px;"><span class="info-label">Diagnosis:</span></div>
      <div class="info-row"><span class="info-value">${bill.diagnosis[0].code} - ${bill.diagnosis[0].description}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">CPT Code</th>
        <th style="width: 65%;">Description</th>
        <th style="width: 20%;">Charge</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>$${bill.totalBilled.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
    </div>
    <div class="total-row">
      <span>Insurance Adjustments:</span>
      <span>$0.00</span>
    </div>
    <div class="total-row">
      <span>Payments Received:</span>
      <span>$0.00</span>
    </div>
    <div class="total-row final">
      <span>AMOUNT DUE:</span>
      <span class="total-amount">$${bill.totalBilled.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
    </div>
  </div>

  <div class="footer">
    <strong>Payment Terms:</strong> Payment due within 30 days. For questions, contact ${bill.provider.email} or ${bill.provider.phone}.<br>
    <em>This statement is for services rendered by ${bill.provider.name}. Remit payment to the address above.</em>
  </div>
</body>
</html>
`;
}

async function main() {
  const outputDir = path.join(process.cwd(), 'test-bills');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for consistent sizing
  await page.setViewport({ width: 850, height: 1100 });
  
  console.log(`Generating ${bills.length} test bills...\n`);
  
  for (const bill of bills) {
    const html = generateBillHtml(bill);
    const filename = `bill-${String(bill.id).padStart(2, '0')}-${bill.provider.name.split(' ').slice(0, 2).join('-').toLowerCase()}.png`;
    const filepath = path.join(outputDir, filename);
    
    // Load HTML
    await page.setContent(html, { waitUntil: 'load', timeout: 5000 });
    
    // Screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png'
    });
    
    console.log(`✓ ${filename} - $${bill.totalBilled.toLocaleString()}`);
  }
  
  await browser.close();
  
  console.log(`\n✅ Generated ${bills.length} bills in ${outputDir}`);
  console.log(`Total billed: $${bills.reduce((sum, b) => sum + b.totalBilled, 0).toLocaleString()}`);
}

main().catch(console.error);
