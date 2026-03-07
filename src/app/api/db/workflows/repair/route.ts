import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * POST /api/db/workflows/repair
 * 
 * Drops and recreates workflow tables to fix schema issues
 */
export async function POST() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop existing tables (in correct order due to foreign keys)
    await client.query('DROP TABLE IF EXISTS workflow_audit_log CASCADE');
    await client.query('DROP TABLE IF EXISTS workflow_configs CASCADE');
    await client.query('DROP TABLE IF EXISTS client_workflows CASCADE');
    
    // Recreate Table 1: client_workflows
    await client.query(`
      CREATE TABLE client_workflows (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        workflow_key VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        enabled_at TIMESTAMP,
        enabled_by VARCHAR(255),
        disabled_at TIMESTAMP,
        disabled_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(client_id, workflow_key)
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_client_workflows_client 
      ON client_workflows(client_id)
    `);
    
    await client.query(`
      CREATE INDEX idx_client_workflows_enabled 
      ON client_workflows(client_id, enabled) 
      WHERE enabled = true
    `);
    
    // Recreate Table 2: workflow_configs
    await client.query(`
      CREATE TABLE workflow_configs (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        workflow_key VARCHAR(50) NOT NULL,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        
        UNIQUE(client_id, workflow_key)
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_workflow_configs_client 
      ON workflow_configs(client_id)
    `);
    
    // Recreate Table 3: workflow_audit_log
    await client.query(`
      CREATE TABLE workflow_audit_log (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        workflow_key VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        actor VARCHAR(255),
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_workflow_audit_client 
      ON workflow_audit_log(client_id, created_at DESC)
    `);
    
    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Apply triggers
    await client.query(`
      CREATE TRIGGER update_client_workflows_updated_at
        BEFORE UPDATE ON client_workflows
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await client.query(`
      CREATE TRIGGER update_workflow_configs_updated_at
        BEFORE UPDATE ON workflow_configs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      message: 'Workflow tables repaired successfully',
      tables: ['client_workflows', 'workflow_configs', 'workflow_audit_log']
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Repair error:', error);
    return NextResponse.json(
      { 
        error: 'Repair failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
