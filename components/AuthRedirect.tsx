"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/token";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that redirects authenticated users away from auth pages
 * (login, reset-password, change-password)
 */
export default function AuthRedirect({ children }: AuthRedirectProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // If authenticated, redirect to home
      router.push("/home");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Show loading while checking, or show children if not authenticated
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

