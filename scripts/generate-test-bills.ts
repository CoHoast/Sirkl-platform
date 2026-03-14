/**
 * Generate Test Medical Bills for E2E Testing
 * Creates realistic-looking medical bill images
 */

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
    patient: {
      name: "John Smith",
      memberId: "SHN-2024-001234",
      dob: "05/15/1975",
      accountNumber: "ACC-78901"
    },
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
    patient: {
      name: "Sarah Johnson",
      memberId: "SHN-2024-002345",
      dob: "08/22/1968",
      accountNumber: "ACC-89012"
    },
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
    patient: {
      name: "Michael Williams",
      memberId: "SHN-2024-003456",
      dob: "11/30/1982",
      accountNumber: "ACC-90123"
    },
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
    patient: {
      name: "Emily Davis",
      memberId: "SHN-2024-004567",
      dob: "03/08/1990",
      accountNumber: "ACC-01234"
    },
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
    patient: {
      name: "Robert Brown",
      memberId: "SHN-2024-005678",
      dob: "07/14/1955",
      accountNumber: "ACC-12345"
    },
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
    patient: {
      name: "Jennifer Martinez",
      memberId: "SHN-2024-006789",
      dob: "12/03/1978",
      accountNumber: "ACC-23456"
    },
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
      name: "Colorado Physical Therapy & Rehab",
      npi: "7890123456",
      taxId: "84-7890123",
      address: "750 Rehab Center Pkwy, Fort Collins, CO 80525",
      phone: "(970) 555-0789",
      fax: "(970) 555-0790",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "David Lee",
      memberId: "SHN-2024-007890",
      dob: "04/25/1985",
      accountNumber: "ACC-34567"
    },
    serviceDate: "02/01/2026",
    lineItems: [
      { cpt: "97161", description: "Physical therapy evaluation, low complexity", charge: 250.00 },
      { cpt: "97110", description: "Therapeutic exercises, 15 min", charge: 150.00, units: 6 },
      { cpt: "97140", description: "Manual therapy, 15 min", charge: 175.00, units: 4 }
    ],
    diagnosis: [{ code: "M23.21", description: "Derangement of anterior horn of medial meniscus" }],
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
    patient: {
      name: "Amanda Wilson",
      memberId: "SHN-2024-008901",
      dob: "09/17/1992",
      accountNumber: "ACC-45678"
    },
    serviceDate: "03/01/2026",
    lineItems: [
      { cpt: "11102", description: "Tangential biopsy of skin", charge: 350.00 },
      { cpt: "11602", description: "Excision, malignant lesion, 1.1-2.0 cm", charge: 600.00 }
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
    patient: {
      name: "Christopher Taylor",
      memberId: "SHN-2024-009012",
      dob: "06/28/1960",
      accountNumber: "ACC-56789"
    },
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
      name: "Neurology Specialists of the Rockies",
      npi: "0123456789",
      taxId: "84-0123456",
      address: "800 Brain Center Dr, Longmont, CO 80501",
      phone: "(303) 555-0012",
      fax: "(303) 555-0013",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "Patricia Anderson",
      memberId: "SHN-2024-010123",
      dob: "02/10/1972",
      accountNumber: "ACC-67890"
    },
    serviceDate: "03/05/2026",
    lineItems: [
      { cpt: "95886", description: "Needle EMG, each extremity", charge: 800.00, units: 2 },
      { cpt: "95910", description: "Nerve conduction, 7-8 studies", charge: 800.00 }
    ],
    diagnosis: [{ code: "G56.00", description: "Carpal tunnel syndrome, unspecified" }],
    totalBilled: 2400.00
  },
  {
    id: 11,
    provider: {
      name: "Colorado Cancer Care Center",
      npi: "1122334455",
      taxId: "84-1122334",
      address: "5000 Oncology Pkwy, Denver, CO 80220",
      phone: "(303) 555-1122",
      fax: "(303) 555-1123",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "Barbara Thomas",
      memberId: "SHN-2024-011234",
      dob: "10/05/1958",
      accountNumber: "ACC-78901"
    },
    serviceDate: "03/07/2026",
    lineItems: [
      { cpt: "96413", description: "Chemo IV infusion, first hour", charge: 8500.00 },
      { cpt: "96415", description: "Chemo IV infusion, each additional hour", charge: 3500.00, units: 2 },
      { cpt: "96360", description: "IV infusion, hydration, first hour", charge: 500.00 },
      { cpt: "J9035", description: "Injection, bevacizumab, 10mg", charge: 3000.00 }
    ],
    diagnosis: [{ code: "C50.911", description: "Malignant neoplasm of breast" }],
    totalBilled: 18500.00
  },
  {
    id: 12,
    provider: {
      name: "Vision Care Ophthalmology",
      npi: "2233445566",
      taxId: "84-2233445",
      address: "1500 Eye Care Blvd, Arvada, CO 80003",
      phone: "(720) 555-2233",
      fax: "(720) 555-2234",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "William Jackson",
      memberId: "SHN-2024-012345",
      dob: "01/18/1950",
      accountNumber: "ACC-89012"
    },
    serviceDate: "03/10/2026",
    lineItems: [
      { cpt: "66984", description: "Cataract surgery with IOL", charge: 6500.00 },
      { cpt: "66982", description: "Complex cataract surgery", charge: 2400.00 }
    ],
    diagnosis: [{ code: "H25.11", description: "Age-related nuclear cataract, right eye" }],
    totalBilled: 8900.00
  },
  {
    id: 13,
    provider: {
      name: "Pain Relief Interventional Center",
      npi: "3344556677",
      taxId: "84-3344556",
      address: "2200 Pain Management Way, Westminster, CO 80031",
      phone: "(303) 555-3344",
      fax: "(303) 555-3345",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "Mary White",
      memberId: "SHN-2024-013456",
      dob: "05/30/1965",
      accountNumber: "ACC-90123"
    },
    serviceDate: "03/12/2026",
    lineItems: [
      { cpt: "62323", description: "Lumbar epidural injection", charge: 2800.00 },
      { cpt: "77003", description: "Fluoroscopic guidance", charge: 850.00 },
      { cpt: "J1030", description: "Injection, methylprednisolone, 40mg", charge: 450.00 }
    ],
    diagnosis: [{ code: "M54.5", description: "Low back pain" }],
    totalBilled: 4100.00
  },
  {
    id: 14,
    provider: {
      name: "Rocky Mountain Urology",
      npi: "4455667788",
      taxId: "84-4455667",
      address: "3300 Urology Center Dr, Thornton, CO 80229",
      phone: "(720) 555-4455",
      fax: "(720) 555-4456",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "James Harris",
      memberId: "SHN-2024-014567",
      dob: "08/12/1962",
      accountNumber: "ACC-01234"
    },
    serviceDate: "03/14/2026",
    lineItems: [
      { cpt: "52000", description: "Cystoscopy", charge: 2200.00 },
      { cpt: "52204", description: "Cystoscopy with biopsy", charge: 1000.00 }
    ],
    diagnosis: [{ code: "N40.1", description: "Benign prostatic hyperplasia with LUTS" }],
    totalBilled: 3200.00
  },
  {
    id: 15,
    provider: {
      name: "Pulmonary & Sleep Medicine Associates",
      npi: "5566778899",
      taxId: "84-5566778",
      address: "4100 Lung Care Pkwy, Broomfield, CO 80020",
      phone: "(720) 555-5566",
      fax: "(720) 555-5567",
      email: "cguiher17@gmail.com"
    },
    patient: {
      name: "Linda Clark",
      memberId: "SHN-2024-015678",
      dob: "04/02/1970",
      accountNumber: "ACC-12345"
    },
    serviceDate: "03/16/2026",
    lineItems: [
      { cpt: "94010", description: "Spirometry", charge: 350.00 },
      { cpt: "94060", description: "Bronchodilator response", charge: 400.00 },
      { cpt: "94729", description: "Diffusing capacity", charge: 350.00 }
    ],
    diagnosis: [{ code: "J44.9", description: "COPD, unspecified" }],
    totalBilled: 1100.00
  }
];

