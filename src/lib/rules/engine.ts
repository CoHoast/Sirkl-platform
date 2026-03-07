// Phase 2D: Rules Engine - Evaluates and executes negotiation rules

import { pool } from '../db';
import { 
  NegotiationRule, 
  RuleCondition, 
  RuleContext, 
  RuleEvaluationResult,
  NegotiationSettings,
  DEFAULT_NEGOTIATION_SETTINGS
} from './types';
import { communicationService, buildLetterData } from '../communication/service';

export class RulesEngine {
  
  // Get client settings (with defaults)
  async getClientSettings(clientId: number): Promise<NegotiationSettings> {
    const result = await pool.query(`
      SELECT * FROM negotiation_settings WHERE client_id = $1
    `, [clientId]);
    
    if (result.rows.length === 0) {
      // Return defaults
      return {
        ...DEFAULT_NEGOTIATION_SETTINGS,
        client_id: clientId,
        updated_at: new Date()
      };
    }
    
    return result.rows[0];
  }
  
  // Update client settings
  async updateClientSettings(clientId: number, settings: Partial<NegotiationSettings>): Promise<NegotiationSettings> {
    const existing = await this.getClientSettings(clientId);
    const merged = { ...existing, ...settings, client_id: clientId, updated_at: new Date() };
    
    await pool.query(`
      INSERT INTO negotiation_settings (
        client_id, autonomy_level,
        default_initial_offer_percent, max_offer_percent, min_offer_percent,
        auto_accept_threshold, max_negotiation_rounds, counter_increment_percent,
        days_to_respond, days_before_followup, days_before_escalation,
        response_delay_mode, response_delay_min_minutes, response_delay_max_minutes,
        response_business_hours_only, response_weekdays_only,
        auto_send_method, require_fax_confirmation,
        notify_on_new_bill, notify_on_response, notify_on_settlement, notify_on_escalation,
        notification_emails, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())
      ON CONFLICT (client_id) DO UPDATE SET
        autonomy_level = EXCLUDED.autonomy_level,
        default_initial_offer_percent = EXCLUDED.default_initial_offer_percent,
        max_offer_percent = EXCLUDED.max_offer_percent,
        min_offer_percent = EXCLUDED.min_offer_percent,
        auto_accept_threshold = EXCLUDED.auto_accept_threshold,
        max_negotiation_rounds = EXCLUDED.max_negotiation_rounds,
        counter_increment_percent = EXCLUDED.counter_increment_percent,
        days_to_respond = EXCLUDED.days_to_respond,
        days_before_followup = EXCLUDED.days_before_followup,
        days_before_escalation = EXCLUDED.days_before_escalation,
        response_delay_mode = EXCLUDED.response_delay_mode,
        response_delay_min_minutes = EXCLUDED.response_delay_min_minutes,
        response_delay_max_minutes = EXCLUDED.response_delay_max_minutes,
        response_business_hours_only = EXCLUDED.response_business_hours_only,
        response_weekdays_only = EXCLUDED.response_weekdays_only,
        auto_send_method = EXCLUDED.auto_send_method,
        require_fax_confirmation = EXCLUDED.require_fax_confirmation,
        notify_on_new_bill = EXCLUDED.notify_on_new_bill,
        notify_on_response = EXCLUDED.notify_on_response,
        notify_on_settlement = EXCLUDED.notify_on_settlement,
        notify_on_escalation = EXCLUDED.notify_on_escalation,
        notification_emails = EXCLUDED.notification_emails,
        updated_at = NOW()
    `, [
      merged.client_id, merged.autonomy_level,
      merged.default_initial_offer_percent, merged.max_offer_percent, merged.min_offer_percent,
      merged.auto_accept_threshold, merged.max_negotiation_rounds, merged.counter_increment_percent,
      merged.days_to_respond, merged.days_before_followup, merged.days_before_escalation,
      merged.response_delay_mode, merged.response_delay_min_minutes, merged.response_delay_max_minutes,
      merged.response_business_hours_only, merged.response_weekdays_only,
      merged.auto_send_method, merged.require_fax_confirmation,
      merged.notify_on_new_bill, merged.notify_on_response, merged.notify_on_settlement, merged.notify_on_escalation,
      JSON.stringify(merged.notification_emails)
    ]);
    
    return merged;
  }
  
