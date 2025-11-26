"use client";

import { ReactNode } from "react";
import MainLogo from "@/components/Icons/MainLogo";
import BackArrow from "@/components/Icons/BackArrow";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBackArrow?: boolean;
  backHref?: string;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  showBackArrow = false,
  backHref = "/auth/login",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat auth-background">
      </div>

      <div className="relative z-50 min-h-screen flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side - Logo and Slogan */}
        <div className="hidden lg:flex flex-col justify-center flex-1 pl-8 lg:pl-12">
          <MainLogo width={140} height={51} className="mb-8" />
          <h1 className="text-5xl lg:text-[45px] xl:text-[55px] font-extrabold text-white leading-tight">
            Focus on beauty,<br />
            we'll handle the<br />
            bookings.
          </h1>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-auto flex items-center justify-end lg:pr-6 xl:pr-[10%] min-w-[42%]">
          <div className="w-full max-w-xl">
            <div className="backdrop-blur-xs border border-white rounded-2xl shadow-2xl py-12 px-8 relative">
              {/* Back Arrow */}
              {showBackArrow && (
                <Link 
                  href={backHref}
                  className="absolute top-6 left-6 text-white hover:text-white/80 transition-colors"
                >
                  <BackArrow />
                </Link>
              )}

              {/* Title and Subtitle */}
              <div className="mb-8">
                <h2 className="text-[25px] font-extrabold text-white text-center capitalize">{title}</h2>
                {subtitle && (
                  <p className="mt-2 text-[12px] text-white w-[90%] mx-auto text-center">{subtitle}</p>
                )}
              </div>

              {/* Form Content */}
              <div className="space-y-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
