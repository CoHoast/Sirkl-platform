/**
 * Client Configuration Loader
 * 
 * Loads client configurations and provides helper functions.
 */

import optalis from './optalis.json';
import solidarity from './solidarity.json';
import unitedRefuah from './united-refuah.json';
import { getClientModules, calculateMonthlyPrice } from '../modules/registry';

// ============================================================
// CLIENT INTERFACE
// ============================================================

export interface ClientConfig {
  id: string;
  name: string;
  industry: string;
  industryType: string;
  subdomain: string;
  modules: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
  };
  settings: Record<string, any>;
  contact: {
    name: string;
    email: string;
  };
  billing: {
    onboardingFee: number | null;
    monthlyFee: number | null;
    billingCycle: string;
  };
  status: 'prospect' | 'onboarding' | 'active' | 'churned';
  createdAt: string;
  goLiveDate: string | null;
}

// ============================================================
// ALL CLIENTS
// ============================================================

export const clients: Record<string, ClientConfig> = {
  'optalis': optalis as ClientConfig,
  'solidarity': solidarity as ClientConfig,
  'united-refuah': unitedRefuah as ClientConfig,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get a client by ID
 */
export function getClient(clientId: string): ClientConfig | undefined {
  return clients[clientId];
}

/**
 * Get a client by subdomain
 */
export function getClientBySubdomain(subdomain: string): ClientConfig | undefined {
  return Object.values(clients).find(c => c.subdomain === subdomain);
}

/**
 * Get all clients
 */
export function getAllClients(): ClientConfig[] {
  return Object.values(clients);
}

/**
 * Get clients by status
 */
export function getClientsByStatus(status: ClientConfig['status']): ClientConfig[] {
  return Object.values(clients).filter(c => c.status === status);
}

/**
 * Get a client's modules with full details
 */
export function getClientModuleDetails(clientId: string) {
  const client = getClient(clientId);
  if (!client) return [];
  return getClientModules(client.modules);
}

/**
 * Get calculated monthly cost for a client
 */
export function getClientMonthlyCost(clientId: string): number {
  const client = getClient(clientId);
  if (!client) return 0;
  return calculateMonthlyPrice(client.modules);
}

/**
 * Check if a client has a specific module
 */
export function clientHasModule(clientId: string, moduleId: string): boolean {
  const client = getClient(clientId);
  if (!client) return false;
  return client.modules.includes(moduleId);
}
