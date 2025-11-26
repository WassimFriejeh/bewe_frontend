"use client";

import { useState, useEffect } from "react";
import ProtectedPage from "../../components/ProtectedPage";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";

export default function Reports() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [reportsData, setReportsData] = useState<any>(null);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchReportsData();
    }
  }, [currentBranch?.id, branchChangeKey]);

  const fetchReportsData = async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      // branch_id is automatically added by axios interceptor
      const response = await axiosClient.get("/reports");
      
      const data = response.data.data || response.data;
      setReportsData(data);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      setReportsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoading ? (
            <p className="text-gray-600">Loading reports...</p>
          ) : (
            <>
              <p className="text-gray-600">View and generate reports here.</p>
              {/* Add your reports components here */}
              {reportsData && (
                <div className="mt-4">
                  {/* Render reports data */}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
