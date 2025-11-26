/**
 * Permission utilities for protecting routes and components
 */

import { getUser, getCurrentBranch } from "./token";

// Map of page paths to required permissions
export const PAGE_PERMISSIONS: Record<string, string> = {
  "/booking/create": "Create Booking",
  "/reports": "View Reports",
  "/dashboard": "View Dashboard",
  "/staff": "View Staff",
  "/customers": "View Customers",
  "/services": "View Services",
  "/marketing": "View Marketing",
  "/memberships": "View Memberships",
  "/balance": "View Balance",
  "/settings": "View Settings",
  "/booking/edit": "Edit Booking",
  // Calendar doesn't require permission
};

/**
 * Check if user has permission for a specific page
 */
export function hasPagePermission(path: string): boolean {
  const user = getUser();
  if (!user?.permissions) return false;
  
  const requiredPermission = PAGE_PERMISSIONS[path];
  
  // If no permission is required for this path, allow access
  if (!requiredPermission) return true;
  
  // Check if user has the required permission
  return user.permissions.includes(requiredPermission);
}

/**
 * Get all allowed pages for the current user
 */
export function getAllowedPages(): string[] {
  const user = getUser();
  if (!user?.permissions) return [];
  
  return Object.entries(PAGE_PERMISSIONS)
    .filter(([path, permission]) => {
      return user.permissions!.includes(permission);
    })
    .map(([path]) => path);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission: string): boolean {
  const user = getUser();
  if (!user?.permissions) return false;
  
  return user.permissions.includes(permission);
}

/**
 * Get user permissions
 */
export function getUserPermissions(): string[] {
  const user = getUser();
  return user?.permissions || [];
}

/**
 * Get user branch information
 * Returns the current active branch (from context/storage) or falls back to legacy branch from user data
 */
export function getUserBranch() {
  // Try to get current branch from storage first
  const currentBranch = getCurrentBranch();
  if (currentBranch) {
    return currentBranch;
  }
  
  // Fallback to legacy branch from user data
  const user = getUser();
  return user?.branch || null;
}
