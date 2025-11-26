import { setUser } from "./token";

/**
 * Utility function for testing - sets mock user with permissions
 * This should only be used for development/testing purposes
 */
export function setMockUserWithPermissions(permissions: string[]) {
  const mockUser = {
    id: "test-user-123",
    email: "test@example.com",
    permissions: permissions,
  };
  
  setUser(mockUser);
}

/**
 * Pre-defined permission sets for testing different user roles
 */
export const PERMISSION_SETS = {
  // Admin with all permissions
  ADMIN: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  
  // Staff member with limited permissions
  STAFF: ["0", "2", "4", "11"], // Create Booking, Dashboard, Customers, Calendar
  
  // Manager with more permissions
  MANAGER: ["0", "1", "2", "3", "4", "5", "8", "11"], // Most permissions except marketing, memberships, settings
  
  // Receptionist with basic permissions
  RECEPTIONIST: ["0", "4", "11"], // Create Booking, Customers, Calendar
};

/**
 * Quick setup functions for different user types
 */
export const setupTestUser = {
  asAdmin: () => setMockUserWithPermissions(PERMISSION_SETS.ADMIN),
  asStaff: () => setMockUserWithPermissions(PERMISSION_SETS.STAFF),
  asManager: () => setMockUserWithPermissions(PERMISSION_SETS.MANAGER),
  asReceptionist: () => setMockUserWithPermissions(PERMISSION_SETS.RECEPTIONIST),
};
