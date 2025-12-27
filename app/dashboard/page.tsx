"use client";

import { useState, useEffect } from "react";
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

export default function Dashboard() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (currentBranch?.id) {
      fetchDashboardData();
    }
  }, [currentBranch?.id, branchChangeKey]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">bewe</span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <BranchSelector />
          <div className="relative">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 2C6.68629 2 4 4.68629 4 8C4 11.3137 6.68629 14 10 14C13.3137 14 16 11.3137 16 8C16 4.68629 13.3137 2 10 2Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14V18M6 18H14"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{data.todayAppointments || 5}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2V10M2 6H10" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-green-600 font-medium">3% increase from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Booked Hours */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Booked Hours (All Team)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.bookedHours?.booked || 9}/{data.bookedHours?.total || 18} ({data.bookedHours?.percentage || 50}%)
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2V10M2 6H10" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-green-600 font-medium">3% increase from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* New Customers */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">New Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data.newCustomers || 200}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2V10M2 6H10" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-green-600 font-medium">3% increase from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue - This Week</p>
                    <p className="text-2xl font-bold text-gray-900">${(data.totalRevenue || 920.0).toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 10V2M2 6H10" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-red-600 font-medium">3% decrease from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Top Performers this Week</h2>
                  <button className="text-sm text-primary font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            Staff Member
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            Number of Bookings
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            Rating
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPerformers?.map((performer) => (
                        <tr key={performer.id} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                                {performer.initial}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{performer.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">{performer.bookings} bookings</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M8 1L10.163 5.607L15 6.351L11.5 9.643L12.326 14.5L8 12.107L3.674 14.5L4.5 9.643L1 6.351L5.837 5.607L8 1Z"
                                  fill="#7C3AED"
                                />
                              </svg>
                              <span className="text-sm text-gray-900">{performer.rating}/5.0</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-8">Booking Status</h2>
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
                        <span className="text-sm text-gray-700">Completed</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.completed || 200} bookings</span>
                    </div>
                    {/* Cancelled */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#48CAE4" }}></div>
                        <span className="text-sm text-gray-700">Cancelled</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.cancelled || 10} bookings</span>
                    </div>
                    {/* No Show */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-sm text-gray-700">No Show</span>
                      </div>
                      <span className="text-sm text-gray-600 pl-5">{data.bookingStatus?.noShow || 2} bookings</span>
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
