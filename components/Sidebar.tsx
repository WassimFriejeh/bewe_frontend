"use client";

import { useState, useEffect } from "react";
import MainLogo from "@/components/Icons/MainLogo";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getUserPermissions } from "../utils/permissions";
import { getUser } from "../utils/token";
import { useBranch } from "../contexts/BranchContext";
import {
  CalendarIcon,
  ReportsIcon,
  DashboardIcon,
  StaffIcon,
  CustomersIcon,
  ServicesIcon,
  MarketingIcon,
  MembershipsIcon,
  BalancesIcon,
  SettingsIcon,
  LogoutIcon,
} from "./Icons/SidebarIcons";

interface MenuItem {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  permission?: string;
}

const menuItems: MenuItem[] = [
  { id: 11, label: "Calendar", icon: CalendarIcon, path: "/calendar" },
  { id: 3, label: "Dashboard", icon: DashboardIcon, path: "/dashboard", permission: "Dashboard" },
  { id: 2, label: "Reports", icon: ReportsIcon, path: "/reports", permission: "Reports" },
  { id: 5, label: "Customers", icon: CustomersIcon, path: "/customers", permission: "Customers" },
  { id: 4, label: "Staff and Schedule", icon: StaffIcon, path: "/staff", permission: "View Staff" },
  { id: 6, label: "Services & Pricing", icon: ServicesIcon, path: "/services", permission: "Services & Pricing" },
  { id: 7, label: "Marketing", icon: MarketingIcon, path: "/marketing", permission: "Marketing" },
  { id: 8, label: "Memberships", icon: MembershipsIcon, path: "/memberships", permission: "Memberships" },
  { id: 9, label: "Balance and earnings", icon: BalancesIcon, path: "/balance", permission: "Balance and earnings" },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { branchChangeKey } = useBranch();

  // Update permissions when branch changes
  useEffect(() => {
    const permissions = getUserPermissions();
    setUserPermissions(permissions);

    // Get user data from localStorage
    const userData = getUser();
    setUser(userData);
  }, [branchChangeKey]);

  // console.log('user permissions' + userPermissions);

  const filteredMenuItems = menuItems.filter(item => {
    // Calendar is accessible to all
    if (item.id === 11) return true;
    // Check if user has the required permission (now string-based)
    return item.permission !== undefined && userPermissions.includes(item.permission);
  });

  return (
    <div
      className={`fixed flex flex-col left-0 top-0 h-full overflow-visible bg-black border-r border-gray-200 transition-all duration-300 ease-in-out z-50 shadow-sm ${isExpanded ? "w-58" : "w-16"
        }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Brand Area */}

      <div className="relative flex items-center  justify-center px-4 py-3">
        <div className=" overflow-hidden  mr-auto">
          <MainLogo width={75} height={51} />
        </div>

        <div className={`absolute transition-all duration-500 right-0  ${!isExpanded ? 'translate-x-[50%]' : '-translate-x-4'} `}>
          <div className="flex items-center relative">
            <div className="w-[16px] h-full bg-black absolute left-0 translate-x-[-100%]"></div>
            <div className={`transition-all duration-500 ${isExpanded ? "rotate-y-180" : ""}`}>
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0.5H17C21.1421 0.5 24.5 3.85786 24.5 8V17C24.5 21.1421 21.1421 24.5 17 24.5H8C3.85786 24.5 0.5 21.1421 0.5 17V8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="#27292A" />
                <path d="M8 0.5H17C21.1421 0.5 24.5 3.85786 24.5 8V17C24.5 21.1421 21.1421 24.5 17 24.5H8C3.85786 24.5 0.5 21.1421 0.5 17V8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#EDF1F5" />
                <path d="M12.875 17C12.875 17 17.375 13.6858 17.375 12.5C17.375 11.3141 12.875 8 12.875 8" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path opacity="0.4" d="M7.625 17C7.625 17 12.125 13.6858 12.125 12.5C12.125 11.3141 7.625 8 7.625 8" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>


      <div className="flex flex-col justify-between h-full">
        {/* Menu Items */}
        <nav className="py-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <div key={item.id} className="px-3">
                <Link
                  href={item.path}
                  className={`
                  sidebar-icon group
                  ${isActive ? "active" : ""}
                  ${!isExpanded ? "flex items-center justify-center" : ""}
                `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    }`} />
                  {isExpanded && (
                    <span className="text">
                      {item.label}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav >

        <div>
          <div className="border-t border-[#383838] py-3 space-y-2">
            {/* Settings Button */}
            {userPermissions.includes("Settings") && (
              <div className="px-3">
                <Link
                  href="/settings"
                  className={`
                  w-full sidebar-icon group
                  ${pathname === "/settings" ? "active" : ""}
                  ${!isExpanded ? "flex items-center justify-center" : ""}
                `}
                >
                  {/* {(() => {
                  const SettingsIcon = settingsIcon;
                  return <SettingsIcon className={`w-5 h-5 flex-shrink-0 ${pathname === "/settings" ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />;
                })()} */}
                  <SettingsIcon className={`w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600`} />

                  {isExpanded && (
                    <span className="text">
                      Settings
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Logout Button */}
            <div className="px-3">
              <button
                onClick={() => {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("user_data");
                  router.push("/auth/login");
                }}
                className={`
                w-full sidebar-icon group
                ${!isExpanded ? "flex items-center justify-center" : ""}
              `}
              >
                <LogoutIcon className={`w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600`} />
                {isExpanded && (
                  <span className="text">
                    Logout
                  </span>
                )}
              </button>
            </div>
          </div>
          <Link
            href="/profile"
            className={`flex items-center py-2 px-3 bg-[#ffffff14] max-h-[56px] hover:bg-[#ffffff24] transition-colors ${pathname === "/profile" ? "bg-[#ffffff24]" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full overflow-hidden ${isExpanded ? 'mr-3' : ''}`}>
              {user?.image?.image ? (
                <img
                  src={user.image.image}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: user?.calendar_color || "#9CA3AF" }}
                >
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className={` transition-all duration-200 ${!isExpanded ? 'opacity-0 w-0' : 'flex-1'}`}>
              <div className="text-sm text-white font-semibold">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : ``
                }
              </div>
              <div className="text-xs text-[#696969] line-clamp-1 break-all">
                {user?.email}
              </div>
            </div>
            <div className={` ${!isExpanded ? 'opacity-0 w-0' : 'ml-2'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2419 12C10.2419 11.0335 11.0254 10.25 11.9919 10.25H12.0009C12.9674 10.25 13.7509 11.0335 13.7509 12C13.7509 12.9665 12.9674 13.75 12.0009 13.75H11.9919C11.0254 13.75 10.2419 12.9665 10.2419 12Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2343 18C10.2343 17.0335 11.0178 16.25 11.9843 16.25H11.9933C12.9598 16.25 13.7433 17.0335 13.7433 18C13.7433 18.9665 12.9598 19.75 11.9933 19.75H11.9843C11.0178 19.75 10.2343 18.9665 10.2343 18Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2498 6C10.2498 5.0335 11.0333 4.25 11.9998 4.25H12.0088C12.9753 4.25 13.7588 5.0335 13.7588 6C13.7588 6.9665 12.9753 7.75 12.0088 7.75H11.9998C11.0333 7.75 10.2498 6.9665 10.2498 6Z" fill="white" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div >
  );
}
