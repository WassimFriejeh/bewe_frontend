"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setupRealAuth } from "../../utils/testRealAuth";

export default function TestPermissions() {
  const router = useRouter();

  useEffect(() => {
    // Set up real authentication structure
    setupRealAuth();
    
    // Redirect to dashboard to see the sidebar
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Setting up real authentication...</h1>
      <p>You will be redirected to the dashboard shortly.</p>
    </div>
  );
}
