// Role-based access control for MCO Advantage Dashboard

export type UserRole = 'admin' | 'manager' | 'reviewer';

// Define which routes each role can access
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/dashboard/applications',
    '/dashboard/decisions',
    '/dashboard/reports',
    '/dashboard/audit-log',
    '/dashboard/integrations',
    '/dashboard/team',
    '/dashboard/security',
    '/dashboard/settings',
  ],
  manager: [
    '/dashboard',
    '/dashboard/applications',
    '/dashboard/decisions',
    '/dashboard/reports',
    '/dashboard/audit-log',
    // No integrations
    // No team
    '/dashboard/security',
    '/dashboard/settings',
  ],
  reviewer: [
    '/dashboard/applications',
    '/dashboard/reports',
    // Reviewers can only view applications and reports
  ],
};

// Check if a user can access a specific route
export function canAccess(role: UserRole, path: string): boolean {
  const allowedPaths = rolePermissions[role];
  
  // Check exact match first
  if (allowedPaths.includes(path)) {
    return true;
  }
  
  // Check if path starts with any allowed path (for nested routes)
  return allowedPaths.some(allowedPath => 
    path.startsWith(allowedPath + '/')
  );
}

// Filter navigation items based on role
export function filterNavigation(
  navigationGroups: Array<{
    name: string;
    items: Array<{ name: string; href: string; icon: string }>;
  }>,
  role: UserRole
) {
  return navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => canAccess(role, item.href))
    }))
    .filter(group => group.items.length > 0); // Remove empty groups
}

// Get display name for role
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    reviewer: 'Reviewer',
  };
  return names[role];
}

// Demo users for testing
export const demoUsers: Record<string, { name: string; initials: string; email: string; role: UserRole }> = {
  'chris@dokit.ai': {
    name: 'Chris Guiher',
    initials: 'CG',
    email: 'chris@dokit.ai',
    role: 'admin',
  },
  'michael.chen@mco-advantage.com': {
    name: 'Michael Chen',
    initials: 'MC',
    email: 'michael.chen@mco-advantage.com',
    role: 'manager',
  },
  'sarah.johnson@mco-advantage.com': {
    name: 'Sarah Johnson',
    initials: 'SJ',
    email: 'sarah.johnson@mco-advantage.com',
    role: 'reviewer',
  },
};
