/**
 * [MODULE NAME] Module
 * 
 * Description: [What this module does]
 * 
 * To use this template:
 * 1. Copy this folder to src/modules/your-module-name/
 * 2. Update this file with your module's details
 * 3. Register in src/modules/registry/index.ts
 */

import { DokitModule } from '../registry';

// ============================================================
// MODULE DEFINITION
// ============================================================

export const moduleDefinition: DokitModule = {
  // Identity
  id: 'your-module-id',           // Unique identifier (kebab-case)
  name: 'Your Module Name',        // Display name
  description: 'What this module does',
  icon: '📦',                      // Emoji or icon name
  category: 'operations',          // intake | claims | operations | analytics | integrations | admin
  
  // Pricing
  monthlyPrice: 500,               // Monthly cost (0 if included)
  
  // Status
  status: 'coming-soon',           // active | beta | coming-soon | deprecated
  
  // Routes this module adds to the dashboard
  routes: [
    {
      path: '/your-module',        // URL path
      name: 'Your Module',         // Sidebar label
      icon: '📦',                  // Sidebar icon
      showInSidebar: true,         // Show in navigation?
    },
    {
      path: '/your-module/:id',    // Detail page (usually hidden)
      name: 'Details',
      showInSidebar: false,
    },
  ],
  
  // Dashboard widget component name (optional)
  dashboardWidget: 'YourModuleWidget',
  
  // Required permissions (optional)
  permissions: ['view:your-module', 'edit:your-module'],
  
  // Other modules this depends on (optional)
  dependencies: [],
};

// ============================================================
// EXPORTS
// ============================================================

// Export components (add as you build them)
// export { YourModuleList } from './components/List';
// export { YourModuleDetail } from './components/Detail';
// export { YourModuleForm } from './components/Form';

// Export hooks
// export { useYourModuleData } from './hooks/useData';

// Export API functions
// export { yourModuleApi } from './api/client';

// Export types
// export * from './types';

// Default export is the module definition
export default moduleDefinition;
