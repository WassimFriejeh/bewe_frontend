// Simple test script to verify the reset password API integration
const axios = require('axios');

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bewe_api.test/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY || "super-secret-api-key-123";

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
});

async function testResetPassword() {
  try {
    console.log("🧪 Testing reset password API integration...");
    console.log("📡 API URL:", API_URL);
    
    const testEmail = "test@example.com";
    
    const response = await axiosClient.post("/authentication/reset-password", {
      email: testEmail,
    });

    console.log("✅ API call successful!");
    console.log("📥 Response status:", response.status);
    console.log("📥 Response data:", response.data);
    
  } catch (error) {
    console.log("❌ API call failed:");
    console.log("📥 Error status:", error?.response?.status);
    console.log("📥 Error data:", error?.response?.data);
    console.log("📥 Error message:", error?.message);
    
    // Note: 404 or other errors might be expected if the backend endpoint doesn't exist yet
    if (error?.response?.status === 404) {
      console.log("ℹ️  This is expected if the backend endpoint doesn't exist yet");
    }
  }
}

testResetPassword();
