"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosClient from "../../../libs/axiosClient";
import AuthLayout from "../../../components/AuthLayout";
import Input from "../../../components/ui/Input";

export default function ChangePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        // Redirect to reset password page if no token
        router.push("/auth/reset-password");
        return;
      }

      try {
        const response = await axiosClient.post("/authentication/check-reset-password-token", {
          token,
        });
        
        console.log("Token validation response:", response);
        setIsTokenValid(true);
      } catch (error: any) {
        console.error("Token validation error:", error);
        // Redirect to reset password page if token is invalid
        router.push("/auth/reset-password");
        return;
      } finally {
        setIsTokenValidating(false);
      }
    };

    validateToken();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the change password API endpoint with token
      const response = await axiosClient.post("/authentication/change-password", {
        token,
        newPassword,
      });

      console.log("Change password response:", response);
      
      // Show success state
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Change password error:", error);
      
      // Handle error response
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to change password. Please try again.";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (isTokenValidating) {
    return (
      <AuthLayout 
        title="Validating..."
        subtitle="Please wait while we verify your reset link"
        showBackArrow={true}
        backHref="/auth/login"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white/20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
          <p className="text-sm text-white/90">
            Validating your reset token...
          </p>
        </div>
      </AuthLayout>
    );
  }


  // Show success state
  if (isSuccess) {
    return (
      <AuthLayout 
        title="Password changed successfully"
        subtitle="Your password has been updated"
        showBackArrow={true}
        backHref="/auth/login"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white/20">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-white/90">
            Your password has been successfully changed. You can now use your new password to sign in.
          </p>
          <div className="space-y-2">
            <a
              href="/auth/login"
              className="login-button inline-block text-center"
            >
              Sign in with new password
            </a>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Show password change form (only when token is valid)
  return (
    <AuthLayout 
      title="Change Password"
      subtitle="Create your new password"
      showBackArrow={true}
      backHref="/auth/login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-500/20 border border-red-500/50 p-4">
            <div className="text-sm text-white">{error}</div>
          </div>
        )}

        <Input
          id="new-password"
          name="new-password"
          type={showNewPassword ? "text" : "password"}
          label="New Password *"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          showPasswordToggle={true}
          isPasswordVisible={showNewPassword}
          onPasswordToggle={() => setShowNewPassword(!showNewPassword)}
        />

        <Input
          id="confirm-password"
          name="confirm-password"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm Password *"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          showPasswordToggle={true}
          isPasswordVisible={showConfirmPassword}
          onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            <span>{isLoading ? "Changing..." : "Change Password"}</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
