import { getToken, isAuthenticated } from "./token";

/**
 * Checks if the user is authenticated
 * Only validates token locally without making API calls for better performance
 * @returns Promise<boolean> - true if authenticated, false otherwise
 */
export async function checkAuth(): Promise<boolean> {
  // Just check if token exists locally - no API call needed
  return isAuthenticated();
}
