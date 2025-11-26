"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosClient from "../../../libs/axiosClient";
import { setToken, setUser, User, setBranches, setCurrentBranch, Branch } from "../../../utils/token";
import AuthLayout from "../../../components/AuthLayout";
import Input from "../../../components/ui/Input";

interface LoginResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
    permissions: string[];
    branch?: any; // Legacy: single branch
    branches?: Branch[]; // New: collection of branches
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axiosClient.post<LoginResponse>("/authentication/login", {
        email,
        password,
      });

      // Debug: Log the full response to see the structure
      console.log("🔍 Full Login Response:", response);
      console.log("🔍 Response.data:", response.data);
      console.log("🔍 Response.data.data:", response.data.data);

      // Handle the actual API response structure: { status, message, data: { token, user, branch, permissions } }
      // Use a loose type here because some environments may return different token field names
      const apiData: any = response.data.data || response.data;
      
      console.log("🔍 API Data object:", apiData);
      console.log("🔍 apiData.token:", apiData?.token);
      
      // Try to find token in various possible locations
      const token =
        apiData?.token ||
        apiData?.access_token ||
        apiData?.auth_token ||
        (response.data as any)?.token ||
        (response.data as any)?.access_token;
      
      console.log("🔍 Final extracted token:", token);
      console.log("🔍 Token type:", typeof token);
      console.log("🔍 Token length:", token?.length);
      console.log("🔍 Token first 20 chars:", token?.substring(0, 20));
      
      const user = apiData?.user || (response.data as any)?.user;

      if (!token || token === "undefined" || token === "null") {
        console.error("❌ No valid token found in API response!");
        console.error("❌ Full response structure:", JSON.stringify(response.data, null, 2));
        setError("Login successful but no token received. Please check console for details.");
        setIsLoading(false);
        return;
      }

      // Store token
      console.log("✅ About to store token:", token);
      console.log("✅ Token value (full):", token);
      setToken(token);
      
      // Verify immediately after storing
      setTimeout(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        console.log("✅ Verification - Token stored:", stored);
        console.log("✅ Verification - Matches:", stored === token);
      }, 100);
      
      // Handle branches: prefer branches array, fallback to single branch for backward compatibility
      const branches = apiData.branches || (apiData.branch ? [apiData.branch] : []);
      
      if (branches.length > 0) {
        // Store all branches
        setBranches(branches);
        
        // Set the first branch as the current/active branch by default
        setCurrentBranch(branches[0]);
        console.log("Stored branches:", branches);
        console.log("Set first branch as current:", branches[0]);
      } else {
        console.warn("No branches received from API");
      }
      
      // Store the complete API data structure (the nested data object)
      // This ensures permissions and branch data are available
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(apiData));
      }
      
      // Verify it was stored
      const verifyToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const verifyUserData = typeof window !== "undefined" ? localStorage.getItem("user_data") : null;
      console.log("Token verification after storage:", verifyToken);
      console.log("User data verification after storage:", verifyUserData);

      console.log("Token stored successfully, redirecting...");

      // Small delay to ensure storage completes before redirect
      setTimeout(() => {
        router.push("/calendar");
      }, 100);
    } catch (error: any) {
      // Handle error
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Login failed. Please check your credentials and try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email *"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password *"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          showPasswordToggle={true}
          isPasswordVisible={showPassword}
          onPasswordToggle={() => setShowPassword(!showPassword)}
        />

        <div className="flex items-center justify-end">
          <span
            className="text-[12px] text-white mr-2"
          >
            Forgot password?
          </span>
          <a
            href="/auth/reset-password"
            className="text-[12px] text-white hover:text-[#7B2CBF] transition-colors duration-300"
          >
            Reset
          </a>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            <span>{isLoading ? "Logging in..." : "Log In"}</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
