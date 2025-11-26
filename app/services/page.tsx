"use client";

import { useState, useEffect } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";

export default function Services() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [servicesData, setServicesData] = useState<any>(null);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchServicesData();
    }
  }, [currentBranch?.id, branchChangeKey]);

  const fetchServicesData = async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      // branch_id is automatically added by axios interceptor
      const response = await axiosClient.get("/services");
      
      const data = response.data.data || response.data;
      setServicesData(data);
    } catch (error) {
      console.error("Error fetching services data:", error);
      setServicesData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Services & Pricing</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <p className="text-gray-600">Loading services...</p>
        ) : (
          <>
            <p className="text-gray-600">Manage services and pricing here.</p>
            {/* Add your services and pricing components here */}
            {servicesData && (
              <div className="mt-4">
                {/* Render services data */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
