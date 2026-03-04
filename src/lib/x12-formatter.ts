/**
 * X12 837 EDI Formatter
 * Generates X12 837P (Professional) and 837I (Institutional) transaction sets
 */

interface X12Config {
  senderId: string;
  senderQualifier: string;
  receiverId: string;
  receiverQualifier: string;
  interchangeControlNumber: string;
  groupControlNumber: string;
  transactionControlNumber: string;
}

const DEFAULT_CONFIG: X12Config = {
  senderId: 'MCOADV         ',  // 15 chars padded
  senderQualifier: 'ZZ',
  receiverId: 'RECEIVER       ',
  receiverQualifier: 'ZZ',
  interchangeControlNumber: '000000001',
  groupControlNumber: '1',
  transactionControlNumber: '0001'
};

function formatDate(date?: string): string {
  if (!date) return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Handle various date formats
  const cleaned = date.replace(/[^0-9]/g, '');
  if (cleaned.length === 8) return cleaned;
  if (cleaned.length === 6) return '20' + cleaned; // Assume 20xx
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function formatTime(): string {
  return new Date().toISOString().slice(11, 16).replace(':', '');
}

function padRight(str: string, len: number): string {
  return (str || '').padEnd(len, ' ').slice(0, len);
}

function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  return isNaN(num) ? '0' : num.toFixed(2);
}

/**
 * Generate X12 837P (Professional Claim) from CMS-1500 data
 */
