"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth } from "../utils/auth";
import { hasPagePermission } from "../utils/permissions";
import Sidebar from "./Sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const verifyAuthAndPermission = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      // Check page permission
      const permitted = hasPagePermission(pathname || "");
      setHasPermission(permitted);
      setIsChecking(false);

      if (!permitted) {
        console.log(`Access denied to ${pathname}. Redirecting to /calendar`);
        router.push("/calendar");
      }
    };

    verifyAuthAndPermission();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push("/calendar")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-16">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
