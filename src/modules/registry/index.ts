/**
 * DOKit Module Registry (The Paint Palette)
 * 
 * This is the central registry of all available modules/tools.
 * Each module is a self-contained "building block" that can be
 * assigned to any client.
 * 
 * To add a new module:
 * 1. Create the module folder in src/modules/[module-name]/
 * 2. Add it to this registry
 * 3. Assign it to clients in src/clients/[client].json
 */

import { ReactNode } from 'react';

// ============================================================
// MODULE INTERFACE
// ============================================================

export interface DokitModule {
  // Identity
  id: string;
  name: string;
  description: string;
  icon: string;  // Emoji or icon name
  category: ModuleCategory;
  
  // Pricing (for reference)
  monthlyPrice?: number;
  
  // Status
  status: 'active' | 'beta' | 'coming-soon' | 'deprecated';
  
  // Routes this module provides
  routes: ModuleRoute[];
  
  // Dashboard widget (optional)
  dashboardWidget?: string;
  
  // Required permissions
  permissions?: string[];
  
  // Dependencies on other modules
  dependencies?: string[];
}

export interface ModuleRoute {
  path: string;
  name: string;
  icon?: string;
  showInSidebar?: boolean;
}

export type ModuleCategory = 
  | 'intake'
  | 'claims'
  | 'operations'
  | 'analytics'
  | 'integrations'
  | 'admin';

// ============================================================
// THE PAINT PALETTE - All Available Modules
// ============================================================

