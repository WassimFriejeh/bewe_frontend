"use client";

import { useState, useEffect, useRef } from "react";
import { getUser } from "@/utils/token";
import { useBranch } from "../../contexts/BranchContext";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import EyeIcon from "../../components/Icons/EyeIcon";
import EyeSlashIcon from "../../components/Icons/EyeSlashIcon";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

export default function ProfilePage() {
  const { currentBranch } = useBranch();
  const [user, setUser] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<"Personal Information" | "Change Password">("Personal Information");
  const [formData, setFormData] = useState({
    firstName: "Joe",
    lastName: "Doe",
    email: "joedoe@gmail.com",
    phoneNumber: "70 123 456",
    countryCode: "+961",
  });
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    if (userData) {
      // Parse phone number if it includes country code
      let phoneNumber = userData.phone || "70 123 456";
      let countryCode = userData.country_code || "+961";
      
      // If phone number starts with country code, extract it
      if (phoneNumber && phoneNumber.startsWith("+")) {
        const parts = phoneNumber.split(" ");
        if (parts.length > 1) {
          countryCode = parts[0];
          phoneNumber = parts.slice(1).join(" ");
        }
      }
      
      setFormData({
        firstName: userData.first_name || "Joe",
        lastName: userData.last_name || "Doe",
        email: userData.email || "joedoe@gmail.com",
        phoneNumber: phoneNumber,
        countryCode: countryCode,
      });
    }
  }, []);

  // Initialize intl-tel-input
  useEffect(() => {
    if (phoneInputRef.current && selectedSection === "Personal Information") {
      if (!itiRef.current) {
        itiRef.current = intlTelInput(phoneInputRef.current, {
          initialCountry: "lb",
          utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
        } as any);

        // Set initial phone number if available
        if (formData.phoneNumber) {
          phoneInputRef.current.value = formData.phoneNumber;
        }

        // Listen for country change
        phoneInputRef.current.addEventListener('countrychange', () => {
          if (itiRef.current) {
            const countryData = itiRef.current.getSelectedCountryData();
            setFormData(prev => ({
              ...prev,
              countryCode: `+${countryData.dialCode}`,
            }));
          }
        });

        // Listen for phone number input
        phoneInputRef.current.addEventListener('input', () => {
          if (phoneInputRef.current && itiRef.current) {
            setFormData(prev => ({
              ...prev,
              phoneNumber: phoneInputRef.current?.value || "",
            }));
          }
        });
      }
    }

    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, [selectedSection]);

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Personal Information</span>
          </h1>
          <div className="flex items-center gap-4">
            <BranchSelector />
            <div className="relative cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">2</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-300 cursor-pointer"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-6">My Profile</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedSection("Personal Information")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    selectedSection === "Personal Information"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setSelectedSection("Change Password")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    selectedSection === "Change Password"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {selectedSection === "Personal Information" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-black mb-6">Personal Information</h2>
                  
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  {/* Email and Phone Number Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm pr-10"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                        placeholder="70 123 456"
                      />
                    </div>
                  </div>

                  {/* Save Changes Button */}
                  <div className="pt-4">
                    <Button
                      variant="primary"
                      className="w-full cursor-pointer"
                      onClick={() => {
                        // Handle save changes
                        console.log("Saving personal information:", formData);
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {selectedSection === "Change Password" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-black mb-6">Change Password</h2>
                  
                  {/* Old Password */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Old Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      placeholder="Old Password"
                      className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* New Password and Confirm Password Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="New Password"
                          className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm Password"
                          className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <div className="pt-4">
                    <Button
                      variant="primary"
                      className="cursor-pointer"
                      onClick={() => {
                        // Handle change password
                        console.log("Changing password...", passwordData);
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
