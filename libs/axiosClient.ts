import axios from "axios";
import { getToken, removeToken, getCurrentBranch } from "../utils/token";

// Log configuration on client side for debugging
if (typeof window !== "undefined") {
  console.log("🔧 Axios Client Configuration:");
  console.log("Base URL:", process.env.NEXT_PUBLIC_API_URL || "❌ NOT SET");
  console.log("API Key:", process.env.NEXT_PUBLIC_API_SECRET_KEY ? "✅ SET" : "❌ NOT SET");
}

// Helper function to safely get property value
const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to safely serialize error info
const safeSerializeErrorInfo = (error: any) => {
  const info: any = {};
  
  try {
    info.status = safeGet(error, 'response.status');
    info.statusText = safeGet(error, 'response.statusText');
    info.url = safeGet(error, 'config.url') || safeGet(error, 'request.responseURL');
    
    // Safely handle method - ensure it's a string before calling toUpperCase
    const method = safeGet(error, 'config.method');
    info.method = method && typeof method === 'string' ? method.toUpperCase() : method;
    
    info.baseURL = safeGet(error, 'config.baseURL');
    info.message = safeGet(error, 'message');
    info.code = safeGet(error, 'code');
    
    // Try to safely get response data
    try {
      const responseData = safeGet(error, 'response.data');
      if (responseData !== undefined && responseData !== null) {
        try {
          info.responseData = JSON.parse(JSON.stringify(responseData));
        } catch {
          try {
            info.responseData = String(responseData);
          } catch {
            info.responseData = '[Unable to serialize response data]';
          }
        }
      }
    } catch {
      info.responseData = '[Unable to extract response data]';
    }
    
    // Construct full URL safely
    try {
      const baseURL = String(info.baseURL || '');
      const url = String(info.url || '');
      info.fullURL = baseURL && url ? `${baseURL}${url}` : (url || baseURL || 'Unknown URL');
    } catch {
      info.fullURL = 'Unknown URL';
    }
  } catch {
    // If anything fails, return minimal info
    info.error = 'Error serialization failed';
  }
  
  return info;
};

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
      if (!config.headers) {
        config.headers = {} as any;
      }
      delete (config.headers as any)['Content-Type'];
    }
    
    const token = getToken();
    console.log("🔍 Token check - Raw token from getToken():", token ? `${token.substring(0, 20)}...` : "null/undefined");
    
    if (token) {
      // Ensure Authorization header is set with Bearer token
      const bearerToken = `Bearer ${token.trim()}`; // Trim any whitespace
      if (!config.headers) {
        config.headers = {} as any;
      }
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
      try {
        const errorInfo = safeSerializeErrorInfo(error);
        const requestUrl = errorInfo.url || '';
        
        // Special handling for bookings/get/by/day - less verbose logging since it's called frequently
        if (requestUrl.includes('/bookings/get/by/day')) {
          // Only log if it's not a 404 or other expected errors
          if (errorInfo.status && errorInfo.status !== 404) {
            console.warn("📥 Calendar API Error:", {
              status: errorInfo.status,
              statusText: errorInfo.statusText,
              message: errorInfo.message
            });
          }
        } else {
          // Full error logging for other endpoints
          console.error("📥 API Error Response:", errorInfo);
          
          // If no useful info was extracted, log basic error details
          const hasInfo = Object.values(errorInfo).some(val => val !== undefined && val !== null && val !== '');
          if (!hasInfo) {
            console.error("📥 API Error occurred (unable to extract details)");
          }
        }
      } catch (logError) {
        // Fallback if anything fails
        console.error("📥 API Error occurred but could not be logged safely");
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
