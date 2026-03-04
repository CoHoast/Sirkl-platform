import { NextRequest, NextResponse } from 'next/server';

// Types
interface Application {
  id: string;
  applicationNumber: string;
  clientId: string;
  status: 'processing' | 'pending_review' | 'approved' | 'denied' | 'needs_info';
  
  // AI Analysis
  aiRecommendation: 'approve' | 'deny' | 'review';
  aiConfidence: number;
  aiSummary: string;
  aiFactors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; score: number }>;
  
  // Applicant Info
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    age: number;
    gender: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  
  // Health Info
  healthHistory: {
    preExistingConditions: string[];
    currentMedications: string[];
    tobaccoUse: boolean;
    alcoholUse: string;
    height: string;
    weight: string;
    bmi: number;
  };
  
  // Coverage
  coverage: {
    planType: 'individual' | 'couple' | 'family';
    monthlyAmount: number;
    requestedStartDate: string;
    previousInsurance: boolean;
    previousCarrier?: string;
    coverageGapDays: number;
  };
  
  // Household
  household: Array<{
    relationship: string;
    firstName: string;
    lastName: string;
    dob: string;
    age: number;
  }>;
  
  // Agreement
  statementOfBeliefs: boolean;
  termsAccepted: boolean;
  signature: string;
  signatureDate: string;
  
  // Flags
  flags: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
    ruleId?: string;
  }>;
  
  // Metadata
  source: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  decisionReason?: string;
}

// In-memory store (in production, use database)
const applications: Map<string, Application> = new Map();

// Initialize with sample data
const sampleApplications: Application[] = [
  {
    id: '1',
    applicationNumber: 'UR-2026-0847',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'review',
    aiConfidence: 72,
    aiSummary: 'Applicant has Type 2 Diabetes (controlled with medication). No other significant health concerns. Previous insurance coverage with Anthem ended January 31, 2026. Coverage gap of 28 days is within acceptable limits. Recommend manual review due to pre-existing condition.',
    aiFactors: [
      { factor: 'Previous coverage maintained', impact: 'positive', score: 10 },
      { factor: 'Family plan', impact: 'positive', score: 5 },
      { factor: 'Pre-existing condition (moderate)', impact: 'negative', score: -15 },
      { factor: 'No tobacco use', impact: 'positive', score: 5 },
    ],
    applicant: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@email.com',
      phone: '(614) 555-0123',
      dob: '1985-03-15',
      age: 40,
      gender: 'Female',
      address: {
        street: '123 Main Street',
        city: 'Columbus',
        state: 'OH',
        zip: '43215',
      },
    },
    healthHistory: {
      preExistingConditions: ['Type 2 Diabetes (controlled)'],
      currentMedications: ['Metformin 500mg 2x daily', 'Lisinopril 10mg daily'],
      tobaccoUse: false,
      alcoholUse: 'occasional',
      height: "5'6\"",
      weight: '165 lbs',
      bmi: 26.6,
    },
    coverage: {
      planType: 'family',
      monthlyAmount: 549,
      requestedStartDate: '2026-03-01',
      previousInsurance: true,
      previousCarrier: 'Anthem',
      coverageGapDays: 28,
    },
    household: [
      { relationship: 'Spouse', firstName: 'David', lastName: 'Johnson', dob: '1983-04-22', age: 42 },
      { relationship: 'Child', firstName: 'Emma', lastName: 'Johnson', dob: '2012-09-10', age: 13 },
      { relationship: 'Child', firstName: 'Lucas', lastName: 'Johnson', dob: '2016-02-28', age: 10 },
    ],
    statementOfBeliefs: true,
    termsAccepted: true,
    signature: 'Sarah Johnson',
    signatureDate: '2026-02-26',
    flags: [
      { type: 'warning', message: 'Pre-existing: Type 2 Diabetes (controlled)', ruleId: 'pre_existing_mod' },
    ],
    source: 'website_form',
    submittedAt: '2026-02-26T14:30:00Z',
  },
  {
    id: '2',
    applicationNumber: 'UR-2026-0846',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'approve',
    aiConfidence: 94,
    aiSummary: 'Healthy applicant with no pre-existing conditions. Previous coverage through employer ended 2 weeks ago. No tobacco use, healthy BMI. Meets all eligibility criteria. Recommend auto-approval.',
    aiFactors: [
      { factor: 'No pre-existing conditions', impact: 'positive', score: 30 },
      { factor: 'Previous coverage maintained', impact: 'positive', score: 10 },
      { factor: 'No tobacco use', impact: 'positive', score: 5 },
      { factor: 'Healthy BMI', impact: 'positive', score: 5 },
    ],
    applicant: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@gmail.com',
      phone: '(216) 555-0456',
      dob: '1990-07-22',
      age: 35,
      gender: 'Male',
      address: {
        street: '456 Oak Avenue',
        city: 'Cleveland',
        state: 'OH',
        zip: '44114',
      },
    },
    healthHistory: {
      preExistingConditions: [],
      currentMedications: [],
      tobaccoUse: false,
      alcoholUse: 'occasional',
      height: "5'10\"",
      weight: '175 lbs',
      bmi: 25.1,
    },
    coverage: {
      planType: 'individual',
      monthlyAmount: 195,
      requestedStartDate: '2026-03-01',
      previousInsurance: true,
      previousCarrier: 'Employer plan',
      coverageGapDays: 14,
    },
    household: [],
    statementOfBeliefs: true,
    termsAccepted: true,
    signature: 'Michael Chen',
    signatureDate: '2026-02-26',
    flags: [],
    source: 'website_form',
    submittedAt: '2026-02-26T13:15:00Z',
  },
  {
    id: '3',
    applicationNumber: 'UR-2026-0845',
    clientId: 'united_refuah',
    status: 'pending_review',
    aiRecommendation: 'deny',
    aiConfidence: 89,
    aiSummary: 'Applicant currently undergoing chemotherapy for breast cancer (Stage 2). Active cancer treatment is outside our sharing guidelines. Recommend denial with information about alternative coverage options.',
    aiFactors: [
      { factor: 'Active cancer treatment', impact: 'negative', score: -50 },
    ],
    applicant: {
      firstName: 'Patricia',
      lastName: 'Williams',
      email: 'pwilliams@email.com',
      phone: '(440) 555-0789',
      dob: '1975-11-08',
      age: 50,
      gender: 'Female',
      address: {
        street: '789 Elm Street',
        city: 'Toledo',
        state: 'OH',
        zip: '43604',
      },
    },
    healthHistory: {
      preExistingConditions: ['Breast Cancer Stage 2 (active treatment)'],
      currentMedications: ['Chemotherapy drugs', 'Anti-nausea medication'],
      tobaccoUse: false,
      alcoholUse: 'none',
      height: "5'4\"",
      weight: '140 lbs',
      bmi: 24.0,
    },
    coverage: {
      planType: 'couple',
      monthlyAmount: 425,
      requestedStartDate: '2026-03-01',
      previousInsurance: true,
      previousCarrier: 'COBRA',
      coverageGapDays: 0,
    },
    household: [
      { relationship: 'Spouse', firstName: 'Robert', lastName: 'Williams', dob: '1973-05-20', age: 52 },
    ],
    statementOfBeliefs: true,
    termsAccepted: true,
    signature: 'Patricia Williams',
    signatureDate: '2026-02-26',
    flags: [
      { type: 'critical', message: 'Active cancer treatment', ruleId: 'active_cancer' },
    ],
    source: 'website_form',
    submittedAt: '2026-02-26T11:00:00Z',
  },
];