  // Get all active rules for a client
  async getClientRules(clientId: number): Promise<NegotiationRule[]> {
    const result = await pool.query(`
      SELECT * FROM negotiation_rules 
      WHERE client_id = $1 AND is_active = true
      ORDER BY priority ASC
    `, [clientId]);
    
    return result.rows;
  }
  
  // Evaluate a single condition
  private evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
    const { field, operator, value, value2 } = condition;
    
    // Get the actual value from context
    let actualValue: any;
    switch (field) {
      case 'total_billed':
        actualValue = context.bill.total_billed;
        break;
      case 'fair_price':
        actualValue = context.bill.fair_price;
        break;
      case 'savings_percent':
        actualValue = context.bill.savings_percent;
        break;
      case 'provider_name':
        actualValue = context.bill.provider_name;
        break;
      case 'provider_npi':
        actualValue = context.bill.provider_npi;
        break;
      case 'provider_history':
        actualValue = context.provider_history?.avg_settlement_percent;
        break;
      case 'member_type':
        actualValue = context.bill.member_type;
        break;
      case 'date_of_service':
        actualValue = new Date(context.bill.date_of_service);
        break;
      case 'days_since_received':
        actualValue = Math.floor((Date.now() - new Date(context.bill.received_at).getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'negotiation_round':
        actualValue = context.negotiation?.round || 0;
        break;
      case 'counter_amount':
        actualValue = context.negotiation?.counter_amount;
        break;
      case 'counter_vs_offer':
        if (context.negotiation?.counter_amount && context.negotiation?.offer_amount) {
          actualValue = Math.abs(
            ((context.negotiation.counter_amount - context.negotiation.offer_amount) / context.negotiation.offer_amount) * 100
          );
        }
        break;
      default:
        return false;
    }
    
    if (actualValue === undefined || actualValue === null) {
      return false;
    }
    
    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return actualValue === value;
      case 'not_equals':
        return actualValue !== value;
      case 'greater_than':
        return actualValue > value;
      case 'less_than':
        return actualValue < value;
      case 'greater_or_equal':
        return actualValue >= value;
      case 'less_or_equal':
        return actualValue <= value;
      case 'between':
        return actualValue >= value && actualValue <= (value2 ?? value);
      case 'not_between':
        return actualValue < value || actualValue > (value2 ?? value);
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(actualValue).toLowerCase().includes(String(value).toLowerCase());
      case 'in_list':
        return Array.isArray(value) && (value as any[]).includes(actualValue);
      case 'not_in_list':
        return Array.isArray(value) && !(value as any[]).includes(actualValue);
      default:
        return false;
    }
  }
  
  // Evaluate all conditions for a rule
  private evaluateConditions(rule: NegotiationRule, context: RuleContext): boolean {
    const conditions = rule.conditions || [];
    
    if (conditions.length === 0) {
      return true; // No conditions = always match
    }
    
    if (rule.condition_logic === 'or') {
      return conditions.some(c => this.evaluateCondition(c, context));
    } else {
      return conditions.every(c => this.evaluateCondition(c, context));
    }
  }
  
  // Evaluate all rules for a context
  async evaluateRules(context: RuleContext): Promise<RuleEvaluationResult[]> {
    const rules = await this.getClientRules(context.bill.client_id);
    const results: RuleEvaluationResult[] = [];
    
    for (const rule of rules) {
      const matched = this.evaluateConditions(rule, context);
      results.push({
        rule_id: rule.id,
        rule_name: rule.name,
        matched,
        action: matched ? rule.action : undefined,
        reason: matched ? `Rule "${rule.name}" matched` : undefined
      });
    }
    
    return results;
  }
  
