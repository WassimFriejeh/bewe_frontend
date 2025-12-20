"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import Popup from "../../components/Popup";
import Arrow from "../../components/ui/Arrow";

interface Promotion {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  services: string;
  status?: "active" | "paused" | "scheduled" | "expired";
}

export default function Marketing() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [selectedTab, setSelectedTab] = useState<"Active" | "Paused" | "Scheduled" | "Expired">("Active");
  const [selectedView, setSelectedView] = useState<"promotions" | "notifications" | "services-pricing">("promotions");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isResumePopupOpen, setIsResumePopupOpen] = useState(false);
  const [promotionToResume, setPromotionToResume] = useState<Promotion | null>(null);
  const [isPausePopupOpen, setIsPausePopupOpen] = useState(false);
  const [promotionToPause, setPromotionToPause] = useState<Promotion | null>(null);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(null);
  const [isCreatePromotionSidebarOpen, setIsCreatePromotionSidebarOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    "24-hours-reminder": true,
    "1-hour-reminder": true,
    "happy-birthday": true,
    "thank-you-visiting": false,
    "re-engagement-drip": true,
  });
  const [reEngagementMenuOpen, setReEngagementMenuOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [settingsData, setSettingsData] = useState({
    triggerTimeframe: "4 weeks",
    sendViaEmail: true,
    sendViaSMS: true,
    sendViaPopUp: false,
  });
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [sendMessageFilters, setSendMessageFilters] = useState({
    service: "All Services",
    fromDate: "",
    toDate: "",
  });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSortColumn, setCustomerSortColumn] = useState<string | null>(null);
  const [customerSortDirection, setCustomerSortDirection] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 12;
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [serviceSortColumn, setServiceSortColumn] = useState<string | null>(null);
  const [serviceSortDirection, setServiceSortDirection] = useState<"asc" | "desc">("asc");

  // Fixed data for Services & Pricing
  const servicesAndPricing = [
    {
      id: "1",
      serviceTitle: "Haircut",
      category: "Hair Services",
      subCategory: "Cutting",
      duration: "30 min",
      price: 45.00
    },
    {
      id: "2",
      serviceTitle: "Hair Color",
      category: "Hair Services",
      subCategory: "Coloring",
      duration: "2 hours",
      price: 120.00
    },
    {
      id: "3",
      serviceTitle: "Hair Treatment",
      category: "Hair Services",
      subCategory: "Treatment",
      duration: "45 min",
      price: 85.00
    },
    {
      id: "4",
      serviceTitle: "Hair Styling",
      category: "Hair Services",
      subCategory: "Styling",
      duration: "1 hour",
      price: 65.00
    },
    {
      id: "5",
      serviceTitle: "Hair Extension",
      category: "Hair Services",
      subCategory: "Extensions",
      duration: "3 hours",
      price: 350.00
    },
    {
      id: "6",
      serviceTitle: "Beard Trim",
      category: "Grooming",
      subCategory: "Beard",
      duration: "20 min",
      price: 25.00
    },
    {
      id: "7",
      serviceTitle: "Facial Treatment",
      category: "Skincare",
      subCategory: "Facial",
      duration: "1 hour",
      price: 95.00
    },
    {
      id: "8",
      serviceTitle: "Manicure",
      category: "Nail Services",
      subCategory: "Hands",
      duration: "45 min",
      price: 40.00
    },
    {
      id: "9",
      serviceTitle: "Pedicure",
      category: "Nail Services",
      subCategory: "Feet",
      duration: "1 hour",
      price: 50.00
    },
    {
      id: "10",
      serviceTitle: "Massage Therapy",
      category: "Wellness",
      subCategory: "Massage",
      duration: "1 hour",
      price: 100.00
    },
    {
      id: "11",
      serviceTitle: "Highlights",
      category: "Hair Services",
      subCategory: "Coloring",
      duration: "2.5 hours",
      price: 150.00
    },
    {
      id: "12",
      serviceTitle: "Balayage",
      category: "Hair Services",
      subCategory: "Coloring",
      duration: "3 hours",
      price: 180.00
    }
  ];

  const fetchPromotionsData = useCallback(async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // const response = await axiosClient.get("/promotions/get", {
      //   params: { branch_id: currentBranch.id },
      // });
      
      // Placeholder data for now
      const mockPromotions: Promotion[] = [
        {
          id: "1",
          title: "Promotion Title",
          type: "Buy One, Get One",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "Buy: Service 1 Get: Service 3",
          status: "active",
        },
        {
          id: "2",
          title: "Promotion Title",
          type: "Minimum Spend Discount",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "Service 1, Service 2, Service 3, Service 4, Service 5",
          status: "active",
        },
        {
          id: "3",
          title: "Promotion Title",
          type: "Percentage",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "-",
          status: "active",
        },
        {
          id: "4",
          title: "Promotion Title",
          type: "Flash Deals",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 3 Oct, 2025 | 02:30 pm",
          services: "Service 1, Service 2",
          status: "active",
        },
        {
          id: "5",
          title: "Promotion Title",
          type: "Buy One, Get One",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "-",
          status: "active",
        },
        {
          id: "6",
          title: "Promotion Title",
          type: "Percentage",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "Service 1",
          status: "active",
        },
        {
          id: "7",
          title: "Promotion Title",
          type: "Minimum Spend Discount",
          startDate: "Fri 29 Aug, 2025 | 02:30 pm",
          endDate: "Fri 5 Sep, 2025 | 02:30 pm",
          services: "-",
          status: "active",
        },
      ];

      setPromotions(mockPromotions);
    } catch (error) {
      console.error("Error fetching promotions data:", error);
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchPromotionsData();
    }
  }, [currentBranch?.id, branchChangeKey, fetchPromotionsData]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.re-engagement-menu')) {
        setReEngagementMenuOpen(false);
      }
    };

    if (reEngagementMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [reEngagementMenuOpen]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedPromotions = () => {
    if (!sortColumn) return promotions;

    return [...promotions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "Promotion Title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "Type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "Start Date & Time":
          aValue = a.startDate.toLowerCase();
          bValue = b.startDate.toLowerCase();
          break;
        case "End Date & Time":
          aValue = a.endDate.toLowerCase();
          bValue = b.endDate.toLowerCase();
          break;
        case "Services":
          aValue = a.services.toLowerCase();
          bValue = b.services.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handlePauseClick = (promotion: Promotion) => {
    setPromotionToPause(promotion);
    setIsPausePopupOpen(true);
  };

  const handlePauseCancel = () => {
    setIsPausePopupOpen(false);
    setPromotionToPause(null);
  };

  const handlePauseConfirm = async () => {
    if (!promotionToPause) return;

    try {
      // TODO: Replace with actual API call
      // await axiosClient.post("/promotions/pause", {
      //   promotion_id: promotionToPause.id,
      //   branch_id: currentBranch?.id,
      // });

      // Update local state
      setPromotions(prev => prev.map(p => 
        p.id === promotionToPause.id ? { ...p, status: "paused" as const } : p
      ));

      setIsPausePopupOpen(false);
      setPromotionToPause(null);
    } catch (error) {
      console.error("Error pausing promotion:", error);
      alert("Failed to pause promotion. Please try again.");
    }
  };

  const handleResumeClick = (promotion: Promotion) => {
    setPromotionToResume(promotion);
    setIsResumePopupOpen(true);
  };

  const handleResumeCancel = () => {
    setIsResumePopupOpen(false);
    setPromotionToResume(null);
  };

  const handleResumeConfirm = async () => {
    if (!promotionToResume) return;

    try {
      // TODO: Replace with actual API call
      // await axiosClient.post("/promotions/resume", {
      //   promotion_id: promotionToResume.id,
      //   branch_id: currentBranch?.id,
      // });

      // Update local state - check if expired first
      const isExpired = checkIfExpired(promotionToResume.endDate);
      setPromotions(prev => prev.map(p => 
        p.id === promotionToResume.id 
          ? { ...p, status: isExpired ? "expired" as const : "active" as const } 
          : p
      ));

      setIsResumePopupOpen(false);
      setPromotionToResume(null);
    } catch (error) {
      console.error("Error resuming promotion:", error);
      alert("Failed to resume promotion. Please try again.");
    }
  };

  const checkIfExpired = (endDateString: string): boolean => {
    // Parse date from format "Fri 5 Sep, 2025 | 02:30 pm"
    const dateMatch = endDateString.match(/(\d{1,2})\s+(\w+),\s+(\d{4})/);
    if (!dateMatch) return false;

    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2];
    const year = parseInt(dateMatch[3], 10);

    const monthMap: { [key: string]: number } = {
      "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
      "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
    };

    const month = monthMap[monthName];
    if (month === undefined) return false;

    const endDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return endDate < today;
  };

  // Auto-update expired promotions on initial load
  useEffect(() => {
    const now = new Date();
    setPromotions(prev => {
      const updated = prev.map(p => {
        if (p.status === "expired") return p;
        const isExpired = checkIfExpired(p.endDate);
        if (isExpired) {
          return { ...p, status: "expired" as const };
        }
        return p;
      });
      // Only update if something changed
      const hasChanges = updated.some((p, i) => p.status !== prev[i]?.status);
      return hasChanges ? updated : prev;
    });
  }, []); // Only run once on mount

  const getFilteredPromotions = () => {
    const sorted = getSortedPromotions();
    let filtered = sorted;

    // Auto-mark expired promotions (but don't update state here to avoid loops)
    filtered = filtered.map(p => {
      if (p.status === "expired") return p;
      const isExpired = checkIfExpired(p.endDate);
      if (isExpired) {
        return { ...p, status: "expired" as const };
      }
      return p;
    });

    // Filter by tab (status)
    const statusMap: { [key: string]: "active" | "paused" | "scheduled" | "expired" } = {
      "Active": "active",
      "Paused": "paused",
      "Scheduled": "scheduled",
      "Expired": "expired",
    };
    
    const targetStatus = statusMap[selectedTab];
    filtered = filtered.filter((promotion) => {
      const promotionStatus = promotion.status || "active";
      return promotionStatus === targetStatus;
    });

    // Filter by type
    if (selectedType !== "All Types") {
      filtered = filtered.filter((promotion) => promotion.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (promotion) =>
          promotion.title.toLowerCase().includes(query) ||
          promotion.type.toLowerCase().includes(query)
      );
    }

    // Filter by date range (if dates are provided)
    if (fromDate) {
      // TODO: Implement date filtering
    }
    if (toDate) {
      // TODO: Implement date filtering
    }

    return filtered;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedTab, fromDate, toDate]);

  const filteredPromotions = getFilteredPromotions();
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromotions = filteredPromotions.slice(startIndex, endIndex);

  // Get unique types for filter dropdown
  const promotionTypes = Array.from(new Set(promotions.map((p) => p.type)));

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      "Buy One, Get One": "bg-blue-100 text-blue-700",
      "Minimum Spend Discount": "bg-green-100 text-green-700",
      "Percentage": "bg-purple-100 text-purple-700",
      "Flash Deals": "bg-orange-100 text-orange-700",
    };
    return colorMap[type] || "bg-gray-100 text-gray-700";
  };

  const handleEditClick = (promotion: Promotion) => {
    setPromotionToEdit(promotion);
    setIsEditSidebarOpen(true);
  };

  const handleDeleteClick = (promotion: Promotion) => {
    // TODO: Implement delete functionality
    console.log("Delete promotion:", promotion);
  };

  const handleCancelPromotion = async (promotion: Promotion) => {
    try {
      // TODO: Replace with actual API call
      // await axiosClient.post("/promotions/cancel", {
      //   promotion_id: promotion.id,
      //   branch_id: currentBranch?.id,
      // });

      // Update local state - remove from scheduled (you might want to move to a different status)
      setPromotions(prev => prev.filter(p => p.id !== promotion.id));
    } catch (error) {
      console.error("Error canceling promotion:", error);
      alert("Failed to cancel promotion. Please try again.");
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] md:-ml-6 md:-mr-6 md:-mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Marketing</span>
          </h1>
          <div className="flex items-center gap-4">
            <BranchSelector />
            <button className="relative text-gray-600 hover:text-gray-900">
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1458 18.75C16.1458 20.7635 14.5135 22.3958 12.5 22.3958C10.4864 22.3958 8.85416 20.7635 8.85416 18.75" stroke="currentColor" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.0324 18.7503H4.96757C3.94995 18.7503 3.125 17.9253 3.125 16.9077C3.125 16.4191 3.31912 15.9504 3.66468 15.6048L4.29304 14.9765C4.87909 14.3904 5.20833 13.5955 5.20833 12.7668V9.89616C5.20833 5.86909 8.47293 2.60449 12.5 2.60449C16.5271 2.60449 19.7917 5.86908 19.7917 9.89616V12.7668C19.7917 13.5955 20.1209 14.3904 20.707 14.9765L21.3353 15.6048C21.6808 15.9504 21.875 16.4191 21.875 16.9077C21.875 17.9253 21.05 18.7503 20.0324 18.7503Z" stroke="currentColor" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="absolute top-[-10px] right-[4px] translate-x-1.5 translate-y-1.5 w-3 h-3 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                2
              </span>
            </button>
            {selectedView === "promotions" && (
              <Button 
                variant="primary" 
                className="flex items-center gap-2"
                onClick={() => setIsCreatePromotionSidebarOpen(true)}
              >
                <span className="hidden md:inline">Create Promotion</span>
                <span className="md:hidden">Create</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row">
        {/* Left Sidebar - Sub Navigation */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 p-6">
          <h2 className="text-lg font-bold text-black mb-6">Marketing</h2>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedView("promotions")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedView === "promotions"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Promotions & Deals
            </button>
            <button
              onClick={() => setSelectedView("notifications")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedView === "notifications"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Automated Notifications
            </button>
            <button
              onClick={() => setSelectedView("services-pricing")}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedView === "services-pricing"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Services & Pricing
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden bg-white border-b border-gray-200 px-2 sm:px-3 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedView("promotions")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedView === "promotions"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Promotions & Deals
            </button>
            <button
              onClick={() => setSelectedView("notifications")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedView === "notifications"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Automated Notifications
            </button>
            <button
              onClick={() => setSelectedView("services-pricing")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedView === "services-pricing"
                  ? "bg-primary/10 text-primary"
                  : "text-black/60 hover:bg-gray-50"
              }`}
            >
              Services & Pricing
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-3 md:p-6 overflow-x-hidden">
          {selectedView === "promotions" ? (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-6 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(["Active", "Paused", "Scheduled", "Expired"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedTab === tab
                        ? "bg-black text-white"
                        : "bg-white text-black/60 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search and Filters - Desktop */}
              <div className="hidden md:flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 flex-1">
                  {/* Search Input */}
                  <div className="flex-1 max-w-md">
                    <SearchInput
                      placeholder="Search by Promotion title"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-4 py-3 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none bg-white cursor-pointer"
                    >
                      <option value="All Types">Type: All Types</option>
                      {promotionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* From Date */}
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-4 py-3 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs bg-white cursor-pointer"
                      placeholder="From: dd/mm/yyyy"
                    />
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* To Date */}
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-4 py-3 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs bg-white cursor-pointer"
                      placeholder="To: dd/mm/yyyy"
                    />
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search and Filters - Mobile/Tablet */}
              <div className="flex md:hidden flex-col gap-3 mb-4">
                {/* Search Input */}
                <div className="w-full">
                  <SearchInput
                    placeholder="Search by Promotion title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col gap-2">
                  {/* Type Filter */}
                  <div className="relative w-full">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2.5 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none bg-white cursor-pointer"
                    >
                      <option value="All Types">Type: All Types</option>
                      {promotionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Date Filters Row */}
                  <div className="flex items-center gap-2">
                    {/* From Date */}
                    <div className="relative flex-1">
                      <label className="block text-xs text-black/60 mb-1">From</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full px-3 py-2.5 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs bg-white cursor-pointer"
                        />
                        <svg
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* To Date */}
                    <div className="relative flex-1">
                      <label className="block text-xs text-black/60 mb-1">To</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full px-3 py-2.5 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs bg-white cursor-pointer"
                        />
                        <svg
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotions Table - Desktop */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        {(selectedTab === "Expired" 
                          ? ["Promotion Title", "Type", "Expired on", "Services", "Action"]
                          : ["Promotion Title", "Type", "Start Date & Time", "End Date & Time", "Services", "Action"]
                        ).map((header) => {
                          const isSorted = sortColumn === header;
                          return (
                            <th
                              key={header}
                              onClick={() => handleSort(header)}
                              className={`group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize ${
                                header !== "Action" ? "cursor-pointer" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {header}
                                {header !== "Action" && (
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
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={selectedTab === "Expired" ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                            Loading promotions...
                          </td>
                        </tr>
                      ) : paginatedPromotions.length === 0 ? (
                        <tr>
                          <td colSpan={selectedTab === "Expired" ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                            No promotions found
                          </td>
                        </tr>
                      ) : (
                        paginatedPromotions.map((promotion) => (
                          <tr 
                            key={promotion.id} 
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-5 py-4 text-xs font-normal text-black/80">{promotion.title}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(promotion.type)}`}>
                                {promotion.type}
                              </span>
                            </td>
                            {selectedTab === "Expired" ? (
                              <td className="px-5 py-4 text-xs font-normal text-black/80">{promotion.endDate}</td>
                            ) : (
                              <>
                                <td className="px-5 py-4 text-xs font-normal text-black/80">{promotion.startDate}</td>
                                <td className="px-5 py-4 text-xs font-normal text-black/80">{promotion.endDate}</td>
                              </>
                            )}
                            <td className="px-5 py-4 text-xs font-normal text-black/80">{promotion.services}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {selectedTab === "Active" && (
                                  <>
                                    <button
                                      onClick={() => handlePauseClick(promotion)}
                                      className="h-[32px] w-[32px] flex items-center justify-center border border-black/10 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                                      title="Pause promotion"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 4V12M10 4V12" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <div className="h-[32px] w-[32px] cursor-pointer" onClick={() => handleEditClick(promotion)}>
                                      <EditIcon />
                                    </div>
                                  </>
                                )}
                                {selectedTab === "Paused" && (
                                  <>
                                    <div className="h-[32px] w-[32px] cursor-pointer" onClick={() => handleEditClick(promotion)}>
                                      <EditIcon />
                                    </div>
                                    <button
                                      onClick={() => handleResumeClick(promotion)}
                                      className="h-[32px] w-[32px] flex items-center justify-center bg-green-100 rounded hover:bg-green-200 transition-colors cursor-pointer"
                                      title="Resume promotion"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 4L12 8L6 12V4Z" fill="#10B981" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                  </>
                                )}
                                {selectedTab === "Scheduled" && (
                                  <>
                                    <button
                                      onClick={() => handleCancelPromotion(promotion)}
                                      className="h-[32px] w-[32px] flex items-center justify-center border border-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Cancel promotion"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 4L4 12M4 4L12 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <div className="h-[32px] w-[32px] cursor-pointer" onClick={() => handleEditClick(promotion)}>
                                      <EditIcon />
                                    </div>
                                  </>
                                )}
                                {selectedTab === "Expired" && (
                                  <DeleteIcon onClick={() => handleDeleteClick(promotion)} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination - Desktop */}
                {filteredPromotions.length > 0 && (
                  <div className="hidden md:flex px-4 py-3 bg-gray-50 border-t border-gray-200 items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {paginatedPromotions.length} out of {filteredPromotions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded cursor-pointer ${
                            currentPage === page
                              ? "bg-primary text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Promotions Table - Mobile/Tablet */}
              <div className="block md:hidden bg-white rounded-lg shadow-sm overflow-visible">
                {isLoading ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    Loading promotions...
                  </div>
                ) : paginatedPromotions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No promotions found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {paginatedPromotions.map((promotion) => (
                      <div key={promotion.id} className="p-3 md:p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-sm font-medium text-black mb-2 break-words">{promotion.title}</h3>
                            <div className="mb-2">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium break-words ${getTypeColor(promotion.type)}`}>
                                {promotion.type}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-black/80">
                              {selectedTab === "Expired" ? (
                                <div className="break-words">
                                  <span className="text-black/60">Expired on: </span>
                                  <span className="break-all">{promotion.endDate}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="break-words">
                                    <span className="text-black/60">Start: </span>
                                    <span className="break-all">{promotion.startDate}</span>
                                  </div>
                                  <div className="break-words">
                                    <span className="text-black/60">End: </span>
                                    <span className="break-all">{promotion.endDate}</span>
                                  </div>
                                </>
                              )}
                              <div className="pt-1 break-words">
                                <span className="text-black/60">Services: </span>
                                <span className="break-words break-all">{promotion.services}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 flex-shrink-0 pt-1">
                            {selectedTab === "Active" && (
                              <>
                                <button
                                  onClick={() => handlePauseClick(promotion)}
                                  className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center border border-black/10 rounded hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
                                  title="Pause promotion"
                                >
                                  <svg width="14" height="14" className="md:w-[16px] md:h-[16px]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4V12M10 4V12" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <div className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] cursor-pointer flex-shrink-0" onClick={() => handleEditClick(promotion)}>
                                  <EditIcon />
                                </div>
                              </>
                            )}
                            {selectedTab === "Paused" && (
                              <>
                                <div className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] cursor-pointer flex-shrink-0" onClick={() => handleEditClick(promotion)}>
                                  <EditIcon />
                                </div>
                                <button
                                  onClick={() => handleResumeClick(promotion)}
                                  className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center bg-green-100 rounded hover:bg-green-200 transition-colors cursor-pointer flex-shrink-0"
                                  title="Resume promotion"
                                >
                                  <svg width="14" height="14" className="md:w-[16px] md:h-[16px]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L12 8L6 12V4Z" fill="#10B981" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              </>
                            )}
                            {selectedTab === "Scheduled" && (
                              <>
                                <button
                                  onClick={() => handleCancelPromotion(promotion)}
                                  className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center border border-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                                  title="Cancel promotion"
                                >
                                  <svg width="14" height="14" className="md:w-[16px] md:h-[16px]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <div className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] cursor-pointer flex-shrink-0" onClick={() => handleEditClick(promotion)}>
                                  <EditIcon />
                                </div>
                              </>
                            )}
                            {selectedTab === "Expired" && (
                              <div className="flex-shrink-0">
                                <DeleteIcon onClick={() => handleDeleteClick(promotion)} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination - Mobile/Tablet */}
                {filteredPromotions.length > 0 && (
                  <div className="block md:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-700 mb-3 text-center">
                      Showing {paginatedPromotions.length} out of {filteredPromotions.length}
                    </div>
                    <div className="flex items-center justify-center gap-2 overflow-x-auto">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
                            currentPage === page
                              ? "bg-primary text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : selectedView === "notifications" ? (
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-black mb-2">Automated Notifications</h3>
                <p className="text-xs md:text-sm text-black/60">
                  View and enable/disable all automated messages sent to your clients.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {/* 24-hours reminder */}
                <div className="border border-black/10 rounded-lg p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-black mb-2 md:mb-3 break-words">24-hours reminder before a booking</h4>
                    <p className="text-xs text-black/60 leading-relaxed break-words">
                      Lorem ipsum dolor sit amet consectetur. Turpis enim aliquam aenean sed leo id sit tempus. Viverra tortor netus accumsan aliquet bibendum.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        "24-hours-reminder": !prev["24-hours-reminder"]
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        notificationSettings["24-hours-reminder"] ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings["24-hours-reminder"] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-black/60">Enable / Disable</span>
                  </div>
                </div>

                {/* 1-hour reminder */}
                <div className="border border-black/10 rounded-lg p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-black mb-2 md:mb-3 break-words">1-hour reminder before a booking</h4>
                    <p className="text-xs text-black/60 leading-relaxed break-words">
                      Lorem ipsum dolor sit amet consectetur. Turpis enim aliquam aenean sed leo id sit tempus. Viverra tortor netus accumsan aliquet bibendum.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        "1-hour-reminder": !prev["1-hour-reminder"]
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        notificationSettings["1-hour-reminder"] ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings["1-hour-reminder"] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-black/60">Enable / Disable</span>
                  </div>
                </div>

                {/* Happy Birthday */}
                <div className="border border-black/10 rounded-lg p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-black mb-2 md:mb-3 break-words">Happy Birthday Message</h4>
                    <p className="text-xs text-black/60 leading-relaxed break-words">
                      Lorem ipsum dolor sit amet consectetur. Turpis enim aliquam aenean sed leo id sit tempus. Viverra tortor netus accumsan aliquet bibendum.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        "happy-birthday": !prev["happy-birthday"]
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        notificationSettings["happy-birthday"] ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings["happy-birthday"] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-black/60">Enable / Disable</span>
                  </div>
                </div>

                {/* Thank You for Visiting */}
                <div className="border border-black/10 rounded-lg p-4 md:p-5 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-black mb-2 md:mb-3 break-words">Thank You for Visiting</h4>
                    <p className="text-xs text-black/60 leading-relaxed break-words">
                      Lorem ipsum dolor sit amet consectetur. Turpis enim aliquam aenean sed leo id sit tempus. Viverra tortor netus accumsan aliquet bibendum.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        "thank-you-visiting": !prev["thank-you-visiting"]
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        notificationSettings["thank-you-visiting"] ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings["thank-you-visiting"] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-black/60">Enable / Disable</span>
                  </div>
                </div>

                {/* Re-Engagement Drip */}
                <div className="border border-black/10 rounded-lg p-4 md:p-5 flex flex-col justify-between relative min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-black mb-2 md:mb-3 break-words">Re-Engagement Drip</h4>
                    <p className="text-xs text-black/60 leading-relaxed break-words">
                      Lorem ipsum dolor sit amet consectetur. Turpis enim aliquam aenean sed leo id sit tempus. Viverra tortor netus accumsan aliquet bibendum.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between relative flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotificationSettings(prev => ({
                          ...prev,
                          "re-engagement-drip": !prev["re-engagement-drip"]
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          notificationSettings["re-engagement-drip"] ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationSettings["re-engagement-drip"] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-xs text-black/60">Enable / Disable</span>
                    </div>
                    <div className="relative re-engagement-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReEngagementMenuOpen(!reEngagementMenuOpen);
                        }}
                        className="p-1.5 rounded transition-colors cursor-pointer text-black/40 hover:bg-black hover:text-white"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                          <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                          <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                        </svg>
                      </button>
                      {reEngagementMenuOpen && (
                        <div className="absolute right-0 top-8 mt-2 w-56 md:w-64 bg-white border border-black/10 rounded-lg shadow-lg z-50">
                          <div className="py-1 px-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReEngagementMenuOpen(false);
                                setIsSettingsSidebarOpen(true);
                              }}
                              className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap"
                            >
                              Settings
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReEngagementMenuOpen(false);
                                setIsSendMessageModalOpen(true);
                              }}
                              className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded whitespace-nowrap"
                            >
                              Send Automated Messages
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Empty card with menu */}
                <div className="border border-black/10 rounded-lg p-5 flex items-end justify-end">
                  <button className="text-black/40 hover:text-black/60 transition-colors cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" fill="currentColor"/>
                      <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" fill="currentColor"/>
                      <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedView === "services-pricing" ? (
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-black mb-2">Services & Pricing</h3>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-4">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none bg-white cursor-pointer"
                  >
                    <option value="All">Category: All</option>
                    {Array.from(new Set(servicesAndPricing.map(s => s.category))).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <SearchInput
                    placeholder="Search by service title"
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Services Table */}
              <div className="border border-black/10 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-5 py-4 text-left text-xs font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (serviceSortColumn === "serviceTitle") {
                            setServiceSortDirection(serviceSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setServiceSortColumn("serviceTitle");
                            setServiceSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Service Title
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-5 py-4 text-left text-xs font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (serviceSortColumn === "category") {
                            setServiceSortDirection(serviceSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setServiceSortColumn("category");
                            setServiceSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Category
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-5 py-4 text-left text-xs font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (serviceSortColumn === "subCategory") {
                            setServiceSortDirection(serviceSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setServiceSortColumn("subCategory");
                            setServiceSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Sub-Category
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-5 py-4 text-left text-xs font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (serviceSortColumn === "duration") {
                            setServiceSortDirection(serviceSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setServiceSortColumn("duration");
                            setServiceSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Duration
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-5 py-4 text-left text-xs font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (serviceSortColumn === "price") {
                            setServiceSortDirection(serviceSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setServiceSortColumn("price");
                            setServiceSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Price
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-black">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      let filtered = [...servicesAndPricing];

                      // Filter by category
                      if (selectedCategory !== "All") {
                        filtered = filtered.filter(service => service.category === selectedCategory);
                      }

                      // Filter by search query
                      if (serviceSearchQuery) {
                        const query = serviceSearchQuery.toLowerCase();
                        filtered = filtered.filter(service =>
                          service.serviceTitle.toLowerCase().includes(query)
                        );
                      }

                      // Sort
                      if (serviceSortColumn) {
                        filtered.sort((a, b) => {
                          let aValue: any = a[serviceSortColumn as keyof typeof a];
                          let bValue: any = b[serviceSortColumn as keyof typeof b];

                          if (serviceSortColumn === "price") {
                            aValue = Number(aValue);
                            bValue = Number(bValue);
                          } else {
                            aValue = String(aValue).toLowerCase();
                            bValue = String(bValue).toLowerCase();
                          }

                          if (aValue < bValue) return serviceSortDirection === "asc" ? -1 : 1;
                          if (aValue > bValue) return serviceSortDirection === "asc" ? 1 : -1;
                          return 0;
                        });
                      }

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                              No services found
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            {service.serviceTitle}
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            {service.category}
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            {service.subCategory}
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            {service.duration}
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            ${service.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="cursor-pointer">
                                <EditIcon />
                              </div>
                              <div className="cursor-pointer">
                                <DeleteIcon onClick={() => {}} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Pause Confirmation Popup */}
      <Popup
        isOpen={isPausePopupOpen}
        onClose={handlePauseCancel}
        title="Pause Promotion"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to pause this promotion?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="transparent"
              onClick={handlePauseCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePauseConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Popup>

      {/* Resume Confirmation Popup */}
      <Popup
        isOpen={isResumePopupOpen}
        onClose={handleResumeCancel}
        title="Resume Promotion"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to resume this promotion?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="transparent"
              onClick={handleResumeCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResumeConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Popup>

      {/* Edit Promotion Sidebar */}
      {isEditSidebarOpen && promotionToEdit && (
        <EditPromotionSidebar
          promotion={promotionToEdit}
          onClose={() => {
            setIsEditSidebarOpen(false);
            setPromotionToEdit(null);
          }}
          onSave={(updatedPromotion) => {
            setPromotions(prev => prev.map(p => 
              p.id === updatedPromotion.id ? updatedPromotion : p
            ));
            setIsEditSidebarOpen(false);
            setPromotionToEdit(null);
          }}
        />
      )}

      {/* Create Promotion Sidebar */}
      {isCreatePromotionSidebarOpen && (
        <CreatePromotionSidebar
          onClose={() => setIsCreatePromotionSidebarOpen(false)}
          onSave={() => {
            fetchPromotionsData();
            setIsCreatePromotionSidebarOpen(false);
          }}
        />
      )}

      {/* Settings Sidebar */}
      {isSettingsSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSettingsSidebarOpen(false)}
          />
          <div className="relative w-full md:w-[400px] md:min-w-[400px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-black">Settings</h2>
              <button
                onClick={() => setIsSettingsSidebarOpen(false)}
                className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
    </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
              {/* Trigger Timeframe */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Trigger Timeframe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={settingsData.triggerTimeframe}
                    onChange={(e) => setSettingsData({ ...settingsData, triggerTimeframe: e.target.value })}
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="3 weeks">3 weeks</option>
                    <option value="4 weeks">4 weeks</option>
                    <option value="5 weeks">5 weeks</option>
                    <option value="6 weeks">6 weeks</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-black">Notification Channels</h3>
                
                {/* Send via Email */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-black">Send via Email</span>
                  <button
                    onClick={() => setSettingsData({ ...settingsData, sendViaEmail: !settingsData.sendViaEmail })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      settingsData.sendViaEmail ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settingsData.sendViaEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Send via SMS */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-black">Send via SMS</span>
                  <button
                    onClick={() => setSettingsData({ ...settingsData, sendViaSMS: !settingsData.sendViaSMS })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      settingsData.sendViaSMS ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settingsData.sendViaSMS ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Send via pop-up notification */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-black">Send via pop-up notification</span>
                  <button
                    onClick={() => setSettingsData({ ...settingsData, sendViaPopUp: !settingsData.sendViaPopUp })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      settingsData.sendViaPopUp ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settingsData.sendViaPopUp ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 md:p-6 border-t border-gray-200 bg-white sticky bottom-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSettingsSidebarOpen(false)}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    // Handle save changes
                    setIsSettingsSidebarOpen(false);
                  }}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-primary rounded-lg text-xs md:text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Automated Message Sidebar */}
      {isSendMessageModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSendMessageModalOpen(false)}
          />
          <div className="relative w-full md:w-[90%] md:max-w-4xl bg-white h-full shadow-xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-black">Send Automated Message</h2>
              <button
                onClick={() => setIsSendMessageModalOpen(false)}
                className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Service Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Service:</label>
                  <div className="relative">
                    <select
                      value={sendMessageFilters.service}
                      onChange={(e) => setSendMessageFilters({ ...sendMessageFilters, service: e.target.value })}
                      className="w-full px-4 py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-sm"
                    >
                      <option value="All Services">All Services</option>
                      <option value="Haircut">Haircut</option>
                      <option value="Hair Color">Hair Color</option>
                      <option value="Hair Treatment">Hair Treatment</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* From Date */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">From:</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={sendMessageFilters.fromDate}
                      readOnly
                      className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white cursor-pointer focus:outline-none focus:border-primary text-sm pr-10"
                    />
                    <input
                      type="date"
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          const [year, month, day] = date.split('-');
                          const formatted = `${day}/${month}/${year}`;
                          setSendMessageFilters({ ...sendMessageFilters, fromDate: formatted });
                        } else {
                          setSendMessageFilters({ ...sendMessageFilters, fromDate: "" });
                        }
                      }}
                      className="absolute right-0 top-0 opacity-0 cursor-pointer z-20"
                      style={{ width: '48px', height: '100%' }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none z-10">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">To:</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={sendMessageFilters.toDate}
                      readOnly
                      className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white cursor-pointer focus:outline-none focus:border-primary text-sm pr-10"
                    />
                    <input
                      type="date"
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          const [year, month, day] = date.split('-');
                          const formatted = `${day}/${month}/${year}`;
                          setSendMessageFilters({ ...sendMessageFilters, toDate: formatted });
                        } else {
                          setSendMessageFilters({ ...sendMessageFilters, toDate: "" });
                        }
                      }}
                      className="absolute right-0 top-0 opacity-0 cursor-pointer z-20"
                      style={{ width: '48px', height: '100%' }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none z-10">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer List - Desktop */}
              <div className="hidden md:block border border-black/10 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.length === 8 && 8 > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomers(Array.from({ length: 8 }, (_, i) => `customer-${i}`));
                            } else {
                              setSelectedCustomers([]);
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (customerSortColumn === "customer") {
                            setCustomerSortDirection(customerSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setCustomerSortColumn("customer");
                            setCustomerSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Customer
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (customerSortColumn === "date") {
                            setCustomerSortDirection(customerSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setCustomerSortColumn("date");
                            setCustomerSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Last Appointment Date
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (customerSortColumn === "service") {
                            setCustomerSortDirection(customerSortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setCustomerSortColumn("service");
                            setCustomerSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          Service
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: 8 }, (_, i) => {
                      const customerId = `customer-${i}`;
                      const isSelected = selectedCustomers.includes(customerId);
                      return (
                        <tr 
                          key={customerId}
                          className={isSelected ? "bg-primary/10" : "hover:bg-gray-50"}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers([...selectedCustomers, customerId]);
                                } else {
                                  setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
                                }
                              }}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">J</span>
                              </div>
                              <span className="text-sm text-black">Jane Doe</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-black">Fri 29 Aug, 2025</td>
                          <td className="px-4 py-3 text-sm text-black">Haircut</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Customer List - Mobile/Tablet */}
              <div className="block md:hidden border border-black/10 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {/* Select All */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === 8 && 8 > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(Array.from({ length: 8 }, (_, i) => `customer-${i}`));
                          } else {
                            setSelectedCustomers([]);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs font-medium text-black">Select All</span>
                    </label>
                  </div>
                  
                  {Array.from({ length: 8 }, (_, i) => {
                    const customerId = `customer-${i}`;
                    const isSelected = selectedCustomers.includes(customerId);
                    return (
                      <div 
                        key={customerId}
                        className={`p-3 ${isSelected ? "bg-primary/10" : "bg-white"}`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers([...selectedCustomers, customerId]);
                              } else {
                                setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
                              }
                            }}
                            className="mt-1 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600">J</span>
                              </div>
                              <span className="text-xs font-medium text-black">Jane Doe</span>
                            </div>
                            <div className="text-xs text-black/60 space-y-1">
                              <div>
                                <span className="text-black/40">Date: </span>
                                <span>Fri 29 Aug, 2025</span>
                              </div>
                              <div>
                                <span className="text-black/40">Service: </span>
                                <span>Haircut</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 md:p-6 border-t border-gray-200 bg-white sticky bottom-0">
              <div className="flex items-center justify-end gap-2 md:gap-3">
                <button
                  onClick={() => setIsSendMessageModalOpen(false)}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle send reminder
                    setIsSendMessageModalOpen(false);
                  }}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-primary rounded-lg text-xs md:text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to parse date string to Date object
const parseDateString = (dateString: string): { date: string; time: string } => {
  // Format: "Fri 29 Aug, 2025 | 02:30 pm"
  const match = dateString.match(/(\d{1,2})\s+(\w+),\s+(\d{4})\s+\|\s+(\d{1,2}):(\d{2})\s+(am|pm)/i);
  if (!match) {
    return { date: "", time: "" };
  }

  const day = match[1].padStart(2, '0');
  const monthName = match[2];
  const year = match[3];
  const hour = match[4];
  const minute = match[5];
  const period = match[6].toLowerCase();

  const monthMap: { [key: string]: string } = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
    "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
  };

  const month = monthMap[monthName] || "01";
  const dateStr = `${year}-${month}-${day}`;
  
  // Convert 12-hour to 24-hour format
  let hour24 = parseInt(hour, 10);
  if (period === "pm" && hour24 !== 12) hour24 += 12;
  if (period === "am" && hour24 === 12) hour24 = 0;
  const timeStr = `${hour24.toString().padStart(2, '0')}:${minute}`;

  return { date: dateStr, time: timeStr };
};

// Helper function to format date and time back to display format
const formatDateString = (date: string, time: string): string => {
  if (!date || !time) return "";
  
  const dateObj = new Date(date);
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours, 10);
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const dayName = dayNames[dateObj.getDay()];
  const day = dateObj.getDate();
  const monthName = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${dayName} ${day} ${monthName}, ${year} | ${hour12}:${minutes} ${period}`;
};

// Edit Promotion Sidebar Component
function EditPromotionSidebar({
  promotion,
  onClose,
  onSave,
}: {
  promotion: Promotion;
  onClose: () => void;
  onSave: (promotion: Promotion) => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const parsedStart = parseDateString(promotion.startDate);
  const parsedEnd = parseDateString(promotion.endDate);
  
  const [formData, setFormData] = useState({
    title: promotion.title,
    type: promotion.type,
    startDate: parsedStart.date,
    startTime: parsedStart.time,
    endDate: parsedEnd.date,
    endTime: parsedEnd.time,
    services: promotion.services,
  });

  const promotionTypes = [
    "Buy One, Get One",
    "Minimum Spend Discount",
    "Percentage",
    "Flash Deals",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSave = () => {
    const updatedPromotion: Promotion = {
      ...promotion,
      title: formData.title,
      type: formData.type,
      startDate: formatDateString(formData.startDate, formData.startTime),
      endDate: formatDateString(formData.endDate, formData.endTime),
      services: formData.services,
    };

    // Check if expired after date change
    const isExpired = checkIfExpired(updatedPromotion.endDate);
    if (isExpired) {
      updatedPromotion.status = "expired";
    } else if (updatedPromotion.status === "expired") {
      // If it's no longer expired, set back to active
      updatedPromotion.status = "active";
    }

    onSave(updatedPromotion);
  };

  const checkIfExpired = (endDateString: string): boolean => {
    const dateMatch = endDateString.match(/(\d{1,2})\s+(\w+),\s+(\d{4})/);
    if (!dateMatch) return false;

    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2];
    const year = parseInt(dateMatch[3], 10);

    const monthMap: { [key: string]: number } = {
      "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
      "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
    };

    const month = monthMap[monthName];
    if (month === undefined) return false;

    const endDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return endDate < today;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-full md:w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 z-10">
          <button
            onClick={handleClose}
            className="cursor-pointer opacity-100 flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-sm md:text-base font-semibold flex-1">Edit Promotion</h2>
          <div className="w-6"></div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 pt-3">
          <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Edit Promotion Details</h3>
          
          <div className="space-y-4 pb-8 md:pb-10">
            {/* Title */}
            <div>
              <label className="main-label black">
                Promotion Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Promotion Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="main-input"
              />
            </div>

            {/* Type */}
            <div>
              <label className="main-label black">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="main-input appearance-none pr-8 cursor-pointer"
                >
                  {promotionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="main-label black">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="main-input"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="main-label black">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="main-input"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="main-label black">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="main-input"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="main-label black">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="main-input"
              />
            </div>

            {/* Services */}
            <div>
              <label className="main-label black">
                Services
              </label>
              <textarea
                placeholder="Enter services (e.g., Buy: Service 1 Get: Service 3)"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                className="main-input min-h-[100px] resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200 sticky bottom-0 bg-[#F9F9F9] pb-4 md:pb-0">
            <Button
              variant="transparent"
              onClick={handleClose}
              className="flex-1 text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Promotion Sidebar Component
function CreatePromotionSidebar({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { currentBranch } = useBranch();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Step 1: Promotion Type
  const [selectedPromotionType, setSelectedPromotionType] = useState<string>("");
  
  // Step 2: Promotion Details
  const [promotionDetails, setPromotionDetails] = useState({
    coverImage: null as File | null,
    coverImageUrl: null as string | null,
    title: "",
    description: "",
    discountValue: "",
    minimumSpending: "",
    servicesToBuy: [] as string[],
    servicesToGet: [] as string[],
    selectedServices: [] as string[],
    startDateTime: "",
    endDateTime: "",
    dealDate: "",
    timeSlotStart: "",
    timeSlotEnd: "",
  });
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const steps = ["Promotion Type", "Promotion Details"];

  const promotionTypes = [
    { value: "Percentage Off", label: "Percentage Off" },
    { value: "Minimum Spend Discount", label: "Minimum Spend Discount" },
    { value: "Buy One, Get One", label: "Buy One, Get One" },
    { value: "Flash Deals", label: "Flash Deals" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      // Reset form state when closing
      setCurrentStep(1);
      setSelectedPromotionType("");
      setPromotionDetails({
        coverImage: null,
        coverImageUrl: null,
        title: "",
        description: "",
        discountValue: "",
        minimumSpending: "",
        servicesToBuy: [],
        servicesToGet: [],
        selectedServices: [],
        startDateTime: "",
        endDateTime: "",
        dealDate: "",
        timeSlotStart: "",
        timeSlotEnd: "",
      });
      onClose();
    }, 300);
  };

  const handleContinue = async () => {
    if (currentStep === 1) {
      // Validate promotion type selection
      if (!selectedPromotionType) {
        alert("Please select a promotion type");
        return;
      }
      setCurrentStep(2);
    } else {
      // On last step, save and close
      await handleSavePromotion();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Convert datetime-local string (YYYY-MM-DDTHH:mm) to display format
  const formatDateTimeLocalToDisplay = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    
    // datetime-local format: YYYY-MM-DDTHH:mm
    const [datePart, timePart] = datetimeLocal.split('T');
    if (!datePart || !timePart) return "";
    
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
    
    const hour24 = parseInt(hours, 10);
    const period = hour24 >= 12 ? "pm" : "am";
    const hour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
    
    return `${day}/${month}/${year} | ${hour12}:${minutes} ${period}`;
  };

  // Convert date and time to datetime-local format (YYYY-MM-DDTHH:mm)
  const convertToDateTimeLocal = (date: string, time: string): string => {
    if (!date || !time) return "";
    return `${date}T${time}`;
  };

  // Convert datetime-local to separate date and time
  const convertFromDateTimeLocal = (datetimeLocal: string): { date: string; time: string } => {
    if (!datetimeLocal) return { date: "", time: "" };
    const [date, time] = datetimeLocal.split('T');
    return { date: date || "", time: time || "" };
  };

  const formatDateString = (date: string, time: string): string => {
    if (!date || !time) return "";
    
    const dateObj = new Date(date);
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const period = hour24 >= 12 ? "pm" : "am";
    const hour12 = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const dayName = dayNames[dateObj.getDay()];
    const day = dateObj.getDate();
    const monthName = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${dayName} ${day} ${monthName}, ${year} | ${hour12}:${minutes} ${period}`;
  };

  const handleSavePromotion = async () => {
    if (!currentBranch) return;

    // Validation based on promotion type
    if (!promotionDetails.title || !promotionDetails.description) {
      alert("Please fill in all required fields");
      return;
    }

    // Type-specific validation
    if (selectedPromotionType === "Percentage Off") {
      if (!promotionDetails.discountValue || promotionDetails.selectedServices.length === 0 ||
          !promotionDetails.startDateTime || !promotionDetails.endDateTime) {
        alert("Please fill in all required fields");
        return;
      }
    } else if (selectedPromotionType === "Minimum Spend Discount") {
      if (!promotionDetails.discountValue || !promotionDetails.minimumSpending ||
          !promotionDetails.startDateTime || !promotionDetails.endDateTime) {
        alert("Please fill in all required fields");
        return;
      }
    } else if (selectedPromotionType === "Buy One, Get One") {
      if (promotionDetails.servicesToBuy.length === 0 || promotionDetails.servicesToGet.length === 0 ||
          !promotionDetails.startDateTime || !promotionDetails.endDateTime) {
        alert("Please fill in all required fields");
        return;
      }
    } else if (selectedPromotionType === "Flash Deals") {
      if (promotionDetails.selectedServices.length === 0 || !promotionDetails.startDateTime ||
          !promotionDetails.endDateTime) {
        alert("Please fill in all required fields");
        return;
      }
    }

    setIsSaving(true);
    try {
      let startDateStr = "";
      let endDateStr = "";
      let servicesStr = "";

      // Convert datetime-local to the format needed for API
      if (promotionDetails.startDateTime) {
        const { date, time } = convertFromDateTimeLocal(promotionDetails.startDateTime);
        startDateStr = formatDateString(date, time);
      }
      if (promotionDetails.endDateTime) {
        const { date, time } = convertFromDateTimeLocal(promotionDetails.endDateTime);
        endDateStr = formatDateString(date, time);
      }

      // Format services based on type
      if (selectedPromotionType === "Buy One, Get One") {
        const buyServices = promotionDetails.servicesToBuy.map(id => {
          const service = services.find(s => s.id === id);
          return service?.name || "";
        }).filter(Boolean);
        const getServices = promotionDetails.servicesToGet.map(id => {
          const service = services.find(s => s.id === id);
          return service?.name || "";
        }).filter(Boolean);
        servicesStr = `Buy: ${buyServices.join(", ")} Get: ${getServices.join(", ")}`;
      } else if (selectedPromotionType === "Percentage Off" || selectedPromotionType === "Flash Deals") {
        const selectedServiceNames = promotionDetails.selectedServices.map(id => {
          const service = services.find(s => s.id === id);
          return service?.name || "";
        }).filter(Boolean);
        servicesStr = selectedServiceNames.join(", ") || "-";
      } else {
        servicesStr = "-";
      }

      const requestData = {
        title: promotionDetails.title,
        type: selectedPromotionType,
        startDate: startDateStr,
        endDate: endDateStr,
        services: servicesStr,
        description: promotionDetails.description,
        discountValue: promotionDetails.discountValue || null,
        minimumSpending: promotionDetails.minimumSpending || null,
        status: "active",
        branch_id: currentBranch.id,
      };

      // TODO: Replace with actual API call
      // await axiosClient.post("/promotions/add", requestData);
      
      // For now, just refresh the list
      console.log("Creating promotion:", requestData);
      
      // Reset form state
      setCurrentStep(1);
      setSelectedPromotionType("");
      setPromotionDetails({
        coverImage: null,
        coverImageUrl: null,
        title: "",
        description: "",
        discountValue: "",
        minimumSpending: "",
        servicesToBuy: [],
        servicesToGet: [],
        selectedServices: [],
        startDateTime: "",
        endDateTime: "",
        dealDate: "",
        timeSlotStart: "",
        timeSlotEnd: "",
      });
      
      // Close modal and refresh promotions list
      onSave();
    } catch (error: any) {
      console.error("Error saving promotion:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save promotion. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-full md:w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 z-10">
          <button
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="cursor-pointer opacity-100 flex-shrink-0"
          >
            {currentStep === 1 ? (
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.72909 12.5H19.7916" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4584 18.75C11.4584 18.75 5.20837 14.147 5.20837 12.5C5.20837 10.8529 11.4584 6.25 11.4584 6.25" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <h2 className="text-sm md:text-base font-semibold flex-1">Create Promotion</h2>
          <div className="w-6"></div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <div className="flex items-center gap-1 md:gap-2 text-xs overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span
                  className={`font-medium transition-colors whitespace-nowrap ${
                    currentStep === index + 1 
                      ? "text-black" 
                      : "text-black/40"
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <Arrow direction="right" opacity={1} className="w-[12px] h-[12px] md:w-[17px] md:h-[17px] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 md:p-6 pt-3">
          {/* Step 1: Promotion Type */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Select Promotion Type</h3>
              
              <div className="space-y-2 pb-8 md:pb-10">
                {promotionTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setSelectedPromotionType(type.value)}
                    className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 bg-white border-2 rounded-lg cursor-pointer transition-colors overflow-hidden w-full ${
                      selectedPromotionType === type.value
                        ? "border-primary"
                        : "border-black/10 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] md:text-xs font-medium text-black mb-1">{type.label}</h4>
                      <p className="text-[10px] md:text-[11px] text-black/60">
                        Lorem ipsum dolor sit amet consectetur massa fames.
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5">
                      {selectedPromotionType === type.value ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary/60 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-black/20"></div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Promotion Details */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">
                {selectedPromotionType === "Percentage Off" && "Percentage Off details"}
                {selectedPromotionType === "Minimum Spend Discount" && "Minimum Spend Discount details"}
                {selectedPromotionType === "Buy One, Get One" && "Buy One, Get One details"}
                {selectedPromotionType === "Flash Deals" && "Flash Deal details"}
              </h3>
              
              <div className="space-y-4 pb-8 md:pb-10">
                {/* Promotion Cover Image Upload - Common for all types */}
                <div>
                  <label className="main-label black">
                    Promotion Cover Image Upload <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-black/60 mb-2">This photo will be displayed on the listing page.</p>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {promotionDetails.coverImageUrl ? (
                        <img
                          src={promotionDetails.coverImageUrl}
                          alt="Cover"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-black/10"
                        />
                      ) : (
                        <label className="cursor-pointer">
                          <div className="w-32 h-32 rounded-lg border border-black/10 flex items-center justify-center hover:border-primary transition-colors bg-gray-50">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16 10.6667V21.3333M10.6667 16H21.3333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPromotionDetails({
                                  ...promotionDetails,
                                  coverImage: file,
                                  coverImageUrl: URL.createObjectURL(file),
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex-1">
                      {promotionDetails.coverImageUrl ? (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/jpeg,image/png,image/svg+xml,image/webp';
                              input.onchange = (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (promotionDetails.coverImageUrl) {
                                    URL.revokeObjectURL(promotionDetails.coverImageUrl);
                                  }
                                  setPromotionDetails({
                                    ...promotionDetails,
                                    coverImage: file,
                                    coverImageUrl: URL.createObjectURL(file),
                                  });
                                }
                              };
                              input.click();
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10.1431 3.9881L11.0775 3.05359C11.5937 2.53748 12.4305 2.53748 12.9466 3.05359C13.4627 3.5697 13.4627 4.40649 12.9466 4.9226L12.0121 5.85711M10.1431 3.9881L4.65381 9.47737C3.95695 10.1742 3.6085 10.5226 3.37124 10.9472C3.13397 11.3718 2.89526 12.3744 2.66699 13.3332C3.62572 13.1049 4.62832 12.8662 5.05292 12.6289C5.47752 12.3916 5.82595 12.0432 6.52283 11.3464L12.0121 5.85711M10.1431 3.9881L12.0121 5.85711" stroke="black" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7.33301 13.3335H11.333" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                            </svg>
                            Edit Image
                          </button>
                          <button
                            onClick={() => {
                              if (promotionDetails.coverImageUrl) {
                                URL.revokeObjectURL(promotionDetails.coverImageUrl);
                              }
                              setPromotionDetails({
                                ...promotionDetails,
                                coverImage: null,
                                coverImageUrl: null,
                              });
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13 3.6665L12.5869 10.3499C12.4813 12.0574 12.4285 12.9112 12.0005 13.5251C11.7889 13.8286 11.5165 14.0847 11.2005 14.2772C10.5614 14.6665 9.706 14.6665 7.99513 14.6665C6.28208 14.6665 5.42553 14.6665 4.78603 14.2764C4.46987 14.0836 4.19733 13.827 3.98579 13.523C3.55792 12.9082 3.5063 12.0532 3.40307 10.3433L3 3.6665" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M2 3.66683H14M10.7038 3.66683L10.2487 2.72798C9.9464 2.10434 9.7952 1.79251 9.53447 1.59804C9.47667 1.5549 9.4154 1.51652 9.35133 1.4833C9.0626 1.3335 8.71607 1.3335 8.023 1.3335C7.31253 1.3335 6.95733 1.3335 6.66379 1.48958C6.59873 1.52417 6.53665 1.5641 6.47819 1.60894C6.21443 1.8113 6.06709 2.13453 5.77241 2.781L5.36861 3.66683" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M6.33301 11V7" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M9.66699 11V7" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-black/50">
                          JPG, PNG, SVG, WEBP. Recommended 800x400 pixels minimum, aspect ratio 4:5
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Percentage Off Fields */}
                {selectedPromotionType === "Percentage Off" && (
                  <>
                    <div>
                      <label className="main-label black">
                        Banner Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Banner Title"
                        value={promotionDetails.title}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, title: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Write promotion description here"
                        value={promotionDetails.description}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, description: e.target.value })}
                        className="main-input min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Applicable Service(s) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={promotionDetails.selectedServices[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && !promotionDetails.selectedServices.includes(value)) {
                              setPromotionDetails({ 
                                ...promotionDetails, 
                                selectedServices: [...promotionDetails.selectedServices, value] 
                              });
                            }
                          }}
                          className="main-input appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">Select 1 or more service</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {promotionDetails.selectedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {promotionDetails.selectedServices.map((serviceId) => {
                            const service = services.find(s => s.id === serviceId);
                            return service ? (
                              <span
                                key={serviceId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                              >
                                {service.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromotionDetails({
                                      ...promotionDetails,
                                      selectedServices: promotionDetails.selectedServices.filter(id => id !== serviceId)
                                    });
                                  }}
                                  className="hover:text-primary/70 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-xs text-black/50 mt-1">Select 1 or more service</p>
                    </div>

                    <div>
                      <label className="main-label black">
                        Discount Value (in %) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Discount Value (in %)"
                        value={promotionDetails.discountValue}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, discountValue: e.target.value })}
                        className="main-input"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.startDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, startDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.endDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, endDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>
                  </>
                )}

                {/* Minimum Spend Discount Fields */}
                {selectedPromotionType === "Minimum Spend Discount" && (
                  <>
                    <div>
                      <label className="main-label black">
                        Banner Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Banner title"
                        value={promotionDetails.title}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, title: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Write promotion description here"
                        value={promotionDetails.description}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, description: e.target.value })}
                        className="main-input min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Discount Value (in %) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Discount Value (in %)"
                        value={promotionDetails.discountValue}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, discountValue: e.target.value })}
                        className="main-input"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Minimum Spending Requirement (in USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Minimum Spending Requirement (in USD)"
                        value={promotionDetails.minimumSpending}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, minimumSpending: e.target.value })}
                        className="main-input"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.startDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, startDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.endDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, endDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>
                  </>
                )}

                {/* Buy One, Get One Fields */}
                {selectedPromotionType === "Buy One, Get One" && (
                  <>
                    <div>
                      <label className="main-label black">
                        Package Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Promotion Title"
                        value={promotionDetails.title}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, title: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Write promotion description here"
                        value={promotionDetails.description}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, description: e.target.value })}
                        className="main-input min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Service(s) to buy <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={promotionDetails.servicesToBuy[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && !promotionDetails.servicesToBuy.includes(value)) {
                              setPromotionDetails({ 
                                ...promotionDetails, 
                                servicesToBuy: [...promotionDetails.servicesToBuy, value] 
                              });
                            }
                          }}
                          className="main-input appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">Select 1 or more</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {promotionDetails.servicesToBuy.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {promotionDetails.servicesToBuy.map((serviceId) => {
                            const service = services.find(s => s.id === serviceId);
                            return service ? (
                              <span
                                key={serviceId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                              >
                                {service.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromotionDetails({
                                      ...promotionDetails,
                                      servicesToBuy: promotionDetails.servicesToBuy.filter(id => id !== serviceId)
                                    });
                                  }}
                                  className="hover:text-primary/70 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-xs text-black/50 mt-1">Select 1 or more</p>
                    </div>

                    <div>
                      <label className="main-label black">
                        Service(s) to get for free <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={promotionDetails.servicesToGet[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && !promotionDetails.servicesToGet.includes(value)) {
                              setPromotionDetails({ 
                                ...promotionDetails, 
                                servicesToGet: [...promotionDetails.servicesToGet, value] 
                              });
                            }
                          }}
                          className="main-input appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">Select 1 or more</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {promotionDetails.servicesToGet.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {promotionDetails.servicesToGet.map((serviceId) => {
                            const service = services.find(s => s.id === serviceId);
                            return service ? (
                              <span
                                key={serviceId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                              >
                                {service.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromotionDetails({
                                      ...promotionDetails,
                                      servicesToGet: promotionDetails.servicesToGet.filter(id => id !== serviceId)
                                    });
                                  }}
                                  className="hover:text-primary/70 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-xs text-black/50 mt-1">Select 1 or more</p>
                    </div>

                    <div>
                      <label className="main-label black">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.startDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, startDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.endDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, endDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>
                  </>
                )}

                {/* Flash Deals Fields */}
                {selectedPromotionType === "Flash Deals" && (
                  <>
                    <div>
                      <label className="main-label black">
                        Banner Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Banner title"
                        value={promotionDetails.title}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, title: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Write promotion description here"
                        value={promotionDetails.description}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, description: e.target.value })}
                        className="main-input min-h-[100px] resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Select Service(s) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={promotionDetails.selectedServices[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && !promotionDetails.selectedServices.includes(value)) {
                              setPromotionDetails({ 
                                ...promotionDetails, 
                                selectedServices: [...promotionDetails.selectedServices, value] 
                              });
                            }
                          }}
                          className="main-input appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">Select 1 or more service</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {promotionDetails.selectedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {promotionDetails.selectedServices.map((serviceId) => {
                            const service = services.find(s => s.id === serviceId);
                            return service ? (
                              <span
                                key={serviceId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                              >
                                {service.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromotionDetails({
                                      ...promotionDetails,
                                      selectedServices: promotionDetails.selectedServices.filter(id => id !== serviceId)
                                    });
                                  }}
                                  className="hover:text-primary/70 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className="text-xs text-black/50 mt-1">Select 1 or more service</p>
                    </div>

                    <div>
                      <label className="main-label black">
                        Discount Value (in %)
                      </label>
                      <input
                        type="number"
                        placeholder="Discount Value (in %)"
                        value={promotionDetails.discountValue}
                        onChange={(e) => setPromotionDetails({ ...promotionDetails, discountValue: e.target.value })}
                        className="main-input"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.startDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, startDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>

                    <div>
                      <label className="main-label black">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={promotionDetails.endDateTime}
                        onChange={(e) => {
                          setPromotionDetails({ ...promotionDetails, endDateTime: e.target.value });
                        }}
                        className="main-input"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200 sticky bottom-0 bg-[#F9F9F9] pb-4 md:pb-0">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="transparent"
                  onClick={handleClose}
                  className="flex-1 text-xs md:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-1 text-xs md:text-sm"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="transparent"
                  onClick={handlePrevious}
                  className="flex-1 text-xs md:text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-1 text-xs md:text-sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Create Promotion"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