// Initialize sample data
sampleApplications.forEach(app => applications.set(app.id, app));

// GET - List all applications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let result = Array.from(applications.values());
  
  // Filter by client
  if (clientId) {
    result = result.filter(app => app.clientId === clientId);
  }
  
  // Filter by status
  if (status && status !== 'all') {
    result = result.filter(app => app.status === status);
  }
  
  // Sort by submitted date (newest first)
  result.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  // Paginate
  const total = result.length;
  result = result.slice(offset, offset + limit);

  return NextResponse.json({
    applications: result,
    total,
    limit,
    offset,
  });
}

// POST - Ingest new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['clientId', 'applicant', 'coverage', 'healthHistory'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate application number
    const applicationNumber = `UR-${new Date().getFullYear()}-${String(applications.size + 1).padStart(4, '0')}`;
    
    // Calculate age from DOB
    const dob = new Date(body.applicant.dob);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Run AI analysis
    const aiAnalysis = analyzeApplication(body);
    
    // Create application
    const application: Application = {
      id: String(Date.now()),
      applicationNumber,
      clientId: body.clientId,
      status: 'pending_review',
      
      // AI Analysis
      aiRecommendation: aiAnalysis.recommendation,
      aiConfidence: aiAnalysis.confidence,
      aiSummary: aiAnalysis.summary,
      aiFactors: aiAnalysis.factors,
      
      // Applicant
      applicant: {
        ...body.applicant,
        age,
      },
      
      // Health
      healthHistory: body.healthHistory,
      
      // Coverage
      coverage: body.coverage,
      
      // Household
      household: body.household || [],
      
      // Agreement
      statementOfBeliefs: body.statementOfBeliefs ?? true,
      termsAccepted: body.termsAccepted ?? true,
      signature: body.signature || '',
      signatureDate: body.signatureDate || new Date().toISOString().split('T')[0],
      
      // Flags
      flags: aiAnalysis.flags,
      
      // Metadata
      source: body.source || 'api',
      submittedAt: new Date().toISOString(),
    };
    
    applications.set(application.id, application);

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
      aiRecommendation: application.aiRecommendation,
      aiConfidence: application.aiConfidence,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error ingesting application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

