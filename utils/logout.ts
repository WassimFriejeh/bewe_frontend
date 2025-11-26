import { removeToken } from "./token";

/**
 * Logs out the user by removing token and redirecting to login
 */
export function logout(): void {
  removeToken();
  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