export const moduleRegistry: Record<string, DokitModule> = {
  
  // ─────────────────────────────────────────────────────────
  // INTAKE MODULES
  // ─────────────────────────────────────────────────────────
  
  'document-intake': {
    id: 'document-intake',
    name: 'Document Intake',
    description: 'AI-powered document processing and data extraction',
    icon: '📥',
    category: 'intake',
    monthlyPrice: 750,
    status: 'active',
    routes: [
      { path: '/workflows/document-intake', name: 'Documents', showInSidebar: true },
    ],
    dashboardWidget: 'DocumentIntakeWidget',
  },
  
  'member-intake': {
    id: 'member-intake',
    name: 'Member Intake',
    description: 'New member application processing',
    icon: '👤',
    category: 'intake',
    monthlyPrice: 500,
    status: 'active',
    routes: [
      { path: '/workflows/member-intake', name: 'Member Intake', showInSidebar: true },
    ],
  },
  
  'application-intake': {
    id: 'application-intake',
    name: 'Application Intake',
    description: 'SNF/Healthcare application intake and review',
    icon: '📋',
    category: 'intake',
    monthlyPrice: 750,
    status: 'active',
    routes: [
      { path: '/applications', name: 'Applications', showInSidebar: true },
      { path: '/review', name: 'Review Queue', showInSidebar: true },
    ],
    dashboardWidget: 'ApplicationsWidget',
  },
  
  // ─────────────────────────────────────────────────────────
  // CLAIMS MODULES
  // ─────────────────────────────────────────────────────────
  
  'claims-adjudication': {
    id: 'claims-adjudication',
    name: 'Claims Adjudication',
    description: 'Review and adjudicate healthcare claims',
    icon: '⚖️',
    category: 'claims',
    monthlyPrice: 1000,
    status: 'active',
    routes: [
      { path: '/workflows/claims-adjudication', name: 'Claims', showInSidebar: true },
      { path: '/decisions', name: 'Decisions', showInSidebar: true },
    ],
    dashboardWidget: 'ClaimsWidget',
  },
  
  'claims-repricing': {
    id: 'claims-repricing',
    name: 'Claims Repricing',
    description: 'Reprice medical claims against fee schedules',
    icon: '💰',
    category: 'claims',
    monthlyPrice: 750,
    status: 'active',
    routes: [
      { path: '/workflows/claims-repricing', name: 'Repricing', showInSidebar: true },
    ],
  },
  
  'bill-negotiator': {
    id: 'bill-negotiator',
    name: 'Bill Negotiator',
    description: 'AI-powered medical bill analysis and negotiation',
    icon: '🏥',
    category: 'claims',
    monthlyPrice: 1000,
    status: 'active',
    routes: [
      { path: '/bill-negotiator', name: 'Bill Negotiator', showInSidebar: true },
      { path: '/bill-negotiator/bills', name: 'Bills', showInSidebar: false },
      { path: '/bill-negotiator/analytics', name: 'Analytics', showInSidebar: false },
    ],
    dashboardWidget: 'BillNegotiatorWidget',
  },
  
  'provider-bills': {
    id: 'provider-bills',
    name: 'Provider Bills',
    description: 'Process and manage provider billing',
    icon: '🧾',
    category: 'claims',
    monthlyPrice: 500,
    status: 'active',
    routes: [
      { path: '/workflows/provider-bills', name: 'Provider Bills', showInSidebar: true },
    ],
  },
  
  'workers-comp': {
    id: 'workers-comp',
    name: 'Workers Comp',
    description: 'Workers compensation claims processing',
    icon: '🦺',
    category: 'claims',
    monthlyPrice: 750,
    status: 'active',
    routes: [
      { path: '/workflows/workers-comp', name: 'Workers Comp', showInSidebar: true },
    ],
  },
  
  // ─────────────────────────────────────────────────────────
  // OPERATIONS MODULES
  // ─────────────────────────────────────────────────────────
  
  'bed-management': {
    id: 'bed-management',
    name: 'Bed Management',
    description: 'Track bed availability across facilities',
    icon: '🛏️',
    category: 'operations',
    monthlyPrice: 500,
    status: 'active',
    routes: [
      { path: '/beds', name: 'Bed Management', showInSidebar: true },
    ],
    dashboardWidget: 'BedAvailabilityWidget',
  },
  
  'scheduling': {
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Appointment and resource scheduling',
    icon: '📅',
    category: 'operations',
    monthlyPrice: 500,
    status: 'active',
    routes: [
      { path: '/workflows/scheduling', name: 'Scheduling', showInSidebar: true },
    ],
  },
  
  // ─────────────────────────────────────────────────────────
  // ANALYTICS MODULES
  // ─────────────────────────────────────────────────────────
  
  'analytics': {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Reporting and business intelligence',
    icon: '📊',
    category: 'analytics',
    monthlyPrice: 250,
    status: 'active',
    routes: [
      { path: '/analytics', name: 'Analytics', showInSidebar: true },
    ],
    dashboardWidget: 'AnalyticsWidget',
  },
  
  'audit-log': {
    id: 'audit-log',
    name: 'Audit Log',
    description: 'Activity tracking and compliance logging',
    icon: '📜',
    category: 'analytics',
    monthlyPrice: 100,
    status: 'active',
    routes: [
      { path: '/audit-log', name: 'Audit Log', showInSidebar: true },
    ],
  },
  
  // ─────────────────────────────────────────────────────────
  // ADMIN MODULES (Usually included for all)
  // ─────────────────────────────────────────────────────────
  
  'team-management': {
    id: 'team-management',
    name: 'Team Management',
    description: 'Manage users, roles, and permissions',
    icon: '👥',
    category: 'admin',
    monthlyPrice: 0, // Included
    status: 'active',
    routes: [
      { path: '/team', name: 'Team', showInSidebar: true },
    ],
  },
  
  'integrations': {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect to external systems and APIs',
    icon: '🔌',
    category: 'integrations',
    monthlyPrice: 0, // Included
    status: 'active',
    routes: [
      { path: '/integrations', name: 'Integrations', showInSidebar: true },
    ],
  },
  
  'email-intake': {
    id: 'email-intake',
    name: 'Email Intake',
    description: 'Process documents received via email',
    icon: '📧',
    category: 'integrations',
    monthlyPrice: 250,
    status: 'active',
    routes: [
      { path: '/email-intake', name: 'Email Intake', showInSidebar: true },
    ],
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get modules for a specific client based on their config
 */
export function getClientModules(moduleIds: string[]): DokitModule[] {
  return moduleIds
    .map(id => moduleRegistry[id])
    .filter(Boolean);
}

/**
 * Get all sidebar routes for a client's modules
 */
export function getClientRoutes(moduleIds: string[]): ModuleRoute[] {
  const modules = getClientModules(moduleIds);
  return modules.flatMap(m => m.routes.filter(r => r.showInSidebar));
}

/**
 * Calculate monthly price for selected modules
 */
export function calculateMonthlyPrice(moduleIds: string[]): number {
  const modules = getClientModules(moduleIds);
  return modules.reduce((sum, m) => sum + (m.monthlyPrice || 0), 0);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: ModuleCategory): DokitModule[] {
  return Object.values(moduleRegistry).filter(m => m.category === category);
}

/**
 * Get all active modules
 */
export function getActiveModules(): DokitModule[] {
  return Object.values(moduleRegistry).filter(m => m.status === 'active');
}