// AI Analysis function
function analyzeApplication(data: any): {
  recommendation: 'approve' | 'deny' | 'review';
  confidence: number;
  summary: string;
  factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; score: number }>;
  flags: Array<{ type: 'info' | 'warning' | 'critical'; message: string; ruleId?: string }>;
} {
  let score = 70; // Base score
  const factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; score: number }> = [];
  const flags: Array<{ type: 'info' | 'warning' | 'critical'; message: string; ruleId?: string }> = [];
  const summaryParts: string[] = [];

  // Check Statement of Beliefs
  if (!data.statementOfBeliefs) {
    return {
      recommendation: 'deny',
      confidence: 95,
      summary: 'Applicant did not accept Statement of Beliefs. This is a required eligibility criterion.',
      factors: [{ factor: 'Statement of Beliefs not accepted', impact: 'negative', score: -100 }],
      flags: [{ type: 'critical', message: 'Statement of Beliefs not accepted', ruleId: 'statement_of_beliefs' }],
    };
  }

  // Check pre-existing conditions
  const preExisting = data.healthHistory?.preExistingConditions || [];
  const highRiskConditions = ['cancer', 'chemotherapy', 'dialysis', 'transplant'];
  const moderateRiskConditions = ['diabetes', 'heart disease', 'copd'];
  
  for (const condition of preExisting) {
    const conditionLower = condition.toLowerCase();
    
    // Check for high-risk (active cancer, etc.)
    if (highRiskConditions.some(risk => conditionLower.includes(risk) && conditionLower.includes('active'))) {
      flags.push({ type: 'critical', message: `Active high-risk condition: ${condition}`, ruleId: 'active_cancer' });
      factors.push({ factor: 'Active high-risk condition', impact: 'negative', score: -50 });
      score -= 50;
      summaryParts.push(`Applicant has active high-risk condition (${condition}).`);
    }
    // Check for moderate risk
    else if (moderateRiskConditions.some(risk => conditionLower.includes(risk))) {
      const isControlled = conditionLower.includes('controlled');
      if (isControlled) {
        flags.push({ type: 'warning', message: `Pre-existing: ${condition}`, ruleId: 'pre_existing_mod' });
        factors.push({ factor: `Pre-existing condition (controlled)`, impact: 'negative', score: -10 });
        score -= 10;
        summaryParts.push(`Applicant has ${condition} (controlled with medication).`);
      } else {
        flags.push({ type: 'warning', message: `Pre-existing: ${condition}`, ruleId: 'pre_existing_mod' });
        factors.push({ factor: `Pre-existing condition`, impact: 'negative', score: -20 });
        score -= 20;
        summaryParts.push(`Applicant has ${condition}.`);
      }
    }
  }

  // No pre-existing conditions bonus
  if (preExisting.length === 0) {
    factors.push({ factor: 'No pre-existing conditions', impact: 'positive', score: 20 });
    score += 20;
    summaryParts.push('Applicant has no pre-existing conditions.');
  }

  // Check tobacco use
  if (data.healthHistory?.tobaccoUse) {
    flags.push({ type: 'warning', message: 'Tobacco use reported', ruleId: 'tobacco_use' });
    factors.push({ factor: 'Tobacco use', impact: 'negative', score: -10 });
    score -= 10;
    summaryParts.push('Applicant uses tobacco products.');
  } else {
    factors.push({ factor: 'No tobacco use', impact: 'positive', score: 5 });
    score += 5;
  }

  // Check coverage gap
  const gapDays = data.coverage?.coverageGapDays || 0;
  if (gapDays > 63) {
    flags.push({ type: 'warning', message: `Coverage gap of ${gapDays} days exceeds 63-day limit`, ruleId: 'coverage_gap' });
    factors.push({ factor: 'Coverage gap exceeds limit', impact: 'negative', score: -15 });
    score -= 15;
    summaryParts.push(`Coverage gap of ${gapDays} days exceeds the 63-day guideline.`);
  } else if (data.coverage?.previousInsurance) {
    factors.push({ factor: 'Previous coverage maintained', impact: 'positive', score: 10 });
    score += 10;
    summaryParts.push('Previous insurance coverage within acceptable gap.');
  }

  // Check plan type
  if (data.coverage?.planType === 'family') {
    factors.push({ factor: 'Family plan', impact: 'positive', score: 5 });
    score += 5;
  }

  // Determine recommendation
  let recommendation: 'approve' | 'deny' | 'review';
  let confidence: number;

  if (flags.some(f => f.type === 'critical')) {
    recommendation = 'deny';
    confidence = Math.min(95, 100 - score);
  } else if (score >= 85) {
    recommendation = 'approve';
    confidence = Math.min(99, score);
  } else if (score >= 60) {
    recommendation = 'review';
    confidence = score;
  } else {
    recommendation = 'deny';
    confidence = Math.min(95, 100 - score);
  }

  // Build summary
  let summary = summaryParts.join(' ');
  if (recommendation === 'approve') {
    summary += ' Meets all eligibility criteria. Recommend auto-approval.';
  } else if (recommendation === 'review') {
    summary += ' Recommend manual review.';
  } else {
    summary += ' Does not meet eligibility criteria.';
  }

  return {
    recommendation,
    confidence,
    summary,
    factors,
    flags,
  };
}
