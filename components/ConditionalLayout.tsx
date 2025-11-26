"use client";

import { usePathname } from "next/navigation";
import ProtectedLayout from "./ProtectedLayout";
import AuthRedirect from "./AuthRedirect";
import { BranchProvider } from "../contexts/BranchContext";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if it's an auth route
  const isAuthRoute = pathname?.startsWith("/auth");
  
  if (isAuthRoute) {
    // For auth routes, redirect if already authenticated
    return <AuthRedirect>{children}</AuthRedirect>;
  }
  
  // For all other routes, protect them and provide branch context
  return (
    <BranchProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </BranchProvider>
  );
}

