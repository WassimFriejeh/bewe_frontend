"use client";

import { useState, useEffect } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";

export default function Dashboard() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchDashboardData();
    }
  }, [currentBranch?.id, branchChangeKey]);

  const fetchDashboardData = async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      // branch_id is automatically added by axios interceptor
      const response = await axiosClient.get("/dashboard");
      
      const data = response.data.data || response.data;
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <p className="text-gray-600">Loading dashboard data...</p>
        ) : (
          <>
            <p className="text-gray-600">Welcome to your dashboard!</p>
            {/* Add your dashboard components here */}
            {dashboardData && (
              <div className="mt-4">
                {/* Render dashboard data */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
