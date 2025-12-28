"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBranch } from "../../../contexts/BranchContext";
import BranchSelector from "../../../components/BranchSelector";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";

interface Subscriber {
  id: string;
  customerName: string;
  customerInitial: string;
  startDate: string;
  endDate: string;
  remainingBookings: string;
  isCancelled?: boolean;
}

export default function MembershipSubscribers() {
  const { currentBranch } = useBranch();
  const searchParams = useSearchParams();
  const [membershipTitle, setMembershipTitle] = useState("Membership Title Goes Here");
  const [membershipPrice, setMembershipPrice] = useState("$99.00");
  const [membershipDuration, setMembershipDuration] = useState("6 months");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Active" | "Cancelled / Expired">("Active");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCustomerSidebarOpen, setIsAddCustomerSidebarOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedStartDateValue, setSelectedStartDateValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [subscriberToCancel, setSubscriberToCancel] = useState<string | null>(null);
  const itemsPerPage = 12;

  const [availableCustomers] = useState([
    { id: "1", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "2", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "3", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "4", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "5", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "6", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
    { id: "7", name: "Sophia Davis", email: "sophiadavis@gmail.com", initial: "S", avatar: null },
  ]);

  useEffect(() => {
    const title = searchParams.get("title");
    const price = searchParams.get("price");
    const duration = searchParams.get("duration");
    if (title) setMembershipTitle(decodeURIComponent(title));
    if (price) setMembershipPrice(decodeURIComponent(price));
    if (duration) setMembershipDuration(decodeURIComponent(duration));
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    { id: "1", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2025", remainingBookings: "30/30", isCancelled: false },
    { id: "2", customerName: "Alex Thompson", customerInitial: "A", startDate: "Mon 15 Jan, 2025", endDate: "Wed 15 Jan, 2026", remainingBookings: "25/30", isCancelled: false },
    { id: "3", customerName: "Sarah Williams", customerInitial: "S", startDate: "Tue 20 Feb, 2025", endDate: "Thu 20 Feb, 2026", remainingBookings: "20/30", isCancelled: false },
    { id: "4", customerName: "Michael Brown", customerInitial: "M", startDate: "Wed 10 Mar, 2025", endDate: "Fri 10 Mar, 2026", remainingBookings: "15/30", isCancelled: false },
    { id: "5", customerName: "Emily Davis", customerInitial: "E", startDate: "Thu 5 Apr, 2025", endDate: "Sat 5 Apr, 2026", remainingBookings: "10/30", isCancelled: false },
    { id: "6", customerName: "David Miller", customerInitial: "D", startDate: "Fri 12 May, 2025", endDate: "Sun 12 May, 2026", remainingBookings: "5/30", isCancelled: false },
    { id: "7", customerName: "Jessica Wilson", customerInitial: "J", startDate: "Sat 1 Jun, 2025", endDate: "Mon 1 Jun, 2026", remainingBookings: "28/30", isCancelled: false },
    { id: "8", customerName: "Emma Johnson", customerInitial: "E", startDate: "Mon 15 Jan, 2024", endDate: "Wed 15 Jan, 2024", remainingBookings: "25/30", isCancelled: true },
    { id: "9", customerName: "James Wilson", customerInitial: "J", startDate: "Tue 20 Feb, 2024", endDate: "Thu 20 Feb, 2024", remainingBookings: "20/30", isCancelled: false },
    { id: "10", customerName: "Olivia Brown", customerInitial: "O", startDate: "Wed 10 Mar, 2024", endDate: "Fri 10 Mar, 2024", remainingBookings: "15/30", isCancelled: true },
    { id: "11", customerName: "Noah Taylor", customerInitial: "N", startDate: "Thu 5 Apr, 2024", endDate: "Sat 5 Apr, 2024", remainingBookings: "10/30", isCancelled: false },
    { id: "12", customerName: "Ava Martinez", customerInitial: "A", startDate: "Fri 12 May, 2024", endDate: "Sun 12 May, 2024", remainingBookings: "5/30", isCancelled: true },
    { id: "13", customerName: "Liam Anderson", customerInitial: "L", startDate: "Sat 1 Jun, 2024", endDate: "Mon 1 Jun, 2024", remainingBookings: "28/30", isCancelled: false },
    { id: "14", customerName: "Isabella Garcia", customerInitial: "I", startDate: "Sun 20 Jul, 2024", endDate: "Tue 20 Jul, 2024", remainingBookings: "22/30", isCancelled: true },
    { id: "15", customerName: "Ethan Rodriguez", customerInitial: "E", startDate: "Mon 5 Aug, 2024", endDate: "Wed 5 Aug, 2024", remainingBookings: "18/30", isCancelled: false },
  ]);

  const handleCancelClick = (subscriberId: string) => {
    setSubscriberToCancel(subscriberId);
    setCancelConfirmationOpen(true);
  };

  const handleConfirmCancel = () => {
    if (subscriberToCancel) {
      // Set endDate to yesterday to make it expired (not cancelled)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const day = yesterday.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const month = monthNames[yesterday.getMonth()];
      const year = yesterday.getFullYear();
      const dayName = dayNames[yesterday.getDay()];
      const expiredDate = `${dayName} ${day} ${month}, ${year}`;

      setSubscribers(prev => 
        prev.map(subscriber => 
          subscriber.id === subscriberToCancel 
            ? { ...subscriber, endDate: expiredDate, isCancelled: false }
            : subscriber
        )
      );
      setCancelConfirmationOpen(false);
      setSubscriberToCancel(null);
      // Switch to Cancelled/Expired tab to show the result
      setStatusFilter("Cancelled / Expired");
    }
  };

  const handleCancelCancel = () => {
    setCancelConfirmationOpen(false);
    setSubscriberToCancel(null);
  };

  const allSubscribers = subscribers;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Function to parse date string and check if expired
  const isExpired = (endDateString: string): boolean => {
    // Parse date string like "Mon 29 Sep, 2025"
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

  const filteredSubscribers = allSubscribers.filter(subscriber => {
    // Filter by search query
    const matchesSearch = subscriber.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by status
    if (statusFilter === "Active") {
      // Active: not cancelled and not expired
      return !subscriber.isCancelled && !isExpired(subscriber.endDate);
    } else {
      // Cancelled / Expired: either cancelled or expired
      return subscriber.isCancelled || isExpired(subscriber.endDate);
    }
  });

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Memberships</span>
            <span className="mx-3 block">/</span>
            <span>{membershipTitle} - Subscribers</span>
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
        {/* Membership Details */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0">
              <h2 className="text-sm md:text-lg font-bold text-black mb-1 break-words">{membershipTitle} | Price: {membershipPrice} • Duration: {membershipDuration}</h2>
            </div>
            <Button 
              variant="primary" 
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => setIsAddCustomerSidebarOpen(true)}
            >
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="w-full md:max-w-md">
              <SearchInput
                placeholder="Search by customer name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => setStatusFilter("Active")}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "Active"
                    ? "bg-black text-white"
                    : "bg-white border border-black/10 text-black hover:bg-gray-50"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("Cancelled / Expired")}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "Cancelled / Expired"
                    ? "bg-black text-white"
                    : "bg-white border border-black/10 text-black hover:bg-gray-50"
                }`}
              >
                Cancelled / Expired
              </button>
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  {(statusFilter === "Active" 
                    ? ["Customer", "Start Date", "End Date", "Bookings", "Action"]
                    : ["Customer", "Start Date", "End Date", "Bookings", "Status"]
                  ).map((header) => {
                    const columnMap: { [key: string]: string } = {
                      "Customer": "customer",
                      "Start Date": "startDate",
                      "End Date": "endDate",
                      "Bookings": "bookings",
                      "Status": "status",
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
                          {sortKey && (
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
                {paginatedSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={statusFilter === "Active" ? 5 : 5} className="px-4 py-8 text-center text-gray-500">
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  paginatedSubscribers.map((subscriber) => {
                    const isActive = !subscriber.isCancelled && !isExpired(subscriber.endDate);
                    return (
                      <tr key={subscriber.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-normal text-gray-600">{subscriber.customerInitial}</span>
                            </div>
                            <span className="text-xs font-normal text-black/80">{subscriber.customerName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-normal text-black/80">
                          {subscriber.startDate}
                        </td>
                        <td className="px-5 py-4 text-xs font-normal text-black/80">
                          {subscriber.endDate}
                        </td>
                        <td className="px-5 py-4 text-xs font-normal text-black/80">
                          {subscriber.remainingBookings}
                        </td>
                        {statusFilter === "Active" ? (
                          <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                            {isActive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(subscriber.id);
                                }}
                                className="cancel-action-btn h-[38px] w-[38px] flex items-center justify-center bg-white rounded-[4.32px] border border-red-500/30 transition-all cursor-pointer hover:bg-red-500 hover:border-red-500 active:bg-red-500 active:border-red-500 relative"
                              >
                                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="38" height="38" rx="4.31818" fill="white" className="cancel-btn-bg"/>
                                  <rect x="0.431818" y="0.431818" width="37.1364" height="37.1364" rx="3.88636" stroke="#FF0000" strokeOpacity="0.3" strokeWidth="0.863636" className="cancel-btn-border"/>
                                  <path d="M24.182 13.8125L13.8191 24.1754M24.1813 24.1761L13.8184 13.8132" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round" className="cancel-btn-x"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        ) : (
                          <td className="px-5 py-4">
                          {subscriber.isCancelled ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-[15.5px] text-xs font-medium bg-[#FF0000]/8 text-[#FF0000]">
                              Cancelled
                            </span>
                          ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-[15.5px] text-xs font-medium bg-black/5 text-black/40">
                                Expired
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Desktop */}
          {filteredSubscribers.length > 0 && statusFilter === "Active" && (
            <div className="hidden md:flex px-4 py-3 bg-gray-50 border-t border-gray-200 items-center justify-between">
              <div className="text-sm text-gray-700" style={{ width: "160px", height: "17px", opacity: "0.4" }}>
                Showing {paginatedSubscribers.length} out of {filteredSubscribers.length}
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded ${
                      currentPage === page
                        ? "bg-black text-white"
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

        {/* Cards - Mobile/Tablet */}
        <div className="block md:hidden bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {paginatedSubscribers.map((subscriber) => (
            <div key={subscriber.id} className="p-3 md:p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">{subscriber.customerInitial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-black mb-2 break-words">{subscriber.customerName}</h3>
                  <div className="space-y-1 text-xs text-black/80">
                    <div className="break-words">
                      <span className="text-black/60">Start Date: </span>
                      <span>{subscriber.startDate}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">End Date: </span>
                      <span>{subscriber.endDate}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">Bookings: </span>
                      <span>{subscriber.remainingBookings}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {subscriber.isCancelled ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-[15.5px] text-xs font-medium bg-[#FF0000]/8 text-[#FF0000]">
                          Cancelled
                        </span>
                      ) : isExpired(subscriber.endDate) ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-[15.5px] text-xs font-medium bg-black/5 text-black/40">
                          Expired
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(subscriber.id);
                            }}
                            className="cancel-action-btn-mobile h-[38px] w-[38px] flex items-center justify-center bg-white rounded-[4.32px] border border-red-500/30 transition-all cursor-pointer hover:bg-red-500 hover:border-red-500 active:bg-red-500 active:border-red-500 relative"
                          >
                            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="38" height="38" rx="4.31818" fill="white" className="cancel-btn-bg-mobile"/>
                              <rect x="0.431818" y="0.431818" width="37.1364" height="37.1364" rx="3.88636" stroke="#FF0000" strokeOpacity="0.3" strokeWidth="0.863636" className="cancel-btn-border-mobile"/>
                              <path d="M24.182 13.8125L13.8191 24.1754M24.1813 24.1761L13.8184 13.8132" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round" className="cancel-btn-x-mobile"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {/* Pagination - Mobile/Tablet */}
          {filteredSubscribers.length > 0 && statusFilter === "Active" && (
            <div className="block md:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-700 mb-3 text-center" style={{ width: "160px", height: "17px", opacity: "0.4", margin: "0 auto" }}>
                Showing {paginatedSubscribers.length} out of {filteredSubscribers.length}
              </div>
              <div className="flex items-center justify-center gap-2 overflow-x-auto">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-xs rounded whitespace-nowrap ${
                      currentPage === page
                        ? "bg-black text-white"
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
      </div>

      {/* Add Customer Sidebar */}
      {isAddCustomerSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsAddCustomerSidebarOpen(false)}
          />
          <div className="relative w-full md:w-[400px] md:min-w-[400px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-black">Add Customer to Subscription</h2>
              <button
                onClick={() => setIsAddCustomerSidebarOpen(false)}
                className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
              {/* Start Date */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="start-date-input"
                    type="date"
                    value={selectedStartDateValue}
                    onChange={(e) => {
                      const date = e.target.value;
                      setSelectedStartDateValue(date);
                      if (date) {
                        const [year, month, day] = date.split('-');
                        const formatted = `${day}/${month}/${year}`;
                        setSelectedStartDate(formatted);
                      } else {
                        setSelectedStartDate("");
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="px-3 md:px-4 py-2 md:py-2.5 pr-12 border border-black/10 rounded-[5px] text-xs md:text-sm bg-white pointer-events-none flex items-center">
                    <span className="text-black">
                      {selectedStartDateValue ? new Date(selectedStartDateValue + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'dd/mm/yyyy'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('start-date-input') as HTMLInputElement;
                      input?.showPicker?.() || input?.click();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 2V6M8 2V6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Customer Search */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-black mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by customer name"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Customer List */}
              {customerSearchQuery && (
                <div className="border border-black/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {availableCustomers
                    .filter(customer => 
                      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                      customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
                    )
                    .map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer.id)}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedCustomer === customer.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-700">{customer.initial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">{customer.name}</p>
                          <p className="text-xs text-black/60 truncate">{customer.email}</p>
                        </div>
                        {selectedCustomer === customer.id && (
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 md:p-6 border-t border-gray-200 bg-white sticky bottom-0">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setIsAddCustomerSidebarOpen(false);
                    setCustomerSearchQuery("");
                    setSelectedStartDate("");
                    setSelectedStartDateValue("");
                    setSelectedCustomer(null);
                  }}
                  className="flex-[1] px-4 md:px-6 py-2 md:py-2.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedCustomer && selectedStartDateValue) {
                      // Handle add customer logic here
                      setIsAddCustomerSidebarOpen(false);
                      setCustomerSearchQuery("");
                      setSelectedStartDate("");
                      setSelectedStartDateValue("");
                      setSelectedCustomer(null);
                    }
                  }}
                  disabled={!selectedCustomer || !selectedStartDateValue}
                  className={`flex-[2] px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                    selectedCustomer && selectedStartDateValue
                      ? "bg-primary text-white hover:bg-white hover:text-primary border border-primary"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Popup */}
      {cancelConfirmationOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={handleCancelCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Cancel Membership</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-700 text-center">
                Are you sure you want to cancel this membership? The customer will be moved to the Cancelled/Expired list.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancelCancel}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-[#6B21B8] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

