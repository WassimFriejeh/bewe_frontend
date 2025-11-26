"use client";

import { useState, useEffect } from "react";
import { useBranch } from "../../contexts/BranchContext";
import { hasPermission, getUserPermissions } from "../../utils/permissions";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Arrow from "../../components/ui/Arrow";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";

interface Booking {
  id: string;
  bookingId: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
  };
  scheduledOn: string;
  service: string;
  staff: {
    id: string;
    name: string;
    avatar?: string;
  };
  duration: number;
  payment: string;
  status: "Pending" | "Confirmed" | "Started" | "Completed" | "Cancelled";
}

interface PendingBooking {
  id: string | number;
  customer_id: number;
  customer?: {
    id: string | number;
    first_name: string;
    last_name: string;
    name?: string; // Fallback for old format
  };
  staff_id?: string | number;
  staff?: {
    id: string | number;
    name: string;
  };
  services?: Array<{
    service_id: string;
    staff_id: string;
  }>;
  date: string;
  status: string;
  [key: string]: any; // Allow additional properties from API
}

export default function Calendar() {
  const { currentBranch, branchChangeKey, permissions: contextPermissions } = useBranch();
  const [view, setView] = useState<"calendar" | "list">("list");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [filters, setFilters] = useState({
    team: "all",
    status: "all",
    search: "",
    date: "today",
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBookingSidebarOpen, setIsBookingSidebarOpen] = useState(false);

  // Use permissions from context (they update automatically when branch changes)
  const canAddBooking = contextPermissions.includes("Add Booking");
  const canViewAllBookings = contextPermissions.includes("View All Bookings");
  const canViewOwnBookings = contextPermissions.includes("View Own Bookings");
  const canEditBooking = contextPermissions.includes("Edit Booking");
  
  console.log("Calendar - Current permissions:", contextPermissions);
  console.log("Calendar - Can add booking:", canAddBooking);

  useEffect(() => {
    if (currentBranch) {
      // Reset pagination when branch changes
      if (branchChangeKey > 0) {
        setCurrentPage(1);
      }
      fetchBookings();
      fetchPendingBookings();
    }
  }, [currentBranch?.id, branchChangeKey, filters, currentPage, canViewAllBookings]);

  const fetchBookings = async () => {
    if (!currentBranch) return;
    
    setIsLoading(true);
    try {
      const params: any = {
        branch_id: currentBranch.id,
        page: currentPage,
        per_page: 12,
      };

      if (filters.team !== "all") {
        params.team_id = filters.team;
      }

      if (filters.status !== "all") {
        params.status = filters.status.toLowerCase();
      }

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.date === "today") {
        params.date = new Date().toISOString().split("T")[0];
      }

      // Determine which endpoint to use based on permissions
      const endpoint = canViewAllBookings ? "/bookings" : "/bookings/my";

      const response = await axiosClient.get(endpoint, { params });
      
      // Adjust based on your API response structure
      const data = response.data.data || response.data;
      setBookings(data.bookings || data || []);
      setTotalBookings(data.total || data.bookings?.length || 0);
      setTotalPages(data.last_page || Math.ceil((data.total || 0) / 12) || 1);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    if (!currentBranch) return;

    try {
      const response = await axiosClient.get("/bookings/pending-today", {
        params: { branch_id: currentBranch.id },
      });
      
      // Handle the API response structure: { status, message, data: { bookings: [...] } }
      const responseData = response.data;
      let bookings = [];
      
      if (responseData?.data?.bookings && Array.isArray(responseData.data.bookings)) {
        bookings = responseData.data.bookings;
      } else if (responseData?.bookings && Array.isArray(responseData.bookings)) {
        bookings = responseData.bookings;
      } else if (responseData?.data?.pending_bookings && Array.isArray(responseData.data.pending_bookings)) {
        bookings = responseData.data.pending_bookings;
      } else if (Array.isArray(responseData?.data)) {
        bookings = responseData.data;
      } else if (Array.isArray(responseData)) {
        bookings = responseData;
      }
      
      setPendingBookings(bookings);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      setPendingBookings([]);
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    if (!canEditBooking) return;

    try {
      await axiosClient.post(`/bookings/${bookingId}/approve`);
      fetchPendingBookings();
      fetchBookings();
    } catch (error) {
      console.error("Error approving booking:", error);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!canEditBooking) return;

    try {
      await axiosClient.post(`/bookings/${bookingId}/decline`);
      fetchPendingBookings();
      fetchBookings();
    } catch (error) {
      console.error("Error declining booking:", error);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    if (canEditBooking) {
      setSelectedBooking(booking);
      setIsEditSidebarOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Started":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3 ">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>{view === "list" ? "List" : "Calendar"}</span>
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
          </div>
        </div>

        <div className="main-container flex justify-between border-b border-black/10">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setView("calendar")}
              className={`flex h-full items-center cursor-pointer gap-2 py-2 text-xs font-medium transition-all relative ${
                view === "calendar"
                  ? "text-black opacity-100"
                  : "text-black opacity-50 hover:opacity-100"
              }`}
            >
              {view === "calendar" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-black"></span>
              )}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={view === "calendar" ? "opacity-100" : "opacity-50"}>
                <g opacity={view === "calendar" ? "1" : "0.8"}>
                  <path d="M13.3333 1.6665V4.99984M6.66667 1.6665V4.99984" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.8333 3.3335H9.16667C6.02397 3.3335 4.45262 3.3335 3.47631 4.3098C2.5 5.28612 2.5 6.85746 2.5 10.0002V11.6668C2.5 14.8095 2.5 16.3809 3.47631 17.3572C4.45262 18.3335 6.02397 18.3335 9.16667 18.3335H10.8333C13.976 18.3335 15.5474 18.3335 16.5237 17.3572C17.5 16.3809 17.5 14.8095 17.5 11.6668V10.0002C17.5 6.85746 17.5 5.28612 16.5237 4.3098C15.5474 3.3335 13.976 3.3335 10.8333 3.3335Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.5 8.3335H17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.99625 11.6665H10.0038M9.99625 14.9998H10.0038M13.3258 11.6665H13.3333M6.66667 11.6665H6.67414M6.66667 14.9998H6.67414" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-full items-center cursor-pointer gap-2 py-2 text-xs font-medium transition-all relative ${
                view === "list"
                  ? "text-black opacity-100"
                  : "text-black opacity-50 hover:opacity-100"
              }`}
            >
              {view === "list" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-black"></span>
              )}
              <svg width="22" height="13" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={view === "list" ? "opacity-100" : "opacity-50"}>
                <g opacity={view === "list" ? "1" : "0.5"}>
                  <path d="M1 2.4C1 1.2417 1.19338 1 2.12 1H15.88C16.8066 1 17 1.2417 17 2.4V3.6C17 4.7583 16.8066 5 15.88 5H2.12C1.19338 5 1 4.7583 1 3.6V2.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                  <path d="M5 9.4C5 8.2417 5.19338 8 6.12 8H19.88C20.8066 8 21 8.2417 21 9.4V10.6C21 11.7583 20.8066 12 19.88 12H6.12C5.19338 12 5 11.7583 5 10.6V9.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </g>
              </svg>
              List
            </button>
          </div>

          <div className="flex items-center gap-3 py-2">
            <Button variant="transparent-red" className="flex items-center gap-1 text-white">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1.5V4.5M6 1.5V4.5" stroke="#FF0000" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.75 9.75V9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5H9" stroke="#FF0000" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.25 7.5H15.75" stroke="#FF0000" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.75 12L13.5 14.25M13.5 14.25L11.25 16.5M13.5 14.25L15.75 16.5M13.5 14.25L11.25 12" stroke="#FF0000" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span><span className="text-red mr-1">10</span> Cancelled</span>
            </Button>
            <Button variant="transparent-secondary" className="flex items-center gap-1 text-white">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.75 6.375C12.75 4.30393 11.071 2.625 9 2.625C6.92893 2.625 5.25 4.30393 5.25 6.375C5.25 8.44605 6.92893 10.125 9 10.125C11.071 10.125 12.75 8.44605 12.75 6.375Z" stroke="#48CAE4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.25 15.375C14.25 12.4755 11.8995 10.125 9 10.125C6.10051 10.125 3.75 12.4755 3.75 15.375" stroke="#48CAE4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span><span className="text-secondary mr-1">12</span> On Waiting List</span>
            </Button>
            {canAddBooking && (
              <>
                <Button variant="black" className="flex items-center gap-2">
                  Add Blocked Time
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1.5V4.5M6 1.5V4.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.75 10.5V9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5H9" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.8335 12.1665L11.4318 15.5682M15.75 13.875C15.75 15.3247 14.5747 16.5 13.125 16.5C11.6753 16.5 10.5 15.3247 10.5 13.875C10.5 12.4253 11.6753 11.25 13.125 11.25C14.5747 11.25 15.75 12.4253 15.75 13.875Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
                <Button 
                  variant="primary" 
                  className="flex items-center gap-2"
                  onClick={() => setIsBookingSidebarOpen(true)}
                >
                  Add New Booking
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Bookings List */}
        <div className="flex-1 p-6">
          {view === "list" ? (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setFilters({ ...filters, date: "today" })}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filters.date === "today"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Today
                  </button>
                  <select
                    value={filters.team}
                    onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Team</option>
                    {/* Add team options dynamically */}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search by ID or customer name"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-black/10">
                      <tr>
                        {["Booking ID", "Customer", "Scheduled on", "Service", "Staff", "Duration", "Payment", "Status"].map((header) => {
                          const isSorted = sortColumn === header;
                          return (
                            <th
                              key={header}
                              onClick={() => {
                                if (isSorted) {
                                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                                } else {
                                  setSortColumn(header);
                                  setSortDirection("asc");
                                }
                              }}
                              className={`group px-4 py-3 text-left text-xs font-medium text-black/50 capitalize ${
                                canEditBooking ? "cursor-pointer hover:bg-gray-100" : ""
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Loading bookings...
                          </td>
                        </tr>
                      ) : bookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            onClick={() => handleBookingClick(booking)}
                            className={`hover:bg-gray-50 transition-colors ${
                              canEditBooking ? "cursor-pointer" : ""
                            }`}
                          >
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">#{booking.bookingId}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                                  {booking.customer.name.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-900">{booking.customer.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{formatDate(booking.scheduledOn)}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{booking.service}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                  {booking.staff.name.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-600">{booking.staff.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{booking.duration} min</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{booking.payment}</td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {bookings.length} out of {totalBookings}
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded ${
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
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Calendar view will be implemented later</p>
            </div>
          )}
        </div>

        {/* Pending Bookings Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full max-h-screen">
          <div className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3334 1.6665V4.99984M6.66669 1.6665V4.99984" stroke="black" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 10.0002C17.5 6.85746 17.5 5.28612 16.5237 4.3098C15.5474 3.3335 13.976 3.3335 10.8333 3.3335H9.16667C6.02397 3.3335 4.45262 3.3335 3.47631 4.3098C2.5 5.28612 2.5 6.85746 2.5 10.0002V11.6668C2.5 14.8095 2.5 16.3809 3.47631 17.3572C4.45262 18.3335 6.02397 18.3335 9.16667 18.3335" stroke="black" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 8.3335H17.5" stroke="black" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.2226 15.5841L14.1666 14.9998V13.5555M17.5 14.9998C17.5 16.8408 16.0076 18.3332 14.1666 18.3332C12.3257 18.3332 10.8333 16.8408 10.8333 14.9998C10.8333 13.1589 12.3257 11.6665 14.1666 11.6665C16.0076 11.6665 17.5 13.1589 17.5 14.9998Z" stroke="black" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Pending Bookings</h2>
            </div>
            <div className="text-xs text-gray-600 mb-4">
              <span className="font-bold">Today</span> {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 relative min-h-0">
            {/* Fade effect at bottom */}
            <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>

          <div className="space-y-3">
              {!Array.isArray(pendingBookings) || pendingBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No pending bookings</p>
            ) : (
                pendingBookings.map((booking) => {
                  // Extract time from date string (format: "2025-11-22 12:26:00")
                  const bookingDate = booking.date ? new Date(booking.date) : null;
                  
                  // Calculate end time based on services duration (assuming 30 min per service for now)
                  let startTime = "N/A";
                  let endTime = "N/A";
                  if (bookingDate) {
                    const startHours = bookingDate.getHours();
                    const startMinutes = bookingDate.getMinutes();
                    const totalDuration = booking.services?.reduce((total, service) => total + 30, 0) || 30; // Default 30 min if no services
                    const endDate = new Date(bookingDate.getTime() + totalDuration * 60000);
                    const endHours = endDate.getHours();
                    const endMinutes = endDate.getMinutes();
                    
                    const formatTime = (hours: number, minutes: number) => {
                      const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                      const m = minutes.toString().padStart(2, "0");
                      const period = hours >= 12 ? "pm" : "am";
                      return `${h}:${m} ${period}`;
                    };
                    
                    startTime = formatTime(startHours, startMinutes);
                    endTime = formatTime(endHours, endMinutes);
                  }
                  
                  // Get customer name
                  const customerName = booking.customer 
                    ? `${booking.customer.first_name || ""} ${booking.customer.last_name || ""}`.trim() || booking.customer.name
                    : `Customer #${booking.customer_id}`;
                  
                  // Get staff name
                  const staffName = booking.staff?.name || `Staff #${booking.services?.[0]?.staff_id || booking.staff_id || "N/A"}`;
                  
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-white p-4 border border-black/10"
                      style={{
                        borderRadius: "12px",
                        boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.05)"
                      }}
                    >
                  <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {customerName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {booking.staff && (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                              {booking.staff.name?.charAt(0) || "S"}
                            </div>
                          )}
                          <p className="text-xs text-gray-600">
                            {staffName} <span className="text-gray-400">|</span> {startTime} - {endTime}
                          </p>
                        </div>
                  </div>
                  {canEditBooking && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                            onClick={() => handleApproveBooking(String(booking.id))}
                            className="px-4 py-2 text-xs"
                      >
                        Approve
                      </Button>
                          <button
                            onClick={() => handleDeclineBooking(String(booking.id))}
                            className="px-4 py-2 text-xs font-medium rounded-[10px] border border-black bg-white text-black hover:bg-black hover:text-white transition-colors cursor-pointer focus:outline-none"
                      >
                        Decline
                          </button>
                    </div>
                  )}
                </div>
                  );
                })
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Booking Sidebar */}
      {isEditSidebarOpen && selectedBooking && (
        <EditBookingSidebar
          booking={selectedBooking}
          onClose={() => {
            setIsEditSidebarOpen(false);
            setSelectedBooking(null);
          }}
          onSave={() => {
            fetchBookings();
            setIsEditSidebarOpen(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Add New Booking Sidebar */}
      {canAddBooking && isBookingSidebarOpen && (
        <AddBookingSidebar
          onClose={() => setIsBookingSidebarOpen(false)}
          onSave={() => {
            fetchBookings();
            setIsBookingSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Edit Booking Sidebar Component
function EditBookingSidebar({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<{
    service: string;
    staff: string;
    scheduledOn: string;
    duration: number;
    payment: string;
    status: "Pending" | "Confirmed" | "Started" | "Completed" | "Cancelled";
  }>({
    service: booking.service,
    staff: booking.staff.id,
    scheduledOn: booking.scheduledOn,
    duration: booking.duration,
    payment: booking.payment,
    status: booking.status,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await axiosClient.put(`/bookings/${booking.id}`, formData);
      onSave();
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID</label>
            <input
              type="text"
              value={`#${booking.bookingId}`}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <input
              type="text"
              value={booking.customer.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <input
              type="text"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled On</label>
            <input
              type="datetime-local"
              value={formData.scheduledOn}
              onChange={(e) => setFormData({ ...formData, scheduledOn: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={formData.payment}
              onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Started">Started</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="transparent"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Booking Sidebar Component
function AddBookingSidebar({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Array<{ id: string; name: string; duration: number; price: number; teamMember?: string }>>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openTeamMemberDropdown, setOpenTeamMemberDropdown] = useState<string | null>(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    countryCode: "+961", // Default to Lebanon
  });

  useEffect(() => {
    // Trigger animation after mount - small delay to ensure initial state renders
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match the transition duration
  };

  const steps = ["Customer", "Booking Details", "Services", "Summary"];

  // Mock data - replace with actual API calls
  const customers = [
    { id: "1", name: "Sophia Davis", email: "sophiadavis@gmail.com", avatar: "A" },
    { id: "2", name: "John Smith", email: "johnsmith@gmail.com", avatar: "J" },
    { id: "3", name: "Emma Wilson", email: "emmawilson@gmail.com", avatar: "E" },
  ];

  const services = [
    { id: "1", name: "Brushing", duration: 30, price: 20.00, category: "Category Name" },
    { id: "2", name: "Haircut", duration: 30, price: 20.00, category: "Category Name" },
    { id: "3", name: "Facial", duration: 30, price: 20.00, category: "Category Name" },
    { id: "4", name: "Bread Trim", duration: 30, price: 20.00, category: "Category Name" },
    { id: "5", name: "Eyelash Extension", duration: 30, price: 20.00, category: "Category Name 2" },
    { id: "6", name: "Blowout", duration: 30, price: 20.00, category: "Category Name 2" },
  ];

  const teamMembers = [
    { id: "any", name: "Any Team Member", avatar: null },
    { id: "1", name: "Karen Taylor", avatar: "KT" },
    { id: "2", name: "Sarah Johnson", avatar: "SJ" },
  ];

  const timeSlots = [
    "10:00 am", "10:15 am", "10:30 am", "10:45 am",
    "11:00 am", "11:15 am", "11:30 am", "11:45 am",
    "12:00 pm", "12:15 pm", "12:30 pm", "12:45 pm",
    "01:00 pm", "01:15 pm", "01:30 pm", "01:45 pm",
    "02:00 pm", "02:15 pm", "02:30 pm", "02:45 pm",
    "03:00 pm", "03:15 pm", "03:30 pm", "03:45 pm",
    "04:00 pm", "04:15 pm", "04:30 pm", "04:45 pm",
    "05:00 pm"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleServiceToggle = (service: typeof services[0]) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, { id: service.id, name: service.name, duration: service.duration, price: service.price }];
      }
    });
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const formatTime = (time: string) => {
    // Calculate start time for each service
    let currentTime = selectedTime;
    return selectedServices.map((service, index) => {
      const startTime = index === 0 ? currentTime : ""; // Calculate based on previous service end time
      return { ...service, startTime };
    });
  };

  // Helper function to parse time string to minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const parts = timeStr.trim().split(" ");
    const period = parts[parts.length - 1].toLowerCase(); // Get am/pm
    const timePart = parts.slice(0, -1).join(" "); // Get time part (handles "01:00" or "1:00")
    const [hours, minutes] = timePart.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === "pm" && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === "am" && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    return totalMinutes;
  };

  // Helper function to format minutes to time string
  const formatMinutesToTime = (minutes: number): string => {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours24 >= 12 ? "pm" : "am";
    let hours12 = hours24 > 12 ? hours24 - 12 : hours24 === 0 ? 12 : hours24;
    const formattedMins = mins.toString().padStart(2, "0");
    return `${hours12}:${formattedMins} ${period}`;
  };

  // Calculate service start times
  const getServiceStartTime = (index: number): string => {
    if (!selectedTime) return "";
    
    const baseMinutes = parseTimeToMinutes(selectedTime);
    let cumulativeMinutes = 0;
    
    // Add durations of all previous services
    for (let i = 0; i < index; i++) {
      cumulativeMinutes += selectedServices[i].duration;
    }
    
    const serviceStartMinutes = baseMinutes + cumulativeMinutes;
    return formatMinutesToTime(serviceStartMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      {/* Sidebar */}
      <div className={`flex flex-col relative w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center gap-4 z-10">
          <button
            onClick={() => {
              if (currentStep === 1 && !isAddingNewCustomer) {
                handleClose();
              } else if (isAddingNewCustomer) {
                setIsAddingNewCustomer(false);
                setNewCustomer({ firstName: "", lastName: "", phone: "", email: "", countryCode: "+961" });
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="cursor-pointer opacity-100"
          >
            {currentStep === 1 && !isAddingNewCustomer ? (
              // X Icon (Close) - Step 1
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // Back Arrow Icon - Steps 2-4 or Adding New Customer
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.72909 12.5H19.7916" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4584 18.75C11.4584 18.75 5.20837 14.147 5.20837 12.5C5.20837 10.8529 11.4584 6.25 11.4584 6.25" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <h2 className="text-base font-semibold">Add New Booking</h2>
          <div className="w-6"></div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3.5 text-xs">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3.5">
                <span className={`font-medium ${currentStep === index + 1 ? "text-black" : "text-black/40"}`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <Arrow direction="right" opacity={1} className="w-[17px] h-[17px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 pt-3">
          {/* Step 1: Select Customer */}
          {currentStep === 1 && !isAddingNewCustomer && (
            <div className="">
              <h3 className="text-base font-bold text-black mb-8">Select Customer</h3>
              
              {/* Add New Customer / Walk-in Options */}
              <div className="flex gap-4 border-b border-black/20 pb-4 mb-4">
                <button
                  onClick={() => {
                    setIsAddingNewCustomer(true);
                  }}
                  className="group flex-1 flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-[42px] h-[42px] flex items-center justify-center shrink-0">
                    {/* Default Icon */}
                    <svg className="group-hover:hidden w-[60px] h-[60px] transition-opacity duration-300" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="url(#paint0_linear_9090_50052)"/>
                      <path d="M33.9993 24.6667C33.9993 20.9848 31.0145 18 27.3327 18C23.6508 18 20.666 20.9848 20.666 24.6667C20.666 28.3485 23.6508 31.3333 27.3327 31.3333C31.0145 31.3333 33.9993 28.3485 33.9993 24.6667Z" stroke="#7B2CBF" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M37.3327 41.9998V32.6665M32.666 37.3332H41.9993" stroke="#7B2CBF" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 40.6668C18 35.5122 22.1787 31.3335 27.3333 31.3335C29.3163 31.3335 31.1549 31.9519 32.6667 33.0064" stroke="#7B2CBF" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="paint0_linear_9090_50052" x1="0" y1="30" x2="60" y2="30" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#DAF4FA"/>
                          <stop offset="1" stopColor="#E5D5F2"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Hover Icon */}
                    <svg className="hidden group-hover:block w-[60px] h-[60px] transition-opacity duration-300" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="url(#paint0_linear_6230_39527)"/>
                      <path d="M33.9993 24.6667C33.9993 20.9848 31.0145 18 27.3327 18C23.6508 18 20.666 20.9848 20.666 24.6667C20.666 28.3485 23.6508 31.3333 27.3327 31.3333C31.0145 31.3333 33.9993 28.3485 33.9993 24.6667Z" stroke="white" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M37.3327 42.0001V32.6667M32.666 37.3334H41.9993" stroke="white" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 40.6667C18 35.512 22.1787 31.3334 27.3333 31.3334C29.3163 31.3334 31.1549 31.9518 32.6667 33.0063" stroke="white" strokeWidth="1.71429" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="paint0_linear_6230_39527" x1="30" y1="0" x2="30" y2="60" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#48CAE4"/>
                          <stop offset="1" stopColor="#7B2CBF"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-black group-hover:text-primary transition-colors duration-300">Add New Customer</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer({ id: "walk-in", name: "Walk-in", email: "" });
                    setCurrentStep(2);
                  }}
                  className="group flex-1 flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-[42px] h-[42px] flex items-center justify-center shrink-0">
                    {/* Default Icon */}
                    <svg className="group-hover:hidden w-[60px] h-[60px] transition-opacity duration-300" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="url(#paint0_linear_6230_39559)"/>
                      <path d="M36.667 20C36.667 21.1046 35.7715 22 34.667 22C33.5625 22 32.667 21.1046 32.667 20C32.667 18.8954 33.5625 18 34.667 18C35.7715 18 36.667 18.8954 36.667 20Z" stroke="#7B2CBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M34 42.003L33.1145 38.515C32.8215 37.3607 32.2153 36.3065 31.3609 35.4651L29.3333 33.4683M29.3333 33.4683C27.9896 32.4098 27.3178 31.8805 27.0575 31.1731C26.9416 30.8579 26.8862 30.5238 26.8943 30.1881C26.9124 29.4346 27.3776 28.7167 28.3079 27.2813L30 24.6704M29.3333 33.4683L34 26.3718M22 28.8731C23.3333 26.2468 25.3836 24.725 30 24.6704M30 24.6704L31.8053 24.6697C32.3296 24.6695 32.802 24.9815 33.1017 25.4115C33.3233 25.7294 33.6257 26.0911 34 26.3718M34 26.3718C35.5396 27.5263 37.9503 27.9914 40.6667 24.9341" stroke="#7B2CBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.333 37.6403L20.2373 37.8554C22.5418 38.4037 24.9373 37.3551 25.9997 35.3333" stroke="#7B2CBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="paint0_linear_6230_39559" x1="0" y1="30" x2="60" y2="30" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#DAF4FA"/>
                          <stop offset="1" stopColor="#E5D5F2"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Hover Icon */}
                    <svg className="hidden group-hover:block w-[60px] h-[60px] transition-opacity duration-300" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="url(#paint0_linear_6230_39567)"/>
                      <path d="M36.667 20C36.667 21.1046 35.7715 22 34.667 22C33.5625 22 32.667 21.1046 32.667 20C32.667 18.8954 33.5625 18 34.667 18C35.7715 18 36.667 18.8954 36.667 20Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M34 42.003L33.1145 38.515C32.8215 37.3607 32.2153 36.3065 31.3609 35.4651L29.3333 33.4683M29.3333 33.4683C27.9896 32.4098 27.3178 31.8805 27.0575 31.1731C26.9416 30.8579 26.8862 30.5238 26.8943 30.1881C26.9124 29.4346 27.3776 28.7167 28.3079 27.2813L30 24.6704M29.3333 33.4683L34 26.3718M22 28.8731C23.3333 26.2468 25.3836 24.725 30 24.6704M30 24.6704L31.8053 24.6697C32.3296 24.6695 32.802 24.9815 33.1017 25.4115C33.3233 25.7294 33.6257 26.0911 34 26.3718M34 26.3718C35.5396 27.5263 37.9503 27.9914 40.6667 24.9341" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.333 37.6403L20.2373 37.8554C22.5418 38.4037 24.9373 37.3551 25.9997 35.3333" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="paint0_linear_6230_39567" x1="30" y1="0" x2="30" y2="60" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#48CAE4"/>
                          <stop offset="1" stopColor="#7B2CBF"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-black group-hover:text-primary transition-colors duration-300">Walk-in</span>
                </button>
              </div>

              {/* Search Bar */}
              <SearchInput
                placeholder="Search by customer name"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />

              {/* Customer List */}
              <div className="space-y-2 mt-4">
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                  .map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCurrentStep(2);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white border border-transparent hover:border-black/10 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        {customer.avatar}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-semibold text-black">{customer.name}</p>
                        <p className="text-xs text-black/40">{customer.email}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Add New Customer Form */}
          {currentStep === 1 && isAddingNewCustomer && (
            <div className="">
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => {
                    setIsAddingNewCustomer(false);
                    setNewCustomer({ firstName: "", lastName: "", phone: "", email: "", countryCode: "+961" });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-base font-bold text-black">Add New Customer</h3>
              </div>

              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={newCustomer.countryCode}
                        onChange={(e) => setNewCustomer({ ...newCustomer, countryCode: e.target.value })}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white pr-8"
                      >
                        <option value="+961">🇱🇧 +961</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                      </select>
                      <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      placeholder="X XXX XXX"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {currentStep === 2 && (
            <div className="">
              <h3 className="text-base font-bold text-black mb-8">Select Date & Time</h3>
              
              {/* Date Picker */}
              <div className="space-y-4 border-b border-black/20 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.8">
                        <path d="M12 1.5V4.5M6 1.5V4.5" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5H9.75C12.5784 16.5 13.9927 16.5 14.8713 15.6213C15.75 14.7427 15.75 13.3284 15.75 10.5V9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3Z" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.25 7.5H15.75" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.99662 10.5H9.00337M8.99662 13.5H9.00337M11.9932 10.5H12M6 10.5H6.00673M6 13.5H6.00673" stroke="black" strokeWidth="2.08333" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                    </svg>
                    <span className="text-[13px] font-semibold text-black/80">
                      {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const today = new Date();
                      const selectedMonth = selectedDate.getMonth();
                      const selectedYear = selectedDate.getFullYear();
                      const todayMonth = today.getMonth();
                      const todayYear = today.getFullYear();
                      const canGoBack = selectedYear > todayYear || (selectedYear === todayYear && selectedMonth > todayMonth);
                      return (
                        <button
                          onClick={() => {
                            if (canGoBack) {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setSelectedDate(newDate);
                            }
                          }}
                          disabled={!canGoBack}
                          className={`p-1 ${canGoBack ? "cursor-pointer" : "cursor-not-allowed"}`}
                        >
                          <Arrow direction="left" opacity={canGoBack ? 0.8 : 0.2} className="w-5 h-5" />
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      className="p-1 cursor-pointer"
                    >
                      <Arrow direction="right" opacity={0.8} className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week - Horizontal Scrollable */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(() => {
                    const today = new Date();
                    const startOfWeek = new Date(selectedDate);
                    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                    const weekDays = [];
                    for (let i = 0; i < 7; i++) {
                      const day = new Date(startOfWeek);
                      day.setDate(startOfWeek.getDate() + i);
                      weekDays.push(day);
                    }
                    return weekDays.map((day) => {
                      const dayName = dayNames[day.getDay()];
                      const dayNumber = day.getDate();
                      const isSelected = 
                        selectedDate.getDate() === dayNumber && 
                        selectedDate.getMonth() === day.getMonth() &&
                        selectedDate.getFullYear() === day.getFullYear();
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dayDate = new Date(day);
                      dayDate.setHours(0, 0, 0, 0);
                      const isPast = dayDate < today;
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => {
                            if (!isPast) {
                              setSelectedDate(day);
                            }
                          }}
                          disabled={isPast}
                          className={`flex-1 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                            isPast
                              ? "bg-gray-50 border-black/5 text-gray-400 cursor-not-allowed"
                              : isSelected
                              ? "bg-gray-900 border-gray-900 text-white cursor-pointer"
                              : "bg-[#F9F9F9] border-black/5 text-black/50 hover:bg-gray-100 cursor-pointer"
                          }`}
                        >
                          <div className="text-[11px] font-medium">{dayName}</div>
                          <div className={`text-[13px] font-bold ${isPast ? "text-gray-400" : isSelected ? "text-white" : "text-black"}`}>{dayNumber}</div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-semibold text-black mb-2 block">Available Times *</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <div
                        key={time}
                        className={`relative rounded-lg p-px transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-secondary to-primary"
                            : "bg-gray-200 hover:bg-gradient-to-r hover:from-secondary hover:to-primary"
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTime(time)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors bg-white text-gray-700"
                        >
                          {time}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {currentStep === 3 && (
            <div className="">
              <h3 className="text-base font-bold text-black mb-8">Select one or multiple services</h3>
              
              {/* Search Bar */}
              <div className="mb-4">
                <SearchInput
                  placeholder="Search by service name"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>

              {/* Services by Category */}
              <div className="space-y-5">
                {Array.from(new Set(services.map(s => s.category))).map((category) => (
                  <div key={category}>
                    <h4 className="text-[13px] font-semibold text-black capitalize mb-3">{category}</h4>
                    <div className="space-y-3">
                      {services
                        .filter(s => s.category === category && s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                        .map((service) => {
                          const isSelected = selectedServices.some(s => s.id === service.id);
                          return (
                            <div key={service.id} className="flex  gap-3 p-3 bg-white border border-black/10 rounded-lg cursor-pointer" onClick={() => handleServiceToggle(service)}>
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleServiceToggle(service);
                                }}
                                className={`w-4.5 h-4.5 mt-[1px] rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                                  isSelected 
                                    ? "bg-primary border-primary" 
                                    : "bg-white border-black/10"
                                }`}
                              >
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[13px] font-semibold text-black">{service.name}</span>
                                  <span className="text-[13px] font-semibold text-black/80">${service.price.toFixed(2)}</span>
                                </div>

                                  <span className="text-xs font-medium text-black/40">{service.duration} min</span>

                                {isSelected && (
                                  <div className="mt-2 relative">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenTeamMemberDropdown(openTeamMemberDropdown === service.id ? null : service.id);
                                      }}
                                      className="flex items-center gap-1 px-2 py-2 bg-[#F9F9F9] hover:bg-[#F5F3F7] border border-black/10 rounded-lg text-xs font-medium text-black  cursor-pointer transition-all duration-300"
                                    >
                                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                                        <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                        <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span>{(() => {
                                        const selectedService = selectedServices.find(s => s.id === service.id);
                                        const teamMemberId = selectedService?.teamMember || "any";
                                        const teamMember = teamMembers.find(tm => tm.id === teamMemberId);
                                        return teamMember?.name || "Any Team Member";
                                      })()}</span>
                                      <Arrow direction={openTeamMemberDropdown === service.id ? "up" : "down"} opacity={1} className="w-4" />
                                    </button>
                                    {openTeamMemberDropdown === service.id && (
                                      <div className="absolute left-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg z-50 min-w-[200px]">
                                        {teamMembers.map((member) => {
                                          const selectedService = selectedServices.find(s => s.id === service.id);
                                          const isSelected = (selectedService?.teamMember || "any") === member.id;
                                          return (
                                            <button
                                              key={member.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedServices(prev => 
                                                  prev.map(s => 
                                                    s.id === service.id 
                                                      ? { ...s, teamMember: member.id === "any" ? undefined : member.id }
                                                      : s
                                                  )
                                                );
                                                setOpenTeamMemberDropdown(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F5F3F7] transition-colors cursor-pointer"
                                            >
                                              {member.id === "any" ? (
                                                <svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                                                  <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                                  <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                                  <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                              ) : (
                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                                  {member.avatar}
                                                </div>
                                              )}
                                              <span className="flex-1 text-left text-xs font-medium text-black">{member.name}</span>
                                              {isSelected && (
                                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                                  <path fillRule="evenodd" clipRule="evenodd" d="M0.9375 9C0.9375 13.4528 4.5472 17.0625 9 17.0625C13.4528 17.0625 17.0625 13.4528 17.0625 9C17.0625 4.5472 13.4528 0.9375 9 0.9375C4.5472 0.9375 0.9375 4.5472 0.9375 9ZM12.5068 6.19714C12.8121 6.47703 12.8327 6.95146 12.5529 7.2568L8.4279 11.7568C8.2896 11.9076 8.0958 11.9953 7.89127 11.9998C7.68675 12.0043 7.48932 11.925 7.34467 11.7803L5.46967 9.90532C5.17678 9.61245 5.17678 9.13755 5.46967 8.84468C5.76257 8.5518 6.23744 8.5518 6.53033 8.84468L7.85145 10.1658L11.4471 6.24321C11.727 5.93787 12.2014 5.91724 12.5068 6.19714Z" fill="url(#paint0_linear_9090_43515)"/>
                                                  <defs>
                                                    <linearGradient id="paint0_linear_9090_43515" x1="9" y1="0.9375" x2="9" y2="17.0625" gradientUnits="userSpaceOnUse">
                                                      <stop stopColor="#48CAE4"/>
                                                      <stop offset="1" stopColor="#7B2CBF"/>
                                                    </linearGradient>
                                                  </defs>
                                                </svg>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-black mb-8">Summary</h3>
              
              {/* Customer Section */}
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold text-gray-900">Customer</h4>
                <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E0F7FA] flex items-center justify-center text-sm font-semibold text-white">
                      {selectedCustomer?.avatar || selectedCustomer?.name?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{selectedCustomer?.name}</p>
                      {selectedCustomer?.email && (
                        <p className="text-[10px] font-medium text-black/40">{selectedCustomer.email}</p>
                      )}
                    </div>
                  </div>
                  <EditIcon onClick={() => setCurrentStep(1)} />
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-900">Date & Time</h4>
                <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {dayNames[selectedDate.getDay()]} {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].slice(0, 3)}
                    </p>
                    <p className="text-[10px] text-gray-500">{selectedTime}</p>
                  </div>
                  <EditIcon onClick={() => setCurrentStep(2)} />
                </div>
              </div>

              {/* Services Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-900">Services</h4>
                <div className="space-y-3">
                  {selectedServices.map((service, index) => {
                    const teamMemberId = service.teamMember || "any";
                    const teamMember = teamMembers.find(tm => tm.id === teamMemberId);
                    
                    return (
                      <div key={service.id} className="flex items-center gap-3">
                        <div className="flex-1 bg-white border border-black/10 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[13px] font-semibold text-black">{service.name}</p>
                                <span className="text-[13px] font-semibold text-black/80">${service.price.toFixed(2)}</span>
                              </div>
                              <span className="text-xs font-medium text-black/40">
                                {getServiceStartTime(index)} | {service.duration} min
                              </span>
                              <div className="mt-2 relative">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTeamMemberDropdown(openTeamMemberDropdown === service.id ? null : service.id);
                                  }}
                                  className="flex items-center gap-1 px-2 py-2 bg-[#F9F9F9] hover:bg-[#F5F3F7] border border-black/10 rounded-lg text-xs font-medium text-black cursor-pointer transition-all duration-300"
                                >
                                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                                    <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                    <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                                  <span>{teamMember?.name || "Any Team Member"}</span>
                                  <Arrow direction={openTeamMemberDropdown === service.id ? "up" : "down"} opacity={1} className="w-4" />
                            </button>
                                {openTeamMemberDropdown === service.id && (
                                  <div className="absolute left-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg z-50 min-w-[200px]">
                                    {teamMembers.map((member) => {
                                      const isSelected = (service.teamMember || "any") === member.id;
                                      return (
                            <button
                                          key={member.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedServices(prev => 
                                              prev.map(s => 
                                                s.id === service.id 
                                                  ? { ...s, teamMember: member.id === "any" ? undefined : member.id }
                                                  : s
                                              )
                                            );
                                            setOpenTeamMemberDropdown(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F5F3F7] transition-colors cursor-pointer"
                                        >
                                          {member.id === "any" ? (
                                            <svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                                              <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                              <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                                          ) : (
                                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                              {member.avatar}
                                            </div>
                                          )}
                                          <span className="flex-1 text-left text-xs font-medium text-black">{member.name}</span>
                                          {isSelected && (
                                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                              <path fillRule="evenodd" clipRule="evenodd" d="M0.9375 9C0.9375 13.4528 4.5472 17.0625 9 17.0625C13.4528 17.0625 17.0625 13.4528 17.0625 9C17.0625 4.5472 13.4528 0.9375 9 0.9375C4.5472 0.9375 0.9375 4.5472 0.9375 9ZM12.5068 6.19714C12.8121 6.47703 12.8327 6.95146 12.5529 7.2568L8.4279 11.7568C8.2896 11.9076 8.0958 11.9953 7.89127 11.9998C7.68675 12.0043 7.48932 11.925 7.34467 11.7803L5.46967 9.90532C5.17678 9.61245 5.17678 9.13755 5.46967 8.84468C5.76257 8.5518 6.23744 8.5518 6.53033 8.84468L7.85145 10.1658L11.4471 6.24321C11.727 5.93787 12.2014 5.91724 12.5068 6.19714Z" fill="url(#paint0_linear_9090_43515)"/>
                                              <defs>
                                                <linearGradient id="paint0_linear_9090_43515" x1="9" y1="0.9375" x2="9" y2="17.0625" gradientUnits="userSpaceOnUse">
                                                  <stop stopColor="#48CAE4"/>
                                                  <stop offset="1" stopColor="#7B2CBF"/>
                                                </linearGradient>
                                              </defs>
                                            </svg>
                                          )}
                            </button>
                                      );
                                    })}
                          </div>
                                )}
                        </div>
                            </div>
                          </div>
                        </div>
                        <DeleteIcon onClick={() => {
                          setSelectedServices(prev => prev.filter(s => s.id !== service.id));
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-secondary transition-all duration-300 cursor-pointer"
                  >
                    Add Service
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="text-xs text-gray-600">{Math.floor(calculateTotalDuration() / 60)} hour{calculateTotalDuration() >= 120 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {(currentStep > 1 || isAddingNewCustomer || currentStep === 4) && (
          <div className="sticky bottom-0 mt-auto bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            {(currentStep > 1 || isAddingNewCustomer) && (
              <Button
                variant="transparent"
                onClick={() => {
                  if (isAddingNewCustomer) {
                    setIsAddingNewCustomer(false);
                    setNewCustomer({ firstName: "", lastName: "", phone: "", email: "", countryCode: "+961" });
                  } else {
                    setCurrentStep(currentStep - 1);
                  }
                }}
                className="w-[30%]"
              >
                Previous
              </Button>
            )}
            {/* Only show Continue button if adding new customer or if not on step 1 */}
            {(isAddingNewCustomer || currentStep > 1) && currentStep < 4 ? (
              <Button
                variant="primary"
                onClick={async () => {
                  // Handle Add New Customer form submission
                  if (isAddingNewCustomer) {
                    // Validate customer form
                    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.phone || !newCustomer.email) {
                      alert("Please fill in all required customer fields");
                      return;
                    }
                    
                    // Validate date & time
                    if (!selectedTime) {
                      alert("Please select a time");
                      return;
                    }
                    
                    // TODO: Replace with actual API call
                    // Create customer
                    const newCustomerData = {
                      id: `new-${Date.now()}`,
                      name: `${newCustomer.firstName} ${newCustomer.lastName}`,
                      email: newCustomer.email,
                      avatar: newCustomer.firstName.charAt(0).toUpperCase(),
                    };
                    
                    // Select the new customer and proceed to step 3 (Services)
                    setSelectedCustomer(newCustomerData);
                    setIsAddingNewCustomer(false);
                    setNewCustomer({ firstName: "", lastName: "", phone: "", email: "", countryCode: "+961" });
                    setCurrentStep(3); // Skip to Services since we already have date/time
                    return;
                  }
                  
                  // Regular step validation
                  if (currentStep === 2 && !selectedTime) {
                    alert("Please select a time");
                    return;
                  }
                  if (currentStep === 3 && selectedServices.length === 0) {
                    alert("Please select at least one service");
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className={isAddingNewCustomer ? "w-full" : "w-[70%] ml-4"}
              >
                Continue
              </Button>
          ) : currentStep === 4 ? (
            <Button
              variant="primary"
              onClick={() => {
                // Handle final booking submission
                onSave();
              }}
              className="w-[70%] ml-4"
            >
              Add Booking
            </Button>
          ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