export function generateX12_837P(data: any, config: Partial<X12Config> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const segments: string[] = [];
  const now = new Date();
  const dateStr = formatDate();
  const timeStr = formatTime();

  // ISA - Interchange Control Header
  segments.push([
    'ISA',
    '00', '          ',  // Authorization Info Qualifier, Info
    '00', '          ',  // Security Info Qualifier, Info
    cfg.senderQualifier, padRight(cfg.senderId, 15),
    cfg.receiverQualifier, padRight(cfg.receiverId, 15),
    dateStr.slice(2),  // YYMMDD
    timeStr,
    '^',  // Repetition Separator
    '00501',  // Version
    cfg.interchangeControlNumber,
    '0',  // Ack Requested
    'P',  // Usage Indicator (P=Production, T=Test)
    ':'   // Component Separator
  ].join('*'));

  // GS - Functional Group Header
  segments.push([
    'GS',
    'HC',  // Health Care Claim
    cfg.senderId.trim(),
    cfg.receiverId.trim(),
    dateStr,
    timeStr,
    cfg.groupControlNumber,
    'X',
    '005010X222A1'  // 837P Implementation Guide
  ].join('*'));

  // ST - Transaction Set Header
  segments.push(['ST', '837', cfg.transactionControlNumber, '005010X222A1'].join('*'));

  // BHT - Beginning of Hierarchical Transaction
  const refId = data.claim?.patient_account_number || `MCO${Date.now()}`;
  segments.push(['BHT', '0019', '00', refId, dateStr, timeStr, 'CH'].join('*'));

  // 1000A - Submitter Name
  segments.push(['NM1', '41', '2', 'MCO ADVANTAGE', '', '', '', '', '46', cfg.senderId.trim()].join('*'));
  segments.push(['PER', 'IC', 'SUBMITTER', 'TE', '6145551234'].join('*'));

  // 1000B - Receiver Name
  const receiverName = data.insurance?.payer_name || 'INSURANCE COMPANY';
  segments.push(['NM1', '40', '2', receiverName, '', '', '', '', '46', cfg.receiverId.trim()].join('*'));

  // 2000A - Billing Provider Hierarchical Level
  segments.push(['HL', '1', '', '20', '1'].join('*'));
  segments.push(['PRV', 'BI', 'PXC', '207Q00000X'].join('*'));  // Billing provider taxonomy

  // 2010AA - Billing Provider Name
  const billingName = data.provider?.billing_name || 'BILLING PROVIDER';
  const billingNpi = data.provider?.billing_npi || '1234567890';
  segments.push(['NM1', '85', '2', billingName, '', '', '', '', 'XX', billingNpi].join('*'));
  
  const facilityAddr = data.provider?.facility_address || '123 MAIN ST';
  segments.push(['N3', facilityAddr].join('*'));
  segments.push(['N4', 'ANYTOWN', 'OH', '43215', 'US'].join('*'));
  
  const taxId = data.provider?.tax_id?.replace(/[^0-9]/g, '') || '123456789';
  segments.push(['REF', 'EI', taxId].join('*'));

  // 2000B - Subscriber Hierarchical Level
  segments.push(['HL', '2', '1', '22', '0'].join('*'));
  segments.push(['SBR', 'P', '18', data.insured?.group_number || '', '', '', '', '', '', 'CI'].join('*'));

  // 2010BA - Subscriber Name
  const patientName = data.patient?.name || 'PATIENT NAME';
  const nameParts = patientName.split(/[,\s]+/).filter(Boolean);
  const lastName = nameParts[0] || 'LASTNAME';
  const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'FIRSTNAME';
  const memberId = data.patient?.member_id || '123456789';
  segments.push(['NM1', 'IL', '1', lastName, firstName, '', '', '', 'MI', memberId].join('*'));
  
  const patientAddr = data.patient?.address || '456 PATIENT ST, CITY, ST 12345';
  segments.push(['N3', patientAddr.split(',')[0] || patientAddr].join('*'));
  
  const addrParts = patientAddr.split(',');
  const city = addrParts[1]?.trim() || 'CITY';
  const stateZip = addrParts[2]?.trim().split(' ') || ['OH', '43215'];
  segments.push(['N4', city, stateZip[0] || 'OH', stateZip[1] || '43215'].join('*'));
  
  const dob = formatDate(data.patient?.dob);
  const gender = data.patient?.gender === 'F' ? 'F' : 'M';
  segments.push(['DMG', 'D8', dob, gender].join('*'));

  // 2010BB - Payer Name
  segments.push(['NM1', 'PR', '2', receiverName, '', '', '', '', 'PI', 'PAYERID'].join('*'));

  // 2300 - Claim Information
  const totalCharges = formatCurrency(data.claim?.total_charges);
  segments.push(['CLM', refId, totalCharges, '', '', '11:B:1', 'Y', 'A', 'Y', 'Y'].join('*'));

  // Diagnoses
  const diagnoses = data.claim?.diagnoses || [{ code: 'Z00.00', pointer: 'A' }];
  const dxCodes = diagnoses.map((dx: any) => dx.code).join(':');
  segments.push(['HI', `ABK:${diagnoses[0]?.code || 'Z0000'}`, ...diagnoses.slice(1).map((dx: any) => `ABF:${dx.code}`)].join('*'));

  // 2400 - Service Lines
  const procedures = data.claim?.procedures || [];
  let lineNum = 1;
  for (const proc of procedures) {
    segments.push(['LX', lineNum.toString()].join('*'));
    
    const cpt = proc.cpt_code || '99213';
    const modifier = proc.modifier ? `:${proc.modifier}` : '';
    const charges = formatCurrency(proc.charges);
    const units = proc.units || 1;
    const dos = formatDate(proc.dos_from);
    
    segments.push(['SV1', `HC:${cpt}${modifier}`, charges, 'UN', units.toString(), '11', '', diagnoses[0]?.pointer || '1'].join('*'));
    segments.push(['DTP', '472', 'D8', dos].join('*'));
    
    lineNum++;
  }

  // If no procedures, add a placeholder
  if (procedures.length === 0) {
    segments.push(['LX', '1'].join('*'));
    segments.push(['SV1', 'HC:99213', totalCharges, 'UN', '1', '11', '', '1'].join('*'));
    segments.push(['DTP', '472', 'D8', dateStr].join('*'));
  }

  // SE - Transaction Set Trailer
  const segmentCount = segments.length - 2 + 1;  // Exclude ISA, GS, add SE
  segments.push(['SE', segmentCount.toString(), cfg.transactionControlNumber].join('*'));

  // GE - Functional Group Trailer
  segments.push(['GE', '1', cfg.groupControlNumber].join('*'));

  // IEA - Interchange Control Trailer
  segments.push(['IEA', '1', cfg.interchangeControlNumber].join('*'));

  return segments.map(s => s + '~').join('\n');
}

