// Phase 2D: Rules Engine Tables Migration

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    // Create negotiation_settings table (client-level config)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS negotiation_settings (
        client_id INTEGER PRIMARY KEY REFERENCES clients(id),
        
        -- Autonomy level
        autonomy_level VARCHAR(20) NOT NULL DEFAULT 'manual'
          CHECK (autonomy_level IN ('manual', 'semi_autonomous', 'fully_autonomous')),
        
        -- Offer defaults
        default_initial_offer_percent INTEGER NOT NULL DEFAULT 50,
        max_offer_percent INTEGER NOT NULL DEFAULT 75,
        min_offer_percent INTEGER NOT NULL DEFAULT 35,
        
        -- Counter response settings
        auto_accept_threshold INTEGER NOT NULL DEFAULT 5,
        max_negotiation_rounds INTEGER NOT NULL DEFAULT 3,
        counter_increment_percent INTEGER NOT NULL DEFAULT 10,
        
        -- Timing
        days_to_respond INTEGER NOT NULL DEFAULT 14,
        days_before_followup INTEGER NOT NULL DEFAULT 7,
        days_before_escalation INTEGER NOT NULL DEFAULT 21,
        
        -- Auto-send settings
        auto_send_method VARCHAR(20) NOT NULL DEFAULT 'none'
          CHECK (auto_send_method IN ('fax', 'email', 'both', 'none')),
        require_fax_confirmation BOOLEAN DEFAULT true,
        
        -- Notification settings
        notify_on_new_bill BOOLEAN DEFAULT true,
        notify_on_response BOOLEAN DEFAULT true,
        notify_on_settlement BOOLEAN DEFAULT true,
        notify_on_escalation BOOLEAN DEFAULT true,
        notification_emails JSONB DEFAULT '[]',
        
        -- Metadata
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by VARCHAR(255)
      )
    `);
    
    // Create negotiation_rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS negotiation_rules (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        
        -- Rule details
        name VARCHAR(255) NOT NULL,
        description TEXT,
        rule_type VARCHAR(50) NOT NULL,
        priority INTEGER NOT NULL DEFAULT 100,
        is_active BOOLEAN DEFAULT true,
        
        -- Conditions
        conditions JSONB NOT NULL DEFAULT '[]',
        condition_logic VARCHAR(10) DEFAULT 'and'
          CHECK (condition_logic IN ('and', 'or')),
        
        -- Action
        action JSONB NOT NULL,
        
        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `);
    
    // Create rule_executions table (audit log)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rule_executions (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(id),
        negotiation_id INTEGER REFERENCES negotiations(id),
        client_id INTEGER NOT NULL REFERENCES clients(id),
        rule_id INTEGER REFERENCES negotiation_rules(id),
        rule_type VARCHAR(50) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        params JSONB,
        result JSONB,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_rules_client ON negotiation_rules(client_id);
      CREATE INDEX IF NOT EXISTS idx_rules_active ON negotiation_rules(client_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_rule_exec_bill ON rule_executions(bill_id);
      CREATE INDEX IF NOT EXISTS idx_rule_exec_client ON rule_executions(client_id);
    `);
    
    // Add response timing columns (for human-like delays)
    const timingColumns = [
      { name: 'response_delay_mode', type: "VARCHAR(20) DEFAULT 'natural'" },
      { name: 'response_delay_min_minutes', type: 'INTEGER DEFAULT 60' },
      { name: 'response_delay_max_minutes', type: 'INTEGER DEFAULT 240' },
      { name: 'response_business_hours_only', type: 'BOOLEAN DEFAULT true' },
      { name: 'response_weekdays_only', type: 'BOOLEAN DEFAULT false' },
    ];
    
    for (const col of timingColumns) {
      try {
        await pool.query(`
          ALTER TABLE negotiation_settings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
      } catch (e) {
        // Column might already exist
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rules engine tables created successfully with response timing columns',
      tables: ['negotiation_settings', 'negotiation_rules', 'rule_executions'],
      timing_columns: timingColumns.map(c => c.name)
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
