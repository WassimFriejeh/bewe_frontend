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
 * TEMPORARY: All access is allowed - remove this override to restore access control
 */
export function hasPagePermission(path: string): boolean {
  // TEMPORARY: Allow all access
  return true;
  
  // Original code (commented out temporarily):
  // const user = getUser();
  // if (!user?.permissions) return false;
  // 
  // const requiredPermission = PAGE_PERMISSIONS[path];
  // 
  // // If no permission is required for this path, allow access
  // if (!requiredPermission) return true;
  // 
  // // Check if user has the required permission
  // return user.permissions.includes(requiredPermission);
}

/**
 * Get all allowed pages for the current user
 * TEMPORARY: All pages are allowed - remove this override to restore access control
 */
export function getAllowedPages(): string[] {
  // TEMPORARY: Return all pages
  return Object.keys(PAGE_PERMISSIONS);
  
  // Original code (commented out temporarily):
  // const user = getUser();
  // if (!user?.permissions) return [];
  // 
  // return Object.entries(PAGE_PERMISSIONS)
  //   .filter(([path, permission]) => {
  //     return user.permissions!.includes(permission);
  //   })
  //   .map(([path]) => path);
}

/**
 * Check if user has a specific permission
 * TEMPORARY: All permissions are granted - remove this override to restore access control
 */
export function hasPermission(permission: string): boolean {
  // TEMPORARY: Allow all permissions
  return true;
  
  // Original code (commented out temporarily):
  // const user = getUser();
  // if (!user?.permissions) return false;
  // 
  // return user.permissions.includes(permission);
}

/**
 * Get user permissions
 * TEMPORARY: Returns all possible permissions - remove this override to restore access control
 */
export function getUserPermissions(): string[] {
  // TEMPORARY: Return all permissions to show all menu items and allow all actions
  return [
    "Dashboard",
    "Reports",
    "View Staff",
    "Add Staff",
    "Edit Staff",
    "Delete Staff",
    "Customers",
    "Services & Pricing",
    "Marketing",
    "Memberships",
    "Balance and earnings",
    "Settings",
    "View Reports",
    "View Dashboard",
    "View Customers",
    "View Services",
    "View Marketing",
    "View Memberships",
    "View Balance",
    "View Settings",
    "Create Booking",
    "Add Booking",
    "Edit Booking",
    "View All Bookings",
    "View Own Bookings",
  ];
  
  // Original code (commented out temporarily):
  // const user = getUser();
  // return user?.permissions || [];
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