/**
 * Generate X12 837I (Institutional Claim) from UB-04 data
 */
export function generateX12_837I(data: any, config: Partial<X12Config> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const segments: string[] = [];
  const dateStr = formatDate();
  const timeStr = formatTime();

  // ISA - Interchange Control Header
  segments.push([
    'ISA',
    '00', '          ',
    '00', '          ',
    cfg.senderQualifier, padRight(cfg.senderId, 15),
    cfg.receiverQualifier, padRight(cfg.receiverId, 15),
    dateStr.slice(2),
    timeStr,
    '^',
    '00501',
    cfg.interchangeControlNumber,
    '0',
    'P',
    ':'
  ].join('*'));

  // GS - Functional Group Header
  segments.push([
    'GS',
    'HC',
    cfg.senderId.trim(),
    cfg.receiverId.trim(),
    dateStr,
    timeStr,
    cfg.groupControlNumber,
    'X',
    '005010X223A2'  // 837I Implementation Guide
  ].join('*'));

  // ST - Transaction Set Header
  segments.push(['ST', '837', cfg.transactionControlNumber, '005010X223A2'].join('*'));

  // BHT - Beginning of Hierarchical Transaction
  const patientControl = data.patient?.control_number || `MCO${Date.now()}`;
  segments.push(['BHT', '0019', '00', patientControl, dateStr, timeStr, 'CH'].join('*'));

  // 1000A - Submitter
  segments.push(['NM1', '41', '2', 'MCO ADVANTAGE', '', '', '', '', '46', cfg.senderId.trim()].join('*'));
  segments.push(['PER', 'IC', 'SUBMITTER', 'TE', '6145551234'].join('*'));

  // 1000B - Receiver
  const payerName = data.payers?.[0]?.name || 'INSURANCE PAYER';
  segments.push(['NM1', '40', '2', payerName, '', '', '', '', '46', cfg.receiverId.trim()].join('*'));

  // 2000A - Billing Provider Hierarchical Level
  segments.push(['HL', '1', '', '20', '1'].join('*'));

  // 2010AA - Billing Provider (Facility)
  const facilityName = data.facility?.name || 'HOSPITAL';
  const facilityNpi = data.facility?.npi || '1234567890';
  segments.push(['NM1', '85', '2', facilityName, '', '', '', '', 'XX', facilityNpi].join('*'));
  
  const facilityAddr = data.facility?.address?.split(',')[0] || '123 HOSPITAL DR';
  segments.push(['N3', facilityAddr].join('*'));
  segments.push(['N4', 'ANYTOWN', 'OH', '43215', 'US'].join('*'));
  
  const taxId = data.facility?.federal_tax_id?.replace(/[^0-9]/g, '') || '123456789';
  segments.push(['REF', 'EI', taxId].join('*'));

  // 2000B - Subscriber Hierarchical Level
  segments.push(['HL', '2', '1', '22', '0'].join('*'));
  segments.push(['SBR', 'P', '18', data.insured?.insurance_group_no || '', '', '', '', '', '', 'CI'].join('*'));

  // 2010BA - Subscriber Name
  const patientName = data.patient?.name || 'PATIENT NAME';
  const nameParts = patientName.split(/[,\s]+/).filter(Boolean);
  const lastName = nameParts[0] || 'LASTNAME';
  const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'FIRSTNAME';
  const memberId = data.insured?.unique_id || '123456789';
  segments.push(['NM1', 'IL', '1', lastName, firstName, '', '', '', 'MI', memberId].join('*'));
  
  const patientAddr = data.patient?.address?.split(',')[0] || '456 PATIENT ST';
  segments.push(['N3', patientAddr].join('*'));
  segments.push(['N4', 'ANYTOWN', 'OH', '43215'].join('*'));
  
  const dob = formatDate(data.patient?.dob);
  const gender = data.patient?.sex === 'F' ? 'F' : 'M';
  segments.push(['DMG', 'D8', dob, gender].join('*'));

  // 2010BB - Payer Name
  const payerNpi = data.payers?.[0]?.npi || 'PAYERID';
  segments.push(['NM1', 'PR', '2', payerName, '', '', '', '', 'PI', payerNpi].join('*'));

  // 2300 - Claim Information
  const totalCharges = formatCurrency(data.totals?.total_charges);
  const tob = data.billing?.type_of_bill || '0131';
  const admitDate = formatDate(data.admission?.date);
  const statementFrom = formatDate(data.billing?.statement_from);
  const statementThrough = formatDate(data.billing?.statement_through);
  
  // CLM segment for institutional
  segments.push(['CLM', patientControl, totalCharges, '', '', `${tob.slice(0,2)}:A:${tob.slice(2,3)}`, 'Y', 'A', 'Y', 'I'].join('*'));

  // Institutional claim specific
  segments.push(['DTP', '434', 'RD8', `${statementFrom}-${statementThrough}`].join('*'));  // Statement dates
  segments.push(['DTP', '435', 'D8', admitDate].join('*'));  // Admission date

  // CL1 - Institutional Claim Code
  const admitType = data.admission?.type || '1';
  const admitSource = data.admission?.source || '1';
  const patientStatus = data.admission?.status || '01';
  segments.push(['CL1', admitType, admitSource, patientStatus].join('*'));

  // Diagnoses
  const principalDx = data.diagnoses?.principal || 'Z0000';
  const otherDx = data.diagnoses?.other || [];
  segments.push(['HI', `ABK:${principalDx}`, ...otherDx.slice(0, 11).map((dx: string) => `ABF:${dx}`)].join('*'));

  // Attending Physician
  const attending = data.physicians?.attending;
  if (attending) {
    const attNpi = attending.npi || '1234567890';
    const attLast = attending.last_name || 'DOCTOR';
    const attFirst = attending.first_name || 'ATTENDING';
    segments.push(['NM1', '71', '1', attLast, attFirst, '', '', '', 'XX', attNpi].join('*'));
  }

  // 2400 - Service Lines
  const serviceLines = data.service_lines || [];
  let lineNum = 1;
  for (const line of serviceLines) {
    segments.push(['LX', lineNum.toString()].join('*'));
    
    const revCode = line.revenue_code || '0001';
    const hcpcs = line.hcpcs_code || '';
    const charges = formatCurrency(line.total_charges);
    const units = line.service_units || 1;
    const serviceDate = formatDate(line.service_date);
    
    // SV2 for institutional services
    segments.push(['SV2', revCode, hcpcs ? `HC:${hcpcs}` : '', charges, 'UN', units.toString()].join('*'));
    segments.push(['DTP', '472', 'D8', serviceDate].join('*'));
    
    lineNum++;
  }

  // If no service lines, add placeholder
  if (serviceLines.length === 0) {
    segments.push(['LX', '1'].join('*'));
    segments.push(['SV2', '0001', '', totalCharges, 'UN', '1'].join('*'));
    segments.push(['DTP', '472', 'D8', dateStr].join('*'));
  }

  // SE - Transaction Set Trailer
  const segmentCount = segments.length - 2 + 1;
  segments.push(['SE', segmentCount.toString(), cfg.transactionControlNumber].join('*'));

  // GE - Functional Group Trailer
  segments.push(['GE', '1', cfg.groupControlNumber].join('*'));

  // IEA - Interchange Control Trailer
  segments.push(['IEA', '1', cfg.interchangeControlNumber].join('*'));

  return segments.map(s => s + '~').join('\n');
}

/**
 * Generate appropriate X12 837 based on document type
 */
export function generateX12(documentType: string, extractedData: any, config?: Partial<X12Config>): string {
  if (documentType === 'UB-04' || documentType === 'UB04') {
    return generateX12_837I(extractedData, config);
  } else {
    return generateX12_837P(extractedData, config);
  }
}

/**
 * Generate JSON output format for MCO systems that prefer JSON over EDI
 */
export function generateMCOJson(documentType: string, extractedData: any): object {
  const timestamp = new Date().toISOString();
  
  return {
    meta: {
      format: 'MCO_ADVANTAGE_CLAIM_V1',
      document_type: documentType,
      generated_at: timestamp,
      source: 'MCO Advantage AI Processing'
    },
    claim: {
      type: documentType === 'UB-04' || documentType === 'UB04' ? 'institutional' : 'professional',
      ...extractedData
    }
  };
}
