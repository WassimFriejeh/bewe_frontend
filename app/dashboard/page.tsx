"use client";

import { useState, useEffect, useRef } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";

interface DashboardData {
  todayAppointments?: number;
  bookedHours?: { booked: number; total: number; percentage: number };
  newCustomers?: number;
  totalRevenue?: number;
  topPerformers?: Array<{
    id: string;
    name: string;
    initial: string;
    bookings: number;
    rating: number;
  }>;
  bookingStatus?: {
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

interface PopularService {
  name: string;
  count: number;
}

export default function Dashboard() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("This Week");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchDashboardData();
      fetchPopularServices();
      fetchUpcomingBookings();
    }
  }, [currentBranch?.id, branchChangeKey, selectedPeriod]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll reviews every 5 seconds
  useEffect(() => {
    const totalReviews = 4; // Total number of reviews
    const reviewsPerView = 2; // Number of reviews visible at a time
    const maxIndex = Math.ceil(totalReviews / reviewsPerView) - 1; // Maximum scroll index

    const scrollInterval = setInterval(() => {
      setCurrentReviewIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex > maxIndex) {
          return 0; // Loop back to the beginning
        }
        return nextIndex;
      });
    }, 5000); // 5 seconds

    return () => clearInterval(scrollInterval);
  }, []);

  // Scroll to the current review index
  useEffect(() => {
    if (reviewsScrollRef.current) {
      const containerWidth = reviewsScrollRef.current.offsetWidth;
      const scrollDistance = containerWidth; // Scroll by full container width (2 reviews)
      const scrollPosition = currentReviewIndex * scrollDistance;

      reviewsScrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentReviewIndex]);

  const fetchDashboardData = async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      const response = await axiosClient.get("/dashboard");
      const data = response.data.data || response.data;
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use mock data on error
      setDashboardData({
        todayAppointments: 5,
        bookedHours: { booked: 9, total: 18, percentage: 50 },
        newCustomers: 200,
        totalRevenue: 920.0,
        topPerformers: [
          { id: "1", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "2", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "3", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "4", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "5", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "6", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
          { id: "7", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
        ],
        bookingStatus: {
          completed: 200,
          cancelled: 10,
          noShow: 2,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPopularServices = async () => {
    if (!currentBranch) return;

    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date(now);
      endDate.setHours(23, 59, 59, 999); // End of today

      if (selectedPeriod === "This Week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === "This Month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // This Year
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
      }

      const params: any = {
        branch_id: currentBranch.id,
        per_page: 1000, // Get all bookings for the period
      };

      // Fetch bookings
      const response = await axiosClient.get("/bookings", { params });
      const bookings = response.data.data?.bookings || response.data.bookings || response.data.data || response.data || [];
      
      // Ensure bookings is an array
      const bookingsArray = Array.isArray(bookings) ? bookings : [];

      // Filter bookings by date range
      const filteredBookings = bookingsArray.filter((booking: any) => {
        const bookingDateStr = booking.scheduledOn || booking.date;
        if (!bookingDateStr) return false;
        
        const bookingDate = new Date(bookingDateStr);
        if (isNaN(bookingDate.getTime())) return false; // Invalid date
        
        // Reset time for comparison
        const bookingDateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        return bookingDateOnly >= startDateOnly && bookingDateOnly <= endDateOnly;
      });

      // Count bookings by service
      const serviceCounts: { [key: string]: number } = {};
      
      filteredBookings.forEach((booking: any) => {
        // Handle both single service string and services array
        if (booking.service) {
          const serviceName = booking.service;
          serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
        } else if (booking.services && Array.isArray(booking.services)) {
          booking.services.forEach((service: any) => {
            const serviceName = service.name || service.service_name || service.title || service.service?.name || 'Unknown Service';
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
          });
        }
      });

      // Convert to array and sort by count (highest first)
      const popularServicesData: PopularService[] = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Get top 5 services

      setPopularServices(popularServicesData);
    } catch (error) {
      console.error("Error fetching popular services:", error);
      // Use mock data on error
      setPopularServices([
        { name: "Haircut", count: 40 },
        { name: "Bread Trim", count: 35 },
        { name: "Brushing", count: 31 },
        { name: "Facial", count: 30 },
        { name: "Eyelash Extension", count: 15 },
      ]);
    }
  };

  const fetchUpcomingBookings = async () => {
    if (!currentBranch) return;

    try {
      // Get today's date
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const params: any = {
        branch_id: currentBranch.id,
        date: todayStr,
        per_page: 100,
      };

      // Fetch today's bookings
      const response = await axiosClient.get("/bookings", { params });
      const bookings = response.data.data?.bookings || response.data.bookings || response.data.data || response.data || [];
      const bookingsArray = Array.isArray(bookings) ? bookings : [];

      // Filter for upcoming bookings (future times today) and sort by time
      const now = new Date();
      const upcoming = bookingsArray
        .filter((booking: any) => {
          const bookingDateStr = booking.scheduledOn || booking.date;
          if (!bookingDateStr) return false;
          
          const bookingDate = new Date(bookingDateStr);
          return bookingDate >= now;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.scheduledOn || a.date);
          const dateB = new Date(b.scheduledOn || b.date);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 10); // Get top 10 upcoming bookings

      // Use custom mock data if no bookings found
      if (upcoming.length === 0) {
        const today = new Date();
        const mockBookings = [
          {
            id: '1',
            customer: { name: 'Marie Doe', first_name: 'Marie', last_name: 'Doe' },
            services: [{ name: 'Haircut' }, { name: 'Eyebrow Shaping' }],
            scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
            duration: 45,
            staff: { name: 'Karen Taylor' },
            price: 28.00,
            status: 'Confirmed'
          },
          {
            id: '2',
            customer: { name: 'John Smith', first_name: 'John', last_name: 'Smith' },
            services: [{ name: 'Haircut' }],
            scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
            duration: 45,
            staff: { name: 'Jad Doe' },
            price: 20.00,
            status: 'Confirmed'
          },
          {
            id: '3',
            customer: { name: 'Jane Smith', first_name: 'Jane', last_name: 'Smith' },
            services: [{ name: 'Brushing' }],
            scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
            duration: 60,
            staff: { name: 'Jad Doe' },
            price: 22.00,
            status: 'Started'
          },
          {
            id: '4',
            customer: { name: 'Mia Taylor', first_name: 'Mia', last_name: 'Taylor' },
            services: [{ name: 'Eyelash Extension' }],
            scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(),
            duration: 90,
            staff: { name: 'Mia Smith' },
            price: 40.00,
            status: 'Started'
          },
          {
            id: '5',
            customer: { name: 'Mike Allen', first_name: 'Mike', last_name: 'Allen' },
            services: [{ name: 'Beard Trim' }],
            scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30).toISOString(),
            duration: 30,
            staff: { name: 'Karen Taylor' },
            price: 18.00,
            status: 'Started'
          }
        ];
        setUpcomingBookings(mockBookings);
      } else {
        setUpcomingBookings(upcoming);
      }
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      // Use custom mock data on error
      const today = new Date();
      const mockBookings = [
        {
          id: '1',
          customer: { name: 'Marie Doe', first_name: 'Marie', last_name: 'Doe' },
          services: [{ name: 'Haircut' }, { name: 'Eyebrow Shaping' }],
          scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
          duration: 45,
          staff: { name: 'Karen Taylor' },
          price: 28.00,
          status: 'Confirmed'
        },
        {
          id: '2',
          customer: { name: 'John Smith', first_name: 'John', last_name: 'Smith' },
          services: [{ name: 'Haircut' }],
          scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
          duration: 45,
          staff: { name: 'Jad Doe' },
          price: 20.00,
          status: 'Confirmed'
        },
        {
          id: '3',
          customer: { name: 'Jane Smith', first_name: 'Jane', last_name: 'Smith' },
          services: [{ name: 'Brushing' }],
          scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
          duration: 60,
          staff: { name: 'Jad Doe' },
          price: 22.00,
          status: 'Started'
        },
        {
          id: '4',
          customer: { name: 'Mia Taylor', first_name: 'Mia', last_name: 'Taylor' },
          services: [{ name: 'Eyelash Extension' }],
          scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(),
          duration: 90,
          staff: { name: 'Mia Smith' },
          price: 40.00,
          status: 'Started'
        },
        {
          id: '5',
          customer: { name: 'Mike Allen', first_name: 'Mike', last_name: 'Allen' },
          services: [{ name: 'Beard Trim' }],
          scheduledOn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30).toISOString(),
          duration: 30,
          staff: { name: 'Karen Taylor' },
          price: 18.00,
          status: 'Started'
        }
      ];
      setUpcomingBookings(mockBookings);
    }
  };

  // Helper function to get staff initial and color
  const getStaffInitial = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 0) {
      return parts[0][0].toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getStaffColor = (staffName: string, index: number) => {
    // Map specific staff names to colors from the design
    const staffColorMap: { [key: string]: string } = {
      'Karen Taylor': '#F87171', // Pink
      'Jad Doe': '#60A5FA', // Light blue
      'Mia Smith': '#F472B6', // Light purple/pink
    };
    
    // Return mapped color if exists, otherwise use index-based fallback
    return staffColorMap[staffName] || ['#F87171', '#60A5FA', '#F472B6', '#34D399'][index % 4];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed') {
      return 'bg-green-100 text-green-700';
    } else if (statusLower === 'started') {
      return 'bg-blue-100 text-blue-700';
    } else if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-700';
    } else if (statusLower === 'completed') {
      return 'bg-gray-100 text-gray-700';
    } else if (statusLower === 'cancelled') {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  // Function to handle line hover and calculate point on curve
  const handleLineHover = (
    e: React.MouseEvent<SVGPathElement>,
    points: Array<{ x: number; y: number; value: number; week: string }>,
    linePath: string,
    padding: { top: number; right: number; bottom: number; left: number },
    graphWidth: number,
    graphHeight: number,
    maxValue: number,
    chartWidth: number,
    chartHeight: number
  ) => {
    try {
      const svgElement = e.currentTarget.ownerSVGElement;
      if (!svgElement) {
        setHoveredSegment('sales-hover');
        return;
      }

      const point = svgElement.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const ctm = svgElement.getScreenCTM();
      if (!ctm) {
        setHoveredSegment('sales-hover');
        return;
      }
      const svgPoint = point.matrixTransform(ctm.inverse());

      // Clamp X to graph area
      const clampedX = Math.max(padding.left, Math.min(padding.left + graphWidth, svgPoint.x));
      
      // Find which segment of the curve we're in
      let segmentIndex = 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (clampedX >= points[i].x && clampedX <= points[i + 1].x) {
          segmentIndex = i;
          break;
        }
      }

      // Get point on the actual path for more accurate positioning
      const pathElement = e.currentTarget;
      const pathLength = pathElement.getTotalLength();
      
      // Binary search for the closest point on the path
      let closestPoint = pathElement.getPointAtLength(0);
      let minDist = Infinity;
      
      for (let i = 0; i <= pathLength; i += 2) {
        const pathPoint = pathElement.getPointAtLength(i);
        const dist = Math.abs(pathPoint.x - clampedX);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = pathPoint;
        }
      }

      // Recalculate value from the actual Y position
      const actualYRatio = (graphHeight - (closestPoint.y - padding.top)) / graphHeight;
      const actualValue = Math.max(0, Math.min(maxValue, actualYRatio * maxValue));

      setHoveredPoint({
        x: closestPoint.x,
        y: closestPoint.y,
        value: actualValue
      });

      setTooltipPosition({
        x: e.clientX,
        y: e.clientY
      });
      
      setHoveredSegment('sales-hover');
    } catch (error) {
      console.error('Error in handleLineHover:', error);
      // Even on error, try to maintain hover state with approximate position
      const svgElement = e.currentTarget.ownerSVGElement;
      if (svgElement) {
        const point = svgElement.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const ctm = svgElement.getScreenCTM();
        if (ctm) {
          const svgPoint = point.matrixTransform(ctm.inverse());
          const clampedX = Math.max(padding.left, Math.min(padding.left + graphWidth, svgPoint.x));
          const clampedY = Math.max(padding.top, Math.min(padding.top + graphHeight, svgPoint.y));
          const yRatio = (graphHeight - (clampedY - padding.top)) / graphHeight;
          const value = Math.max(0, Math.min(maxValue, yRatio * maxValue));
          
          setHoveredPoint({
            x: clampedX,
            y: clampedY,
            value: value
          });
          setTooltipPosition({
            x: e.clientX,
            y: e.clientY
          });
        }
      }
      setHoveredSegment('sales-hover');
    }
  };

  // Mock data fallback
  const data: DashboardData = dashboardData || {
    todayAppointments: 5,
    bookedHours: { booked: 9, total: 18, percentage: 50 },
    newCustomers: 200,
    totalRevenue: 920.0,
    topPerformers: [
      { id: "1", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "2", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "3", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "4", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "5", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "6", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
      { id: "7", name: "Mia Smith", initial: "M", bookings: 100, rating: 4.0 },
    ],
    bookingStatus: {
      completed: 200,
      cancelled: 10,
      noShow: 2,
    },
  };

  const totalBookings = (data.bookingStatus?.completed || 0) + (data.bookingStatus?.cancelled || 0) + (data.bookingStatus?.noShow || 0);
  const completedPercentage = totalBookings > 0 ? ((data.bookingStatus?.completed || 0) / totalBookings) * 100 : 0;
  const cancelledPercentage = totalBookings > 0 ? ((data.bookingStatus?.cancelled || 0) / totalBookings) * 100 : 0;
  const noShowPercentage = totalBookings > 0 ? ((data.bookingStatus?.noShow || 0) / totalBookings) * 100 : 0;

  // Helper function to calculate color opacity based on bar height percentage
  // Lower values = lighter (lower opacity), Higher values = darker (higher opacity)
  // Base color: #48CAE4, opacity range: 15% (0x26) to 100% (0xFF)
  const getBarColor = (percentage: number): string => {
    const minOpacity = 0.15; // 15% for lowest values
    const maxOpacity = 1.0;  // 100% for highest values
    const opacity = minOpacity + (percentage / 100) * (maxOpacity - minOpacity);
    const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#48CAE4${opacityHex}`;
  };

  // Calculate donut chart segments (double size: 384px = 192px radius doubled)
  const radius = 120;
  const strokeWidth = 60;
  const innerRadius = radius - strokeWidth / 2;
  const outerRadius = radius + strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const completedLength = (completedPercentage / 100) * circumference;
  const cancelledLength = (cancelledPercentage / 100) * circumference;
  const noShowLength = (noShowPercentage / 100) * circumference;
  
  // Calculate positions for dividing lines
  const centerX = 192;
  const centerY = 192;
  const completedEndAngle = (completedPercentage / 100) * 360;
  const cancelledEndAngle = completedEndAngle + (cancelledPercentage / 100) * 360;
  
  // Convert angles to radians and calculate line endpoints (subtract 90 to start from top)
  const completedEndRad = (completedEndAngle - 90) * (Math.PI / 180);
  const cancelledEndRad = (cancelledEndAngle - 90) * (Math.PI / 180);
  
  // Inner and outer points for dividing lines
  const completedInnerX = centerX + innerRadius * Math.cos(completedEndRad);
  const completedInnerY = centerY + innerRadius * Math.sin(completedEndRad);
  const completedOuterX = centerX + outerRadius * Math.cos(completedEndRad);
  const completedOuterY = centerY + outerRadius * Math.sin(completedEndRad);
  
  const cancelledInnerX = centerX + innerRadius * Math.cos(cancelledEndRad);
  const cancelledInnerY = centerY + innerRadius * Math.sin(cancelledEndRad);
  const cancelledOuterX = centerX + outerRadius * Math.cos(cancelledEndRad);
  const cancelledOuterY = centerY + outerRadius * Math.sin(cancelledEndRad);
  
  // Top line (0 degrees / -90 after rotation)
  const topInnerX = centerX;
  const topInnerY = centerY - innerRadius;
  const topOuterX = centerX;
  const topOuterY = centerY - outerRadius;

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Dashboard</span>
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
      </div>

      {/* Main Content */}
      <div className="main-container py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Today's Appointments */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 mb-2" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', opacity: 0.5 }}>Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{data.todayAppointments || 5}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 9.75V6H11.25" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 6L11.25 9.75C10.588 10.412 10.2571 10.7428 9.85095 10.7794C9.78375 10.7855 9.71625 10.7855 9.64905 10.7794C9.24285 10.7428 8.91195 10.412 8.25 9.75C7.58805 9.08805 7.25711 8.75715 6.85093 8.72055C6.78378 8.71448 6.71622 8.71448 6.64907 8.72055C6.24289 8.75715 5.91192 9.08805 5.25 9.75L3 12" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs font-normal" style={{ fontSize: '12px', lineHeight: '18px', letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.5)' }}>
                        <span style={{ color: '#48CAE4' }}>3%</span> increase from yesterday
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                      <path d="M30 13.8896V18.3341M20 13.8896V18.3341" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M32.7778 16.1113H17.2222C15.9949 16.1113 15 17.1063 15 18.3336V33.8891C15 35.1164 15.9949 36.1113 17.2222 36.1113H32.7778C34.0051 36.1113 35 35.1164 35 33.8891V18.3336C35 17.1063 34.0051 16.1113 32.7778 16.1113Z" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M15 22.7783H35" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M21.4498 30.0003L23.6721 32.2225L29.2276 26.667" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Booked Hours */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 mb-4" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', opacity: 0.5 }}>Booked Hours (All Team)</p>
                    <p className="text-gray-900" style={{ fontFamily: 'Inter', fontWeight: 700, lineHeight: '100%', letterSpacing: '0%' }}>
                      <span style={{ fontSize: '25px' }}>{data.bookedHours?.booked || 9}/{data.bookedHours?.total || 18}</span> <span style={{ fontSize: '18px', opacity: 0.5 }}>({data.bookedHours?.percentage || 50}%)</span>
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 9.75V6H11.25" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 6L11.25 9.75C10.588 10.412 10.2571 10.7428 9.85095 10.7794C9.78375 10.7855 9.71625 10.7855 9.64905 10.7794C9.24285 10.7428 8.91195 10.412 8.25 9.75C7.58805 9.08805 7.25711 8.75715 6.85093 8.72055C6.78378 8.71448 6.71622 8.71448 6.64907 8.72055C6.24289 8.75715 5.91192 9.08805 5.25 9.75L3 12" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs font-normal" style={{ fontSize: '12px', lineHeight: '18px', letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.5)' }}>
                        <span style={{ color: '#48CAE4' }}>3%</span> increase from yesterday
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                      <path d="M25 36.1119C31.1365 36.1119 36.1111 31.1373 36.1111 25.0008C36.1111 18.8643 31.1365 13.8896 25 13.8896C18.8635 13.8896 13.8889 18.8643 13.8889 25.0008C13.8889 31.1373 18.8635 36.1119 25 36.1119Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M25 18.5V22.9444L27.2222 25.1667" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* New Customers */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 mb-2" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', opacity: 0.5 }}>New Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data.newCustomers || 200}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 9.75V6H11.25" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 6L11.25 9.75C10.588 10.412 10.2571 10.7428 9.85095 10.7794C9.78375 10.7855 9.71625 10.7855 9.64905 10.7794C9.24285 10.7428 8.91195 10.412 8.25 9.75C7.58805 9.08805 7.25711 8.75715 6.85093 8.72055C6.78378 8.71448 6.71622 8.71448 6.64907 8.72055C6.24289 8.75715 5.91192 9.08805 5.25 9.75L3 12" stroke="#48CAE4" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs font-normal" style={{ fontSize: '12px', lineHeight: '18px', letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.5)' }}>
                        <span style={{ color: '#48CAE4' }}>3%</span> increase from yesterday
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                      <path d="M26.1111 19.4444C26.1111 21.899 24.1212 23.8889 21.6667 23.8889C19.2121 23.8889 17.2222 21.899 17.2222 19.4444C17.2222 16.9898 19.2121 15 21.6667 15C24.1212 15 26.1111 16.9898 26.1111 19.4444Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M28.3334 23.8889C30.7879 23.8889 32.7778 21.899 32.7778 19.4444C32.7778 16.9898 30.7879 15 28.3334 15" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M23.8889 27.2227H19.4445C16.3762 27.2227 13.8889 29.71 13.8889 32.7782C13.8889 34.0055 14.8838 35.0004 16.1111 35.0004H27.2222C28.4496 35.0004 29.4445 34.0055 29.4445 32.7782C29.4445 29.71 26.9571 27.2227 23.8889 27.2227Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M30.5556 27.2227C33.6238 27.2227 36.1112 29.71 36.1112 32.7782C36.1112 34.0055 35.1163 35.0004 33.8889 35.0004H32.2223" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 mb-2" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', opacity: 0.5 }}>Total Revenue - This Week</p>
                    <p className="text-2xl font-bold text-gray-900">${(data.totalRevenue || 920.0).toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 8.25V12H11.25" stroke="#FF0000" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 12L11.25 8.25C10.588 7.58805 10.2571 7.25711 9.85095 7.22053C9.78375 7.21447 9.71625 7.21447 9.64905 7.22053C9.24285 7.25711 8.91195 7.58805 8.25 8.25C7.58805 8.91195 7.25711 9.24285 6.85093 9.27945C6.78378 9.28552 6.71622 9.28552 6.64907 9.27945C6.24289 9.24285 5.91192 8.91195 5.25 8.25L3 6" stroke="#FF0000" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs font-normal" style={{ fontSize: '12px', lineHeight: '18px', letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.5)' }}>
                        <span style={{ color: '#FF0000' }}>3%</span> decrease from yesterday
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="50" height="50" rx="8.88889" fill="#7B2CBF" fillOpacity="0.1"/>
                      <path d="M28.8889 26.1114C32.8776 26.1114 36.1111 25.1165 36.1111 23.8892C36.1111 22.6619 32.8776 21.667 28.8889 21.667C24.9002 21.667 21.6667 22.6619 21.6667 23.8892C21.6667 25.1165 24.9002 26.1114 28.8889 26.1114Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M36.1111 28.8896C36.1111 30.117 32.8777 31.1119 28.8889 31.1119C24.9001 31.1119 21.6667 30.117 21.6667 28.8896" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M36.1111 23.8896V33.6674C36.1111 35.0174 32.8777 36.1119 28.8889 36.1119C24.9001 36.1119 21.6667 35.0174 21.6667 33.6674V23.8896" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M21.1111 18.3341C25.0998 18.3341 28.3333 17.3392 28.3333 16.1119C28.3333 14.8846 25.0998 13.8896 21.1111 13.8896C17.1224 13.8896 13.8889 14.8846 13.8889 16.1119C13.8889 17.3392 17.1224 18.3341 21.1111 18.3341Z" stroke="#7B2CBF" strokeWidth="2.2"/>
                      <path d="M18.3333 23.8892C16.2313 23.6334 14.2999 22.972 13.8889 21.667M18.3333 29.4448C16.2313 29.189 14.2999 28.5275 13.8889 27.2225" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M18.3333 35.0002C16.2313 34.7444 14.2999 34.083 13.8889 32.778V16.1113" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M28.3333 18.3336V16.1113" stroke="#7B2CBF" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-900" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Top Performers this Week</h2>
                    <button className="text-sm font-medium hover:text-primary active:text-primary transition-colors cursor-pointer text-black/60" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%' }}>View All</button>
                </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead className="bg-white border-b border-gray-200">
                        <tr>
                          <th className="group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize cursor-pointer">
                            <div className="flex items-center gap-2">
                            Staff Member
                              <svg 
                                width="15" 
                                height="15" 
                                viewBox="0 0 18 18" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                className="transition-colors text-gray-400 opacity-50 group-hover:text-primary group-hover:opacity-100"
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
                          <th className="group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize cursor-pointer">
                            <div className="flex items-center gap-2">
                            Number of Bookings
                              <svg 
                                width="15" 
                                height="15" 
                                viewBox="0 0 18 18" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                className="transition-colors text-gray-400 opacity-50 group-hover:text-primary group-hover:opacity-100"
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
                          <th className="group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize cursor-pointer">
                            <div className="flex items-center gap-2">
                            Rating
                              <svg 
                                width="15" 
                                height="15" 
                                viewBox="0 0 18 18" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                className="transition-colors text-gray-400 opacity-50 group-hover:text-primary group-hover:opacity-100"
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
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {data.topPerformers?.map((performer) => (
                          <tr key={performer.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-normal text-gray-700">
                                {performer.initial}
                              </div>
                                <span className="text-xs font-normal text-black/80">{performer.name}</span>
                            </div>
                          </td>
                            <td className="px-5 py-4 text-xs font-normal text-black/80">{performer.bookings} bookings</td>
                            <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                                <svg width="17" height="17" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                                <span className="text-xs font-normal text-black/80">{performer.rating}/5.0</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="mb-8" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Booking Status</h2>
                <div className="flex flex-col items-center">
                  {/* Donut Chart */}
                  <div 
                    className="relative mb-8 mx-auto" 
                    style={{ width: "384px", height: "384px", margin: "0" }}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <svg width="384" height="384" viewBox="0 0 384 384" className="transform -rotate-90">
                      {/* Completed segment - dark purple */}
                      <circle
                        cx="192"
                        cy="192"
                        r={radius}
                        stroke="#7B2CBF"
                        strokeWidth="40"
                        fill="none"
                        strokeDasharray={`${completedLength} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="butt"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          setHoveredSegment("completed");
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                      />
                      {/* Cancelled segment - bright turquoise */}
                      <circle
                        cx="192"
                        cy="192"
                        r={radius}
                        stroke="#48CAE4"
                        strokeWidth="40"
                        fill="none"
                        strokeDasharray={`${cancelledLength} ${circumference}`}
                        strokeDashoffset={-completedLength}
                        strokeLinecap="butt"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          setHoveredSegment("cancelled");
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                      />
                      {/* No Show segment - light gray */}
                      <circle
                        cx="192"
                        cy="192"
                        r={radius}
                        stroke="#E5E7EB"
                        strokeWidth="40"
                        fill="none"
                        strokeDasharray={`${noShowLength} ${circumference}`}
                        strokeDashoffset={-(completedLength + cancelledLength)}
                        strokeLinecap="butt"
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          setHoveredSegment("noShow");
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.closest("div")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPosition({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top
                            });
                          }
                        }}
                      />
                    </svg>
                    
                    {/* Tooltip */}
                    {hoveredSegment && (
                      <div
                        className="absolute bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 z-10 pointer-events-none"
                        style={{
                          left: `${tooltipPosition.x + 10}px`,
                          top: `${tooltipPosition.y - 10}px`,
                          transform: "translateY(-100%)"
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ 
                            backgroundColor: hoveredSegment === "completed" ? "#7B2CBF" : 
                                            hoveredSegment === "cancelled" ? "#48CAE4" : "#E5E7EB" 
                          }}
                        />
                        <span className="text-sm text-gray-700">
                          {hoveredSegment === "completed" ? "Completed" : 
                           hoveredSegment === "cancelled" ? "Cancelled" : "No Show"}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {hoveredSegment === "completed" ? data.bookingStatus?.completed || 200 :
                           hoveredSegment === "cancelled" ? data.bookingStatus?.cancelled || 10 :
                           data.bookingStatus?.noShow || 2}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="w-full flex items-start justify-around">
                    {/* Completed */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7B2CBF" }}></div>
                        <span className="text-sm" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Completed</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.completed || 200} bookings</span>
                    </div>
                    {/* Cancelled */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#48CAE4" }}></div>
                        <span className="text-sm" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Cancelled</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.cancelled || 10} bookings</span>
                    </div>
                    {/* No Show */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-sm" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>No Show</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.noShow || 2} bookings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Most Popular Services */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-900" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Most Popular Services</h2>
                    <div className="relative" ref={periodDropdownRef}>
                      <button
                        onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 cursor-pointer text-xs font-medium border border-black/20 rounded-[10px] transition-colors focus:outline-none whitespace-nowrap ${
                          isPeriodDropdownOpen 
                            ? "bg-black text-white" 
                            : "bg-white hover:bg-black hover:text-white"
                        }`}
                      >
                        <span className="whitespace-nowrap">{selectedPeriod}</span>
                        <svg
                          className={`w-4 h-4 transition-transform flex-shrink-0 ${isPeriodDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isPeriodDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-full bg-white border border-black/20 rounded-[10px] shadow-lg z-50 min-w-[140px]">
                          <div>
                            {["This Week", "This Month", "This Year"].map((period) => (
                              <button
                                key={period}
                                onClick={() => {
                                  setSelectedPeriod(period);
                                  setIsPeriodDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors rounded-[10px] ${
                                  selectedPeriod === period ? "bg-black/10 text-black" : "text-gray-700"
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-4">
                  {(() => {
                    // Calculate max value for scaling
                    const maxCount = popularServices.length > 0 
                      ? Math.max(...popularServices.map(s => s.count))
                      : 45;
                    
                    // Round max to nearest nice number (divisible by 3 or 5)
                    const roundedMax = maxCount === 0 ? 45 : Math.ceil(maxCount / 5) * 5;
                    
                    // Calculate Y-axis labels
                    const yAxisLabels = [
                      roundedMax,
                      Math.round(roundedMax * 2 / 3),
                      Math.round(roundedMax / 3),
                      0
                    ];

                    return (
                      <div>
                        <div className="relative" style={{ height: '582px' }}>
                          {/* Y-axis labels on the left */}
                          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500" style={{ width: '20px' }}>
                            {yAxisLabels.map((label, index) => (
                              <span key={index}>{label}</span>
                            ))}
                          </div>
                          
                          {/* Chart area with grid lines */}
                          <div className="relative ml-6 h-full">
                            {/* Horizontal dashed grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                              <div className="w-full border-t border-dashed border-gray-300"></div>
                              <div className="w-full border-t border-dashed border-gray-300"></div>
                              <div className="w-full border-t border-dashed border-gray-300"></div>
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            
                            {/* Bars container - aligned to bottom (zero line) */}
                            <div className="relative h-full flex items-end justify-between px-2">
                              {popularServices.length > 0 ? (
                                popularServices.map((service, index) => {
                                  const heightPercentage = roundedMax > 0 ? (service.count / roundedMax) * 100 : 0;
                                  return (
                                    <div key={index} className="w-8 flex flex-col items-center h-full" style={{ justifyContent: 'flex-end' }}>
                                      <div 
                                        className="w-full" 
                                        style={{ 
                                          height: `${heightPercentage}%`,
                                          display: 'flex',
                                          alignItems: 'flex-end'
                                        }}
                                      >
                                        <svg 
                                          width="100%" 
                                          height="100%"
                                          viewBox="0 0 20 190" 
                                          fill="none" 
                                          xmlns="http://www.w3.org/2000/svg"
                                          preserveAspectRatio="none"
                                          style={{ display: 'block' }}
                                        >
                                          <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill={getBarColor(heightPercentage)}/>
                                        </svg>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="w-full flex items-center justify-center h-full">
                                  <span className="text-sm text-gray-500">No data available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Service labels below the zero line */}
                        <div className="relative ml-6 flex justify-between px-2" style={{ marginTop: '4px' }}>
                          {popularServices.length > 0 ? (
                            popularServices.map((service, index) => (
                              <div key={index} className="w-8 flex justify-center">
                                <span className="text-xs text-gray-700 text-center">{service.name}</span>
                              </div>
                            ))
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Peak Hours */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="mb-8" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Peak Hours</h2>
                <div className="flex flex-col items-center">
                  <div className="w-full flex items-end justify-between" style={{ height: '582px' }}>
                  {/* 8:00am */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '40%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">8:00am</span>
                  </div>
                  {/* 9:00am - Peak */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '100%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#7B2CBF"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">9:00am</span>
                  </div>
                  {/* 10:00am */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '50%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">10:00am</span>
                  </div>
                  {/* 11:00am */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '45%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">11:00am</span>
                  </div>
                  {/* 12:00pm - Peak */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '100%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#7B2CBF"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">12:00pm</span>
                  </div>
                  {/* 1:00pm */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '20%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">1:00pm</span>
                  </div>
                  {/* 2:00pm */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '35%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">2:00pm</span>
                  </div>
                  {/* 3:00pm */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '40%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">3:00pm</span>
                  </div>
                  {/* 4:00pm - Peak */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '100%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#7B2CBF"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">4:00pm</span>
                  </div>
                  {/* 5:00pm */}
                  <div className="w-8 flex flex-col items-center gap-1 h-full">
                    <div className="w-full flex flex-col items-end justify-end h-full">
                      <svg 
                        width="100%" 
                        style={{ height: '30%' }}
                        viewBox="0 0 20 190" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 9.99999C0 8.14137 0 7.21207 0.153718 6.43928C0.784971 3.26575 3.26575 0.784971 6.43928 0.153718C7.21207 0 8.14138 0 10 0C11.8586 0 12.7879 0 13.5607 0.153718C16.7342 0.784971 19.215 3.26575 19.8463 6.43928C20 7.21207 20 8.14138 20 10V189.19H0V9.99999Z" fill="#48CAE426"/>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">5:00pm</span>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Upcoming Bookings Today */}
            <div className="mt-6 bg-white rounded-lg shadow-sm">
              <div className="p-6 pb-4">
                <h2 className="text-gray-900" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Upcoming Bookings Today</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled on</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingBookings.length > 0 ? (
                      upcomingBookings.map((booking, index) => {
                        const customerName = booking.customer?.name || 
                          (booking.customer?.first_name && booking.customer?.last_name 
                            ? `${booking.customer.first_name} ${booking.customer.last_name}`.trim()
                            : booking.customer_name || 'Customer');
                        
                        const services = booking.services || [];
                        const servicesList = services.length > 0
                          ? services.map((s: any) => s.name || s.service_name || s.title || 'Service').join(', ')
                          : booking.service || 'N/A';
                        
                        const scheduledOn = booking.scheduledOn || booking.date;
                        const dateStr = scheduledOn ? formatDate(scheduledOn) : 'N/A';
                        const timeStr = scheduledOn ? formatTime(scheduledOn) : '';
                        const scheduledDisplay = scheduledOn ? `${dateStr}, ${timeStr}` : 'N/A';
                        
                        const duration = booking.duration || 
                          (services.length > 0 
                            ? services.reduce((sum: number, s: any) => sum + (s.duration || s.duration_minutes || 0), 0)
                            : 0);
                        const durationDisplay = duration > 0 ? `${duration} min` : 'N/A';
                        
                        const staff = booking.staff || (services.length > 0 && services[0].staff) || {};
                        const staffName = staff.name || 'N/A';
                        const staffInitial = getStaffInitial(staffName);
                        const staffColor = getStaffColor(staffName, index);
                        
                        const price = booking.price || 
                          (services.length > 0 
                            ? services.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
                            : 0);
                        const priceDisplay = price > 0 ? `$${price.toFixed(2)}` : 'N/A';
                        
                        const status = booking.status || 'Pending';
                        const statusColorClass = getStatusColor(status);
                        
                        return (
                          <tr key={booking.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{servicesList}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{scheduledDisplay}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{durationDisplay}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                  style={{ backgroundColor: staffColor }}
                                >
                                  {staffInitial}
                                </div>
                                <span>{staffName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{priceDisplay}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColorClass}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                          No upcoming bookings today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Sales Overview */}
            <div className="mt-6 bg-white rounded-lg shadow-sm">
              <div className="p-6 pb-4">
                <h2 className="text-gray-900 mb-1" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Monthly Sales Overview</h2>
                <p style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.5)' }}>
                  <span style={{ color: '#48CAE4' }}>3%</span> increase from yesterday
                </p>
              </div>
              <div className="px-6 pb-6">
                {(() => {
                  // Sales data for 4 weeks with more fluctuation
                  const salesData = [
                    { week: 'Week 1', value: 800 },
                    { week: 'Week 1', value: 970 },
                    { week: 'Week 2', value: 1070 },
                    { week: 'Week 2', value: 1800 },
                    { week: 'Week 3', value: 1450 },
                    { week: 'Week 3', value: 800 },
                    { week: 'Week 4', value: 1750 },
                  ];
                  
                  // Week labels for X-axis (only show once per week)
                  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

                  const maxValue = 2000;
                  const chartHeight = 582;
                  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
                  const graphHeight = chartHeight - padding.top - padding.bottom;

                  const chartWidth = 1000;
                  const graphWidth = chartWidth - padding.left - padding.right;

                  // Calculate points for the line
                  const points = salesData.map((data, index) => {
                    const x = padding.left + (index / (salesData.length - 1)) * graphWidth;
                    const y = padding.top + graphHeight - (data.value / maxValue) * graphHeight;
                    return { x, y, value: data.value, week: data.week };
                  });

                  // Create smooth curved path for the line
                  const createSmoothPath = (points: typeof points) => {
                    if (points.length === 0) return '';
                    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
                    
                    let path = `M ${points[0].x} ${points[0].y}`;
                    
                    for (let i = 1; i < points.length; i++) {
                      const prev = points[i - 1];
                      const curr = points[i];
                      const next = points[i + 1];
                      
                      // Calculate control points for smooth curve
                      const tension = 0.3; // Controls curve smoothness
                      let cp1x, cp1y, cp2x, cp2y;
                      
                      if (i === 1) {
                        // First curve
                        const dx = (next ? next.x - prev.x : curr.x - prev.x) * tension;
                        const dy = (next ? next.y - prev.y : curr.y - prev.y) * tension;
                        cp1x = prev.x + dx;
                        cp1y = prev.y + dy;
                        cp2x = curr.x - (next ? (next.x - prev.x) * tension : dx);
                        cp2y = curr.y - (next ? (next.y - prev.y) * tension : dy);
                      } else if (i === points.length - 1) {
                        // Last curve
                        const prevPrev = points[i - 2];
                        const dx = (curr.x - prevPrev.x) * tension;
                        const dy = (curr.y - prevPrev.y) * tension;
                        cp1x = prev.x + dx;
                        cp1y = prev.y + dy;
                        cp2x = curr.x - (curr.x - prev.x) * tension;
                        cp2y = curr.y - (curr.y - prev.y) * tension;
                      } else {
                        // Middle curves
                        const prevPrev = points[i - 2];
                        const dx1 = (curr.x - prevPrev.x) * tension;
                        const dy1 = (curr.y - prevPrev.y) * tension;
                        const dx2 = (next.x - prev.x) * tension;
                        const dy2 = (next.y - prev.y) * tension;
                        cp1x = prev.x + dx1;
                        cp1y = prev.y + dy1;
                        cp2x = curr.x - dx2;
                        cp2y = curr.y - dy2;
                      }
                      
                      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                    }
                    
                    return path;
                  };
                  
                  const linePath = createSmoothPath(points);

                  // Create path for the area (line + bottom)
                  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

                  return (
                    <div 
                      className="relative w-full" 
                      style={{ height: `${chartHeight}px` }}
                      onMouseLeave={() => {
                        setHoveredSegment(null);
                        setHoveredPoint(null);
                      }}
                    >
                      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full">
                        <defs>
                          <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="5%" stopColor="#48CAE4" stopOpacity="0.3" />
                            <stop offset="22%" stopColor="#7B2CBF" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="salesLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#000000" />
                            <stop offset="100%" stopColor="#7B2CBF" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 500, 1000, 1500, 2000].map((value, index) => {
                          const y = padding.top + graphHeight - (value / maxValue) * graphHeight;
                          return (
                            <g key={index}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + graphWidth}
                                y2={y}
                                stroke="#E5E7EB"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                              <text
                                x={padding.left - 15}
                                y={y + 5}
                                textAnchor="end"
                                style={{ 
                                  fontFamily: 'Inter', 
                                  fontWeight: 400, 
                                  fontSize: '12px', 
                                  lineHeight: '100%', 
                                  letterSpacing: '0%',
                                  fill: '#000000',
                                  opacity: 0.6
                                }}
                              >
                                {value === 0 ? '$0' : value === 1000 ? '$1K' : value === 1500 ? '$1.5K' : value === 2000 ? '$2K' : value === 500 ? '$0.5K' : `$${value / 1000}K`}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area fill */}
                        <path
                          d={areaPath}
                          fill="url(#salesGradient)"
                        />

                        {/* Invisible wider hover area - much wider for better detection */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="50"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredSegment('sales-hover');
                            handleLineHover(e, points, linePath, padding, graphWidth, graphHeight, maxValue, chartWidth, chartHeight);
                          }}
                          onMouseMove={(e) => {
                            setHoveredSegment('sales-hover');
                            handleLineHover(e, points, linePath, padding, graphWidth, graphHeight, maxValue, chartWidth, chartHeight);
                          }}
                          onMouseLeave={() => {
                            setHoveredSegment(null);
                            setHoveredPoint(null);
                          }}
                        />
                        
                        {/* Visible line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="url(#salesLineGradient)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pointerEvents="none"
                        />

                        {/* Circle at hover point */}
                        {hoveredPoint && hoveredSegment === 'sales-hover' && (
                          <g>
                            <svg
                              x={hoveredPoint.x - 6}
                              y={hoveredPoint.y - 6}
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="6" cy="6" r="5.25" fill="white" stroke="black" strokeWidth="1.5"/>
                            </svg>
                          </g>
                        )}

                        {/* X-axis labels */}
                        {weekLabels.map((week, index) => {
                          const x = padding.left + (index / (weekLabels.length - 1)) * graphWidth;
                          return (
                            <text
                              key={index}
                              x={x}
                              y={chartHeight - 15}
                              textAnchor="middle"
                              style={{ 
                                fontFamily: 'Inter', 
                                fontWeight: 'normal', 
                                fontSize: '12px', 
                                lineHeight: '100%', 
                                letterSpacing: '0%',
                                fill: '#000000',
                                fontStyle: 'normal'
                              }}
                            >
                              {week}
                            </text>
                          );
                        })}
                      </svg>

                      {/* Tooltip */}
                      {hoveredPoint && hoveredSegment === 'sales-hover' && (
                        <div
                          className="fixed pointer-events-none z-50"
                          style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y - 50}px`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <svg width="71" height="34" viewBox="0 0 71 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 6C0 2.68629 2.68629 0 6 0H65C68.3137 0 71 2.68629 71 6V22.6316C71 25.9453 68.3137 28.6316 65 28.6316H46.6814C42.8706 28.6316 39.2217 30.1729 36.5649 32.9049C35.9816 33.5047 35.0184 33.5047 34.4351 32.9049C31.7783 30.1729 28.1294 28.6316 24.3186 28.6316H6C2.68629 28.6316 0 25.9453 0 22.6316V6Z" fill="black"/>
                            <text
                              x="35.5"
                              y="19"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              style={{
                                fontFamily: 'Inter',
                                fontWeight: 400,
                                fontSize: '12px',
                                lineHeight: '18px',
                                letterSpacing: '0%'
                              }}
                            >
                              ${hoveredPoint.value.toFixed(2)}
                            </text>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Reviews and Top Customers Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Reviews */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 pb-4">
                  <h2 className="text-gray-900 mb-2" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Reviews</h2>
                  <p className="text-sm text-gray-600 mb-4">Lorem ipsum dolor sit amet consectetur vitae in eu etiam sit phasellus lacus sem vitae venenatis.</p>
                </div>
                <div className="px-6 pb-6">
                  <div ref={reviewsScrollRef} className="overflow-x-auto scrollbar-hide -mx-6 px-6 snap-x snap-mandatory">
                    <div className="flex gap-4">
                      {/* Review 1 */}
                      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-shrink-0 snap-start" style={{ width: 'calc((100% - 1rem) / 2)' }}>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                          <img src="/api/placeholder/48/48" alt="Sophia Davis" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">Sophia Davis</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                    <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ))}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                  <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">Today, 10:00 AM</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Lorem ipsum dolor sit amet consectetur suspendisse neque eget est proin phasellus sed arcu lorem.</p>
                        </div>
                      </div>

                      {/* Review 2 */}
                      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-shrink-0 snap-start" style={{ width: 'calc((100% - 1rem) / 2)' }}>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                          <img src="/api/placeholder/48/48" alt="Sophia Davis" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">Sophia Davis</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                    <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ))}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                  <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">Today, 10:00 AM</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Lorem ipsum dolor sit amet consectetur suspendisse neque eget est proin phasellus sed arcu lorem.</p>
                        </div>
                      </div>

                      {/* Review 3 - Additional review for scrolling */}
                      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-shrink-0 snap-start" style={{ width: 'calc((100% - 1rem) / 2)' }}>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                          <img src="/api/placeholder/48/48" alt="Jane Smith" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">Jane Smith</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                    <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">Yesterday, 2:30 PM</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Excellent service! The staff was very professional and the results exceeded my expectations.</p>
                        </div>
                      </div>

                      {/* Review 4 - Additional review for scrolling */}
                      <div className="flex gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-shrink-0 snap-start" style={{ width: 'calc((100% - 1rem) / 2)' }}>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                          <img src="/api/placeholder/48/48" alt="Mike Allen" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">Mike Allen</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                    <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ))}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 19 19" fill="none">
                                  <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">2 days ago, 4:15 PM</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Great experience overall. Would definitely recommend to others looking for quality service.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pagination dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {[0, 1].map((index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentReviewIndex === index ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 pb-4">
                  <h2 className="text-gray-900 mb-2" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', lineHeight: '100%', letterSpacing: '0%', color: '#000000' }}>Top Customers</h2>
                  <p className="text-sm text-gray-600 mb-4">Lorem ipsum dolor sit amet consectetur vitae in eu etiam sit phasellus lacus sem vitae venenatis.</p>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex gap-3 justify-between">
                    {/* Customer 1 - Marie Doe */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center mb-2">
                        <span className="text-blue-700 font-semibold text-lg">MD</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Marie Doe</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 2.33333C10.9 1.56667 9.8 1 8.75 1C6.01667 1 3.83333 3.18333 3.83333 5.91667H1.16667L4.08333 8.83333L7 5.91667H4.66667C4.66667 4.08333 6.26667 2.5 8.08333 2.5C9.01667 2.5 9.93333 2.91667 10.6667 3.5L11.6667 2.33333ZM2.33333 11.6667C3.1 12.4333 4.2 13 5.25 13C7.98333 13 10.1667 10.8167 10.1667 8.08333H12.8333L9.91667 5.16667L7 8.08333H9.33333C9.33333 9.91667 7.73333 11.5 5.91667 11.5C4.98333 11.5 4.06667 11.0833 3.33333 10.5L2.33333 11.6667Z" fill="#7B2CBF"/>
                        </svg>
                        <span>34 visits</span>
                      </div>
                    </div>

                    {/* Customer 2 - Sophia Davis */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-16 h-16 rounded-full bg-gray-200 mb-2">
                        <img src="/api/placeholder/64/64" alt="Sophia Davis" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Sophia Davis</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 2.33333C10.9 1.56667 9.8 1 8.75 1C6.01667 1 3.83333 3.18333 3.83333 5.91667H1.16667L4.08333 8.83333L7 5.91667H4.66667C4.66667 4.08333 6.26667 2.5 8.08333 2.5C9.01667 2.5 9.93333 2.91667 10.6667 3.5L11.6667 2.33333ZM2.33333 11.6667C3.1 12.4333 4.2 13 5.25 13C7.98333 13 10.1667 10.8167 10.1667 8.08333H12.8333L9.91667 5.16667L7 8.08333H9.33333C9.33333 9.91667 7.73333 11.5 5.91667 11.5C4.98333 11.5 4.06667 11.0833 3.33333 10.5L2.33333 11.6667Z" fill="#7B2CBF"/>
                        </svg>
                        <span>28 visits</span>
                      </div>
                    </div>

                    {/* Customer 3 - Jane Smith */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-16 h-16 rounded-full bg-gray-200 mb-2">
                        <img src="/api/placeholder/64/64" alt="Jane Smith" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Jane Smith</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 2.33333C10.9 1.56667 9.8 1 8.75 1C6.01667 1 3.83333 3.18333 3.83333 5.91667H1.16667L4.08333 8.83333L7 5.91667H4.66667C4.66667 4.08333 6.26667 2.5 8.08333 2.5C9.01667 2.5 9.93333 2.91667 10.6667 3.5L11.6667 2.33333ZM2.33333 11.6667C3.1 12.4333 4.2 13 5.25 13C7.98333 13 10.1667 10.8167 10.1667 8.08333H12.8333L9.91667 5.16667L7 8.08333H9.33333C9.33333 9.91667 7.73333 11.5 5.91667 11.5C4.98333 11.5 4.06667 11.0833 3.33333 10.5L2.33333 11.6667Z" fill="#7B2CBF"/>
                        </svg>
                        <span>24 visits</span>
                      </div>
                    </div>

                    {/* Customer 4 - Mike Allen */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-16 h-16 rounded-full bg-gray-200 mb-2">
                        <img src="/api/placeholder/64/64" alt="Mike Allen" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Mike Allen</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 2.33333C10.9 1.56667 9.8 1 8.75 1C6.01667 1 3.83333 3.18333 3.83333 5.91667H1.16667L4.08333 8.83333L7 5.91667H4.66667C4.66667 4.08333 6.26667 2.5 8.08333 2.5C9.01667 2.5 9.93333 2.91667 10.6667 3.5L11.6667 2.33333ZM2.33333 11.6667C3.1 12.4333 4.2 13 5.25 13C7.98333 13 10.1667 10.8167 10.1667 8.08333H12.8333L9.91667 5.16667L7 8.08333H9.33333C9.33333 9.91667 7.73333 11.5 5.91667 11.5C4.98333 11.5 4.06667 11.0833 3.33333 10.5L2.33333 11.6667Z" fill="#7B2CBF"/>
                        </svg>
                        <span>21 visits</span>
                      </div>
                    </div>

                    {/* Customer 5 - John Wilson */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center mb-2">
                        <span className="text-green-700 font-semibold text-lg">JW</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">John Wilson</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 2.33333C10.9 1.56667 9.8 1 8.75 1C6.01667 1 3.83333 3.18333 3.83333 5.91667H1.16667L4.08333 8.83333L7 5.91667H4.66667C4.66667 4.08333 6.26667 2.5 8.08333 2.5C9.01667 2.5 9.93333 2.91667 10.6667 3.5L11.6667 2.33333ZM2.33333 11.6667C3.1 12.4333 4.2 13 5.25 13C7.98333 13 10.1667 10.8167 10.1667 8.08333H12.8333L9.91667 5.16667L7 8.08333H9.33333C9.33333 9.91667 7.73333 11.5 5.91667 11.5C4.98333 11.5 4.06667 11.0833 3.33333 10.5L2.33333 11.6667Z" fill="#7B2CBF"/>
                        </svg>
                        <span>18 visits</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
