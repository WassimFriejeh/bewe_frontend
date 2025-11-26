"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasPagePermission } from "../utils/permissions";

interface ProtectedPageProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export default function ProtectedPage({ children, fallbackPath = "/calendar" }: ProtectedPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      const permitted = hasPagePermission(pathname);
      setHasPermission(permitted);
      setIsChecking(false);

      if (!permitted) {
        console.log(`Access denied to ${pathname}. Redirecting to ${fallbackPath}`);
        router.push(fallbackPath);
      }
    };

    checkPermission();
  }, [pathname, router, fallbackPath]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
