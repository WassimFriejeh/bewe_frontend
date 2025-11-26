"use client";

import { useState, useEffect } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";

export default function Customers() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [customersData, setCustomersData] = useState<any>(null);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchCustomersData();
    }
  }, [currentBranch?.id, branchChangeKey]);

  const fetchCustomersData = async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      // branch_id is automatically added by axios interceptor
      const response = await axiosClient.get("/customers");
      
      const data = response.data.data || response.data;
      setCustomersData(data);
    } catch (error) {
      console.error("Error fetching customers data:", error);
      setCustomersData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <p className="text-gray-600">Loading customers...</p>
        ) : (
          <>
            <p className="text-gray-600">Manage customer information here.</p>
            {/* Add your customer management components here */}
            {customersData && (
              <div className="mt-4">
                {/* Render customers data */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
