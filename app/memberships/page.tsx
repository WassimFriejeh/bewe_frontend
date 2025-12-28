"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "../../contexts/BranchContext";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";

interface Membership {
  id: string;
  title: string;
  price: string;
  duration: string;
  isActive: boolean;
  status?: "active" | "paused" | "scheduled";
}

export default function Memberships() {
  const { currentBranch } = useBranch();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [isCreateMembershipSidebarOpen, setIsCreateMembershipSidebarOpen] = useState(false);
  const [membershipForm, setMembershipForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
    numberOfSessions: "",
    eligibleDays: "",
    allServices: false,
    category1: false,
    category2: false,
    category3: false,
    isActive: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [openMembershipMenuId, setOpenMembershipMenuId] = useState<string | null>(null);
  const [menuPositionAbove, setMenuPositionAbove] = useState<{ [key: string]: boolean }>({});
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [categoryServices, setCategoryServices] = useState<{ [key: string]: { [key: string]: boolean } }>({
    category1: {
      "Service 1": false,
      "Service 2": false,
      "Service 3": false,
      "Service 4": false,
    },
    category2: {
      "Service 1": false,
      "Service 2": false,
      "Service 3": false,
      "Service 4": false,
    },
    category3: {
      "Service 1": false,
      "Service 2": false,
      "Service 3": false,
      "Service 4": false,
    },
  });
  const [memberships, setMemberships] = useState<Membership[]>([
    { id: "1", title: "Premium Membership", price: "$99.00", duration: "6 months", isActive: true, status: "active" },
    { id: "2", title: "Basic Membership", price: "$49.00", duration: "3 months", isActive: true, status: "active" },
    { id: "3", title: "Gold Membership", price: "$149.00", duration: "12 months", isActive: true, status: "active" },
    { id: "4", title: "Silver Membership", price: "$79.00", duration: "6 months", isActive: false, status: "paused" },
    { id: "5", title: "Platinum Membership", price: "$199.00", duration: "12 months", isActive: false, status: "paused" },
    { id: "6", title: "Bronze Membership", price: "$29.00", duration: "1 month", isActive: false, status: "paused" },
    { id: "7", title: "VIP Membership", price: "$299.00", duration: "12 months", isActive: false, status: "scheduled" },
    { id: "8", title: "Student Membership", price: "$39.00", duration: "3 months", isActive: false, status: "scheduled" },
    { id: "9", title: "Corporate Membership", price: "$399.00", duration: "12 months", isActive: false, status: "scheduled" },
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleToggleActive = (id: string) => {
    setMemberships(prev =>
      prev.map(membership =>
        membership.id === id
          ? { ...membership, isActive: !membership.isActive }
          : membership
      )
    );
  };

  const getSortedMemberships = () => {
    if (!sortColumn) return memberships;

    return [...memberships].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "price":
          // Extract numeric value from price string (e.g., "$99.00" -> 99.00)
          aValue = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
          bValue = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          break;
        case "duration":
          aValue = a.duration.toLowerCase();
          bValue = b.duration.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredMemberships = () => {
    const sorted = getSortedMemberships();
    if (!searchQuery) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (membership) =>
        membership.title.toLowerCase().includes(query) ||
        membership.price.toLowerCase().includes(query) ||
        membership.duration.toLowerCase().includes(query)
    );
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredMemberships = getFilteredMemberships();
  const totalPages = Math.ceil(filteredMemberships.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMemberships = filteredMemberships.slice(startIndex, endIndex);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMembershipMenuId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.membership-menu-container')) {
          setOpenMembershipMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMembershipMenuId]);

  // Check if menu should appear above button
  useEffect(() => {
    if (openMembershipMenuId) {
      const button = menuButtonRefs.current[openMembershipMenuId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = 150; // Approximate height of the dropdown menu
        
        // If there's not enough space below but enough space above, show above
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
          setMenuPositionAbove(prev => ({ ...prev, [openMembershipMenuId]: true }));
        } else {
          setMenuPositionAbove(prev => ({ ...prev, [openMembershipMenuId]: false }));
        }
      }
    }
  }, [openMembershipMenuId]);

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Memberships</span>
          </h1>
          <div className="flex items-center gap-4">
            <BranchSelector />
            <button className="relative text-gray-600 hover:text-gray-900 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1458 18.75C16.1458 20.7635 14.5135 22.3958 12.5 22.3958C10.4864 22.3958 8.85416 20.7635 8.85416 18.75" stroke="currentColor" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.0324 18.7503H4.96757C3.94995 18.7503 3.125 17.9253 3.125 16.9077C3.125 16.4191 3.31912 15.9504 3.66468 15.6048L4.29304 14.9765C4.87909 14.3904 5.20833 13.5955 5.20833 12.7668V9.89616C5.20833 5.86909 8.47293 2.60449 12.5 2.60449C16.5271 2.60449 19.7917 5.86908 19.7917 9.89616V12.7668C19.7917 13.5955 20.1209 14.3904 20.707 14.9765L21.3353 15.6048C21.6808 15.9504 21.875 16.4191 21.875 16.9077C21.875 17.9253 21.05 18.7503 20.0324 18.7503Z" stroke="currentColor" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="absolute top-[-10px] right-[4px] translate-x-1.5 translate-y-1.5 w-3 h-3 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                2
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 md:p-6">
        {/* Title and Create Membership Button */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-2xl font-bold text-black">Memberships</h2>
          <Button 
            variant="primary" 
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => setIsCreateMembershipSidebarOpen(true)}
          >
            <span className="hidden md:inline">Create Membership</span>
            <span className="md:hidden">Create</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search by membership title, price, or duration"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  {["Membership Title", "Price", "Duration", "Active / Inactive", "Actions"].map((header) => {
                    const columnMap: { [key: string]: string } = {
                      "Membership Title": "title",
                      "Price": "price",
                      "Duration": "duration",
                    };
                    const sortKey = columnMap[header];
                    const isSorted = sortColumn === sortKey;
                    return (
                      <th
                        key={header}
                        onClick={() => sortKey && handleSort(sortKey)}
                        className={`group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize ${
                          sortKey ? "cursor-pointer" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {header}
                          <svg 
                            width="15" 
                            height="15" 
                            viewBox="0 0 18 18" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-colors ${
                              isSorted 
                                ? "text-primary opacity-100" 
                                : "text-gray-400 opacity-50 group-hover:text-primary group-hover:opacity-100"
                            }`}
                          >
                            <path 
                              d="M5.25 3V15" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <path 
                              d="M12.75 14.25V3" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <path 
                              d="M7.5 5.24998C7.5 5.24998 5.8429 3.00001 5.24998 3C4.65706 2.99999 3 5.25 3 5.25" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <path 
                              d="M15 12.75C15 12.75 13.3429 15 12.75 15C12.157 15 10.5 12.75 10.5 12.75" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No memberships found
                    </td>
                  </tr>
                ) : (
                  paginatedMemberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/memberships/subscribers?id=${membership.id}&title=${encodeURIComponent(membership.title)}&price=${encodeURIComponent(membership.price)}&duration=${encodeURIComponent(membership.duration)}`)}
                  >
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {membership.title}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {membership.price}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {membership.duration}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActive(membership.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          membership.isActive ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            membership.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', overflow: 'visible' }}>
                      <div className="relative membership-menu-container">
                        <button
                          ref={(el) => {
                            if (el) menuButtonRefs.current[membership.id] = el;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMembershipMenuId(openMembershipMenuId === membership.id ? null : membership.id);
                          }}
                          className="p-0 transition-colors cursor-pointer"
                        >
                          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="38" height="38" rx="4.31818" fill="#F9F9F9"/>
                            <rect x="3.43182" y="3.43182" width="37.1364" height="37.1364" rx="3.88636" stroke="black" strokeOpacity="0.2" strokeWidth="0.863636"/>
                            <path d="M21.9934 22H22.0003" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21.9866 27.1797H21.9936" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22.0001 16.8125H22.0071" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {openMembershipMenuId === membership.id && (
                          <div className={`absolute right-0 w-56 md:w-64 bg-white border border-black/10 rounded-lg shadow-lg ${menuPositionAbove[membership.id] ? 'bottom-full mb-2' : 'top-full mt-2'}`} style={{ zIndex: 9999 }}>
                            <div className="py-1 px-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMembershipMenuId(null);
                                  // Handle Edit - navigate to edit page or open edit modal
                                  console.log("Edit membership:", membership.id);
                                }}
                                className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap flex items-center justify-between"
                              >
                                <span>Edit</span>
                                <div className="p-1 rounded transition-colors text-black/40">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                                    <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                                    <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                                  </svg>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMembershipMenuId(null);
                                  // Handle Delete - show confirmation popup
                                  console.log("Delete membership:", membership.id);
                                }}
                                className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMembershipMenuId(null);
                                  // Handle View Subscribers - navigate to subscribers page
                                  router.push(`/memberships/subscribers?id=${membership.id}&title=${encodeURIComponent(membership.title)}&price=${encodeURIComponent(membership.price)}&duration=${encodeURIComponent(membership.duration)}`);
                                }}
                                className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap flex items-center justify-between"
                              >
                                <span>View Subscribers</span>
                                <div className="p-1 rounded transition-colors text-black/40">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                                    <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                                    <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                                  </svg>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Cards - Mobile/Tablet */}
          <div className="block md:hidden divide-y divide-gray-200">
            {filteredMemberships.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No memberships found
              </div>
            ) : (
              paginatedMemberships.map((membership) => (
              <div
                key={membership.id}
                className="p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/memberships/subscribers?id=${membership.id}&title=${encodeURIComponent(membership.title)}&price=${encodeURIComponent(membership.price)}&duration=${encodeURIComponent(membership.duration)}`)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-black mb-1 break-words">{membership.title}</h3>
                    <div className="space-y-1 text-xs text-black/80">
                      <div className="break-words">
                        <span className="text-black/60">Price: </span>
                        <span>{membership.price}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-black/60">Duration: </span>
                        <span>{membership.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(membership.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                        membership.isActive ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          membership.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <div className="relative membership-menu-container">
                      <button
                        ref={(el) => {
                          if (el) menuButtonRefs.current[membership.id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMembershipMenuId(openMembershipMenuId === membership.id ? null : membership.id);
                        }}
                        className="p-0 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="38" height="38" rx="4.31818" fill="#F9F9F9"/>
                          <rect x="3.43182" y="3.43182" width="37.1364" height="37.1364" rx="3.88636" stroke="black" strokeOpacity="0.2" strokeWidth="0.863636"/>
                          <path d="M21.9934 22H22.0003" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21.9866 27.1797H21.9936" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22.0001 16.8125H22.0071" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {openMembershipMenuId === membership.id && (
                        <div className={`absolute right-0 w-56 md:w-64 bg-white border border-black/10 rounded-lg shadow-lg ${menuPositionAbove[membership.id] ? 'bottom-full mb-2' : 'top-full mt-2'}`} style={{ zIndex: 9999 }}>
                          <div className="py-1 px-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMembershipMenuId(null);
                                // Handle Edit - navigate to edit page or open edit modal
                                console.log("Edit membership:", membership.id);
                              }}
                              className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap flex items-center justify-between"
                            >
                              <span>Edit</span>
                              <div className="p-1 rounded transition-colors text-black/40">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                                  <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                                  <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                                </svg>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMembershipMenuId(null);
                                // Handle Delete - show confirmation popup
                                console.log("Delete membership:", membership.id);
                              }}
                              className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap"
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMembershipMenuId(null);
                                // Handle View Subscribers - navigate to subscribers page
                                router.push(`/memberships/subscribers?id=${membership.id}&title=${encodeURIComponent(membership.title)}&price=${encodeURIComponent(membership.price)}&duration=${encodeURIComponent(membership.duration)}`);
                              }}
                              className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap flex items-center justify-between"
                            >
                              <span>View Subscribers</span>
                              <div className="p-1 rounded transition-colors text-black/40">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                                  <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                                  <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                                </svg>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Membership Sidebar */}
      {isCreateMembershipSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCreateMembershipSidebarOpen(false)}
          />
          <div className="relative w-full md:w-[573px] bg-white h-full shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-black">Create Membership</h2>
              <button
                onClick={() => setIsCreateMembershipSidebarOpen(false)}
                className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-3 space-y-4 md:space-y-6 min-h-0">
              {/* Membership Title */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Membership Title <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Membership Title"
                  value={membershipForm.title}
                  onChange={(e) => setMembershipForm({ ...membershipForm, title: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-xs md:text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Description <span className="text-primary">*</span>
                </label>
                <textarea
                  placeholder="Write description explaining the membership here"
                  value={membershipForm.description}
                  onChange={(e) => setMembershipForm({ ...membershipForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-xs md:text-sm resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Duration <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <select
                    value={membershipForm.duration}
                    onChange={(e) => setMembershipForm({ ...membershipForm, duration: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-xs md:text-sm"
                  >
                    <option value="">-Select Duration-</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Price <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Price"
                  value={membershipForm.price}
                  onChange={(e) => setMembershipForm({ ...membershipForm, price: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-xs md:text-sm"
                />
              </div>

              {/* Included Services */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Included Services <span className="text-primary">*</span>
                </label>
                <div className="border border-black/10 rounded-lg overflow-hidden">
                  {/* All Services */}
                  <div className="flex items-center px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      id="allServices"
                      checked={membershipForm.allServices}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        // Check/uncheck all categories
                        const newForm = { 
                          ...membershipForm, 
                          allServices: isChecked,
                          category1: isChecked,
                          category2: isChecked,
                          category3: isChecked,
                        };
                        // Check/uncheck all services in all categories
                        const newCategoryServices = { ...categoryServices };
                        Object.keys(newCategoryServices).forEach(categoryKey => {
                          Object.keys(newCategoryServices[categoryKey]).forEach(serviceKey => {
                            newCategoryServices[categoryKey][serviceKey] = isChecked;
                          });
                        });
                        setCategoryServices(newCategoryServices);
                        setMembershipForm(newForm);
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="allServices" className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer">
                      All Services
                    </label>
                  </div>

                  {/* Category 1 */}
                  <div className="border-b border-gray-200">
                    <div className="flex items-center px-3 md:px-4 py-2 md:py-3">
                      <input
                        type="checkbox"
                        id="category1"
                        checked={membershipForm.category1}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newForm = { ...membershipForm, category1: isChecked };
                          // If category is checked, check all its services
                          if (isChecked) {
                            const allServicesChecked = Object.keys(categoryServices.category1).reduce((acc, key) => {
                              acc[key] = true;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category1: allServicesChecked });
                          } else {
                            const allServicesUnchecked = Object.keys(categoryServices.category1).reduce((acc, key) => {
                              acc[key] = false;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category1: allServicesUnchecked });
                          }
                          // Check if all categories are checked to update "All Services"
                          if (isChecked && newForm.category2 && newForm.category3) {
                            newForm.allServices = true;
                          } else {
                            // Only uncheck "All Services" if not all categories are checked
                            const allCategoriesChecked = (isChecked ? true : newForm.category1) && newForm.category2 && newForm.category3;
                            newForm.allServices = allCategoriesChecked;
                          }
                          setMembershipForm(newForm);
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="category1" className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer flex-1">
                        Category 1
                      </label>
                      <button
                        onClick={() => setExpandedCategories({ ...expandedCategories, category1: !expandedCategories.category1 })}
                        className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transform transition-transform ${expandedCategories.category1 ? 'rotate-180' : ''}`}
                        >
                          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    {/* Category 1 Services */}
                    {expandedCategories.category1 && (
                      <div className="bg-gray-50">
                        {Object.keys(categoryServices.category1).map((serviceName) => (
                          <div key={serviceName} className="flex items-center px-3 md:px-4 py-2 pl-6 md:pl-8 border-b border-gray-200 last:border-b-0">
                            <input
                              type="checkbox"
                              id={`category1-${serviceName}`}
                              checked={categoryServices.category1[serviceName]}
                              onChange={(e) => {
                                const newServices = {
                                  ...categoryServices.category1,
                                  [serviceName]: e.target.checked,
                                };
                                setCategoryServices({ ...categoryServices, category1: newServices });
                                // Category stays checked unless ALL services are unchecked
                                const allUnchecked = Object.values(newServices).every(v => !v);
                                if (allUnchecked) {
                                  setMembershipForm({ ...membershipForm, category1: false });
                                } else {
                                  // Keep category checked if at least one service is checked
                                  setMembershipForm({ ...membershipForm, category1: true });
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor={`category1-${serviceName}`} className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer">
                              {serviceName}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 2 */}
                  <div className="border-b border-gray-200">
                    <div className="flex items-center px-3 md:px-4 py-2 md:py-3">
                      <input
                        type="checkbox"
                        id="category2"
                        checked={membershipForm.category2}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newForm = { ...membershipForm, category2: isChecked };
                          // If category is checked, check all its services
                          if (isChecked) {
                            const allServicesChecked = Object.keys(categoryServices.category2).reduce((acc, key) => {
                              acc[key] = true;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category2: allServicesChecked });
                          } else {
                            const allServicesUnchecked = Object.keys(categoryServices.category2).reduce((acc, key) => {
                              acc[key] = false;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category2: allServicesUnchecked });
                          }
                          // Check if all categories are checked to update "All Services"
                          if (isChecked && newForm.category1 && newForm.category3) {
                            newForm.allServices = true;
                          } else {
                            // Only uncheck "All Services" if not all categories are checked
                            const allCategoriesChecked = newForm.category1 && (isChecked ? true : newForm.category2) && newForm.category3;
                            newForm.allServices = allCategoriesChecked;
                          }
                          setMembershipForm(newForm);
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="category2" className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer flex-1">
                        Category 2
                      </label>
                      <button
                        onClick={() => setExpandedCategories({ ...expandedCategories, category2: !expandedCategories.category2 })}
                        className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transform transition-transform ${expandedCategories.category2 ? 'rotate-180' : ''}`}
                        >
                          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    {/* Category 2 Services */}
                    {expandedCategories.category2 && (
                      <div className="bg-gray-50">
                        {Object.keys(categoryServices.category2).map((serviceName) => (
                          <div key={serviceName} className="flex items-center px-3 md:px-4 py-2 pl-6 md:pl-8 border-b border-gray-200 last:border-b-0">
                            <input
                              type="checkbox"
                              id={`category2-${serviceName}`}
                              checked={categoryServices.category2[serviceName]}
                              onChange={(e) => {
                                const newServices = {
                                  ...categoryServices.category2,
                                  [serviceName]: e.target.checked,
                                };
                                setCategoryServices({ ...categoryServices, category2: newServices });
                                // Category stays checked unless ALL services are unchecked
                                const allUnchecked = Object.values(newServices).every(v => !v);
                                if (allUnchecked) {
                                  setMembershipForm({ ...membershipForm, category2: false });
                                } else {
                                  // Keep category checked if at least one service is checked
                                  setMembershipForm({ ...membershipForm, category2: true });
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor={`category2-${serviceName}`} className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer">
                              {serviceName}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 3 */}
                  <div>
                    <div className="flex items-center px-3 md:px-4 py-2 md:py-3">
                      <input
                        type="checkbox"
                        id="category3"
                        checked={membershipForm.category3}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newForm = { ...membershipForm, category3: isChecked };
                          // If category is checked, check all its services
                          if (isChecked) {
                            const allServicesChecked = Object.keys(categoryServices.category3).reduce((acc, key) => {
                              acc[key] = true;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category3: allServicesChecked });
                          } else {
                            const allServicesUnchecked = Object.keys(categoryServices.category3).reduce((acc, key) => {
                              acc[key] = false;
                              return acc;
                            }, {} as { [key: string]: boolean });
                            setCategoryServices({ ...categoryServices, category3: allServicesUnchecked });
                          }
                          // Check if all categories are checked to update "All Services"
                          if (isChecked && newForm.category1 && newForm.category2) {
                            newForm.allServices = true;
                          } else {
                            // Only uncheck "All Services" if not all categories are checked
                            const allCategoriesChecked = newForm.category1 && newForm.category2 && (isChecked ? true : newForm.category3);
                            newForm.allServices = allCategoriesChecked;
                          }
                          setMembershipForm(newForm);
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="category3" className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer flex-1">
                        Category 3
                      </label>
                      <button
                        onClick={() => setExpandedCategories({ ...expandedCategories, category3: !expandedCategories.category3 })}
                        className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transform transition-transform ${expandedCategories.category3 ? 'rotate-180' : ''}`}
                        >
                          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    {/* Category 3 Services */}
                    {expandedCategories.category3 && (
                      <div className="bg-gray-50">
                        {Object.keys(categoryServices.category3).map((serviceName) => (
                          <div key={serviceName} className="flex items-center px-3 md:px-4 py-2 pl-6 md:pl-8 border-b border-gray-200 last:border-b-0">
                            <input
                              type="checkbox"
                              id={`category3-${serviceName}`}
                              checked={categoryServices.category3[serviceName]}
                              onChange={(e) => {
                                const newServices = {
                                  ...categoryServices.category3,
                                  [serviceName]: e.target.checked,
                                };
                                setCategoryServices({ ...categoryServices, category3: newServices });
                                // Category stays checked unless ALL services are unchecked
                                const allUnchecked = Object.values(newServices).every(v => !v);
                                if (allUnchecked) {
                                  setMembershipForm({ ...membershipForm, category3: false });
                                } else {
                                  // Keep category checked if at least one service is checked
                                  setMembershipForm({ ...membershipForm, category3: true });
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor={`category3-${serviceName}`} className="ml-2 md:ml-3 text-xs md:text-sm text-black cursor-pointer">
                              {serviceName}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Number of Sessions */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Number of Sessions <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Number of Sessions"
                  value={membershipForm.numberOfSessions}
                  onChange={(e) => setMembershipForm({ ...membershipForm, numberOfSessions: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-xs md:text-sm"
                />
              </div>

              {/* Eligible Days */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Eligible Days <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <select
                    value={membershipForm.eligibleDays}
                    onChange={(e) => setMembershipForm({ ...membershipForm, eligibleDays: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-xs md:text-sm"
                  >
                    <option value="">-Select Eligible Days-</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="All Days">All Days</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active / Inactive */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Active / Inactive
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMembershipForm({ ...membershipForm, isActive: !membershipForm.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      membershipForm.isActive ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        membershipForm.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex-shrink-0 bg-[#F9F9F9] border-t border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 z-20">
              <button
                onClick={() => setIsCreateMembershipSidebarOpen(false)}
                className="flex-[1] px-4 md:px-6 py-2 md:py-2.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle create membership
                  setIsCreateMembershipSidebarOpen(false);
                }}
                className="flex-[3] px-4 md:px-6 py-2 md:py-2.5 bg-primary rounded-lg text-xs md:text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Create Membership
              </button>
            </div>
      </div>
        </div>
      )}
    </div>
  );
}
