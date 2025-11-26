/**
 * Token storage utilities
 * Stores authentication token in localStorage
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";
const BRANCHES_KEY = "user_branches";
const CURRENT_BRANCH_KEY = "current_branch";

export interface Branch {
  id?: string | number;
  label?: string;
  name?: string; // Legacy support
  [key: string]: any;
}

export interface User {
  id?: string;
  email?: string;
  permissions?: string[];
  branch?: any; // Legacy support
  branches?: Branch[]; // New: collection of branches
  [key: string]: any;
}

/**
 * Stores the authentication token
 */

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    console.log("setToken() called with:", token);
    console.log("Token type:", typeof token);
    console.log("Token length:", token?.length);
    
    if (!token || token === "undefined" || token === "null") {
      console.warn("Attempting to store empty/undefined/null token:", token);
      return;
    }
    
    try {
      localStorage.setItem(TOKEN_KEY, token);
      const verify = localStorage.getItem(TOKEN_KEY);
      console.log("Token stored in localStorage - Key:", TOKEN_KEY);
      console.log("Token stored - Value:", token);
      console.log("Verification read back:", verify);
      console.log("Storage successful:", verify === token);
    } catch (error) {
      console.error("Error storing token in localStorage:", error);
    }
  } else {
    console.warn("setToken() called but window is undefined (SSR)");
  }
}

/**
 * Retrieves the authentication token
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log("getToken() called - Key:", TOKEN_KEY, "Value:", token);
    // Handle case where localStorage might return "undefined" as string
    if (token === "undefined" || token === null) {
      console.warn("Token is undefined or null");
      return null;
    }
    return token;
  }
  return null;
}

/**
 * Removes the authentication token
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(BRANCHES_KEY);
    localStorage.removeItem(CURRENT_BRANCH_KEY);
  }
}

/**
 * Stores user data
 */
export function setUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Retrieves user data
 */
export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem(USER_KEY);
    
    // Check if userData exists and is valid
    if (!userData || userData === "undefined" || userData === "null") {
      return null;
    }
    
    try {
      const parsed = JSON.parse(userData);
      console.log("Parsed user data from localStorage:", parsed);
      
      // Handle the new structure where we store API data directly
      if (parsed.user && parsed.permissions && parsed.branch) {
        // This is the API data structure: { user, permissions, branch }
        return {
          ...parsed.user,
          permissions: parsed.permissions,
          branch: parsed.branch
        };
      } else if (parsed.user) {
        // Legacy structure with nested user
        return {
          ...parsed.user,
          permissions: parsed.permissions || [],
          branch: parsed.branch
        };
      }
      // Direct user object (fallback)
      return parsed;
    } catch (error) {
      // If parsing fails, remove invalid data and return null
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
  return null;
}

/**
 * Checks if user is authenticated (has a token)
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Stores branches array
 */
export function setBranches(branches: Branch[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
  }
}

/**
 * Retrieves branches array
 */
export function getBranches(): Branch[] {
  if (typeof window !== "undefined") {
    const branchesData = localStorage.getItem(BRANCHES_KEY);
    if (!branchesData || branchesData === "undefined" || branchesData === "null") {
      return [];
    }
    try {
      return JSON.parse(branchesData);
    } catch (error) {
      console.error("Error parsing branches from localStorage:", error);
      return [];
    }
  }
  return [];
}

/**
 * Stores the current/active branch
 */
export function setCurrentBranch(branch: Branch): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_BRANCH_KEY, JSON.stringify(branch));
  }
}

/**
 * Retrieves the current/active branch
 */
export function getCurrentBranch(): Branch | null {
  if (typeof window !== "undefined") {
    const branchData = localStorage.getItem(CURRENT_BRANCH_KEY);
    if (!branchData || branchData === "undefined" || branchData === "null") {
      return null;
    }
    try {
      return JSON.parse(branchData);
    } catch (error) {
      console.error("Error parsing current branch from localStorage:", error);
      return null;
    }
  }
  return null;
}
