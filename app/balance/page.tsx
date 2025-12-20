"use client";

import { useState } from "react";
import { useBranch } from "../../contexts/BranchContext";
import BranchSelector from "../../components/BranchSelector";

interface Booking {
  id: string;
  bookingId: string;
  date: string;
  customerName: string;
  customerInitial: string;
  price: string;
  discount: string;
  services: string[];
  duration: string;
}

export default function Balance() {
  const { currentBranch } = useBranch();
  const [selectedTab, setSelectedTab] = useState<"Pending Balance" | "Earnings History">("Pending Balance");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalItems = 125;

  const bookings: Booking[] = [
    { id: "1", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "2", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "3", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "4", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "5", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "6", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "7", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "8", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "9", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "10", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "11", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
    { id: "12", bookingId: "#126", date: "Fri 29 Aug, 2025 - 10:24 am", customerName: "Mia Smith", customerInitial: "M", price: "$20.00", discount: "10%", services: ["Haircut", "Brushing", "Service 3", "Service 4"], duration: "1h 30 min" },
  ];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getAvatarColor = (initial: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Balance & Earnings</span>
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
      <div className="p-3 md:p-6">
        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          {/* Pending Balance */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Pending Balance</h3>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-black">$920.00</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Total Earnings</h3>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12L15 15" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-black">$2220.00</p>
          </div>

          {/* Next Payout Date */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Next Payout Date</h3>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-black">200</p>
          </div>

          {/* Last Payout Date */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Last Payout Date</h3>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-black">$920.00</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3 md:mb-4">
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedTab("Pending Balance")}
              className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedTab === "Pending Balance"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:text-black"
              }`}
            >
              Pending Balance
            </button>
            <button
              onClick={() => setSelectedTab("Earnings History")}
              className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                selectedTab === "Earnings History"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:text-black"
              }`}
            >
              Earnings History
            </button>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("bookingId")}
                  >
                    <div className="flex items-center gap-2">
                      Booking ID
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("customer")}
                  >
                    <div className="flex items-center gap-2">
                      Customer
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("discount")}
                  >
                    <div className="flex items-center gap-2">
                      Discount
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("services")}
                  >
                    <div className="flex items-center gap-2">
                      Services Booked
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("duration")}
                  >
                    <div className="flex items-center gap-2">
                      Duration
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 2L12 6M4 10L8 14L12 10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-black">
                      {booking.bookingId}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {booking.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(booking.customerInitial)} flex items-center justify-center text-white text-xs font-medium`}>
                          {booking.customerInitial}
                        </div>
                        <span>{booking.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {booking.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {booking.discount}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <div className="flex items-center gap-1">
                        <span>{booking.services[0]}, {booking.services[1]}</span>
                        <span className="underline cursor-pointer">+{booking.services.length - 2} services</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {booking.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Desktop */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {startItem} out {totalItems}
            </p>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const pageNum = i + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="px-2 text-gray-600">...</span>;
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Cards - Mobile/Tablet */}
        <div className="block md:hidden bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(booking.customerInitial)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                      {booking.customerInitial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-black break-words">{booking.customerName}</h3>
                      <p className="text-xs text-black/60 break-words">{booking.bookingId}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-black/80">
                    <div className="break-words">
                      <span className="text-black/60">Date: </span>
                      <span className="break-all">{booking.date}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">Price: </span>
                      <span>{booking.price}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">Discount: </span>
                      <span>{booking.discount}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">Services: </span>
                      <span className="break-words">{booking.services[0]}, {booking.services[1]}</span>
                      <span className="underline cursor-pointer"> +{booking.services.length - 2} services</span>
                    </div>
                    <div className="break-words">
                      <span className="text-black/60">Duration: </span>
                      <span>{booking.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination - Mobile/Tablet */}
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-3 text-center">
              Showing {startItem} out {totalItems}
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const pageNum = i + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${
                        currentPage === pageNum
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="px-2 text-gray-600">...</span>;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
