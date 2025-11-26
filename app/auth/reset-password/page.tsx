"use client";

import { useState } from "react";
import axiosClient from "../../../libs/axiosClient";
import AuthLayout from "../../../components/AuthLayout";
import Input from "../../../components/ui/Input";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Call the reset password API endpoint
      const response = await axiosClient.post("/authentication/reset-password", {
        email,
      });

      console.log("Reset password response:", response);
      
      // Show success state
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      // Handle error response
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send reset email. Please try again.";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check your email"
        subtitle="We've sent you instructions to reset your password"
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
            Email was sent
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
                setError("");
              }}
              className="w-full flex justify-center py-3 px-4 border border-white/30 rounded-md text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            >
              Try another email
            </button>
            <a
              href="/auth/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[#7B2CBF] hover:bg-gradient-to-r hover:from-[#48CAE4] hover:to-[#7B2CBF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B2CBF] transition-all duration-300"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset Password"
      subtitle="We'll send you a secure link to create a new password"
      showBackArrow={true}
      backHref="/auth/login"
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

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            <span>{isLoading ? "Sending..." : "Send Link"}</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
