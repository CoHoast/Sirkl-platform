// Phase 2D: Rules Engine Types

export type AutonomyLevel = 'manual' | 'semi_autonomous' | 'fully_autonomous';

export type RuleType = 
  | 'auto_analyze'      // Auto-analyze bills on intake
  | 'auto_offer'        // Auto-generate offers
  | 'auto_send'         // Auto-send offers
  | 'auto_counter'      // Auto-respond to counters
  | 'auto_accept'       // Auto-accept within thresholds
  | 'auto_escalate'     // Auto-escalate to human
  | 'notification';     // Send notifications

export type RuleConditionField = 
  | 'total_billed'
  | 'fair_price'
  | 'savings_percent'
  | 'provider_name'
  | 'provider_npi'
  | 'provider_history'  // avg settlement %
  | 'member_type'
  | 'date_of_service'
  | 'days_since_received'
  | 'negotiation_round'
  | 'counter_amount'
  | 'counter_vs_offer';  // % difference

export type RuleOperator = 
  | 'equals' | 'not_equals'
  | 'greater_than' | 'less_than'
  | 'greater_or_equal' | 'less_or_equal'
  | 'between' | 'not_between'
  | 'contains' | 'not_contains'
  | 'in_list' | 'not_in_list';

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleOperator;
  value: string | number | string[] | number[];
  value2?: string | number; // For 'between' operator
}

export interface RuleAction {
  type: RuleType;
  params: Record<string, any>;
}

export interface NegotiationRule {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  rule_type: RuleType;
  priority: number; // Lower = higher priority
  is_active: boolean;
  
  // When to apply
  conditions: RuleCondition[];
  condition_logic: 'and' | 'or'; // How to combine conditions
  
  // What to do
  action: RuleAction;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

// Client-level negotiation settings
export interface NegotiationSettings {
  client_id: number;
  
  // Autonomy level
  autonomy_level: AutonomyLevel;
  
  // Offer defaults
  default_initial_offer_percent: number;  // e.g., 50 = 50% of billed
  max_offer_percent: number;              // e.g., 80 = never offer more than 80%
  min_offer_percent: number;              // e.g., 30 = never offer less than 30%
  
  // Counter response settings
  auto_accept_threshold: number;          // Accept if counter is within X% of our offer
  max_negotiation_rounds: number;         // Give up after N rounds
  counter_increment_percent: number;      // Increase offer by X% each round
  
  // Timing
  days_to_respond: number;                // Response deadline in offer letters
  days_before_followup: number;           // Send reminder after N days
  days_before_escalation: number;         // Escalate to human after N days
  
  // Auto-send settings
  auto_send_method: 'fax' | 'email' | 'both' | 'none';
  require_fax_confirmation: boolean;
  
  // Notification settings
  notify_on_new_bill: boolean;
  notify_on_response: boolean;
  notify_on_settlement: boolean;
  notify_on_escalation: boolean;
  notification_emails: string[];
  
  // Metadata
  updated_at: Date;
  updated_by?: string;
}

// Default settings for new clients
export const DEFAULT_NEGOTIATION_SETTINGS: Omit<NegotiationSettings, 'client_id' | 'updated_at'> = {
  autonomy_level: 'manual',
  
  default_initial_offer_percent: 50,
  max_offer_percent: 75,
  min_offer_percent: 35,
  
  auto_accept_threshold: 5,   // Accept if within 5% of our offer
  max_negotiation_rounds: 3,
  counter_increment_percent: 10,
  
  days_to_respond: 14,
  days_before_followup: 7,
  days_before_escalation: 21,
  
  auto_send_method: 'none',
  require_fax_confirmation: true,
  
  notify_on_new_bill: true,
  notify_on_response: true,
  notify_on_settlement: true,
  notify_on_escalation: true,
  notification_emails: []
};

// Pre-built rule templates
export const RULE_TEMPLATES = {
  // Auto-analyze all incoming bills
  autoAnalyze: {
    name: 'Auto-Analyze All Bills',
    description: 'Automatically analyze bills when they arrive',
    rule_type: 'auto_analyze' as RuleType,
    conditions: [],
    condition_logic: 'and' as const,
    action: { type: 'auto_analyze' as RuleType, params: {} }
  },
  
  // Auto-offer for small bills
  autoOfferSmallBills: {
    name: 'Auto-Offer for Small Bills',
    description: 'Automatically create offer for bills under $1,000',
    rule_type: 'auto_offer' as RuleType,
    conditions: [
      { field: 'total_billed' as RuleConditionField, operator: 'less_than' as RuleOperator, value: 1000 }
    ],
    condition_logic: 'and' as const,
    action: { 
      type: 'auto_offer' as RuleType, 
      params: { offer_percent: 50 } 
    }
  },
  
  // Auto-accept close counters
  autoAcceptClose: {
    name: 'Auto-Accept Close Counters',
    description: 'Accept counters within 5% of our offer',
    rule_type: 'auto_accept' as RuleType,
    conditions: [
      { field: 'counter_vs_offer' as RuleConditionField, operator: 'less_or_equal' as RuleOperator, value: 5 }
    ],
    condition_logic: 'and' as const,
    action: { type: 'auto_accept' as RuleType, params: {} }
  },
  
  // Auto-counter with increment
  autoCounter: {
    name: 'Auto-Counter Reasonable Responses',
    description: 'Auto-counter if their counter is within 20% of our offer',
    rule_type: 'auto_counter' as RuleType,
    conditions: [
      { field: 'counter_vs_offer' as RuleConditionField, operator: 'less_or_equal' as RuleOperator, value: 20 },
      { field: 'negotiation_round' as RuleConditionField, operator: 'less_than' as RuleOperator, value: 3 }
    ],
    condition_logic: 'and' as const,
    action: { 
      type: 'auto_counter' as RuleType, 
      params: { increment_percent: 10 } 
    }
  },
  
  // Escalate high-value bills
  escalateHighValue: {
    name: 'Escalate High-Value Bills',
    description: 'Require human review for bills over $10,000',
    rule_type: 'auto_escalate' as RuleType,
    conditions: [
      { field: 'total_billed' as RuleConditionField, operator: 'greater_than' as RuleOperator, value: 10000 }
    ],
    condition_logic: 'and' as const,
    action: { 
      type: 'auto_escalate' as RuleType, 
      params: { reason: 'High value bill requires human review' } 
    }
  },
  
  // Notify on settlement
  notifySettlement: {
    name: 'Notify on Settlement',
    description: 'Send notification when a bill is settled',
    rule_type: 'notification' as RuleType,
    conditions: [],
    condition_logic: 'and' as const,
    action: { 
      type: 'notification' as RuleType, 
      params: { event: 'settlement', channels: ['email'] } 
    }
  }
};

// Rule evaluation context
export interface RuleContext {
  bill: {
    id: number;
    client_id: number;
    total_billed: number;
    fair_price?: number;
    savings_percent?: number;
    provider_name: string;
    provider_npi?: string;
    member_type?: string;
    date_of_service: string;
    received_at: string;
    status: string;
  };
  negotiation?: {
    id: number;
    round: number;
    offer_amount: number;
    counter_amount?: number;
    status: string;
  };
  provider_history?: {
    avg_settlement_percent: number;
    total_negotiations: number;
  };
}

// Rule evaluation result
export interface RuleEvaluationResult {
  rule_id: number;
  rule_name: string;
  matched: boolean;
  action?: RuleAction;
  reason?: string;
}