  // Execute a rule action
  async executeAction(
    context: RuleContext, 
    action: { type: string; params: Record<string, any> },
    settings: NegotiationSettings
  ): Promise<{ success: boolean; message: string; data?: any }> {
    
    switch (action.type) {
      case 'auto_analyze':
        return this.executeAutoAnalyze(context);
        
      case 'auto_offer':
        return this.executeAutoOffer(context, action.params, settings);
        
      case 'auto_send':
        return this.executeAutoSend(context, action.params, settings);
        
      case 'auto_counter':
        return this.executeAutoCounter(context, action.params, settings);
        
      case 'auto_accept':
        return this.executeAutoAccept(context);
        
      case 'auto_escalate':
        return this.executeAutoEscalate(context, action.params);
        
      case 'notification':
        return this.executeNotification(context, action.params, settings);
        
      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  }
  
  // Action: Auto-analyze bill
  private async executeAutoAnalyze(context: RuleContext): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Trigger analysis (in real implementation, call extraction pipeline)
      await pool.query(`
        UPDATE bills SET status = 'analyzing', updated_at = NOW() WHERE id = $1
      `, [context.bill.id]);
      
      // For now, mock the analysis - mark ready after a delay would happen via background job
      return { success: true, message: 'Bill queued for analysis' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Auto-create offer
  private async executeAutoOffer(
    context: RuleContext, 
    params: Record<string, any>,
    settings: NegotiationSettings
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const offerPercent = params.offer_percent || settings.default_initial_offer_percent;
      const offerAmount = Math.round(context.bill.total_billed * (offerPercent / 100) * 100) / 100;
      
      // Ensure within bounds
      const minOffer = context.bill.total_billed * (settings.min_offer_percent / 100);
      const maxOffer = context.bill.total_billed * (settings.max_offer_percent / 100);
      const boundedOffer = Math.max(minOffer, Math.min(maxOffer, offerAmount));
      
      // Create negotiation
      const result = await pool.query(`
        INSERT INTO negotiations (bill_id, initial_offer, current_offer, strategy, status, auto_negotiated, created_at, updated_at)
        VALUES ($1, $2, $2, 'medicare_percentage', 'pending', true, NOW(), NOW())
        RETURNING id
      `, [context.bill.id, boundedOffer]);
      
      // Update bill status
      await pool.query(`
        UPDATE bills SET status = 'ready_to_negotiate', updated_at = NOW() WHERE id = $1
      `, [context.bill.id]);
      
      return { 
        success: true, 
        message: `Auto-created offer for $${boundedOffer.toFixed(2)} (${offerPercent}%)`,
        data: { negotiation_id: result.rows[0].id, offer_amount: boundedOffer }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Auto-send offer
  private async executeAutoSend(
    context: RuleContext,
    params: Record<string, any>,
    settings: NegotiationSettings
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (settings.auto_send_method === 'none') {
        return { success: false, message: 'Auto-send is disabled for this client' };
      }
      
      if (!context.negotiation) {
        return { success: false, message: 'No negotiation to send' };
      }
      
      // Get provider contact info
      const billResult = await pool.query(`
        SELECT provider_fax, provider_email FROM bills WHERE id = $1
      `, [context.bill.id]);
      
      const bill = billResult.rows[0];
      const method = settings.auto_send_method === 'both' ? 
        (bill.provider_fax ? 'fax' : 'email') : settings.auto_send_method;
      const recipient = method === 'fax' ? bill.provider_fax : bill.provider_email;
      
      if (!recipient) {
        return { success: false, message: `No ${method} number/address for provider` };
      }
      
      // Build letter data and send
      const letterData = await buildLetterData(
        context.bill.id,
        context.negotiation.id,
        context.negotiation.offer_amount,
        context.bill.client_id
      );
      
      const sendResult = await communicationService.sendOffer({
        billId: context.bill.id,
        negotiationId: context.negotiation.id,
        method: method as 'fax' | 'email',
        recipient,
        letterType: 'initial_offer'
      }, letterData);
      
      if (sendResult.success) {
        await pool.query(`
          UPDATE bills SET status = 'offer_sent', updated_at = NOW() WHERE id = $1
        `, [context.bill.id]);
      }
      
      return sendResult.success ? 
        { success: true, message: `Offer auto-sent via ${method}`, data: sendResult } :
        { success: false, message: sendResult.error || 'Failed to send' };
        
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Auto-counter
  private async executeAutoCounter(
    context: RuleContext,
    params: Record<string, any>,
    settings: NegotiationSettings
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!context.negotiation?.counter_amount) {
        return { success: false, message: 'No counter to respond to' };
      }
      
      // Check if we've exceeded max rounds
      if (context.negotiation.round >= settings.max_negotiation_rounds) {
        return { success: false, message: 'Max negotiation rounds reached' };
      }
      
      // Calculate new offer (split the difference or increment)
      const increment = params.increment_percent || settings.counter_increment_percent;
      const currentOffer = context.negotiation.offer_amount;
      const counterOffer = context.negotiation.counter_amount;
      
      // New offer = current + increment%, but not more than their counter
      let newOffer = currentOffer * (1 + increment / 100);
      newOffer = Math.min(newOffer, counterOffer);
      
      // Ensure within bounds
      const maxOffer = context.bill.total_billed * (settings.max_offer_percent / 100);
      newOffer = Math.min(newOffer, maxOffer);
      newOffer = Math.round(newOffer * 100) / 100;
      
      // Create new negotiation round
      const result = await pool.query(`
        INSERT INTO negotiations (bill_id, initial_offer, current_offer, strategy, round, status, auto_negotiated, created_at, updated_at)
        VALUES ($1, $2, $2, 'medicare_percentage', $3, 'pending', true, NOW(), NOW())
        RETURNING id
      `, [context.bill.id, newOffer, context.negotiation.round + 1]);
      
      return { 
        success: true, 
        message: `Auto-countered with $${newOffer.toFixed(2)}`,
        data: { negotiation_id: result.rows[0].id, offer_amount: newOffer }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Auto-accept
  private async executeAutoAccept(context: RuleContext): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!context.negotiation) {
        return { success: false, message: 'No negotiation to accept' };
      }
      
      const finalAmount = context.negotiation.counter_amount || context.negotiation.offer_amount;
      const savings = context.bill.total_billed - finalAmount;
      const savingsPercent = (savings / context.bill.total_billed) * 100;
      
      // Update negotiation
      await pool.query(`
        UPDATE negotiations 
        SET status = 'accepted', response_status = 'accepted', 
            final_amount = $1, savings_amount = $2, savings_percent = $3,
            settled_at = NOW(), updated_at = NOW()
        WHERE id = $4
      `, [finalAmount, savings, savingsPercent, context.negotiation.id]);
      
      // Update bill
      await pool.query(`
        UPDATE bills SET status = 'settled', settled_amount = $1, updated_at = NOW() WHERE id = $2
      `, [finalAmount, context.bill.id]);
      
      return { 
        success: true, 
        message: `Auto-accepted at $${finalAmount.toFixed(2)} (saved ${savingsPercent.toFixed(0)}%)`,
        data: { final_amount: finalAmount, savings, savings_percent: savingsPercent }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Escalate to human
  private async executeAutoEscalate(
    context: RuleContext,
    params: Record<string, any>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const reason = params.reason || 'Requires human review';
      
      // Log escalation
      await pool.query(`
        INSERT INTO rule_executions (bill_id, negotiation_id, client_id, rule_type, action_type, params, result, created_at)
        VALUES ($1, $2, $3, 'auto_escalate', 'escalate', $4, $5, NOW())
      `, [
        context.bill.id,
        context.negotiation?.id,
        context.bill.client_id,
        JSON.stringify(params),
        JSON.stringify({ escalated: true, reason })
      ]);
      
      // Update bill to show it needs attention
      await pool.query(`
        UPDATE bills SET 
          notes = COALESCE(notes, '') || E'\n[ESCALATED] ' || $1,
          updated_at = NOW()
        WHERE id = $2
      `, [reason, context.bill.id]);
      
      return { success: true, message: `Escalated: ${reason}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Action: Send notification
  private async executeNotification(
    context: RuleContext,
    params: Record<string, any>,
    settings: NegotiationSettings
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const emails = settings.notification_emails || [];
      if (emails.length === 0) {
        return { success: false, message: 'No notification emails configured' };
      }
      
      // In real implementation, send via SES
      console.log(`[NOTIFICATION] Event: ${params.event}, Bill: ${context.bill.id}, To: ${emails.join(', ')}`);
      
      return { success: true, message: `Notification sent to ${emails.length} recipients` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Process a bill through the rules engine
  async processBill(billId: number): Promise<{ executed: RuleEvaluationResult[]; errors: string[] }> {
    const executed: RuleEvaluationResult[] = [];
    const errors: string[] = [];
    
    // Get bill and context
    const billResult = await pool.query(`
      SELECT b.*, c.name as client_name
      FROM bills b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = $1
    `, [billId]);
    
    if (billResult.rows.length === 0) {
      return { executed, errors: ['Bill not found'] };
    }
    
    const bill = billResult.rows[0];
    
    // Get latest negotiation if any
    const negResult = await pool.query(`
      SELECT * FROM negotiations WHERE bill_id = $1 ORDER BY round DESC LIMIT 1
    `, [billId]);
    
    // Get provider history
    const providerResult = await pool.query(`
      SELECT avg_settlement_percent, total_negotiations FROM bill_providers WHERE npi = $1
    `, [bill.provider_npi]);
    
    // Build context
    const context: RuleContext = {
      bill: {
        id: bill.id,
        client_id: bill.client_id,
        total_billed: parseFloat(bill.total_billed),
        fair_price: bill.fair_price ? parseFloat(bill.fair_price) : undefined,
        savings_percent: bill.fair_price ? 
          ((parseFloat(bill.total_billed) - parseFloat(bill.fair_price)) / parseFloat(bill.total_billed)) * 100 : undefined,
        provider_name: bill.provider_name,
        provider_npi: bill.provider_npi,
        member_type: bill.member_type,
        date_of_service: bill.date_of_service,
        received_at: bill.received_at,
        status: bill.status
      },
      negotiation: negResult.rows[0] ? {
        id: negResult.rows[0].id,
        round: negResult.rows[0].round,
        offer_amount: parseFloat(negResult.rows[0].current_offer || negResult.rows[0].initial_offer),
        counter_amount: negResult.rows[0].counter_amount ? parseFloat(negResult.rows[0].counter_amount) : undefined,
        status: negResult.rows[0].status
      } : undefined,
      provider_history: providerResult.rows[0] || undefined
    };
    
    // Get settings and rules
    const settings = await this.getClientSettings(bill.client_id);
    
    // Check autonomy level
    if (settings.autonomy_level === 'manual') {
      return { executed, errors: ['Client is in manual mode - no auto-actions'] };
    }
    
    // Evaluate rules
    const results = await this.evaluateRules(context);
    
    // Execute matched rules
    for (const result of results) {
      if (result.matched && result.action) {
        // In semi-autonomous mode, only execute certain action types
        if (settings.autonomy_level === 'semi_autonomous') {
          const allowedInSemi = ['auto_analyze', 'notification', 'auto_escalate'];
          if (!allowedInSemi.includes(result.action.type)) {
            result.reason = `Skipped in semi-autonomous mode: ${result.action.type}`;
            executed.push(result);
            continue;
          }
        }
        
        const execResult = await this.executeAction(context, result.action, settings);
        result.reason = execResult.message;
        executed.push(result);
        
        if (!execResult.success) {
          errors.push(`Rule "${result.rule_name}": ${execResult.message}`);
        }
      }
    }
    
    return { executed, errors };
  }
}

// Singleton
export const rulesEngine = new RulesEngine();