// Generate HTML for a bill
function generateBillHtml(bill: typeof bills[0]): string {
  const lineItemsHtml = bill.lineItems.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.cpt}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(item as any).units || 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.charge.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
    </tr>
  `).join('');

  const diagnosisHtml = bill.diagnosis.map(d => 
    `<div style="margin: 2px 0;">${d.code} - ${d.description}</div>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.4; }
    .header { border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 20px; }
    .provider-name { font-size: 24px; color: #003366; font-weight: bold; }
    .statement-title { font-size: 18px; color: #666; margin-top: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; }
    .info-section { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .section-title { font-weight: bold; color: #003366; margin-bottom: 10px; font-size: 14px; }
    .info-row { margin: 5px 0; font-size: 13px; }
    .label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #003366; color: white; padding: 10px; text-align: left; }
    .total-section { background: #f5f5f5; padding: 15px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .total-amount { font-size: 24px; font-weight: bold; color: #003366; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
    .contact-info { margin-top: 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="provider-name">${bill.provider.name}</div>
    <div class="statement-title">PATIENT STATEMENT</div>
    <div class="contact-info">
      ${bill.provider.address}<br>
      Phone: ${bill.provider.phone} | Fax: ${bill.provider.fax}<br>
      Email: ${bill.provider.email}<br>
      NPI: ${bill.provider.npi} | Tax ID: ${bill.provider.taxId}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <div class="section-title">PATIENT INFORMATION</div>
      <div class="info-row"><span class="label">Patient Name:</span> ${bill.patient.name}</div>
      <div class="info-row"><span class="label">Member ID:</span> ${bill.patient.memberId}</div>
      <div class="info-row"><span class="label">Date of Birth:</span> ${bill.patient.dob}</div>
      <div class="info-row"><span class="label">Account #:</span> ${bill.patient.accountNumber}</div>
    </div>
    <div class="info-section">
      <div class="section-title">SERVICE INFORMATION</div>
      <div class="info-row"><span class="label">Date of Service:</span> ${bill.serviceDate}</div>
      <div class="info-row"><span class="label">Statement Date:</span> ${new Date().toLocaleDateString()}</div>
      <div class="section-title" style="margin-top: 10px;">DIAGNOSIS</div>
      ${diagnosisHtml}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">CPT Code</th>
        <th style="width: 55%;">Description</th>
        <th style="width: 10%; text-align: center;">Units</th>
        <th style="width: 20%; text-align: right;">Charge</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <div class="total-section">
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
    <div class="total-row" style="border-top: 2px solid #003366; padding-top: 10px; margin-top: 10px;">
      <span style="font-weight: bold; font-size: 18px;">AMOUNT DUE:</span>
      <span class="total-amount">$${bill.totalBilled.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
    </div>
  </div>

  <div class="footer">
    <strong>Payment Terms:</strong> Payment is due within 30 days of statement date.<br>
    For billing questions, please contact our billing department at ${bill.provider.email} or call ${bill.provider.phone}.<br><br>
    <em>This is a request for payment from ${bill.provider.name}. Please remit payment to the address above.</em>
  </div>
</body>
</html>
`;
}

// Export bills data for use in other scripts
export { bills, generateBillHtml };

// Log summary
console.log('Generated bill data for', bills.length, 'test bills');
console.log('Total billed amount:', bills.reduce((sum, b) => sum + b.totalBilled, 0).toLocaleString('en-US', {style: 'currency', currency: 'USD'}));
