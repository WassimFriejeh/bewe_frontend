"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getBranches, getCurrentBranch, setCurrentBranch as saveCurrentBranch, Branch, getUser, setUser } from "../utils/token";
import axiosClient from "../libs/axiosClient";

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch) => Promise<void>;
  isLoading: boolean;
  branchChangeKey: number; // Increments when branch changes, triggers refetches
  permissions: string[]; // Current user permissions for the active branch
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branchChangeKey, setBranchChangeKey] = useState(0);
  const [permissions, setPermissions] = useState<string[]>([]);

  const fetchPermissionsForBranch = async (branch: Branch) => {
    if (branch?.id) {
      // TEMPORARY: Bypass API and grant all permissions - remove this override to restore access control
      const allPermissions = [
        "Dashboard",
        "Reports",
        "View Staff",
        "Add Staff",
        "Edit Staff",
        "Delete Staff",
        "Customers",
        "Services & Pricing",
        "Marketing",
        "Memberships",
        "Balance and earnings",
        "Settings",
        "View Reports",
        "View Dashboard",
        "View Customers",
        "View Services",
        "View Marketing",
        "View Memberships",
        "View Balance",
        "View Settings",
        "Create Booking",
        "Add Booking",
        "Edit Booking",
        "View All Bookings",
        "View Own Bookings",
      ];
      
      // Update user permissions in storage
      const user = getUser();
      if (user) {
        const updatedUser = {
          ...user,
          permissions: allPermissions,
        };
        setUser(updatedUser);
      }
      
      // Update state so components can react immediately
      setPermissions(allPermissions);
      
      console.log("TEMPORARY: All permissions granted for branch:", branch.label);
      return;
      
      // Original code (commented out temporarily):
      // try {
      //   // Clear permissions first to avoid showing stale data
      //   setPermissions([]);
      //   
      //   // branch_id will be automatically added by axios interceptor, but we pass it explicitly for clarity
      //   const response = await axiosClient.get("/get-permissions", {
      //     params: { branch_id: branch.id }
      //   });
      //   
      //   console.log("Permissions API response:", response.data);
      //   
      //   // Extract permissions from response - handle the structure: { status, message, data: { permissions: [...] } }
      //   const newPermissions = response.data?.data?.permissions || response.data?.permissions || [];
      //   
      //   console.log("Extracted permissions:", newPermissions);
      //   console.log("Has 'Add Booking':", newPermissions.includes("Add Booking"));
      //   console.log("Branch ID:", branch.id, "Branch Label:", branch.label);
      //   
      //   // Update user permissions in storage
      //   const user = getUser();
      //   if (user) {
      //     const updatedUser = {
      //       ...user,
      //       permissions: newPermissions,
      //     };
      //     setUser(updatedUser);
      //   }
      //   
      //   // Update state so components can react immediately
      //   setPermissions(newPermissions);
      //   
      //   console.log("Permissions state updated for branch:", branch.label, newPermissions);
      // } catch (error) {
      //   console.error("Error fetching permissions for branch:", error);
      //   // On error, clear permissions
      //   setPermissions([]);
      //   const user = getUser();
      //   if (user) {
      //     setUser({ ...user, permissions: [] });
      //   }
      // }
    }
  };

  useEffect(() => {
    // Load branches and current branch from storage
    const loadedBranches = getBranches();
    const loadedCurrentBranch = getCurrentBranch();

    if (loadedBranches.length > 0) {
      setBranches(loadedBranches);
      
      // If there's a saved current branch, use it; otherwise use the first branch
      const branchToUse = loadedCurrentBranch || loadedBranches[0];
      if (branchToUse) {
        setCurrentBranchState(branchToUse);
        if (!loadedCurrentBranch) {
          saveCurrentBranch(branchToUse);
        }
        
        // Fetch permissions for the initial branch
        fetchPermissionsForBranch(branchToUse).then(() => {
          // After fetching, update permissions state from storage
          const user = getUser();
          setPermissions(user?.permissions || []);
        });
      }
    }
    
    setIsLoading(false);
  }, []);

  const setCurrentBranch = async (branch: Branch) => {
    setCurrentBranchState(branch);
    saveCurrentBranch(branch);
    
    // Fetch new permissions for this branch
    await fetchPermissionsForBranch(branch);
    
    // Increment change key to trigger refetches in components
    setBranchChangeKey(prev => prev + 1);
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        setCurrentBranch,
        isLoading,
        branchChangeKey,
        permissions,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}

