"use client";

import { useState, useEffect } from "react";
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
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
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
    { id: "1", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: false },
    { id: "2", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: false },
    { id: "3", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: true },
    { id: "4", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: true },
    { id: "5", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: false },
    { id: "6", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: true },
    { id: "7", customerName: "Mia Smith", customerInitial: "M", startDate: "Fri 29 Aug, 2024", endDate: "Mon 29 Sep, 2024", remainingBookings: "30/30", isCancelled: false },
  ]);

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

  const filteredSubscribers = subscribers.filter(subscriber => {
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
        <div className="bg-white rounded-lg shadow-sm">
          {/* Membership Details */}
          <div className="p-3 md:p-6 border-b border-gray-200">
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
          <div className="p-3 md:p-6 border-b border-gray-200">
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
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("customer")}
                  >
                    <div className="flex items-center gap-2">
                      Customer
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("startDate")}
                  >
                    <div className="flex items-center gap-2">
                      Start Date
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("endDate")}
                  >
                    <div className="flex items-center gap-2">
                      End Date
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("bookings")}
                  >
                    <div className="flex items-center gap-2">
                      Bookings
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-600">{subscriber.customerInitial}</span>
                        </div>
                        <span className="text-sm text-black">{subscriber.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {subscriber.startDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {subscriber.endDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {subscriber.remainingBookings}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.isCancelled ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Expired
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards - Mobile/Tablet */}
          <div className="block md:hidden divide-y divide-gray-200">
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
                      <div className="mt-2">
                        {subscriber.isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 md:p-6 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div className="text-xs md:text-sm text-black/60 text-center md:text-left">
                Showing {filteredSubscribers.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredSubscribers.length)} out of {filteredSubscribers.length}
              </div>
              <div className="flex items-center justify-center gap-1.5 md:gap-2 overflow-x-auto">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 md:px-3 py-1 text-xs md:text-sm rounded cursor-pointer whitespace-nowrap ${
                          currentPage === page
                            ? "bg-black text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-black/10"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-xs md:text-sm text-gray-500">...</span>;
                  }
                  return null;
                })}
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
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={selectedStartDate}
                    readOnly
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white cursor-pointer focus:outline-none focus:border-primary text-xs md:text-sm pr-10"
                  />
                  <input
                    type="date"
                    onChange={(e) => {
                      const date = e.target.value;
                      if (date) {
                        const [year, month, day] = date.split('-');
                        const formatted = `${day}/${month}/${year}`;
                        setSelectedStartDate(formatted);
                      } else {
                        setSelectedStartDate("");
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
              <div className="flex items-center justify-end gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setIsAddCustomerSidebarOpen(false);
                    setCustomerSearchQuery("");
                    setSelectedStartDate("");
                    setSelectedCustomer(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedCustomer && selectedStartDate) {
                      // Handle add customer logic here
                      setIsAddCustomerSidebarOpen(false);
                      setCustomerSearchQuery("");
                      setSelectedStartDate("");
                      setSelectedCustomer(null);
                    }
                  }}
                  disabled={!selectedCustomer || !selectedStartDate}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                    selectedCustomer && selectedStartDate
                      ? "bg-primary text-white hover:bg-primary/90"
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
    </div>
  );
}

