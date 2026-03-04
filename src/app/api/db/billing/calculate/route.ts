import { NextResponse } from 'next/server';
import { calculateMonthlyBilling, calculateAllClientsBilling, getBillingSummary, finalizeMonthlyBilling, getClientTiers, updateClientTiers } from '@/lib/billing';

export async function POST(request: Request) {
  try {
    const { action, clientId, billingPeriod, tiers } = await request.json();

    if (!billingPeriod && action !== 'update-tiers') {
      return NextResponse.json({ error: 'Billing period is required' }, { status: 400 });
    }

    switch (action) {
      case 'calculate-client':
        if (!clientId) {
          return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }
        const clientCalc = await calculateMonthlyBilling(clientId, billingPeriod);
        return NextResponse.json({ success: true, calculation: clientCalc });

      case 'calculate-all':
        const allCalcs = await calculateAllClientsBilling(billingPeriod);
        return NextResponse.json({ success: true, calculations: allCalcs });

      case 'finalize':
        if (!clientId) {
          return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }
        const finalized = await finalizeMonthlyBilling(clientId, billingPeriod);
        return NextResponse.json({ success: finalized });

      case 'update-tiers':
        if (!clientId || !tiers) {
          return NextResponse.json({ error: 'Client ID and tiers are required' }, { status: 400 });
        }
        await updateClientTiers(clientId, tiers);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing calculation error:', error);
    return NextResponse.json({ error: 'Failed to process billing' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const clientId = searchParams.get('clientId');
    const billingPeriod = searchParams.get('period') || new Date().toISOString().slice(0, 7);

    if (action === 'tiers' && clientId) {
      const tiers = await getClientTiers(parseInt(clientId));
      return NextResponse.json({ tiers });
    }

    if (action === 'summary') {
      const summary = await getBillingSummary(billingPeriod);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }
}
