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
        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          {/* Pending Balance */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Pending Balance</h3>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                  <path d="M28.8888 26.1085C32.8776 26.1085 36.1111 25.1136 36.1111 23.8863C36.1111 22.659 32.8776 21.6641 28.8888 21.6641C24.9001 21.6641 21.6666 22.659 21.6666 23.8863C21.6666 25.1136 24.9001 26.1085 28.8888 26.1085Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                  <path d="M36.1111 28.8906C36.1111 30.118 32.8776 31.1128 28.8888 31.1128C24.9001 31.1128 21.6666 30.118 21.6666 28.8906" stroke="#7B2CBF" strokeWidth="2.2"/>
                  <path d="M36.1111 23.8906V33.6684C36.1111 35.0184 32.8776 36.1128 28.8888 36.1128C24.9001 36.1128 21.6666 35.0184 21.6666 33.6684V23.8906" stroke="#7B2CBF" strokeWidth="2.2"/>
                  <path d="M21.1111 18.3351C25.0999 18.3351 28.3334 17.3401 28.3334 16.1128C28.3334 14.8855 25.0999 13.8906 21.1111 13.8906C17.1224 13.8906 13.8889 14.8855 13.8889 16.1128C13.8889 17.3401 17.1224 18.3351 21.1111 18.3351Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                  <path d="M18.3332 23.8863C16.2312 23.6305 14.2998 22.9691 13.8888 21.6641M18.3332 29.4418C16.2312 29.1861 14.2998 28.5246 13.8888 27.2196" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                  <path d="M18.3334 34.9983C16.2313 34.7425 14.2999 34.081 13.8889 32.776V16.1094" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                  <path d="M28.3333 18.3316V16.1094" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-black">$920.00</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600">Total Earnings</h3>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                  <path d="M26.1111 15.5547H27.2222C28.2556 15.5547 28.7722 15.5547 29.1961 15.6683C30.3463 15.9765 31.2449 16.875 31.5531 18.0253C31.6667 18.4492 31.6667 18.9658 31.6667 19.9991H17.2222C15.9949 19.9991 15 19.0042 15 17.7769C15 16.5496 15.9949 15.5547 17.2222 15.5547H20.5556" stroke="#7B2CBF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 17.7734V28.8845C15 32.0272 15 33.5985 15.9763 34.5749C16.9526 35.5512 18.524 35.5512 21.6667 35.5512H28.3333C31.476 35.5512 33.0473 35.5512 34.0237 34.5749C35 33.5985 35 32.0272 35 28.8845V26.6623C35 23.5197 35 21.9483 34.0237 20.972C33.0473 19.9957 31.476 19.9957 28.3333 19.9957H19.4444" stroke="#7B2CBF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M35 25.5547H32.7778C32.2611 25.5547 32.0028 25.5547 31.7909 25.6115C31.2157 25.7656 30.7664 26.2148 30.6123 26.79C30.5555 27.0019 30.5555 27.2602 30.5555 27.7769C30.5555 28.2936 30.5555 28.5519 30.6123 28.7638C30.7664 29.339 31.2157 29.7882 31.7909 29.9424C32.0028 29.9991 32.2611 29.9991 32.7778 29.9991H35" stroke="#7B2CBF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.3333 14.4453C25.4811 14.4453 27.2222 16.1864 27.2222 18.3342C27.2222 18.9306 27.088 19.4957 26.848 20.0009H19.8187C19.5787 19.4957 19.4445 18.9306 19.4445 18.3342C19.4445 16.1864 21.1856 14.4453 23.3333 14.4453Z" stroke="#7B2CBF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
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
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  {["Booking ID", "Date", "Customer", "Price", "Discount", "Services Booked", "Duration"].map((header) => {
                    const columnMap: { [key: string]: string } = {
                      "Booking ID": "bookingId",
                      "Date": "date",
                      "Customer": "customer",
                      "Price": "price",
                      "Discount": "discount",
                      "Services Booked": "services",
                      "Duration": "duration",
                    };
                    const column = columnMap[header];
                    const isSorted = sortColumn === column;
                    return (
                      <th
                        key={header}
                        onClick={() => handleSort(column)}
                        className="group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize cursor-pointer"
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
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {booking.bookingId}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {booking.date}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(booking.customerInitial)} flex items-center justify-center text-white text-xs font-normal`}>
                          {booking.customerInitial}
                        </div>
                        <span>{booking.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {booking.price}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      {booking.discount}
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
                      <div className="flex items-center gap-1">
                        <span>{booking.services[0]}, {booking.services[1]}</span>
                        <span className="underline cursor-pointer">+{booking.services.length - 2} services</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-normal text-black/80">
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
