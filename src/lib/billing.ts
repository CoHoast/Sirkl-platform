import { pool } from './db';

interface BillingTier {
  tier_number: number;
  min_docs: number;
  max_docs: number | null;
  price_per_doc: string;
}

interface TierBreakdown {
  tier: number;
  docs: number;
  pricePerDoc: number;
  subtotal: number;
}

interface BillingCalculation {
  clientId: number;
  billingPeriod: string;
  totalDocuments: number;
  totalAmount: number;
  breakdown: TierBreakdown[];
}

/**
 * Get billing tiers for a client
 */
export async function getClientTiers(clientId: number): Promise<BillingTier[]> {
  const result = await pool.query(`
    SELECT tier_number, min_docs, max_docs, price_per_doc
    FROM billing_tiers
    WHERE client_id = $1
    ORDER BY tier_number ASC
  `, [clientId]);
  
  return result.rows;
}

/**
 * Calculate billing for a client's document count using tiered pricing
 */
export function calculateTieredBilling(documentCount: number, tiers: BillingTier[]): { total: number; breakdown: TierBreakdown[] } {
  const breakdown: TierBreakdown[] = [];
  let remaining = documentCount;
  let total = 0;
  
  for (const tier of tiers) {
    if (remaining <= 0) break;
    
    const tierMin = tier.min_docs;
    const tierMax = tier.max_docs || Infinity;
    const tierCapacity = tierMax - tierMin + 1;
    const pricePerDoc = parseFloat(tier.price_per_doc);
    
    // How many docs fall in this tier?
    const docsInTier = Math.min(remaining, tierCapacity);
    const subtotal = docsInTier * pricePerDoc;
    
    if (docsInTier > 0) {
      breakdown.push({
        tier: tier.tier_number,
        docs: docsInTier,
        pricePerDoc,
        subtotal: Math.round(subtotal * 100) / 100,
      });
      
      total += subtotal;
      remaining -= docsInTier;
    }
  }
  
  return {
    total: Math.round(total * 100) / 100,
    breakdown,
  };
}

/**
 * Get document count for a client in a billing period
 */
export async function getDocumentCount(clientId: number, billingPeriod: string): Promise<number> {
  // billingPeriod format: YYYY-MM
  const [year, month] = billingPeriod.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM documents
    WHERE client_id = $1
      AND created_at >= $2
      AND created_at <= $3
  `, [clientId, startDate.toISOString(), endDate.toISOString()]);
  
  return parseInt(result.rows[0].count);
}

/**
 * Calculate and store monthly billing for a client
 */
export async function calculateMonthlyBilling(clientId: number, billingPeriod: string): Promise<BillingCalculation> {
  const tiers = await getClientTiers(clientId);
  const documentCount = await getDocumentCount(clientId, billingPeriod);
  const { total, breakdown } = calculateTieredBilling(documentCount, tiers);
  
  // Upsert monthly_usage record
  await pool.query(`
    INSERT INTO monthly_usage (client_id, billing_period, document_count, calculated_amount, tier_breakdown, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (client_id, billing_period) DO UPDATE SET
      document_count = $3,
      calculated_amount = $4,
      tier_breakdown = $5,
      updated_at = NOW()
  `, [clientId, billingPeriod, documentCount, total, JSON.stringify(breakdown)]);
  
  return {
    clientId,
    billingPeriod,
    totalDocuments: documentCount,
    totalAmount: total,
    breakdown,
  };
}

/**
 * Calculate billing for all clients for a period
 */
export async function calculateAllClientsBilling(billingPeriod: string): Promise<BillingCalculation[]> {
  const clientsResult = await pool.query('SELECT id FROM clients WHERE status = $1', ['active']);
  const calculations: BillingCalculation[] = [];
  
  for (const client of clientsResult.rows) {
    const calc = await calculateMonthlyBilling(client.id, billingPeriod);
    calculations.push(calc);
  }
  
  return calculations;
}

/**
 * Get monthly usage summary for a client
 */
export async function getMonthlyUsage(clientId: number, billingPeriod: string): Promise<{
  documentCount: number;
  calculatedAmount: number;
  breakdown: TierBreakdown[];
  finalized: boolean;
} | null> {
  const result = await pool.query(`
    SELECT document_count, calculated_amount, tier_breakdown, finalized
    FROM monthly_usage
    WHERE client_id = $1 AND billing_period = $2
  `, [clientId, billingPeriod]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    documentCount: row.document_count,
    calculatedAmount: parseFloat(row.calculated_amount),
    breakdown: row.tier_breakdown || [],
    finalized: row.finalized,
  };
}

/**
 * Finalize monthly billing (lock it in for invoicing)
 */
export async function finalizeMonthlyBilling(clientId: number, billingPeriod: string): Promise<boolean> {
  const result = await pool.query(`
    UPDATE monthly_usage
    SET finalized = true, finalized_at = NOW()
    WHERE client_id = $1 AND billing_period = $2 AND finalized = false
    RETURNING id
  `, [clientId, billingPeriod]);
  
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get billing summary for all clients for a period
 */
export async function getBillingSummary(billingPeriod: string): Promise<{
  clients: Array<{
    clientId: number;
    clientName: string;
    documentCount: number;
    calculatedAmount: number;
    finalized: boolean;
  }>;
  totals: {
    totalDocuments: number;
    totalAmount: number;
  };
}> {
  const result = await pool.query(`
    SELECT 
      c.id as client_id,
      c.name as client_name,
      COALESCE(mu.document_count, 0) as document_count,
      COALESCE(mu.calculated_amount, 0) as calculated_amount,
      COALESCE(mu.finalized, false) as finalized
    FROM clients c
    LEFT JOIN monthly_usage mu ON c.id = mu.client_id AND mu.billing_period = $1
    WHERE c.status = 'active'
    ORDER BY c.name
  `, [billingPeriod]);
  
  const clients = result.rows.map(row => ({
    clientId: row.client_id,
    clientName: row.client_name,
    documentCount: parseInt(row.document_count),
    calculatedAmount: parseFloat(row.calculated_amount) || 0,
    finalized: row.finalized,
  }));
  
  const totals = {
    totalDocuments: clients.reduce((sum, c) => sum + c.documentCount, 0),
    totalAmount: clients.reduce((sum, c) => sum + c.calculatedAmount, 0),
  };
  
  return { clients, totals };
}

/**
 * Update tiers for a client
 */
export async function updateClientTiers(clientId: number, tiers: Array<{ tier: number; min: number; max: number | null; price: number }>): Promise<void> {
  // Delete existing tiers
  await pool.query('DELETE FROM billing_tiers WHERE client_id = $1', [clientId]);
  
  // Insert new tiers
  for (const tier of tiers) {
    await pool.query(`
      INSERT INTO billing_tiers (client_id, tier_number, min_docs, max_docs, price_per_doc)
      VALUES ($1, $2, $3, $4, $5)
    `, [clientId, tier.tier, tier.min, tier.max, tier.price]);
  }
}
