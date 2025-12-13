"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useBranch } from "../../contexts/BranchContext";
import { hasPermission, getUserPermissions } from "../../utils/permissions";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Arrow from "../../components/ui/Arrow";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

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
  status: "Pending" | "Confirmed" | "Started" | "Completed" | "Cancelled" | "No Show";
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

interface WorkingHours {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time?: string; // e.g., "09:00"
  end_time?: string; // e.g., "17:00"
  is_working?: boolean; // Whether they work on this day
}

interface StaffMember {
  id: string;
  name: string;
  avatar?: string;
  calendarColor?: string;
  working_hours?: WorkingHours[]; // Array of working hours for each day
}

export default function Calendar() {
  const { currentBranch, branchChangeKey, permissions: contextPermissions } = useBranch();
  
  // Initialize view from localStorage or default to "list"
  const [view, setView] = useState<"calendar" | "list">(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("calendar-view") as "calendar" | "list" | null;
      return savedView || "list";
    }
    return "list";
  });
  
  // Initialize calendarView from localStorage or default to "day"
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">(() => {
    if (typeof window !== "undefined") {
      const savedCalendarView = localStorage.getItem("calendar-view-type") as "day" | "week" | "month" | null;
      return savedCalendarView || "day";
    }
    return "day";
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffScrollIndex, setStaffScrollIndex] = useState(0); // Index for scrolling through staff
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // All bookings for calendar (no pagination)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
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
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | null>(null);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [branchOpeningHours, setBranchOpeningHours] = useState<any>(null);
  const [isLoadingOpeningHours, setIsLoadingOpeningHours] = useState(false);

  // Use permissions from context (they update automatically when branch changes)
  // Ensure contextPermissions is always an array to prevent errors
  const safePermissions = Array.isArray(contextPermissions) ? contextPermissions : [];
  const canAddBooking = safePermissions.includes("Add Booking");
  const canViewAllBookings = safePermissions.includes("View All Bookings");
  const canViewOwnBookings = safePermissions.includes("View Own Bookings");
  const canEditBooking = safePermissions.includes("Edit Booking");
  
  console.log("Calendar - Current permissions:", contextPermissions);
  console.log("Calendar - Can add booking:", canAddBooking);

  // Fetch a single staff member by ID (for when a specific staff is selected)
  const fetchSingleStaffMember = async (staffId: string) => {
    if (!currentBranch) return;

    try {
      const response = await axiosClient.get("/staff/get", {
        params: { 
          branch_id: currentBranch.id,
          staff_id: staffId 
        },
      });
      
      const staffData = response.data?.data?.staff || [];
      
      if (staffData.length > 0) {
        const member = staffData[0];
        const firstName = member.first_name || "";
        const lastName = member.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || "Staff Member";
        
        const avatarUrl = (member.image?.image && member.image.image.trim() !== "")
          ? member.image.image
          : null;
        
        // Helper function to convert day string to number (0=Sunday, 1=Monday, etc.)
        const dayStringToNumber = (day: string | number): number => {
          if (typeof day === 'number') return day;
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2, 'tues': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
          };
          return dayMap[day.toLowerCase()] ?? 0;
        };

        // Extract working hours
        let workingHours: WorkingHours[] = [];
        if (member.working_hours && Array.isArray(member.working_hours)) {
          workingHours = member.working_hours.map((wh: any) => ({
            day: dayStringToNumber(wh.day !== undefined ? wh.day : (wh.day_of_week !== undefined ? wh.day_of_week : 0)),
            start_time: wh.from || wh.start_time || wh.startTime || wh.start,
            end_time: wh.to || wh.end_time || wh.endTime || wh.end,
            is_working: true,
          }));
        } else if (member.schedule && Array.isArray(member.schedule)) {
          workingHours = member.schedule.map((sched: any) => ({
            day: dayStringToNumber(sched.day !== undefined ? sched.day : (sched.day_of_week !== undefined ? sched.day_of_week : 0)),
            start_time: sched.from || sched.start_time || sched.startTime || sched.start,
            end_time: sched.to || sched.end_time || sched.endTime || sched.end,
            is_working: true,
          }));
        } else if (member.availability && Array.isArray(member.availability)) {
          workingHours = member.availability.map((avail: any) => ({
            day: dayStringToNumber(avail.day !== undefined ? avail.day : (avail.day_of_week !== undefined ? avail.day_of_week : 0)),
            start_time: avail.from || avail.start_time || avail.startTime || avail.start,
            end_time: avail.to || avail.end_time || avail.endTime || avail.end,
            is_working: true,
          }));
        }
        
        const updatedStaff: StaffMember = {
          id: String(member.id),
          name: fullName,
          avatar: avatarUrl,
          calendarColor: member.calendar_color || "#9CA3AF",
          working_hours: workingHours.length > 0 ? workingHours : undefined,
        };

        // Update only this staff member in the list, keeping all others
        setStaffMembers(prev => 
          prev.map(staff => staff.id === staffId ? updatedStaff : staff)
        );
      }
    } catch (error) {
      console.error("Error fetching single staff member:", error);
    }
  };

  // Helper function to safely format date to YYYY-MM-DD (using local time, not UTC)
  const formatDateToString = (date: Date | string | null | undefined): string | null => {
    try {
      if (!date) return null;
      
      // If it's already a date string in YYYY-MM-DD format, return it directly
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Ensure we have a Date object
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else {
        // For date strings with time, parse normally
        // For date-only strings (YYYY-MM-DD), parse as local date to avoid timezone issues
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
          const [year, month, day] = date.trim().split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else {
          dateObj = new Date(date);
        }
      }
      
      // Validate the date
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return null;
      }
      
      // Use local date components to avoid timezone issues
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn("Error formatting date:", error, date);
      return null;
    }
  };

  const fetchAllBookingsForCalendar = useCallback(async () => {
    if (!currentBranch) return;

    try {
      let dates: Date[] = [];
      
      if (calendarView === "day") {
        dates = [new Date(currentDate)];
      } else if (calendarView === "week") {
        // Get all 7 days of the week
        const dayOfWeek = currentDate.getDay();
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
        const weekStart = new Date(currentDate);
        weekStart.setDate(diff);
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          dates.push(day);
        }
      } else { // month
        // Get all days in the month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
          dates.push(new Date(year, month, i));
        }
      }

      // Batch requests to avoid overwhelming the backend
      // Process requests in chunks of 5 at a time
      const batchSize = 5;
      const allBookingsData: any[] = [];
      
      for (let i = 0; i < dates.length; i += batchSize) {
        const batch = dates.slice(i, i + batchSize);
        const batchPromises = batch.map(date => {
          const dateStr = formatDateToString(date);
          if (!dateStr) {
            // Skip invalid dates
            return Promise.resolve([]);
          }
          
          const params: any = {
            branch_id: currentBranch.id,
            date: dateStr, // YYYY-MM-DD format
          };

          if (filters.team !== "all") {
            params.team_member = filters.team;
          }

          if (filters.status !== "all") {
            params.status = filters.status.toLowerCase();
          }

          return axiosClient.get("/bookings/get/by/day", { 
            params,
            timeout: 15000 // Increase timeout to 15 seconds for calendar requests
          })
            .then(response => {
              const data = response.data.data || response.data;
              const bookings = data.bookings || data || [];
              
              // Debug: Log raw API response structure
              if (bookings.length > 0) {
                console.log(`[API Response for ${params.date}] Raw booking structure:`, {
                  keys: Object.keys(bookings[0]),
                  hasStaff: !!bookings[0].staff,
                  hasStaffId: !!(bookings[0].staff_id || bookings[0].staffId),
                  staffType: typeof bookings[0].staff,
                  staffValue: bookings[0].staff,
                  scheduledOnField: bookings[0].scheduledOn || bookings[0].scheduled_on || bookings[0].date,
                });
              }
              
              // Normalize booking data - handle both snake_case and camelCase
              if (!Array.isArray(bookings)) {
                console.warn("Bookings is not an array:", bookings);
                return [];
              }
              
              // Flatten bookings: if a booking has multiple services with different staff, create separate entries
              const normalizedBookings: any[] = [];
              
              bookings.forEach((booking: any) => {
                // Normalize scheduledOn field (use 'date' field from your API)
                const scheduledOn = booking.scheduledOn || booking.scheduled_on || booking.date || booking.scheduled_at;
                
                // Normalize customer field
                let customer = booking.customer;
                if (customer && typeof customer === 'object') {
                  // Extract name from first_name and last_name
                  const firstName = customer.first_name || '';
                  const lastName = customer.last_name || '';
                  const fullName = `${firstName} ${lastName}`.trim() || customer.name || 'Customer';
                  
                  customer = {
                    ...customer,
                    id: String(customer.id || customer.customer_id || ''),
                    name: fullName,
                    avatar: customer.image?.image || customer.avatar || customer.customer_avatar,
                  };
                } else if (booking.customer_id || booking.customerId) {
                  customer = {
                    id: String(booking.customer_id || booking.customerId),
                    name: booking.customer_name || booking.customerName || 'Customer',
                    avatar: booking.customer?.avatar || booking.customer_avatar,
                  };
                } else {
                  customer = { id: '', name: 'Customer' };
                }
                
                // Handle services array - extract staff from each service
                const services = booking.services || [];
                
                if (services.length === 0) {
                  // No services, create a booking with empty staff
                  normalizedBookings.push({
                    ...booking,
                    id: String(booking.id),
                    bookingId: String(booking.id),
                    scheduledOn,
                    staff: { id: '', name: 'Staff' },
                    customer,
                    service: 'No service',
                    duration: booking.duration || 60,
                    payment: booking.payment || '',
                    status: booking.status || 'pending',
                  });
                } else {
                  // Parse the booking date to get the base start time
                  const baseDate = new Date(scheduledOn);
                  
                  // Create one booking entry per service (not grouped by staff)
                  // This allows multiple services with the same staff to be displayed as sequential time slots
                  let cumulativeDuration = 0; // Track cumulative duration for calculating start times
                  
                  services.forEach((service: any, serviceIndex: number) => {
                    const staffId = String(service.staff_id || service.staffId || '');
                    const serviceId = String(service.service_id || '');
                    
                    // Get duration from service (could be string or number)
                    const serviceDuration = service.duration 
                      ? (typeof service.duration === 'string' ? parseInt(service.duration, 10) : service.duration)
                      : (service.duration_minutes || 30); // Default 30 min if not provided
                    
                    // Service name - use service ID or a default
                    const serviceName = serviceId ? `Service ${serviceId}` : 'Service';
                    
                    // Calculate the actual start time for this service
                    // First service starts at the base booking time, subsequent services start after previous ones
                    const serviceStartTime = new Date(baseDate);
                    serviceStartTime.setMinutes(serviceStartTime.getMinutes() + cumulativeDuration);
                    
                    // Reconstruct full datetime string with time component (matching API format: "YYYY-MM-DD HH:mm:ss")
                    const year = serviceStartTime.getFullYear();
                    const month = String(serviceStartTime.getMonth() + 1).padStart(2, '0');
                    const day = String(serviceStartTime.getDate()).padStart(2, '0');
                    const hours = String(serviceStartTime.getHours()).padStart(2, '0');
                    const minutes = String(serviceStartTime.getMinutes()).padStart(2, '0');
                    const seconds = String(serviceStartTime.getSeconds()).padStart(2, '0');
                    const adjustedScheduledOnFull = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    
                    normalizedBookings.push({
                      ...booking,
                      id: `${booking.id}-${staffId}-${serviceIndex}`, // Unique ID per service
                      bookingId: String(booking.id),
                      scheduledOn: adjustedScheduledOnFull, // Use adjusted start time
                      staff: {
                        id: staffId,
                        name: 'Staff', // Will be matched with staffMembers later
                        avatar: undefined,
                      },
                      customer,
                      service: serviceName,
                      duration: serviceDuration, // Individual service duration
                      payment: booking.payment || '',
                      status: booking.status || 'pending',
                      services: [service], // Store this individual service
                      serviceIndex: serviceIndex, // Index to maintain order
                    });
                    
                    // Add this service's duration to cumulative for next service
                    cumulativeDuration += serviceDuration;
                  });
                }
              });
              
              // Debug: Log normalization result
              if (normalizedBookings.length > 0) {
                console.log(`[Normalized] Created ${normalizedBookings.length} booking entries from ${bookings.length} raw bookings`);
                console.log(`[Normalized] Sample booking:`, {
                  id: normalizedBookings[0].id,
                  scheduledOn: normalizedBookings[0].scheduledOn,
                  staff: normalizedBookings[0].staff,
                  customer: normalizedBookings[0].customer,
                  service: normalizedBookings[0].service,
                });
              }
              
              return normalizedBookings;
            })
            .catch(error => {
              console.error(`Error fetching bookings for ${params.date}:`, error);
              return [];
            });
        });

        // Wait for this batch to complete before moving to the next
        const batchResults = await Promise.all(batchPromises);
        allBookingsData.push(...batchResults.flat());
      }
      
      console.log("=== CALENDAR BOOKINGS SUMMARY ===");
      console.log("Total bookings fetched:", allBookingsData.length);
      if (allBookingsData.length > 0) {
        console.log("Sample normalized booking:", {
          id: allBookingsData[0].id,
          scheduledOn: allBookingsData[0].scheduledOn,
          staff: allBookingsData[0].staff,
          customer: allBookingsData[0].customer,
          service: allBookingsData[0].service,
        });
        
        // Check staff ID consistency
        const staffIds = [...new Set(allBookingsData.map((b: any) => b.staff?.id).filter(Boolean))];
        console.log("Unique staff IDs in bookings:", staffIds);
        console.log("Staff members loaded:", staffMembers.map(s => ({ id: s.id, name: s.name })));
        
        // Match staff names from staffMembers
        staffIds.forEach(staffId => {
          const staffMember = staffMembers.find(s => String(s.id) === String(staffId));
          if (staffMember) {
            console.log(`✅ Staff ID "${staffId}" matched to: ${staffMember.name}`);
          } else {
            console.warn(`⚠️ Staff ID "${staffId}" NOT FOUND in staff members list`);
          }
        });
        
        // Check for ID mismatches
        const bookingStaffIds = new Set(staffIds.map(String));
        const memberStaffIds = new Set(staffMembers.map(s => String(s.id)));
        const missingInMembers = [...bookingStaffIds].filter(id => !memberStaffIds.has(id));
        const missingInBookings = [...memberStaffIds].filter(id => !bookingStaffIds.has(id));
        
        if (missingInMembers.length > 0) {
          console.warn("⚠️ Staff IDs in bookings but NOT in staff members:", missingInMembers);
          console.warn("   These bookings will NOT display on the calendar!");
        }
        if (missingInBookings.length > 0) {
          console.log("ℹ️ Staff members with no bookings:", missingInBookings);
        }
      } else {
        console.log("❌ No bookings fetched. Check API response structure.");
      }
      console.log("=================================");
      setAllBookings(allBookingsData);
    } catch (error) {
      console.error("Error fetching calendar bookings:", error);
      setAllBookings([]);
    }
  }, [currentBranch, calendarView, currentDate, filters.team, filters.status, staffMembers]);

  // Fetch staff members - only when branch changes, not when filters change
  // This ensures all staff are always available in the dropdown
  useEffect(() => {
    if (currentBranch) {
      fetchStaffMembers();
    }
  }, [currentBranch?.id, branchChangeKey]);

  // Fetch bookings for list view - only when branch, filters, page, or permissions change
  useEffect(() => {
    if (currentBranch && view === "list") {
      // Reset pagination when branch changes
      if (branchChangeKey > 0) {
        setCurrentPage(1);
      }
      fetchBookings();
    }
  }, [currentBranch?.id, branchChangeKey, filters, currentPage, canViewAllBookings, view]);

  // Fetch pending bookings - only when branch changes (not when filters change)
  useEffect(() => {
    if (currentBranch) {
      fetchPendingBookings();
    }
  }, [currentBranch?.id, branchChangeKey]);

  // Fetch bookings for calendar view - only when calendar-specific dependencies change
  useEffect(() => {
    if (view === "calendar" && currentBranch) {
      fetchAllBookingsForCalendar();
    }
  }, [view, currentBranch, fetchAllBookingsForCalendar]);

  // Fetch branch opening hours
  const fetchBranchOpeningHours = useCallback(async () => {
    if (!currentBranch?.id) {
      return;
    }

    setIsLoadingOpeningHours(true);
    try {
      const response = await axiosClient.get("/branch/get");
      const branchData = response.data?.data?.branch || response.data?.branch || response.data?.data || response.data;
      const openingHours = branchData?.opening_hours;

      if (openingHours) {
        setBranchOpeningHours(openingHours);
      } else {
        setBranchOpeningHours(null);
      }
    } catch (error: any) {
      console.warn("Could not fetch branch opening hours:", error?.response?.status || error?.message || "Unknown error");
      setBranchOpeningHours(null);
    } finally {
      setIsLoadingOpeningHours(false);
    }
  }, [currentBranch?.id]);

  // Fetch opening hours when branch changes
  useEffect(() => {
    if (currentBranch) {
      fetchBranchOpeningHours();
    }
  }, [currentBranch?.id, branchChangeKey, fetchBranchOpeningHours]);

  // Persist view state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("calendar-view", view);
    }
  }, [view]);

  // Persist calendarView state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("calendar-view-type", calendarView);
    }
  }, [calendarView]);

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
        const todayStr = formatDateToString(new Date());
        if (todayStr) {
          params.date = todayStr;
        }
      }

      // Always use "/bookings" endpoint
      const endpoint = "/bookings";

      console.log("Fetching bookings from endpoint:", endpoint, "canViewAllBookings:", canViewAllBookings);

      const response = await axiosClient.get(endpoint, { params });
      
      // Adjust based on your API response structure
      const data = response.data.data || response.data;
      setBookings(data.bookings || data || []);
      setTotalBookings(data.total || data.bookings?.length || 0);
      setTotalPages(data.last_page || Math.ceil((data.total || 0) / 12) || 1);
    } catch (error) {
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

  const fetchStaffMembers = async () => {
    if (!currentBranch || !currentBranch.id) return;

    try {
      const params: { branch_id: number } = { 
        branch_id: typeof currentBranch.id === 'string' ? parseInt(currentBranch.id, 10) : currentBranch.id 
      };
      
      // Always fetch all staff members - don't filter by team here
      // The team filter should only be used for filtering bookings, not staff list
      
      const response = await axiosClient.get("/staff/get", { params });
      
      const staffData = response.data?.data?.staff || [];
      
      const transformedData = staffData.map((member: any) => {
        const firstName = member.first_name || "";
        const lastName = member.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || "Staff Member";
        
        const avatarUrl = (member.image?.image && member.image.image.trim() !== "")
          ? member.image.image
          : null;
        
        // Helper function to convert day string to number (0=Sunday, 1=Monday, etc.)
        const dayStringToNumber = (day: string | number): number => {
          if (typeof day === 'number') return day;
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2, 'tues': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
          };
          return dayMap[day.toLowerCase()] ?? 0;
        };

        // Extract working hours - handle different possible API response formats
        let workingHours: WorkingHours[] = [];
        if (member.working_hours && Array.isArray(member.working_hours)) {
          workingHours = member.working_hours.map((wh: any) => ({
            day: dayStringToNumber(wh.day !== undefined ? wh.day : (wh.day_of_week !== undefined ? wh.day_of_week : 0)),
            start_time: wh.from || wh.start_time || wh.startTime || wh.start,
            end_time: wh.to || wh.end_time || wh.endTime || wh.end,
            is_working: true, // If entry exists, they work that day
          }));
        } else if (member.schedule && Array.isArray(member.schedule)) {
          // Alternative format: schedule array
          workingHours = member.schedule.map((sched: any) => ({
            day: dayStringToNumber(sched.day !== undefined ? sched.day : (sched.day_of_week !== undefined ? sched.day_of_week : 0)),
            start_time: sched.from || sched.start_time || sched.startTime || sched.start,
            end_time: sched.to || sched.end_time || sched.endTime || sched.end,
            is_working: true,
          }));
        } else if (member.availability && Array.isArray(member.availability)) {
          // Another alternative format: availability array
          workingHours = member.availability.map((avail: any) => ({
            day: dayStringToNumber(avail.day !== undefined ? avail.day : (avail.day_of_week !== undefined ? avail.day_of_week : 0)),
            start_time: avail.from || avail.start_time || avail.startTime || avail.start,
            end_time: avail.to || avail.end_time || avail.endTime || avail.end,
            is_working: true,
          }));
        }
        
        return {
          id: String(member.id),
          name: fullName,
          avatar: avatarUrl,
          calendarColor: member.calendar_color || "#9CA3AF",
          working_hours: workingHours.length > 0 ? workingHours : undefined,
        };
      });

      setStaffMembers(transformedData);
      // Reset scroll index when staff members change
      setStaffScrollIndex(0);
    } catch (error) {
      console.error("Error fetching staff members:", error);
      setStaffMembers([]);
      setStaffScrollIndex(0);
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

  const getStatusColorForList = (status: string) => {
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

  // Calendar helper functions
  const formatDateForHeader = (date: Date, view: "day" | "week" | "month") => {
    if (view === "day") {
      return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    } else if (view === "week") {
      const dateCopy = new Date(date);
      const dayOfWeek = dateCopy.getDay();
      const diff = dateCopy.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfWeek = new Date(dateCopy);
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${startOfWeek.getFullYear()}`;
    } else {
      return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
  };

  const navigateDate = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(currentDate);
    
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }
    
    if (calendarView === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else       if (calendarView === "week") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      } else if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getTimeSlots = () => {
    const slots = [];
    // Generate slots every 1 hour (60 minutes) from 8:00 AM to 8:00 PM
    for (let hour = 8; hour <= 20; hour++) {
      const date = new Date();
      date.setHours(hour, 0, 0, 0);
      
      // Format as 12-hour with AM/PM
      const timeString = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      
      slots.push({
        display: timeString,
        hour: hour,
        minute: 0,
        totalMinutes: hour * 60,
      });
    }
    return slots;
  };

  // Generate 15-minute clickable slots for empty areas
  const get15MinuteSlots = (hour: number) => {
    const slots = [];
    for (let min = 0; min < 60; min += 15) {
      slots.push({
        hour: hour,
        minute: min,
        totalMinutes: hour * 60 + min,
      });
    }
    return slots;
  };

  // Format time for 15-minute slots
  const format15MinTime = (hour: number, minute: number): string => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Convert 24-hour time to 12-hour format
  const convert24To12Hour = (time24h: string): string => {
    if (!time24h) return "10:00 am";
    
    const time = time24h.trim().replace(/\s+/g, '');
    // Check if already in 12-hour format
    if (/^\d{1,2}:\d{2}(am|pm)$/i.test(time)) {
      const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
      if (match) {
        return `${match[1]}:${match[2]} ${match[3].toLowerCase()}`;
      }
      return time;
    }
    
    // Parse 24-hour format
    const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      
      if (isNaN(hours) || hours < 0 || hours > 23) {
        return "10:00 am";
      }
      
      const period = hours >= 12 ? "pm" : "am";
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      
      return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
    }
    
    return "10:00 am";
  };

  // Get opening hours for a specific day
  const getOpeningHoursForDay = (date: Date): { startTime: string; endTime: string } | null => {
    if (!branchOpeningHours) return null;

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to Monday-first format (0 = Monday, 6 = Sunday)
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const dayNameToIndex: { [key: string]: number } = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
      mon: 0,
      tue: 1,
      wed: 2,
      thu: 3,
      fri: 4,
      sat: 5,
      sun: 6,
    };

    let entries: any[] = [];
    if (Array.isArray(branchOpeningHours)) {
      entries = branchOpeningHours;
    } else if (typeof branchOpeningHours === 'object') {
      entries = Object.values(branchOpeningHours);
    } else {
      return null;
    }

    // Find matching day entry
    for (const entry of entries) {
      if (!entry || !entry.day || !entry.from || !entry.to) continue;
      
      const dayStr = entry.day.trim().toLowerCase();
      
      // Check if it's a range
      if (dayStr.includes("-") || dayStr.includes("to")) {
        const rangeMatch = dayStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*[-to]+\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
        if (rangeMatch) {
          const startDay = rangeMatch[1].toLowerCase();
          const endDay = rangeMatch[2].toLowerCase();
          const startIndex = dayNameToIndex[startDay];
          const endIndex = dayNameToIndex[endDay];
          
          if (startIndex !== undefined && endIndex !== undefined && dayIndex >= startIndex && dayIndex <= endIndex) {
            return {
              startTime: convert24To12Hour(entry.from),
              endTime: convert24To12Hour(entry.to),
            };
          }
        }
      } else {
        // Single day
        const entryDayIndex = dayNameToIndex[dayStr];
        if (entryDayIndex === dayIndex) {
          return {
            startTime: convert24To12Hour(entry.from),
            endTime: convert24To12Hour(entry.to),
          };
        }
      }
    }

    return null;
  };

  // Parse time string to minutes from midnight
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

  // Check if a specific time is within opening hours
  const isTimeWithinOpeningHours = (date: Date, hour: number, minute: number): boolean => {
    const hours = getOpeningHoursForDay(date);
    if (!hours) return false;

    const timeMinutes = hour * 60 + minute;
    const startMinutes = parseTimeToMinutes(hours.startTime);
    const endMinutes = parseTimeToMinutes(hours.endTime);

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getWeekDays = () => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust to Monday as first day (0 = Sunday, so we shift)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    const days = [];
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month's leading days to fill the grid
    const remaining = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  // Helper function to check if a staff member works on a specific day
  const doesStaffWorkOnDay = (staff: StaffMember, date: Date): boolean => {
    // If no working hours data, assume they work all days (backward compatibility)
    if (!staff.working_hours || staff.working_hours.length === 0) {
      return true;
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    // Find working hours for this day - if entry exists, they work that day
    const dayWorkingHours = staff.working_hours.find(wh => wh.day === dayOfWeek);
    
    // If entry exists for this day, they work (since we set is_working=true for all entries)
    return dayWorkingHours !== undefined;
  };

  // Helper function to get filtered staff members for a specific date
  const getFilteredStaffForDate = (date: Date): StaffMember[] => {
    let filtered = staffMembers.filter(staff => doesStaffWorkOnDay(staff, date));
    
    // If a specific team member is selected, show only that staff member
    if (filters.team !== "all") {
      filtered = filtered.filter(staff => String(staff.id) === String(filters.team));
    }
    
    return filtered;
  };

  // Helper function to get filtered staff members for multiple dates (week/month view)
  const getFilteredStaffForDates = (dates: Date[]): StaffMember[] => {
    // Get all unique staff IDs that work on at least one of the dates
    const workingStaffIds = new Set<string>();
    
    dates.forEach(date => {
      staffMembers.forEach(staff => {
        if (doesStaffWorkOnDay(staff, date)) {
          workingStaffIds.add(staff.id);
        }
      });
    });
    
    // Return staff members that work on at least one of the dates
    let filtered = staffMembers.filter(staff => workingStaffIds.has(staff.id));
    
    // If a specific team member is selected, show only that staff member
    if (filters.team !== "all") {
      filtered = filtered.filter(staff => String(staff.id) === String(filters.team));
    }
    
    return filtered;
  };

  // Reset staff scroll index when date changes, team filter changes, or when filtered staff length changes
  useEffect(() => {
    const filteredStaff = getFilteredStaffForDate(currentDate);
    const maxScrollIndex = Math.max(0, filteredStaff.length - 3);
    setStaffScrollIndex(prev => {
      if (prev > maxScrollIndex) {
        return Math.max(0, maxScrollIndex);
      }
      return prev;
    });
  }, [currentDate, staffMembers, filters.team]);

  const getBookingsForSlot = (date: Date, staffId?: string) => {
    // Validate input date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return [];
    }
    
    const dateStr = formatDateToString(date);
    if (!dateStr) {
      return [];
    }
    
    const filtered = allBookings.filter(booking => {
      // Handle both snake_case and camelCase from API
      const scheduledOn = booking.scheduledOn || (booking as any).scheduled_on || (booking as any).date;
      if (!scheduledOn) return false;
      
      const bookingDateStr = formatDateToString(scheduledOn);
      if (!bookingDateStr) {
        return false;
      }
      
      const matchesDate = bookingDateStr === dateStr;
      
      // Compare staff IDs, handling both string and number types
      const bookingStaffId = booking.staff?.id ? String(booking.staff.id) : null;
      const searchStaffId = staffId ? String(staffId) : null;
      const matchesStaff = !searchStaffId || bookingStaffId === searchStaffId;
      
      // Debug: Log why bookings are filtered out
      if (!matchesDate && bookingDateStr) {
        // Only log date mismatches occasionally to avoid spam
        if (Math.random() < 0.01) { // 1% chance
          console.log(`Date mismatch: calendar="${dateStr}" vs booking="${bookingDateStr}"`);
        }
      }
      
      if (!matchesStaff && searchStaffId && bookingStaffId) {
        // Log staff ID mismatches
        console.warn(`Staff ID mismatch: looking for "${searchStaffId}" (type: ${typeof searchStaffId}), found "${bookingStaffId}" (type: ${typeof bookingStaffId})`, {
          bookingId: booking.id,
          bookingStaff: booking.staff,
        });
      }
      
      if (matchesDate && matchesStaff) {
        // Debug: log successful matches
        console.log(`✓ Match: date="${dateStr}", staffId="${searchStaffId || 'any'}", booking=`, {
          id: booking.id,
          scheduledOn: scheduledOn,
          staffId: bookingStaffId,
        });
      }
      
      return matchesDate && matchesStaff;
    });
    
    // Debug: log summary
    if (filtered.length > 0) {
      console.log(`✅ Found ${filtered.length} booking(s) for date ${dateStr}, staffId=${staffId || 'all'}`);
    } else if (allBookings.length > 0) {
      console.log(`❌ No bookings found for date ${dateStr}, staffId=${staffId || 'all'}. Total bookings in state: ${allBookings.length}`);
    }
    
    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.3337 10.0001C18.3337 5.39771 14.6027 1.66675 10.0003 1.66675C5.39795 1.66675 1.66699 5.39771 1.66699 10.0001C1.66699 14.6024 5.39795 18.3334 10.0003 18.3334C14.6027 18.3334 18.3337 14.6024 18.3337 10.0001Z" stroke="#8A38F5" strokeWidth="1.5"/>
            <path d="M6.66699 10.4167L8.75033 12.5L13.3337 7.5" stroke="#8A38F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "confirmed":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13.3337 1.66675V5.00008M6.66699 1.66675V5.00008" stroke="#009207" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.5 10.8333V9.99992C17.5 6.85722 17.5 5.28588 16.5237 4.30956C15.5474 3.33325 13.976 3.33325 10.8333 3.33325H9.16667C6.02397 3.33325 4.45262 3.33325 3.47631 4.30956C2.5 5.28588 2.5 6.85722 2.5 9.99992V11.6666C2.5 14.8093 2.5 16.3807 3.47631 17.3569C4.45262 18.3333 6.02397 18.3333 9.16667 18.3333" stroke="#009207" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.5 8.33325H17.5" stroke="#009207" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.833 16.2499C10.833 16.2499 11.9568 16.6722 12.4997 18.3333C12.4997 18.3333 15.1468 14.1666 17.4997 13.3333" stroke="#009207" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "started":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15.7425 10.705C15.4479 11.8242 14.0559 12.615 11.2717 14.1968C8.58032 15.7258 7.23466 16.4903 6.15018 16.183C5.70183 16.0559 5.29332 15.8147 4.96386 15.4822C4.16699 14.6782 4.16699 13.1188 4.16699 10C4.16699 6.88117 4.16699 5.32175 4.96386 4.51777C5.29332 4.18538 5.70183 3.94407 6.15018 3.81702C7.23466 3.50971 8.58032 4.27423 11.2717 5.80328C14.0559 7.38498 15.4479 8.17583 15.7425 9.295C15.8641 9.757 15.8641 10.243 15.7425 10.705Z" stroke="#48CAE4" strokeWidth="1.0625" strokeLinejoin="round"/>
          </svg>
        );
      case "pending":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M11.3337 1.41663V4.24996M5.66699 1.41663V4.24996" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.875 8.50004C14.875 5.82875 14.875 4.49311 14.0451 3.66324C13.2153 2.83337 11.8796 2.83337 9.20833 2.83337H7.79167C5.12037 2.83337 3.78473 2.83337 2.95486 3.66324C2.125 4.49311 2.125 5.82875 2.125 8.50004V9.91671C2.125 12.588 2.125 13.9237 2.95486 14.7535C3.78473 15.5834 5.12037 15.5834 7.79167 15.5834" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.125 7.08337H14.875" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.9389 13.2466L12.0413 12.75V11.5223M14.8747 12.75C14.8747 14.3147 13.6061 15.5833 12.0413 15.5833C10.4766 15.5833 9.20801 14.3147 9.20801 12.75C9.20801 11.1852 10.4766 9.91663 12.0413 9.91663C13.6061 9.91663 14.8747 11.1852 14.8747 12.75Z" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M11.3337 1.41663V4.24996M5.66699 1.41663V4.24996" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.875 8.50004C14.875 5.82875 14.875 4.49311 14.0451 3.66324C13.2153 2.83337 11.8796 2.83337 9.20833 2.83337H7.79167C5.12037 2.83337 3.78473 2.83337 2.95486 3.66324C2.125 4.49311 2.125 5.82875 2.125 8.50004V9.91671C2.125 12.588 2.125 13.9237 2.95486 14.7535C3.78473 15.5834 5.12037 15.5834 7.79167 15.5834" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.125 7.08337H14.875" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.9389 13.2466L12.0413 12.75V11.5223M14.8747 12.75C14.8747 14.3147 13.6061 15.5833 12.0413 15.5833C10.4766 15.5833 9.20801 14.3147 9.20801 12.75C9.20801 11.1852 10.4766 9.91663 12.0413 9.91663C13.6061 9.91663 14.8747 11.1852 14.8747 12.75Z" stroke="black" strokeOpacity="0.25" strokeWidth="1.0625" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#EDE1FE";
      case "confirmed":
        return "#D9EFDA";
      case "started":
        return "#E4F7FB";
      case "pending":
        return "#0000000D";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "#0000000D";
    }
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
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
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
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColorForList(booking.status)}`}>
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
            <div className="">
              {/* Calendar Header - No white background */}
              <div className=" py-2">
                <div className="flex items-center justify-between mb-4">
                  {/* Date Navigation, Today, and Filters */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateDate("prev")}
                      className="p-2 border border-black/20 rounded-[5px] bg-white hover:bg-black transition-colors group"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-black group-hover:stroke-white"/>
                      </svg>
                    </button>
                    <h2 className="text-lg font-bold">
                      {formatDateForHeader(currentDate, calendarView)}
                    </h2>
                    <button
                      onClick={() => navigateDate("next")}
                      className="p-2 border border-black/20 rounded-[5px] bg-white hover:bg-black transition-colors group"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-black group-hover:stroke-white"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => navigateDate("today")}
                      className="px-4 py-2.5 text-xs font-medium text-left border border-black/20 rounded-[5px] bg-white hover:bg-black hover:text-white transition-colors focus:outline-none cursor-pointer"
                    >
                      Today
                    </button>
                    {/* Team Select with Custom Arrow */}
                    <div className="relative group">
                      <select
                        value={filters.team}
                        onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                        className="appearance-none px-4 py-2.5 pr-10 text-xs font-medium text-left border border-black/20 rounded-[5px] bg-white hover:bg-black hover:text-white transition-colors focus:outline-none cursor-pointer"
                      >
                        <option value="all">Team: All Team</option>
                        {staffMembers.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            Team: {staff.name}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none stroke-black group-hover:stroke-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {/* Status Select with Custom Arrow */}
                    <div className="relative group">
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="appearance-none px-4 py-2.5 pr-10 text-xs font-medium text-left border border-black/20 rounded-[5px] bg-white hover:bg-black hover:text-white transition-colors focus:outline-none cursor-pointer"
                      >
                        <option value="all">Status: All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="started">Started</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none stroke-black group-hover:stroke-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white text-xs rounded-lg p-1">
                      <button
                        onClick={() => setCalendarView("day")}
                        className={`cursor-pointer px-4 py-1.5 rounded transition-colors ${
                          calendarView === "day"
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setCalendarView("week")}
                        className={`cursor-pointer px-4 py-1.5 rounded transition-colors ${
                          calendarView === "week"
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setCalendarView("month")}
                        className={`cursor-pointer px-4 py-1.5 rounded transition-colors ${
                          calendarView === "month"
                            ? "bg-primary/10 text-primary"
                            : ""
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              <div className="bg-white relative">
                {calendarView === "day" && (() => {
                  const hasOpeningHours = getOpeningHoursForDay(currentDate) !== null;
                  
                  if (!hasOpeningHours && !isLoadingOpeningHours) {
                    return (
                      <div className="p-8 text-center">
                        <div className="text-gray-500 text-sm mb-2">Branch is closed on this day</div>
                        <div className="text-gray-400 text-xs">No opening hours defined for {currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                      </div>
                    );
                  }
                  
                  const filteredStaff = getFilteredStaffForDate(currentDate);
                  const filteredStaffLength = filteredStaff.length;
                  const maxScrollIndex = Math.max(0, filteredStaffLength - 3);
                  
                  return (
                    <div className="">
                      {/* Staff Navigation Arrows */}
                      {filteredStaffLength > 3 && (
                        <>
                          <button
                            onClick={() => setStaffScrollIndex(Math.max(0, staffScrollIndex - 1))}
                            disabled={staffScrollIndex === 0}
                            className={`absolute left-0 top-[35px] p-2 cursor-pointer z-20 rounded-[5px] ${
                              staffScrollIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setStaffScrollIndex(Math.min(maxScrollIndex, staffScrollIndex + 1))}
                            disabled={staffScrollIndex >= maxScrollIndex}
                            className={`absolute right-0 top-[35px] p-2 cursor-pointer z-20 rounded-[5px]  ${
                              staffScrollIndex >= maxScrollIndex ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </>
                      )}

                      <div className="overflow-x-auto">
                        <div className="flex min-w-full">
                          {/* Time Column */}
                          <div className="w-10 shrink-0 border-r border-gray-200">
                            <div className="h-[105px] border-b border-gray-200 bg-transparent"></div>
                            {getTimeSlots().map((time, idx) => (
                              <div
                                key={idx}
                                className="h-24 border-b border-gray-100 p-1.5 pt-1"
                              >
                                <span className="text-[9px] font-semibold text-black/60">{time.display}</span>
                              </div>
                            ))}
                          </div>

                          {/* Staff Columns - Show only 3 at a time */}
                          <div className="flex-1 flex relative">
                            {filteredStaff.slice(staffScrollIndex, staffScrollIndex + 3).map((staff) => {
                              const dayBookings = getBookingsForSlot(currentDate, staff.id);
                              return (
                                <div key={staff.id} className="flex-1 border-r border-gray-200 last:border-r-0">
                                  {/* Staff Header */}
                                  <div 
                                    onClick={() => {
                                      setSelectedStaffId(staff.id);
                                    }}
                                    className={`border-b border-gray-200 p-3 flex flex-col items-center justify-center h-[105px] cursor-pointer transition-colors ${
                                      selectedStaffId === staff.id ? 'bg-primary/10' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    {staff.avatar ? (
                                      <div
                                        className="w-12 h-12 rounded-full mb-2 flex items-center justify-center overflow-hidden"
                                        style={{ 
                                          border: `3px solid ${staff.calendarColor || "#9CA3AF"}`,
                                        }}
                                      >
                                        <img
                                          src={staff.avatar}
                                          alt={staff.name}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-base font-semibold text-white mb-2"
                                        style={{ 
                                          backgroundColor: staff.calendarColor || "#9CA3AF",
                                          border: `3px solid ${staff.calendarColor || "#9CA3AF"}`
                                        }}
                                      >
                                        {staff.name.charAt(0)}
                                      </div>
                                    )}
                                    <span className="text-xs font-medium text-black/80">{staff.name}</span>
                                  </div>

                                  {/* Time Slots */}
                                  <div className="relative">
                                    {getTimeSlots().map((timeSlot, slotIdx) => {
                                      const slotStart = new Date(currentDate);
                                      slotStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
                                      const slotEnd = new Date(slotStart);
                                      slotEnd.setMinutes(slotEnd.getMinutes() + 60); // 1 hour = 60 minutes

                                      const slotBookings = dayBookings.filter((booking) => {
                                        const bookingStart = new Date(booking.scheduledOn);
                                        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
                                        // Only include booking in the slot where it starts
                                        // This prevents duplicate bookings when they span multiple slots
                                        return bookingStart >= slotStart && bookingStart < slotEnd;
                                      });

                                      const slotStartMinutes = timeSlot.totalMinutes;
                                      
                                      // Get occupied time ranges in this slot
                                      // Include all bookings that intersect with this slot (not just those that start here)
                                      // This ensures 15-minute slots are correctly marked as occupied even if booking extends from previous slot
                                      const occupiedRanges: Array<{ start: number; end: number }> = [];
                                      dayBookings.forEach((booking) => {
                                        const bookingStart = new Date(booking.scheduledOn);
                                        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
                                        // Check if booking intersects with this slot
                                        const intersects = (
                                          (bookingStart >= slotStart && bookingStart < slotEnd) ||
                                          (bookingEnd > slotStart && bookingEnd <= slotEnd) ||
                                          (bookingStart <= slotStart && bookingEnd >= slotEnd)
                                        );
                                        if (intersects) {
                                          const startMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
                                          const endMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
                                          occupiedRanges.push({ start: startMinutes, end: endMinutes });
                                        }
                                      });

                                      // Check if a 15-minute slot is occupied
                                      const isSlotOccupied = (slotMinutes: number): boolean => {
                                        return occupiedRanges.some(
                                          (range) => slotMinutes >= range.start && slotMinutes < range.end
                                        );
                                      };

                                      return (
                                        <div
                                          key={slotIdx}
                                          className="h-24 border-b border-gray-100 relative"
                                        >
                                          {slotBookings.map((booking, idx) => {
                                            const bookingStart = new Date(booking.scheduledOn);
                                            const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
                                            const startMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
                                            const endMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
                                            
                                            // Calculate position and height (based on 60-minute slots)
                                            const topPercent = ((startMinutes - slotStartMinutes) / 60) * 100;
                                            const heightPercent = ((endMinutes - startMinutes) / 60) * 100;
                                            
                                            return (
                                              <div
                                                key={booking.id}
                                                onClick={() => handleBookingClick(booking)}
                                                className="absolute left-1 right-1 p-[4px] cursor-pointer border"
                                                style={{
                                                  top: `${Math.max(0, topPercent)}%`,
                                                  height: `${heightPercent}%`, // Allow height to exceed 100% to span multiple slots
                                                  zIndex: 10 + idx,
                                                  backgroundColor: getStatusColor(booking.status),
                                                  borderRadius: '3px',
                                                  borderColor: 'transparent',
                                                }}
                                              >
                                                <div className="h-full flex flex-col relative">
                                                  {/* Status Icon - Top Right */}
                                                  <div className="absolute top-0 right-0">
                                                    {getStatusIcon(booking.status)}
                                                  </div>
                                                  
                                                  {/* Content - Time and Service on left, Name on right */}
                                                  <div className="flex items-start gap-2 flex-1 pt-0.5">
                                                    {/* Time on the left */}
                                                    <div className="shrink-0">
                                                      <div className="text-[10px] font-medium text-gray-700 whitespace-nowrap">
                                                        {formatTime12Hour(bookingStart)} - {formatTime12Hour(bookingEnd)}
                                                      </div>
                                                      {booking.duration >= 30 && (
                                                        <div className="text-[10px] text-gray-600 truncate leading-tight mt-0.5">
                                                          {booking.service}
                                                        </div>
                                                      )}
                                                    </div>
                                                    
                                                    {/* Name and Service (if < 30 mins) on the right */}
                                                    <div className="flex-1 min-w-0">
                                                      <div className="text-xs font-bold text-gray-900 truncate leading-tight">
                                                        {booking.customer.name}
                                                        {booking.duration < 30 && (
                                                          <span className="text-[10px] font-normal text-gray-600 ml-1.5">
                                                            {booking.service}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          
                                          {/* 15-minute clickable slots for empty areas */}
                                          {get15MinuteSlots(timeSlot.hour).map((slot) => {
                                            const slotMinutes = slot.totalMinutes;
                                            const isOccupied = isSlotOccupied(slotMinutes);
                                            
                                            // Check if time is within opening hours
                                            const isWithinHours = isTimeWithinOpeningHours(currentDate, slot.hour, slot.minute);
                                            
                                            // Only show clickable slots if not occupied and within opening hours
                                            if (isOccupied || !isWithinHours) return null;
                                            
                                            const slotTopPercent = ((slotMinutes - slotStartMinutes) / 60) * 100;
                                            
                                            return (
                                              <div
                                                key={`slot-${slot.hour}-${slot.minute}`}
                                                onClick={() => {
                                                  if (canAddBooking) {
                                                    // Set date at midnight (time is stored separately)
                                                    const slotDate = new Date(currentDate);
                                                    slotDate.setHours(0, 0, 0, 0);
                                                    setSelectedBookingDate(slotDate);
                                                    
                                                    // Format time to match the format used in timeSlots
                                                    // formatMinutesToTime returns format like "2:30 pm" (lowercase, no leading zero for hours)
                                                    // We need to convert hour/minute to the same format
                                                    const totalMinutes = slot.hour * 60 + slot.minute;
                                                    const hours24 = Math.floor(totalMinutes / 60);
                                                    const mins = totalMinutes % 60;
                                                    const period = hours24 >= 12 ? "pm" : "am";
                                                    let hours12 = hours24 > 12 ? hours24 - 12 : hours24 === 0 ? 12 : hours24;
                                                    const formattedMins = mins.toString().padStart(2, "0");
                                                    const formattedTime = `${hours12}:${formattedMins} ${period}`;
                                                    
                                                    setSelectedBookingTime(formattedTime);
                                                    setSelectedStaffId(staff.id);
                                                    setIsBookingSidebarOpen(true);
                                                  }
                                                }}
                                                className={`absolute left-0 right-0 border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-all duration-200 ${
                                                  canAddBooking ? 'hover:bg-primary/10' : ''
                                                }`}
                                                style={{
                                                  top: `${slotTopPercent}%`,
                                                  height: `${(15 / 60) * 100}%`, // 15 minutes = 25% of 60 minutes
                                                  zIndex: 1,
                                                }}
                                                title={canAddBooking ? `Click to add booking at ${format15MinTime(slot.hour, slot.minute)}` : ''}
                                              >
                                                {/* Optional: show time label on hover */}
                                                <div className="h-full flex items-center px-2 opacity-0 hover:opacity-100 transition-opacity">
                                                  <span className="text-[9px] font-semibold text-primary">
                                                    {format15MinTime(slot.hour, slot.minute)}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {calendarView === "week" && (
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Header Row */}
                      <div className="flex border-b border-gray-200">
                        <div className="w-48 flex-shrink-0 border-r border-gray-200 p-4">
                          <span className="text-sm font-semibold text-gray-900">Team Members</span>
                        </div>
                        <div className="flex-1 flex">
                          {getWeekDays().map((day, idx) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            return (
                              <div
                                key={idx}
                                className={`flex-1 border-r border-gray-200 last:border-r-0 p-4 text-center ${
                                  isToday ? "bg-primary/5" : ""
                                }`}
                              >
                                <div className="text-xs text-gray-600 mb-1">
                                  {day.toLocaleDateString("en-GB", { weekday: "short" })}
                                </div>
                                <div className={`text-sm font-semibold ${isToday ? "text-primary" : "text-gray-900"}`}>
                                  {day.getDate()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Staff Rows */}
                      {getFilteredStaffForDates(getWeekDays()).map((staff) => (
                        <div key={staff.id} className="flex border-b border-gray-200 min-h-[200px]">
                          <div className="w-48 flex-shrink-0 border-r border-gray-200 p-4">
                            <div className="flex items-center gap-3">
                              {staff.avatar ? (
                                <img
                                  src={staff.avatar}
                                  alt={staff.name}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                                  style={{ backgroundColor: staff.calendarColor || "#9CA3AF" }}
                                >
                                  {staff.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                            </div>
                          </div>
                          <div className="flex-1 flex relative">
                            {getWeekDays().map((day, dayIdx) => {
                              // Only show bookings if staff works on this day
                              if (!doesStaffWorkOnDay(staff, day)) {
                                return (
                                  <div
                                    key={dayIdx}
                                    className="flex-1 border-r border-gray-200 last:border-r-0 p-2 relative bg-gray-50"
                                  >
                                    <div className="text-xs text-gray-400 text-center mt-2">Not working</div>
                                  </div>
                                );
                              }
                              const dayBookings = getBookingsForSlot(day, staff.id);
                              const hasOpeningHours = getOpeningHoursForDay(day) !== null;
                              const isClickable = canAddBooking && hasOpeningHours;

                              return (
                                <div
                                  key={dayIdx}
                                  onClick={(e) => {
                                    // Only open booking modal if clicking on empty space (not on a booking) and day has opening hours
                                    const target = e.target as HTMLElement;
                                    const isBookingClick = target.closest('[data-booking-item]') !== null;
                                    if (isClickable && !isBookingClick) {
                                      const clickedDate = new Date(day);
                                      clickedDate.setHours(0, 0, 0, 0);
                                      setSelectedBookingDate(clickedDate);
                                      setSelectedBookingTime(null);
                                      setSelectedStaffId(staff.id);
                                      setIsBookingSidebarOpen(true);
                                    }
                                  }}
                                  className={`flex-1 border-r border-gray-200 last:border-r-0 p-2 relative ${
                                    !hasOpeningHours ? "bg-gray-100 opacity-50" : ""
                                  } ${isClickable ? "cursor-pointer hover:bg-gray-50/50" : ""}`}
                                  title={!hasOpeningHours ? "Branch is closed on this day" : ""}
                                >
                                  <div className="space-y-2">
                                    {dayBookings.map((booking) => {
                                      const bookingStart = new Date(booking.scheduledOn);
                                      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
                                      return (
                                        <div
                                          key={booking.id}
                                          data-booking-item
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleBookingClick(booking);
                                          }}
                                          className="p-2 border cursor-pointer relative"
                                          style={{
                                            backgroundColor: getStatusColor(booking.status),
                                            borderRadius: '3px',
                                            borderColor: 'transparent',
                                          }}
                                        >
                                          {/* Status Icon - Top Right */}
                                          <div className="absolute top-1.5 right-1.5">
                                            {getStatusIcon(booking.status)}
                                          </div>
                                          
                                          {/* Content - Time and Service on left, Name on right */}
                                          <div className="flex items-start gap-2 pr-6">
                                            {/* Time on the left */}
                                            <div className="shrink-0">
                                              <div className="text-[10px] font-medium text-gray-700 whitespace-nowrap">
                                                {formatTime12Hour(bookingStart)} - {formatTime12Hour(bookingEnd)}
                                              </div>
                                              {booking.duration >= 30 && (
                                                <div className="text-[10px] text-gray-600 truncate leading-tight mt-0.5">
                                                  {booking.service}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Name and Service (if < 30 mins) on the right */}
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-bold text-gray-900 truncate leading-tight">
                                                {booking.customer.name}
                                                {booking.duration < 30 && (
                                                  <span className="text-[10px] font-normal text-gray-600 ml-1.5">
                                                    {booking.service}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
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

                {calendarView === "month" && (
                  <div>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day} className="p-3 text-center text-xs font-semibold text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                      {getMonthDays().map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayBookings = getBookingsForSlot(day);
                        const visibleBookings = dayBookings.slice(0, 3);
                        const moreCount = dayBookings.length - 3;

                        const hasOpeningHours = getOpeningHoursForDay(day) !== null;
                        const isClickable = canAddBooking && hasOpeningHours && isCurrentMonth;

                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              // Only open booking modal if clicking on empty space (not on a booking) and day has opening hours
                              const target = e.target as HTMLElement;
                              const isBookingClick = target.closest('[data-booking-item]') !== null;
                              if (isClickable && !isBookingClick) {
                                const clickedDate = new Date(day);
                                clickedDate.setHours(0, 0, 0, 0);
                                setSelectedBookingDate(clickedDate);
                                setSelectedBookingTime(null);
                                setSelectedStaffId(null); // Clear staff ID for month view as there's no specific staff context
                                setIsBookingSidebarOpen(true);
                              }
                            }}
                            className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                              !isCurrentMonth ? "bg-gray-50" : ""
                            } ${isToday ? "bg-primary/5" : ""} ${
                              !hasOpeningHours && isCurrentMonth ? "bg-gray-100 opacity-50" : ""
                            } ${isClickable ? "cursor-pointer hover:bg-gray-50/50" : ""}`}
                            title={!hasOpeningHours && isCurrentMonth ? "Branch is closed on this day" : ""}
                          >
                            <div className={`text-sm font-semibold mb-1 ${isCurrentMonth ? "text-gray-900" : "text-gray-400"} ${isToday ? "text-primary" : ""}`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1">
                              {visibleBookings.map((booking) => {
                                const bookingStart = new Date(booking.scheduledOn);
                                const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
                                return (
                                  <div
                                    key={booking.id}
                                    data-booking-item
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBookingClick(booking);
                                    }}
                                    className="p-1.5 text-[10px] cursor-pointer border relative"
                                    style={{
                                      backgroundColor: getStatusColor(booking.status),
                                      borderRadius: '3px',
                                      borderColor: 'transparent',
                                    }}
                                  >
                                    {/* Status Icon - Top Right */}
                                    <div className="absolute top-1 right-1">
                                      {getStatusIcon(booking.status)}
                                    </div>
                                    
                                    {/* Content - Time and Service on left, Name on right */}
                                    <div className="flex items-start gap-1.5 pr-5">
                                      {/* Time on the left */}
                                      <div className="shrink-0">
                                        <div className="text-[9px] font-medium text-gray-700 whitespace-nowrap">
                                          {formatTime12Hour(bookingStart)} - {formatTime12Hour(bookingEnd)}
                                        </div>
                                        {booking.duration >= 30 && (
                                          <div className="text-[9px] text-gray-600 truncate leading-tight">
                                            {booking.service}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Name and Service (if < 30 mins) on the right */}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-gray-900 truncate leading-tight">
                                          {booking.customer.name}
                                          {booking.duration < 30 && (
                                            <span className="text-[9px] font-normal text-gray-600 ml-1.5">
                                              {booking.service}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {moreCount > 0 && (
                                <div className="text-[10px] text-gray-500 font-medium pl-1">
                                  + {moreCount} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
           
            <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>

          <div className="space-y-3">
              {!Array.isArray(pendingBookings) || pendingBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No pending bookings</p>
            ) : (
                pendingBookings.map((booking) => {
                  const bookingDate = booking.date ? new Date(booking.date) : null;
                  
                  let startTime = "N/A";
                  let endTime = "N/A";
                  if (bookingDate) {
                    const startHours = bookingDate.getHours();
                    const startMinutes = bookingDate.getMinutes();
                    
                    const totalDuration = booking.services?.reduce((total: number, service: any) => {
                      const serviceDuration = service.duration || service.duration_minutes || 30; // Default 30 min if not provided
                      return total + serviceDuration;
                    }, 0) || 30;
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
                  
                  const customerName = booking.customer 
                    ? `${booking.customer.first_name || ""} ${booking.customer.last_name || ""}`.trim() || booking.customer.name
                    : `Customer #${booking.customer_id}`;
                  
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
                            className="px-4 py-2 text-xs font-medium rounded-[5px] border border-black bg-white text-black hover:bg-black hover:text-white transition-colors cursor-pointer focus:outline-none"
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
          initialDate={selectedBookingDate || undefined}
          initialTime={selectedBookingTime || undefined}
          selectedStaffId={selectedStaffId}
          onClose={() => {
            setIsBookingSidebarOpen(false);
            setSelectedBookingDate(null);
            setSelectedBookingTime(null);
            setSelectedStaffId(null);
          }}
          onSave={(customerName: string) => {
            fetchBookings();
            fetchAllBookingsForCalendar();
            setIsBookingSidebarOpen(false);
            setSelectedBookingDate(null);
            setSelectedBookingTime(null);
            setSelectedStaffId(null);
            setSuccessMessage(`${customerName} was added to the bookings.`);
            setShowSuccessNotification(true);
            // Auto-hide notification after 3 seconds
            setTimeout(() => {
              setShowSuccessNotification(false);
            }, 3000);
          }}
        />
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
          <div className="bg-[#E0F7E9] border border-[#4CAF50]/20 rounded-lg px-6 py-3 shadow-lg flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0 w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1B5E20]">{successMessage}</p>
          </div>
        </div>
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
  const [status, setStatus] = useState<"Pending" | "Confirmed" | "Started" | "Completed" | "Cancelled" | "No Show">(booking.status as any || "Pending");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [isDeclinePopupOpen, setIsDeclinePopupOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const customerMenuRef = useRef<HTMLDivElement>(null);

  // Parse scheduled date
  const scheduledDate = booking.scheduledOn ? new Date(booking.scheduledOn) : new Date();
  const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Extract customer email if available (from booking data structure)
  const customerEmail = (booking as any).customer?.email || "";

  // Get services from booking - if it's an array, use it; otherwise create array from single service
  const bookingServices = (booking as any).services || [{
    id: booking.id,
    name: booking.service,
    duration: booking.duration,
    price: (booking as any).price || 0,
    staff_id: booking.staff.id,
    staff: booking.staff
  }];

  const totalPrice = bookingServices.reduce((sum: number, service: any) => sum + (service.price || 0), 0);
  const totalDuration = bookingServices.reduce((sum: number, service: any) => sum + (service.duration || 0), 0);
  const paymentMethod = (booking as any).payment || "Credit Card";

  // Status options with icons
  const statusOptions = [
    { 
      value: "Pending", 
      label: "Pending", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
        </svg>
      )
    },
    { 
      value: "Confirmed", 
      label: "Confirmed", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    { 
      value: "Started", 
      label: "Started", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      )
    },
    { 
      value: "Completed", 
      label: "Completed", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    { 
      value: "Cancelled", 
      label: "Cancelled", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6m0-6l6 6" />
        </svg>
      )
    },
    { 
      value: "No Show", 
      label: "No Show", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9l-12 12" />
          <circle cx="18" cy="9" r="3" strokeWidth={2} />
        </svg>
      )
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (customerMenuRef.current && !customerMenuRef.current.contains(event.target as Node)) {
        setIsCustomerMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as any);
    setIsStatusDropdownOpen(false);
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      return;
    }

    setIsDeclining(true);
    try {
      await axiosClient.post("/bookings/decline", {
        booking_id: booking.id,
        reason: declineReason,
      });
      setIsDeclinePopupOpen(false);
      setDeclineReason("");
      onSave(); // Refresh bookings
      onClose(); // Close sidebar
    } catch (error) {
      console.error("Error declining booking:", error);
      alert("Failed to decline booking. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await axiosClient.put(`/bookings/${booking.id}`, {
        status: status,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentStatusOption = statusOptions.find(opt => opt.value === status) || statusOptions[0];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* Sidebar */}
        <div className="flex flex-col relative w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Date and Time */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
              <span className="text-sm text-gray-600">{formattedTime}</span>
            </div>

            {/* Status Selector */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="px-3 py-1.5 bg-gray-100 rounded-full flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <span>{currentStatusOption.label}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Status Dropdown */}
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusChange(option.value)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 text-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </div>
                      {status === option.value && (
                        <div className="w-4 h-4 rounded-full bg-[#7B2CBF]"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {/* Customer Card */}
            <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Customer Avatar */}
                {booking.customer.avatar ? (
                  <img 
                    src={booking.customer.avatar} 
                    alt={booking.customer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {getInitials(booking.customer.name)}
                    </span>
                  </div>
                )}
                
                {/* Customer Info */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{booking.customer.name}</h3>
                  {customerEmail && (
                    <p className="text-sm text-gray-500">{customerEmail}</p>
                  )}
                </div>
              </div>

              {/* Three Dots Menu */}
              <div className="relative" ref={customerMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCustomerMenuOpen(!isCustomerMenuOpen)}
                  className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 hover:bg-black transition-colors group"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>

                {/* Customer Dropdown Menu */}
                {isCustomerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerMenuOpen(false);
                        // TODO: Implement view details
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 first:rounded-t-lg"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerMenuOpen(false);
                        // TODO: Implement edit customer
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 last:rounded-b-lg border-t border-gray-100"
                    >
                      Edit Customer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Services Section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Services</h3>
              <div className="space-y-4">
                {bookingServices.map((service: any, index: number) => {
                  const serviceStartTime = new Date(scheduledDate);
                  let cumulativeMinutes = 0;
                  for (let i = 0; i < index; i++) {
                    cumulativeMinutes += bookingServices[i].duration || 0;
                  }
                  serviceStartTime.setMinutes(serviceStartTime.getMinutes() + cumulativeMinutes);
                  const serviceTime = serviceStartTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });

                  return (
                    <div key={service.id || index} className="bg-white rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{service.name || booking.service}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {serviceTime} • {service.duration || booking.duration} min
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ${(service.price || 0).toFixed(2)}
                        </span>
                      </div>
                      {/* Staff Selector */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          {service.staff?.avatar ? (
                            <img 
                              src={service.staff.avatar} 
                              alt={service.staff.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {getInitials(service.staff?.name || booking.staff.name)}
                              </span>
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-700 flex-1">
                            {service.staff?.name || booking.staff.name}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Duration */}
              <div className="mt-4 text-right">
                <span className="text-sm text-gray-600">
                  {totalDuration >= 60 
                    ? `${Math.floor(totalDuration / 60)} hour${Math.floor(totalDuration / 60) !== 1 ? 's' : ''}${totalDuration % 60 > 0 ? ` ${totalDuration % 60} min` : ''}`
                    : `${totalDuration} min`
                  }
                </span>
              </div>

              {/* Add Service Button */}
              <button
                type="button"
                className="mt-4 w-full py-3 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200">
            {/* Total */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-xs text-gray-400 ml-2">(Paid - {paymentMethod})</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeclinePopupOpen(true)}
                className="flex-1 py-2.5 bg-white border border-red-500 text-red-500 rounded-lg font-medium text-sm hover:border-primary hover:text-primary transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-[#6B21B8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Popup */}
      {isDeclinePopupOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Decline Booking</h2>
              <button
                onClick={() => {
                  setIsDeclinePopupOpen(false);
                  setDeclineReason("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to decline booking?</p>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Enter Reason</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Add your reason here"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsDeclinePopupOpen(false);
                  setDeclineReason("");
                }}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-[10px] font-medium text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={!declineReason.trim() || isDeclining}
                className="flex-1 py-2.5 bg-primary text-white rounded-[10px] font-medium text-xs hover:bg-[#6B21B8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeclining ? "Declining..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add Booking Sidebar Component
function AddBookingSidebar({
  onClose,
  onSave,
  initialDate,
  initialTime,
  selectedStaffId,
}: {
  onClose: () => void;
  onSave: (customerName: string) => void;
  initialDate?: Date;
  initialTime?: string;
  selectedStaffId?: string | null;
}) {
  const { currentBranch } = useBranch();
  const [currentStep, setCurrentStep] = useState(1); // Always start at step 1
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || "");
  const [selectedServices, setSelectedServices] = useState<Array<{ id: string; name: string; duration: number; price: number; teamMember?: string }>>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openTeamMemberDropdown, setOpenTeamMemberDropdown] = useState<string | null>(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [branchOpeningHours, setBranchOpeningHours] = useState<any>(null);
  const [isLoadingOpeningHours, setIsLoadingOpeningHours] = useState(false);
  const [services, setServices] = useState<Array<{ id: string; name: string; duration: number; price: number; category: string; staff?: Array<{ id: string | number; name: string; avatar?: string }> }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email: string; avatar?: string }>>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [visibleCustomersCount, setVisibleCustomersCount] = useState(8); // Show 8 customers initially
  const customerListRef = useRef<HTMLDivElement>(null);
  const lastFetchedKey = useRef<string>(""); // Track last fetched date+time+branch to prevent duplicate calls
  const isFetchingRef = useRef<boolean>(false); // Track if we're currently fetching to prevent concurrent calls
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  useEffect(() => {
    // Trigger animation after mount - small delay to ensure initial state renders
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Set initial date and time from props
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialTime) {
      setSelectedTime(initialTime);
    }
  }, [initialDate, initialTime]);

  // Reset selected time when date changes (if the new date has different opening hours)
  // Also reset services and fetch key when date changes
  useEffect(() => {
    if (currentStep === 2 && !initialDate) {
      setSelectedTime(""); // Reset time when date changes, unless we have an initial date
    }
  }, [selectedDate, currentStep, initialDate]);


  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match the transition duration
  };

  const steps = ["Customer", "Booking Details", "Services", "Summary"];

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    if (!currentBranch?.id) {
      console.log("No branch ID available, skipping customers fetch");
      return;
    }

    setIsLoadingCustomers(true);
    try {
      // Note: branch_id will be automatically added by axios interceptor
      const response = await axiosClient.get("/customers/get");
      
      // Parse response structure - adjust based on actual API response
      const customersData = response.data?.data?.customers || response.data?.customers || response.data?.data || [];
      
      // Transform API response to match our format
      const transformedCustomers: Array<{ id: string; name: string; email: string; avatar?: string }> = customersData.map((customer: any) => {
        // Extract name from first_name and last_name, or use name field
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';
        const fullName = customer.name || `${firstName} ${lastName}`.trim() || 'Customer';
        
        // Extract email
        const email = customer.email || '';
        
        // Extract avatar from image object or generate initials
        const avatarUrl = customer.image?.image || customer.image?.thumb || customer.avatar || null;
        const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'CU';
        
        return {
          id: String(customer.id),
          name: fullName,
          email: email,
          avatar: avatarUrl || initials,
        };
      });
      
      setCustomers(transformedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [currentBranch?.id]);

  // Fetch customers when step 1 is reached or when branch changes
  useEffect(() => {
    if (currentStep === 1 && currentBranch?.id && customers.length === 0 && !isLoadingCustomers) {
      fetchCustomers();
    }
  }, [currentStep, currentBranch?.id, customers.length, isLoadingCustomers, fetchCustomers]);

  // Initialize intl-tel-input for phone number input
  useEffect(() => {
    if (phoneInputRef.current && isAddingNewCustomer && currentStep === 2) {
      if (!itiRef.current) {
        itiRef.current = intlTelInput(phoneInputRef.current, {
          initialCountry: "lb",
          utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
        } as any);

        // Listen for phone number input
        phoneInputRef.current.addEventListener('input', () => {
          if (phoneInputRef.current && itiRef.current) {
            setNewCustomer(prev => ({
              ...prev,
              phone: phoneInputRef.current?.value || "",
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
  }, [isAddingNewCustomer, currentStep]);

  // Convert 12-hour time format to 24-hour format for API
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return "";
    
    const parts = time12h.trim().split(" ");
    const period = parts[parts.length - 1].toLowerCase(); // Get am/pm
    const timePart = parts.slice(0, -1).join(" "); // Get time part
    const [hours, minutes] = timePart.split(":").map(Number);
    
    let hours24 = hours;
    if (period === "pm" && hours !== 12) {
      hours24 = hours + 12;
    } else if (period === "am" && hours === 12) {
      hours24 = 0;
    }
    
    return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Format date as YYYY-MM-DD for API
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch services from API with available staff members based on date and time
  const fetchServices = useCallback(async () => {
    if (!currentBranch?.id || !selectedDate || !selectedTime) {
      console.log("Missing required data for fetching services: branch_id, date, or time");
      return;
    }
    
    // Create a unique key for this fetch request
    const dateStr = formatDateForAPI(selectedDate);
    const timeStr = convertTo24Hour(selectedTime);
    const fetchKey = `${currentBranch.id}-${dateStr}-${timeStr}-${selectedStaffId || 'all'}`;
    
    // Prevent duplicate calls for the same date/time/staff or if already fetching
    if (lastFetchedKey.current === fetchKey || isFetchingRef.current) {
      return;
    }
    
    lastFetchedKey.current = fetchKey;
    isFetchingRef.current = true;
    setIsLoadingServices(true);
    
    try {
      // Note: branch_id will be automatically added by axios interceptor
      const params: { date: string; time: string; staff_id?: string } = { 
        date: dateStr,
        time: timeStr,
      };
      
      // Add staff_id if a staff member is selected
      if (selectedStaffId) {
        params.staff_id = selectedStaffId;
      }
      
      const response = await axiosClient.get("/services/get-services-available-staff", {
        params,
      });
      
      const servicesData = response.data?.data?.services || response.data?.services || {};
      
      // Transform API response to match our format
      const transformedServices: Array<{ 
        id: string; 
        name: string; 
        duration: number; 
        price: number; 
        category: string;
        staff?: Array<{ id: string | number; name: string; avatar?: string }>;
      }> = [];
      
      // Iterate through each category (e.g., "Hair", "Body")
      Object.keys(servicesData).forEach((categoryName) => {
        const categoryServices = servicesData[categoryName] || [];
        categoryServices.forEach((service: any) => {
          // Extract staff members if available
          const staffMembers = service.staff || service.staff_members || service.available_staff || [];
          const transformedStaff = staffMembers.map((staff: any) => {
            const firstName = staff.first_name || '';
            const lastName = staff.last_name || '';
            const fullName =
              staff.name ||
              staff.full_name ||
              `${firstName} ${lastName}`.trim() ||
              'Staff Member';

            // Prefer image URLs from image.image or image.thumb, then fall back to any avatar field
            const avatarUrl =
              staff.image?.image ||
              staff.image?.thumb ||
              staff.avatar ||
              null;

            const initials =
              fullName
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2) || 'SM';

            return {
              id: staff.id || staff.staff_id,
              name: fullName,
              avatar: avatarUrl || initials,
            };
          });
          
          transformedServices.push({
            id: String(service.id),
            name: service.label || service.name || "Service",
            duration: service.duration || service.duration_minutes || 30,
            price: parseFloat(service.price || service.cost || 0),
            category: categoryName,
            staff: transformedStaff.length > 0 ? transformedStaff : undefined,
          });
        });
      });
      
      setServices(transformedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      lastFetchedKey.current = ""; // Reset on error to allow retry
    } finally {
      setIsLoadingServices(false);
      isFetchingRef.current = false;
    }
  }, [currentBranch?.id, selectedDate, selectedTime, selectedStaffId]);

  // Fetch services when step 3 is reached and date/time are selected
  useEffect(() => {
    if (currentStep === 3) {
      fetchServices();
    }
  }, [currentStep, fetchServices]);

  // Fetch branch opening hours
  const fetchBranchOpeningHours = useCallback(async () => {
    if (!currentBranch?.id) {
      console.log("No branch ID available, skipping opening hours fetch");
      return;
    }
    
    setIsLoadingOpeningHours(true);
    try {
      // Note: branch_id will be automatically added by axios interceptor
      const response = await axiosClient.get("/branch/get");
      
      const branchData = response.data?.data?.branch || response.data?.branch || response.data?.data || response.data;
      const openingHours = branchData?.opening_hours;
      
      if (openingHours) {
        setBranchOpeningHours(openingHours);
      } else {
        console.log("No opening hours found in branch data");
        setBranchOpeningHours(null);
      }
    } catch (error: any) {
      // Silently handle errors - opening hours are optional
      // Only log if it's not a 404 or similar expected error
      if (error?.response?.status !== 404) {
        console.warn("Could not fetch branch opening hours:", error?.response?.status || error?.message || "Unknown error");
      }
      setBranchOpeningHours(null);
    } finally {
      setIsLoadingOpeningHours(false);
    }
  }, [currentBranch?.id]);

  // Fetch branch opening hours when branch changes or when step 2 is reached
  useEffect(() => {
    // Only fetch when we have a branch and we're on step 2 (Booking Details)
    if (currentBranch?.id && currentStep === 2 && !branchOpeningHours && !isLoadingOpeningHours) {
      fetchBranchOpeningHours();
    }
  }, [currentBranch?.id, currentStep, branchOpeningHours, isLoadingOpeningHours, fetchBranchOpeningHours]);

  // Convert 24-hour time to 12-hour format
  const convert24To12Hour = (time24h: string): string => {
    if (!time24h) return "10:00 am";
    
    const time = time24h.trim().replace(/\s+/g, '');
    // Check if already in 12-hour format
    if (/^\d{1,2}:\d{2}(am|pm)$/i.test(time)) {
      const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
      if (match) {
        return `${match[1]}:${match[2]} ${match[3].toLowerCase()}`;
      }
      return time;
    }
    
    // Parse 24-hour format
    const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      
      if (isNaN(hours) || hours < 0 || hours > 23) {
        return "10:00 am";
      }
      
      const period = hours >= 12 ? "pm" : "am";
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      
      return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
    }
    
    return "10:00 am";
  };

  // Get opening hours for a specific day
  const getOpeningHoursForDay = (date: Date): { startTime: string; endTime: string } | null => {
    if (!branchOpeningHours) return null;
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to Monday-first format (0 = Monday, 6 = Sunday)
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const dayNameToIndex: { [key: string]: number } = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
      mon: 0,
      tue: 1,
      wed: 2,
      thu: 3,
      fri: 4,
      sat: 5,
      sun: 6,
    };

    let entries: any[] = [];
    if (Array.isArray(branchOpeningHours)) {
      entries = branchOpeningHours;
    } else if (typeof branchOpeningHours === 'object') {
      entries = Object.values(branchOpeningHours);
    } else {
      return null;
    }

    // Find matching day entry
    for (const entry of entries) {
      if (!entry || !entry.day || !entry.from || !entry.to) continue;
      
      const dayStr = entry.day.trim().toLowerCase();
      
      // Check if it's a range
      if (dayStr.includes("-") || dayStr.includes("to")) {
        const rangeMatch = dayStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*[-to]+\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
        if (rangeMatch) {
          const startDay = rangeMatch[1].toLowerCase();
          const endDay = rangeMatch[2].toLowerCase();
          const startIndex = dayNameToIndex[startDay];
          const endIndex = dayNameToIndex[endDay];
          
          if (startIndex !== undefined && endIndex !== undefined && dayIndex >= startIndex && dayIndex <= endIndex) {
            return {
              startTime: convert24To12Hour(entry.from),
              endTime: convert24To12Hour(entry.to),
            };
          }
        }
      } else {
        // Single day
        const entryDayIndex = dayNameToIndex[dayStr];
        if (entryDayIndex === dayIndex) {
          return {
            startTime: convert24To12Hour(entry.from),
            endTime: convert24To12Hour(entry.to),
          };
        }
      }
    }
    
    return null;
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

  // Generate time slots based on opening hours for selected day
  const timeSlots = useMemo(() => {
    if (!branchOpeningHours) {
      return [];
    }

    const hours = getOpeningHoursForDay(selectedDate);
    
    if (!hours) {
      // If no opening hours for this day, return empty array (day is still selectable)
      return [];
    }

    const slots: string[] = [];
    const startMinutes = parseTimeToMinutes(hours.startTime);
    const endMinutes = parseTimeToMinutes(hours.endTime);
    
    // Generate slots in 15-minute intervals
    let currentMinutes = startMinutes;
    while (currentMinutes < endMinutes) {
      slots.push(formatMinutesToTime(currentMinutes));
      currentMinutes += 15;
    }
    
    return slots;
  }, [selectedDate, branchOpeningHours]);

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
        // If a staff member is selected from calendar, use that; otherwise use first staff member as default
        const teamMemberId = selectedStaffId || (service.staff && service.staff.length > 0 ? String(service.staff[0].id) : undefined);
        return [...prev, { 
          id: service.id, 
          name: service.name, 
          duration: service.duration, 
          price: typeof service.price === 'number' ? service.price : parseFloat(service.price || 0),
          teamMember: teamMemberId,
        }];
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
                setNewCustomer({ firstName: "", lastName: "", phone: "", email: "" });
                setCurrentStep(1); // Go back to customer selection
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
          <div className="flex items-center gap-2 text-xs">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navigate to step 2 with customer form
                    setIsAddingNewCustomer(true);
                    setCurrentStep(2);
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
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setVisibleCustomersCount(8); // Reset to 8 when search changes
                }}
              />

              {/* Customer List */}
              <div 
                ref={customerListRef}
                className="space-y-2 mt-4 overflow-y-auto"
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                  
                  // Load more when user scrolls within 100px of bottom
                  if (scrollBottom < 100) {
                    const filteredCustomers = customers.filter(c => 
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                      c.email.toLowerCase().includes(customerSearch.toLowerCase())
                    );
                    if (visibleCustomersCount < filteredCustomers.length) {
                      setVisibleCustomersCount(prev => Math.min(prev + 8, filteredCustomers.length));
                    }
                  }
                }}
              >
                {isLoadingCustomers ? (
                  <div className="text-xs text-black/50 py-8 text-center">Loading customers...</div>
                ) : (() => {
                  const filteredCustomers = customers.filter(c => 
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                    c.email.toLowerCase().includes(customerSearch.toLowerCase())
                  );
                  
                  if (filteredCustomers.length === 0) {
                    return <div className="text-xs text-black/50 py-8 text-center">No customers found</div>;
                  }
                  
                  const visibleCustomers = filteredCustomers.slice(0, visibleCustomersCount);
                  
                  return (
                    <>
                      {visibleCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCurrentStep(2);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white border border-transparent hover:border-black/10 transition-colors cursor-pointer"
                    >
                          {customer.avatar && typeof customer.avatar === 'string' && (customer.avatar.startsWith('http') || customer.avatar.startsWith('/')) ? (
                            <img 
                              src={customer.avatar} 
                              alt={customer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        {customer.avatar}
                      </div>
                          )}
                      <div className="flex-1 text-left">
                        <p className="text-xs font-semibold text-black">{customer.name}</p>
                        <p className="text-xs text-black/40">{customer.email}</p>
                      </div>
                    </button>
                  ))}
                    </>
                  );
                })()}
              </div>
            </div>
          )}


          {/* Step 2: Select Date & Time (with optional Customer Form above) */}
          {currentStep === 2 && (
            <div className="">
              <h3 className="text-base font-bold text-black mb-8">Select Date & Time</h3>
              
              {/* Customer Details Form - Show when adding new customer */}
              {isAddingNewCustomer && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-black/80 mb-4">Customer Details <span className="text-primary">*</span></h4>
                  
                  <div className="space-y-4">
                    {/* First Name */}
                    <div>
                      <label className="main-label black">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="main-label black">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="main-label black">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        placeholder="X XXX XXX"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="main-input"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="main-label black">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className="main-input"
                      />
                    </div>
                  </div>
                </div>
              )}
              
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
                {isLoadingOpeningHours ? (
                  <div className="text-xs text-black/50 py-4 text-center">Loading opening hours...</div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-xs text-black/50 py-4 text-center">
                    No opening hours defined for this day. Please contact the branch or select a different day.
                  </div>
                ) : (
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
                )}
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

              {/* Loading State */}
              {isLoadingServices ? (
                <div className="text-xs text-black/50 py-8 text-center">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="text-xs text-black/50 py-8 text-center">No services available</div>
              ) : (
                /* Services by Category */
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
                                  <span className="text-[13px] font-semibold text-black/80">${(typeof service.price === 'number' ? service.price : parseFloat(service.price || 0)).toFixed(2)}</span>
                                </div>

                                  <span className="text-xs font-medium text-black/40">{service.duration} min</span>

                                {isSelected && selectedStaffId && (() => {
                                  const serviceData = services.find(s => s.id === service.id);
                                  const availableStaff = serviceData?.staff || [];
                                  const selectedStaff = availableStaff.find(s => String(s.id) === String(selectedStaffId));
                                  return selectedStaff ? (
                                    <div className="mt-2 flex items-center gap-1 px-2 py-2 bg-[#F9F9F9] border border-black/10 rounded-lg">
                                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                                        <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                        <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="text-xs font-medium text-black">{selectedStaff.name}</span>
                                    </div>
                                  ) : null;
                                })()}

                                {isSelected && !selectedStaffId && (
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
                                        const serviceData = services.find(s => s.id === service.id);
                                        const availableStaff = serviceData?.staff || [];
                                        const firstStaffId = availableStaff.length > 0 ? String(availableStaff[0].id) : null;
                                        const teamMemberId = selectedService?.teamMember;
                                        
                                        // If no team member selected or it's the first staff member, show "Any Team Member"
                                        if (!teamMemberId || teamMemberId === firstStaffId) {
                                          return "Any Team Member";
                                        }
                                        
                                        const teamMember = serviceData?.staff?.find(tm => String(tm.id) === String(teamMemberId));
                                        return teamMember?.name || "Any Team Member";
                                      })()}</span>
                                      <Arrow direction={openTeamMemberDropdown === service.id ? "up" : "down"} opacity={1} className="w-4" />
                                    </button>
                                    {openTeamMemberDropdown === service.id && (() => {
                                      const serviceData = services.find(s => s.id === service.id);
                                      const availableStaff = serviceData?.staff || [];
                                      const allOptions = [
                                        { id: "any", name: "Any Team Member", avatar: null },
                                        ...availableStaff.map(s => ({ id: String(s.id), name: s.name, avatar: s.avatar }))
                                      ];
                                      
                                      return (
                                      <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute left-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[200px] overflow-y-auto"
                                      >
                                          {allOptions.map((member) => {
                                          const selectedService = selectedServices.find(s => s.id === service.id);
                                          const firstStaffId = availableStaff.length > 0 ? String(availableStaff[0].id) : null;
                                          const currentTeamMember = selectedService?.teamMember || firstStaffId || "any";
                                          // Check if selected is "any" (which is stored as first staff ID)
                                          const isAnySelected = !selectedService?.teamMember || selectedService?.teamMember === firstStaffId;
                                          const isSelected = member.id === "any" ? isAnySelected : (!isAnySelected && currentTeamMember === member.id);
                                          return (
                                            <button
                                              key={member.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const selectedTeamMemberId = member.id === "any" ? (firstStaffId || undefined) : member.id;
                                                setSelectedServices(prev => 
                                                  prev.map(s => 
                                                    s.id === service.id 
                                                      ? { ...s, teamMember: selectedTeamMemberId }
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
                                                member.avatar && typeof member.avatar === 'string' && (member.avatar.startsWith('http') || member.avatar.startsWith('/')) ? (
                                                  <img 
                                                    src={member.avatar} 
                                                    alt={member.name}
                                                    className="w-7 h-7 rounded-full object-cover"
                                                  />
                                              ) : (
                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                                    {member.name ? member.name.substring(0, 2).toUpperCase() : 'SM'}
                                                </div>
                                                )
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
                                      );
                                    })()}
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
              )}
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
                    const serviceData = services.find(s => s.id === service.id);
                    const availableStaff = serviceData?.staff || [];
                    const firstStaffId = availableStaff.length > 0 ? String(availableStaff[0].id) : null;
                    const teamMemberId = selectedStaffId || service.teamMember;
                    
                    // If a staff is selected from calendar, use that; otherwise check if no team member selected or it's the first staff member, treat as "Any Team Member"
                    const isAnySelected = !selectedStaffId && (!teamMemberId || teamMemberId === firstStaffId);
                    const teamMember = selectedStaffId
                      ? serviceData?.staff?.find(tm => String(tm.id) === String(selectedStaffId)) || { id: selectedStaffId, name: "Selected Staff" }
                      : isAnySelected
                      ? { id: "any", name: "Any Team Member" }
                      : serviceData?.staff?.find(tm => String(tm.id) === String(teamMemberId));
                    
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
                              {!selectedStaffId ? (
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
                                  {openTeamMemberDropdown === service.id && (() => {
                                  const serviceData = services.find(s => s.id === service.id);
                                  const availableStaff = serviceData?.staff || [];
                                  const firstStaffId = availableStaff.length > 0 ? String(availableStaff[0].id) : null;
                                  const selectedTeamMemberId = service.teamMember;
                                  
                                  // If a specific staff member is selected (not "any"), filter to show only that staff member
                                  const filteredStaff = selectedTeamMemberId && selectedTeamMemberId !== firstStaffId
                                    ? availableStaff.filter(s => String(s.id) === String(selectedTeamMemberId))
                                    : availableStaff;
                                  
                                  const allOptions = [
                                    { id: "any", name: "Any Team Member", avatar: null },
                                    ...filteredStaff.map(s => ({ id: String(s.id), name: s.name, avatar: s.avatar }))
                                  ];
                                  
                                  return (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[200px] overflow-y-auto"
                                  >
                                      {allOptions.map((member) => {
                                      const firstStaffId = availableStaff.length > 0 ? String(availableStaff[0].id) : null;
                                      const currentTeamMember = service.teamMember || firstStaffId || "any";
                                      // Check if selected is "any" (which is stored as first staff ID)
                                      const isAnySelected = !service.teamMember || service.teamMember === firstStaffId;
                                      const isSelected = member.id === "any" ? isAnySelected : (!isAnySelected && currentTeamMember === member.id);
                                      return (
                            <button
                                          key={member.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const selectedTeamMemberId = member.id === "any" ? (firstStaffId || undefined) : member.id;
                                            setSelectedServices(prev => 
                                              prev.map(s => 
                                                s.id === service.id 
                                                  ? { ...s, teamMember: selectedTeamMemberId }
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
                                                member.avatar && typeof member.avatar === 'string' && (member.avatar.startsWith('http') || member.avatar.startsWith('/')) ? (
                                                  <img 
                                                    src={member.avatar} 
                                                    alt={member.name}
                                                    className="w-7 h-7 rounded-full object-cover"
                                                  />
                                          ) : (
                                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                                    {member.name ? member.name.substring(0, 2).toUpperCase() : 'SM'}
                                            </div>
                                                )
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
                                  );
                                })()}
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center gap-1 px-2 py-2 bg-[#F9F9F9] border border-black/10 rounded-lg">
                                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                                    <circle opacity="0.1" cx="15" cy="15" r="15" fill="#7B2CBF"/>
                                    <path d="M20.4163 21.6665V19.9752C20.4163 18.9399 19.9503 17.9248 19.0083 17.4953C17.8593 16.9716 16.4813 16.6665 14.9997 16.6665C13.5181 16.6665 12.1401 16.9716 10.9911 17.4953C10.0491 17.9248 9.58301 18.9399 9.58301 19.9752V21.6665" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14.9997 14.1668C16.6105 14.1668 17.9163 12.861 17.9163 11.2502C17.9163 9.63933 16.6105 8.3335 14.9997 8.3335C13.3888 8.3335 12.083 9.63933 12.083 11.2502C12.083 12.861 13.3888 14.1668 14.9997 14.1668Z" stroke="#7B2CBF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span className="text-xs font-medium text-black">{teamMember?.name || "Any Team Member"}</span>
                                </div>
                              )}
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
                    setNewCustomer({ firstName: "", lastName: "", phone: "", email: "" });
                    setCurrentStep(1); // Go back to customer selection
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
                  // Handle Add New Customer form submission (when on step 2)
                  if (isAddingNewCustomer && currentStep === 2) {
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
                    
                    setIsCreatingCustomer(true);
                    try {
                      // Get full phone number with country code from intl-tel-input
                      let phoneNumber = newCustomer.phone;
                      if (itiRef.current && phoneInputRef.current) {
                        const fullNumber = itiRef.current.getNumber();
                        if (fullNumber) {
                          phoneNumber = fullNumber;
                        }
                      }
                      
                      // Call API to create customer
                      const response = await axiosClient.post('/customers/add', {
                        first_name: newCustomer.firstName,
                        last_name: newCustomer.lastName,
                        email: newCustomer.email,
                        phone_number: phoneNumber,
                      });
                      
                      // Get the created customer data from response - check multiple possible response structures
                      const createdCustomer = response.data?.data?.customer || 
                                             response.data?.data || 
                                             response.data?.customer || 
                                             response.data;
                      
                      // Transform the customer data to match our format (similar to fetchCustomers transformation)
                      const firstName = createdCustomer.first_name || newCustomer.firstName;
                      const lastName = createdCustomer.last_name || newCustomer.lastName;
                      const fullName = createdCustomer.name || `${firstName} ${lastName}`.trim() || 'Customer';
                      const email = createdCustomer.email || newCustomer.email;
                      const customerId = createdCustomer.id || `new-${Date.now()}`;
                      
                      // Extract avatar from image object or generate initials
                      const avatarUrl = createdCustomer.image?.image || createdCustomer.image?.thumb || createdCustomer.avatar || null;
                      const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'CU';
                      
                      const newCustomerData = {
                        id: String(customerId),
                        name: fullName,
                        email: email,
                        avatar: avatarUrl || initials,
                      };
                      
                      // Add the new customer to the customers list so it appears when going back to step 1
                      setCustomers(prevCustomers => {
                        // Check if customer already exists (avoid duplicates)
                        const exists = prevCustomers.some(c => c.id === newCustomerData.id || c.email === newCustomerData.email);
                        if (exists) {
                          return prevCustomers;
                        }
                        // Add new customer at the beginning of the list
                        return [newCustomerData, ...prevCustomers];
                      });
                      
                      // Select the new customer and proceed to step 3 (Services)
                      setSelectedCustomer(newCustomerData);
                      setIsAddingNewCustomer(false);
                      setNewCustomer({ firstName: "", lastName: "", phone: "", email: "" });
                      setCurrentStep(3); // Proceed to Services
                    } catch (error: any) {
                      console.error("Error creating customer:", error);
                      alert(error?.response?.data?.message || "Failed to create customer. Please try again.");
                    } finally {
                      setIsCreatingCustomer(false);
                    }
                    return;
                  }
                  
                  // Regular step validation (when not adding new customer)
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
                disabled={isCreatingCustomer}
                className={isAddingNewCustomer ? "w-full" : "w-[70%] ml-4"}
              >
                {isCreatingCustomer ? "Creating..." : "Continue"}
              </Button>
          ) : currentStep === 4 ? (
            <Button
              variant="primary"
              onClick={async () => {
                // Handle final booking submission
                if (!selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0) {
                  alert("Please complete all booking details");
                  return;
                }

                setIsSubmitting(true);
                try {
                  // Format date as YYYY-MM-DD
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  
                  // Combine date and time
                  const dateTime = `${formattedDate} ${selectedTime}`;

                  // Format services array
                  const servicesData = selectedServices.map(service => ({
                    service_id: service.id,
                    staff_id: service.teamMember || null,
                    duration: service.duration
                  }));

                  // Create booking payload
                  const bookingData = {
                    branch_id: currentBranch?.id,
                    customer_id: selectedCustomer.id,
                    date: dateTime,
                    services: servicesData
                  };

                  await axiosClient.post('/bookings/add', bookingData);
                  onSave(selectedCustomer.name);
                } catch (error: any) {
                  console.error("Error creating booking:", error);
                  alert(error?.response?.data?.message || "Failed to create booking. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-[70%] ml-4"
            >
              {isSubmitting ? "Adding..." : "Add Booking"}
            </Button>
          ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
