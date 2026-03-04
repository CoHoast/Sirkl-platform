// Mock data for MCO Advantage Dashboard Demo

export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'review';
export type DocumentType = 'referral' | 'insurance' | 'medical' | 'consent' | 'other';

export interface Application {
  id: string;
  patientName: string;
  dateOfBirth: string;
  facilityRequested: string;
  submittedAt: string;
  status: ApplicationStatus;
  priority: 'high' | 'normal' | 'low';
  source: 'email' | 'fax' | 'portal' | 'phone';
  documents: Document[];
  extractedData?: ExtractedData;
  notes?: string;
  assignedTo?: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
  status: 'pending' | 'processed' | 'error';
  url?: string;
}

export interface ExtractedData {
  patientInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    ssn?: string;
    phone: string;
    address: string;
  };
  insuranceInfo: {
    primary: string;
    policyNumber: string;
    groupNumber?: string;
    effectiveDate: string;
  };
  medicalInfo: {
    diagnosis: string[];
    medications: string[];
    allergies: string[];
    physician: string;
    physicianNPI?: string;
  };
  requestedServices: string[];
  preferredAdmitDate: string;
  confidence: number;
}

export const mockApplications: Application[] = [
  {
    id: 'APP-2026-001',
    patientName: 'Margaret Thompson',
    dateOfBirth: '1942-03-15',
    facilityRequested: 'Cranberry Park at West Bloomfield',
    submittedAt: '2026-02-24T14:30:00Z',
    status: 'pending',
    priority: 'high',
    source: 'email',
    documents: [
      { id: 'DOC-001', type: 'referral', name: 'Hospital_Referral.pdf', uploadedAt: '2026-02-24T14:30:00Z', status: 'processed' },
      { id: 'DOC-002', type: 'insurance', name: 'Insurance_Card.jpg', uploadedAt: '2026-02-24T14:30:00Z', status: 'processed' },
      { id: 'DOC-003', type: 'medical', name: 'H&P_Report.pdf', uploadedAt: '2026-02-24T14:32:00Z', status: 'processed' },
    ],
    extractedData: {
      patientInfo: {
        firstName: 'Margaret',
        lastName: 'Thompson',
        dob: '1942-03-15',
        phone: '(248) 555-0142',
        address: '4521 Maple Drive, West Bloomfield, MI 48322',
      },
      insuranceInfo: {
        primary: 'Medicare',
        policyNumber: '1EG4-TE5-MK72',
        effectiveDate: '2007-03-01',
      },
      medicalInfo: {
        diagnosis: ['Hip Fracture (S72.001A)', 'Hypertension', 'Type 2 Diabetes'],
        medications: ['Lisinopril 10mg', 'Metformin 500mg', 'Aspirin 81mg'],
        allergies: ['Penicillin'],
        physician: 'Dr. Robert Chen',
        physicianNPI: '1234567890',
      },
      requestedServices: ['Skilled Nursing', 'Physical Therapy', 'Occupational Therapy'],
      preferredAdmitDate: '2026-02-26',
      confidence: 94,
    },
    assignedTo: 'John Guiher',
  },
  {
    id: 'APP-2026-002',
    patientName: 'Robert Williams',
    dateOfBirth: '1938-07-22',
    facilityRequested: 'MCO Advantage of Grand Rapids',
    submittedAt: '2026-02-24T11:15:00Z',
    status: 'review',
    priority: 'normal',
    source: 'fax',
    documents: [
      { id: 'DOC-004', type: 'referral', name: 'Referral_Form.pdf', uploadedAt: '2026-02-24T11:15:00Z', status: 'processed' },
      { id: 'DOC-005', type: 'insurance', name: 'BCBS_Card.pdf', uploadedAt: '2026-02-24T11:15:00Z', status: 'processed' },
    ],
    extractedData: {
      patientInfo: {
        firstName: 'Robert',
        lastName: 'Williams',
        dob: '1938-07-22',
        phone: '(616) 555-0198',
        address: '892 Oak Street, Grand Rapids, MI 49503',
      },
      insuranceInfo: {
        primary: 'Blue Cross Blue Shield',
        policyNumber: 'XYZ123456789',
        groupNumber: 'GRP-001',
        effectiveDate: '2024-01-01',
      },
      medicalInfo: {
        diagnosis: ['COPD', 'Pneumonia'],
        medications: ['Albuterol', 'Prednisone'],
        allergies: ['None known'],
        physician: 'Dr. Sarah Miller',
        physicianNPI: '9876543210',
      },
      requestedServices: ['Skilled Nursing', 'Respiratory Therapy'],
      preferredAdmitDate: '2026-02-27',
      confidence: 87,
    },
    notes: 'Insurance verification pending - needs pre-authorization',
    assignedTo: 'Marcus Taylor',
  },
  {
    id: 'APP-2026-003',
    patientName: 'Dorothy Martinez',
    dateOfBirth: '1945-11-08',
    facilityRequested: 'Cranberry Park at Milford',
    submittedAt: '2026-02-24T09:45:00Z',
    status: 'approved',
    priority: 'normal',
    source: 'portal',
    documents: [
      { id: 'DOC-006', type: 'referral', name: 'Admission_Request.pdf', uploadedAt: '2026-02-24T09:45:00Z', status: 'processed' },
      { id: 'DOC-007', type: 'insurance', name: 'Medicare_Card.jpg', uploadedAt: '2026-02-24T09:45:00Z', status: 'processed' },
      { id: 'DOC-008', type: 'medical', name: 'Medical_Records.pdf', uploadedAt: '2026-02-24T09:47:00Z', status: 'processed' },
      { id: 'DOC-009', type: 'consent', name: 'Consent_Forms.pdf', uploadedAt: '2026-02-24T09:50:00Z', status: 'processed' },
    ],
    extractedData: {
      patientInfo: {
        firstName: 'Dorothy',
        lastName: 'Martinez',
        dob: '1945-11-08',
        phone: '(248) 555-0321',
        address: '156 Highland Ave, Milford, MI 48381',
      },
      insuranceInfo: {
        primary: 'Medicare Advantage - Humana',
        policyNumber: 'H5216-001',
        effectiveDate: '2025-01-01',
      },
      medicalInfo: {
        diagnosis: ['Dementia - Alzheimers Type', 'Anxiety'],
        medications: ['Donepezil 10mg', 'Sertraline 50mg'],
        allergies: ['Sulfa drugs'],
        physician: 'Dr. James Wilson',
        physicianNPI: '5678901234',
      },
      requestedServices: ['Memory Care', 'Assisted Living'],
      preferredAdmitDate: '2026-03-01',
      confidence: 96,
    },
    assignedTo: 'John Guiher',
  },
  {
    id: 'APP-2026-004',
    patientName: 'Harold Johnson',
    dateOfBirth: '1940-05-30',
    facilityRequested: 'MCO Advantage of ShorePointe',
    submittedAt: '2026-02-23T16:20:00Z',
    status: 'denied',
    priority: 'low',
    source: 'email',
    documents: [
      { id: 'DOC-010', type: 'referral', name: 'Referral.pdf', uploadedAt: '2026-02-23T16:20:00Z', status: 'processed' },
    ],
    notes: 'Denied - Does not meet medical necessity criteria. Recommended for home health instead.',
  },
  {
    id: 'APP-2026-005',
    patientName: 'Betty Anderson',
    dateOfBirth: '1948-09-12',
    facilityRequested: 'The Cottages at Grand Rapids',
    submittedAt: '2026-02-23T10:00:00Z',
    status: 'approved',
    priority: 'normal',
    source: 'phone',
    documents: [
      { id: 'DOC-011', type: 'referral', name: 'Application.pdf', uploadedAt: '2026-02-23T10:00:00Z', status: 'processed' },
    ],
    extractedData: {
      patientInfo: {
        firstName: 'Betty',
        lastName: 'Anderson',
        dob: '1948-09-12',
        phone: '(616) 555-0456',
        address: '234 Pine Road, Wyoming, MI 49519',
      },
      insuranceInfo: {
        primary: 'Private Pay',
        policyNumber: 'N/A',
        effectiveDate: 'N/A',
      },
      medicalInfo: {
        diagnosis: ['Healthy - Independent Living'],
        medications: ['Vitamin D', 'Calcium'],
        allergies: ['None'],
        physician: 'Dr. Emily Brown',
      },
      requestedServices: ['Independent Living'],
      preferredAdmitDate: '2026-03-15',
      confidence: 99,
    },
    assignedTo: 'Marcus Taylor',
  },
  {
    id: 'APP-2026-006',
    patientName: 'James Wilson',
    dateOfBirth: '1936-02-18',
    facilityRequested: 'MCO Advantage of Troy',
    submittedAt: '2026-02-24T15:45:00Z',
    status: 'pending',
    priority: 'high',
    source: 'email',
    documents: [
      { id: 'DOC-012', type: 'referral', name: 'ER_Referral.pdf', uploadedAt: '2026-02-24T15:45:00Z', status: 'pending' },
    ],
  },
  {
    id: 'APP-2026-007',
    patientName: 'Patricia Davis',
    dateOfBirth: '1944-12-03',
    facilityRequested: 'Cranberry Park of Grand Rapids',
    submittedAt: '2026-02-22T14:00:00Z',
    status: 'approved',
    priority: 'normal',
    source: 'portal',
    documents: [
      { id: 'DOC-013', type: 'referral', name: 'Admission_Form.pdf', uploadedAt: '2026-02-22T14:00:00Z', status: 'processed' },
      { id: 'DOC-014', type: 'medical', name: 'Medical_Summary.pdf', uploadedAt: '2026-02-22T14:05:00Z', status: 'processed' },
    ],
    extractedData: {
      patientInfo: {
        firstName: 'Patricia',
        lastName: 'Davis',
        dob: '1944-12-03',
        phone: '(616) 555-0789',
        address: '567 Birch Lane, Grand Rapids, MI 49546',
      },
      insuranceInfo: {
        primary: 'Medicare',
        policyNumber: '2GH5-KL8-MN90',
        effectiveDate: '2009-12-01',
      },
      medicalInfo: {
        diagnosis: ['Parkinsons Disease', 'Depression'],
        medications: ['Levodopa', 'Citalopram'],
        allergies: ['Codeine'],
        physician: 'Dr. Michael Lee',
        physicianNPI: '3456789012',
      },
      requestedServices: ['Assisted Living', 'Memory Care'],
      preferredAdmitDate: '2026-02-28',
      confidence: 91,
    },
  },
];

export const dashboardStats = {
  today: {
    pending: 3,
    approved: 2,
    denied: 1,
    review: 1,
  },
  week: {
    pending: 12,
    approved: 18,
    denied: 4,
    review: 6,
  },
  avgProcessingTime: '2.4 hours',
  approvalRate: '78%',
};

export const facilities = [
  'Cranberry Park at West Bloomfield',
  'Cranberry Park at Milford',
  'Cranberry Park of Grand Rapids',
  'The Cottages at Grand Rapids',
  'MCO Advantage of Grand Rapids',
  'MCO Advantage of ShorePointe',
  'MCO Advantage of Troy',
  'MCO Advantage of Ann Arbor',
  'MCO Advantage of Canton',
  'MCO Advantage of Sterling Heights',
];

export const teamMembers = [
  { id: '1', name: 'John Guiher', role: 'Admissions Director', avatar: 'JG' },
  { id: '2', name: 'Marcus Taylor', role: 'Admissions Coordinator', avatar: 'MT' },
  { id: '3', name: 'Amanda Rodriguez', role: 'RN Case Manager', avatar: 'AR' },
  { id: '4', name: 'Dr. David Chen', role: 'Medical Director', avatar: 'DC' },
];
