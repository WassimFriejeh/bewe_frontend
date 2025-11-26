import axios from "axios";
import { getToken, removeToken, getCurrentBranch } from "../utils/token";

// Log configuration on client side for debugging
if (typeof window !== "undefined") {
  console.log("🔧 Axios Client Configuration:");
  console.log("Base URL:", process.env.NEXT_PUBLIC_API_URL || "❌ NOT SET");
  console.log("API Key:", process.env.NEXT_PUBLIC_API_SECRET_KEY ? "✅ SET" : "❌ NOT SET");
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Api-Access-Token": process.env.NEXT_PUBLIC_API_SECRET_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add token to headers and branch_id to requests
axiosClient.interceptors.request.use(
  (config) => {
    // Handle FormData - remove Content-Type header so browser can set it with boundary
    if (config.data instanceof FormData) {
      config.headers = config.headers || {};
      delete (config.headers as any)['Content-Type'];
    }
    
    const token = getToken();
    console.log("🔍 Token check - Raw token from getToken():", token ? `${token.substring(0, 20)}...` : "null/undefined");
    
    if (token) {
      // Ensure Authorization header is set with Bearer token
      const bearerToken = `Bearer ${token.trim()}`; // Trim any whitespace
      config.headers = config.headers || {};
      config.headers['Authorization'] = bearerToken;
      
      console.log("🔑 Setting Authorization header:", bearerToken.substring(0, 30) + "...");
      console.log("🔑 Full Authorization header value:", bearerToken);
      console.log("🔑 Token value (first 20 chars):", token.substring(0, 20));
      console.log("🔑 Config headers Authorization:", config.headers['Authorization']);
    } else {
      console.warn("⚠️ No token found - request will be unauthenticated");
      console.warn("⚠️ localStorage token check:", typeof window !== "undefined" ? localStorage.getItem("auth_token") : "N/A (SSR)");
    }
    
    // Add branch_id to requests
    const currentBranch = getCurrentBranch();
    if (currentBranch?.id) {
      const method = config.method?.toLowerCase();
      
      if (method === 'get' || method === 'delete') {
        // Add branch_id as query parameter for GET and DELETE requests
        config.params = {
          ...config.params,
          branch_id: currentBranch.id,
        };
      } else if (method === 'post' || method === 'put' || method === 'patch') {
        // Add branch_id to request body for POST, PUT, PATCH requests
        // Only add if it's not already present (to allow explicit branch_id values)
        if (config.data) {
          if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
            // Only add branch_id if it's not already in the request body
            if (!('branch_id' in config.data)) {
              config.data = {
                ...config.data,
                branch_id: currentBranch.id,
              };
            }
          }
        } else {
          config.data = {
            branch_id: currentBranch.id,
          };
        }
      }
    }
    
    // Log request details in development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("📤 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        tokenLength: token?.length,
        authorizationHeader: config.headers?.Authorization ? "✅ Set" : "❌ Missing",
        authorizationValue: config.headers?.Authorization ? `${String(config.headers.Authorization).substring(0, 20)}...` : "N/A",
        hasBranchId: !!currentBranch?.id,
        branchId: currentBranch?.id,
      });
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (unauthorized)
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("📥 API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Log error responses
    if (typeof window !== "undefined") {
      const errorInfo: any = {};
      
      // Extract error information
      if (error?.response) {
        errorInfo.status = error.response.status;
        errorInfo.statusText = error.response.statusText;
        errorInfo.responseData = error.response.data;
      }
      
      if (error?.config) {
        errorInfo.url = error.config.url;
        errorInfo.method = error.config.method?.toUpperCase();
        errorInfo.baseURL = error.config.baseURL;
        errorInfo.fullURL = `${error.config.baseURL}${error.config.url}`;
      } else if (error?.request) {
        errorInfo.url = error.request.responseURL;
      }
      
      if (error?.message) {
        errorInfo.message = error.message;
      }
      
      if (error?.code) {
        errorInfo.code = error.code;
      }
      
      // Always log the structured info, and also log the full error for debugging
      console.error("📥 API Error Response:", errorInfo);
      
      // Also log the full error object for complete debugging
      if (Object.keys(errorInfo).length === 0 || Object.values(errorInfo).every(val => val === undefined || val === null || val === '')) {
        console.error("📥 API Error (Full Error Object):", error);
        console.error("📥 API Error (Error Type):", typeof error);
        console.error("📥 API Error (Error Keys):", Object.keys(error || {}));
      }
    }
    
    if (error?.response?.status === 401) {
      const requestUrl = error?.config?.url || '';
      
      // For /get-permissions endpoint, the token might be invalid - log it
      if (requestUrl.includes('/get-permissions')) {
        console.error("⚠️ 401 Unauthorized on /get-permissions - Token might be invalid or expired");
        console.error("⚠️ Current token:", getToken() ? `${getToken()?.substring(0, 20)}...` : "null");
        console.error("⚠️ This might be a stale token. Please log in again.");
        // Don't redirect for permissions endpoint, just log the error
      } else {
        // Only redirect to login for critical endpoints, not for public APIs like /hello
        const criticalEndpoints = ['/auth/', '/user/', '/profile/', '/admin/'];
        const isCriticalEndpoint = criticalEndpoints.some(endpoint => requestUrl.includes(endpoint));
        
        if (isCriticalEndpoint) {
          // Token is invalid or expired for a critical endpoint, remove it and redirect
          console.warn("⚠️ 401 Unauthorized on critical endpoint - Removing token and redirecting to login");
          removeToken();
          // Redirect to login if we're on the client side
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        } else {
          // For non-critical endpoints like /hello, just log the error but don't redirect
          console.warn("⚠️ 401 Unauthorized on non-critical endpoint - Not redirecting");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
