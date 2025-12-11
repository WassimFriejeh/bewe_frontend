"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBranch } from "../../contexts/BranchContext";
import { hasPermission, getUserPermissions } from "../../utils/permissions";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import EyeIcon from "../../components/Icons/EyeIcon";
import EyeSlashIcon from "../../components/Icons/EyeSlashIcon";
import Arrow from "../../components/ui/Arrow";
import Popup from "../../components/Popup";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  branch: string;
  branchId?: string | number; // Original branch ID from API
  assignedServices: string[];
  assignedServiceIds?: string[];
  email: string;
  phoneNumber: string;
  rating: number;
  avatar?: string;
  calendarColor?: string;
}

export default function Staff() {
  const { currentBranch, branchChangeKey, permissions: contextPermissions } = useBranch();
  const [view, setView] = useState<"staff-list" | "weekly-schedules">("staff-list");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isAddMemberSidebarOpen, setIsAddMemberSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editFormInitialStep, setEditFormInitialStep] = useState(1);
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false);
  const [returnToSidebar, setReturnToSidebar] = useState(false);

  // Use permissions from context
  const canAddStaff = contextPermissions.includes("Add Staff");
  const canEditStaff = contextPermissions.includes("Edit Staff");
  const canDeleteStaff = contextPermissions.includes("Delete Staff");

  const fetchStaffMembers = useCallback(async () => {
    if (!currentBranch) return;

    setIsLoading(true);
    try {
      const response = await axiosClient.get("/staff/get", {
        params: { branch_id: currentBranch.id },
      });
      
      const staffData = response.data?.data?.staff || [];
      
      // Transform API data to match our interface
      const transformedData = staffData.map((member: any) => {
        const firstName = member.first_name || "";
        const lastName = member.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || "Staff Member";
        
        // Map services to service names
        const serviceNames = member.services 
          ? member.services.map((service: any) => service.label || service.name || "Service")
          : [];
        
        // Get service IDs from services_ids or from services array
        const serviceIds = member.services_ids 
          ? member.services_ids.map((id: any) => String(id))
          : (member.services 
              ? member.services.map((service: any) => String(service.id))
              : []);
        
        // Get avatar from image object - always use image field
        const avatarUrl = (member.image?.image && member.image.image.trim() !== "")
          ? member.image.image
          : null;
        
        return {
          id: String(member.id),
          name: fullName,
          role: member.job_title || "Staff",
          branch: currentBranch.label || "Branch",
          branchId: member.branch_id || currentBranch.id, // Store original branch ID
          assignedServices: serviceNames,
          assignedServiceIds: serviceIds,
          email: member.email || "",
          phoneNumber: member.phone_number || "",
          rating: 4.0, // Default rating as it's not in API
          avatar: avatarUrl,
          calendarColor: member.calendar_color || "#9CA3AF", // Default to gray if not set
        };
      });

      setStaffMembers(transformedData);
    } catch (error) {
      console.error("Error fetching staff members:", error);
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    if (currentBranch) {
      fetchStaffMembers();
    }
  }, [currentBranch?.id, branchChangeKey, fetchStaffMembers]);

  const handleRowClick = (member: StaffMember) => {
    setStaffToEdit(member);
    setIsEditSidebarOpen(true); // Open staff details sidebar
  };

  const handleEditClick = (member: StaffMember) => {
    setStaffToEdit(member);
    setIsEditFormOpen(true);
    setEditFormInitialStep(1);
    setReturnToSidebar(false); // Coming from listing, don't return to sidebar
  };

  const handleDeleteClick = (member: StaffMember) => {
    setStaffToDelete(member);
    setIsDeletePopupOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeletePopupOpen(false);
    setStaffToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete || !currentBranch) return;

    setIsDeleting(true);
    try {
      await axiosClient.post("/staff/delete", {
        branch_id: currentBranch.id,
        staff_id: staffToDelete.id,
      });

      // Close popup and refresh staff list
      setIsDeletePopupOpen(false);
      setStaffToDelete(null);
      
      // Reset to page 1 after deletion
      setCurrentPage(1);
      
      fetchStaffMembers();
    } catch (error) {
      console.error("Error deleting staff member:", error);
      console.error("Failed to delete staff member. Please try again.", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedStaff = () => {
    if (!sortColumn) return staffMembers;

    return [...staffMembers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "Staff Member":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "Role":
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case "Branch":
          aValue = a.branch.toLowerCase();
          bValue = b.branch.toLowerCase();
          break;
        case "Assigned Services":
          // Sort by number of services first, then alphabetically by first service name
          if (a.assignedServices.length === 0 && b.assignedServices.length === 0) {
            aValue = "";
            bValue = "";
          } else if (a.assignedServices.length === 0) {
            aValue = "zzz"; // Empty services go to the end
            bValue = b.assignedServices[0]?.toLowerCase() || "";
          } else if (b.assignedServices.length === 0) {
            aValue = a.assignedServices[0]?.toLowerCase() || "";
            bValue = "zzz"; // Empty services go to the end
          } else {
            // Sort alphabetically by first service name
            aValue = a.assignedServices[0]?.toLowerCase() || "";
            bValue = b.assignedServices[0]?.toLowerCase() || "";
          }
          break;
        case "Email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "Phone Number":
          aValue = a.phoneNumber;
          bValue = b.phoneNumber;
          break;
        case "Rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredStaff = () => {
    const sorted = getSortedStaff();
    if (!searchQuery) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
    );
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredStaff = getFilteredStaff();
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  const getAvatarColor = (name: string) => {
    // Match specific colors from the design
    const firstLetter = name.charAt(0).toUpperCase();
    const colorMap: { [key: string]: string } = {
      'K': 'bg-pink-200 text-pink-700',
      'J': 'bg-cyan-200 text-cyan-700',
      'M': 'bg-purple-200 text-purple-700',
    };
    return colorMap[firstLetter] || 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Staff List</span>
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
              onClick={() => setView("staff-list")}
              className={`flex h-full items-center cursor-pointer gap-2 py-3 text-xs font-medium transition-all relative ${
                view === "staff-list"
                  ? "text-black opacity-100"
                  : "text-black opacity-50 hover:opacity-100"
              }`}
            >
              {view === "staff-list" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-black"></span>
              )}
              <svg width="22" height="13" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={view === "staff-list" ? "opacity-100" : "opacity-50"}>
                <g opacity={view === "staff-list" ? "1" : "0.5"}>
                  <path d="M1 2.4C1 1.2417 1.19338 1 2.12 1H15.88C16.8066 1 17 1.2417 17 2.4V3.6C17 4.7583 16.8066 5 15.88 5H2.12C1.19338 5 1 4.7583 1 3.6V2.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                  <path d="M5 9.4C5 8.2417 5.19338 8 6.12 8H19.88C20.8066 8 21 8.2417 21 9.4V10.6C21 11.7583 20.8066 12 19.88 12H6.12C5.19338 12 5 11.7583 5 10.6V9.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </g>
              </svg>
              Staff List
            </button>
            <button
              onClick={() => setView("weekly-schedules")}
              className={`flex h-full items-center cursor-pointer gap-2 py-2 text-xs font-medium transition-all relative ${
                view === "weekly-schedules"
                  ? "text-black opacity-100"
                  : "text-black opacity-50 hover:opacity-100"
              }`}
            >
              {view === "weekly-schedules" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-black"></span>
              )}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={view === "weekly-schedules" ? "opacity-100" : "opacity-50"}>
                <g opacity={view === "weekly-schedules" ? "1" : "0.8"}>
                  <path d="M13.3334 1.6665V4.99984M6.66669 1.6665V4.99984" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.8334 3.3335H9.16669C6.02399 3.3335 4.45264 3.3335 3.47633 4.3098C2.50002 5.28612 2.50002 6.85746 2.50002 10.0002V11.6668C2.50002 14.8095 2.50002 16.3809 3.47633 17.3572C4.45264 18.3335 6.02399 18.3335 9.16669 18.3335H10.8334C13.976 18.3335 15.5474 18.3335 16.5237 17.3572C17.5 16.3809 17.5 14.8095 17.5 11.6668V10.0002C17.5 6.85746 17.5 5.28612 16.5237 4.3098C15.5474 3.3335 13.976 3.3335 10.8334 3.3335Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.50002 8.3335H17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.99625 11.6665H10.0038M9.99625 14.9998H10.0038M13.3258 11.6665H13.3334M6.66669 11.6665H6.67414M6.66669 14.9998H6.67414" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
              Weekly Schedules
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
    <div className="p-6">
        {view === "staff-list" ? (
          <>
            {/* Team Members Section */}
            <div>
              {/* Top Section: Heading and Add Team Member Button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-black">Team Members</h2>
              </div>
              
              {/* Bottom Section: Search and Sort By */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 max-w-md">
                  <SearchInput
                    placeholder="Search by member name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {canAddStaff && (
                  <Button 
                    variant="primary" 
                    className="flex items-center gap-2"
                    onClick={() => setIsAddMemberSidebarOpen(true)}
                  >
                    Add Team Member
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                )}
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-gray-200 ">
                    <tr>
                      {["Staff Member", "Role", "Branch", "Assigned Services", "Email", "Phone Number", "Rating", "Actions"].map((header) => {
                        const isSorted = sortColumn === header;
                        return (
                          <th
                            key={header}
                            onClick={() => handleSort(header)}
                            className={`group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize ${
                              header !== "Actions" ? "cursor-pointer" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {header}
                              {header !== "Actions" && (
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
                              )}
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
                          Loading staff members...
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No staff members found
                        </td>
                      </tr>
                    ) : (
                      paginatedStaff.map((member) => (
                        <tr 
                          key={member.id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(member)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {member.avatar ? (
                                <img 
                                  src={member.avatar} 
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-normal text-white"
                                  style={{ backgroundColor: member.calendarColor || "#9CA3AF" }}
                                >
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-xs font-normal text-black/80">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80 capitalize">{member.role}</td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">{member.branch}</td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">
                            {member.assignedServices.length > 0 ? (
                              <div>
                                <span>{member.assignedServices.slice(0, 2).join(", ")}</span>
                                {member.assignedServices.length > 2 && (
                                  <>
                                    <span>. </span>
                                    <button 
                                      className="text-primary hover:underline cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setStaffToEdit(member);
                                        setIsEditServicesOpen(true);
                                      }}
                                    >
                                      ... +{member.assignedServices.length - 2} more
                                    </button>
                                  </>
                                )}
              </div>
                            ) : (
                              <span className="text-black/80">No services</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">{member.email}</td>
                          <td className="px-5 py-4 text-xs font-normal text-black/80">{member.phoneNumber}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 19 19" fill="none">
                                <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-xs font-normal text-black/80">{member.rating}/5.0</span>
                            </div>
                          </td>
                          <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {canEditStaff && (
                                <div className="h-[32px] w-[32px]" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(member);
                                }}>
                                  <EditIcon />
                                </div>
                              )}
                              {canDeleteStaff && <DeleteIcon onClick={() => handleDeleteClick(member)} />}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredStaff.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {paginatedStaff.length} out of {filteredStaff.length}
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
            )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-black mb-4">Weekly Schedules</h2>
            <p className="text-gray-600">Weekly schedules view will be implemented later</p>
          </div>
        )}
      </div>

      {/* Add Team Member Sidebar */}
      {canAddStaff && isAddMemberSidebarOpen && (
        <AddTeamMemberSidebar
          onClose={() => setIsAddMemberSidebarOpen(false)}
          onSave={() => {
            fetchStaffMembers();
            setIsAddMemberSidebarOpen(false);
          }}
        />
      )}

      {/* Edit Team Member Sidebar */}
      {canEditStaff && isEditFormOpen && staffToEdit && (
        <AddTeamMemberSidebar
          editStaff={staffToEdit}
          initialStep={editFormInitialStep}
          onClose={() => {
            setIsEditFormOpen(false);
            if (returnToSidebar && staffToEdit) {
              // Return to EditStaffSidebar
              setIsEditSidebarOpen(true);
              setReturnToSidebar(false);
            } else {
              // Close completely
              setStaffToEdit(null);
              setEditFormInitialStep(1);
            }
          }}
          onSave={() => {
            fetchStaffMembers();
            setIsEditFormOpen(false);
            if (returnToSidebar && staffToEdit) {
              // Return to EditStaffSidebar
              setIsEditSidebarOpen(true);
              setReturnToSidebar(false);
            } else {
              // Close completely
              setStaffToEdit(null);
              setEditFormInitialStep(1);
            }
          }}
        />
      )}

      {/* Edit Staff Sidebar */}
      {canEditStaff && isEditSidebarOpen && staffToEdit && (
        <EditStaffSidebar
          staff={staffToEdit}
          onClose={() => {
            setIsEditSidebarOpen(false);
            setStaffToEdit(null);
          }}
          onSave={() => {
            fetchStaffMembers();
            setIsEditSidebarOpen(false);
            setStaffToEdit(null);
          }}
          onEditProfile={() => {
            setIsEditFormOpen(true);
            setEditFormInitialStep(1);
            setIsEditSidebarOpen(false);
            setReturnToSidebar(true); // Mark that we should return to sidebar when closing
          }}
          onEditServices={() => {
            setIsEditServicesOpen(true);
            setIsEditSidebarOpen(false);
          }}
        />
      )}

      {/* Edit Services Sidebar */}
      {canEditStaff && isEditServicesOpen && staffToEdit && (
        <EditServicesSidebar
          staff={staffToEdit}
          onClose={() => {
            setIsEditServicesOpen(false);
            setStaffToEdit(null);
          }}
          onSave={() => {
            fetchStaffMembers();
            setIsEditServicesOpen(false);
            setStaffToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleDeleteCancel}
        title="Delete Staff Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{staffToDelete?.name}</span>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="transparent"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              No
            </Button>
            <Button
              variant="transparent-red"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes"}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}

// Add Team Member Sidebar Component
// Edit Staff Sidebar Component
function EditStaffSidebar({
  staff,
  onClose,
  onSave,
  onEditProfile,
  onEditServices,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSave: () => void;
  onEditProfile: () => void;
  onEditServices: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"services" | "overview" | "reviews">("services");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getAvatarColor = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    const colorMap: { [key: string]: string } = {
      'K': 'bg-pink-200 text-pink-700',
      'J': 'bg-cyan-200 text-cyan-700',
      'M': 'bg-purple-200 text-purple-700',
    };
    return colorMap[firstLetter] || 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center gap-4 z-10">
          <button
            onClick={handleClose}
            className="cursor-pointer opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold">Staff Details</h2>
          <div className="w-6"></div>
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {staff.avatar ? (
              <img 
                src={staff.avatar} 
                alt={staff.name}
                className="w-26 h-26 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-26 h-26 rounded-full flex items-center justify-center text-2xl font-normal text-white"
                style={{ backgroundColor: staff.calendarColor || "#9CA3AF" }}
              >
                {staff.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-5 py-2 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {staff.role}
                </span>
                <span className="px-5 py-2 bg-[#48CAE41A]  text-secondary text-xs font-medium rounded-full">
                  {staff.branch}
                </span>
              </div>
              <h3 className="text-base font-normal text-black mb-1">{staff.name}</h3>
              <p className="text-xs text-black/50">{staff.email}</p>
              <p className="text-xs text-black/50 mt-1">{staff.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className=" px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border border-black/20 rounded-[5px] cursor-pointer ${
                activeTab === "services"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              Offered Services
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border border-black/20 rounded-[5px] cursor-pointer ${
                activeTab === "overview"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border border-black/20 rounded-[5px] cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              Rating & Reviews
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1">
          {activeTab === "services" && (
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Offered Services</h3>
              {staff.assignedServices.length > 0 ? (
                <div className="space-y-3">
                  {staff.assignedServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-black">{service}</p>
                        <p className="text-xs text-gray-500 mt-1">30 min</p>
                      </div>
                      <p className="text-sm font-semibold text-black">$20.00</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-black/50">No services assigned</p>
              )}
            </div>
          )}

          {activeTab === "overview" && (
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Overview</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-[#00000014]">
                  <p className="text-xs text-black/50 mb-1">Total Sales</p>
                  <p className="text-xl font-bold text-black">1,000 USD</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-[#00000014]">
                    <p className="text-xs text-black/50 mb-1">Total appointments</p>
                    <p className="text-xl font-bold text-black">100</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#00000014]">
                    <p className="text-xs text-black/50 mb-1">Total Occupancy (in %)</p>
                    <p className="text-xl font-bold text-black">20%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Rating & Reviews</h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="flex gap-3">
                  <svg className="mt-1.5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 19 19" fill="none">
                    <path d="M10.5245 1.95348L11.991 4.91073C12.191 5.32239 12.7242 5.71725 13.1742 5.79286L15.8322 6.23812C17.532 6.52377 17.932 7.76716 16.7071 8.99375L14.6407 11.0772C14.2907 11.4301 14.0991 12.1106 14.2074 12.5979L14.799 15.1771C15.2656 17.2186 14.1907 18.0083 12.3993 16.9413L9.90788 15.4543C9.45796 15.1855 8.71638 15.1855 8.25805 15.4543L5.76669 16.9413C3.98355 18.0083 2.90034 17.2102 3.36696 15.1771L3.95856 12.5979C4.06687 12.1106 3.87523 11.4301 3.52526 11.0772L1.45883 8.99375C0.242298 7.76716 0.633923 6.52377 2.33373 6.23812L4.99177 5.79286C5.43339 5.71725 5.96666 5.32239 6.16664 4.91073L7.63313 1.95348C8.43305 0.34884 9.73288 0.34884 10.5245 1.95348Z" fill="#7B2CBF" stroke="#7B2CBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p className="text-lg font-semibold text-black/80">{staff.rating}/5.0</p>
                    <p className="text-xs text-black/60">10 reviews</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {/* Mock review cards - replace with API data */}
                {[1, 2, 3].map((review) => (
                  <div key={review} className="bg-white p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-[13px] text-black font-semibold">
                        J
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="text-[13px] text-black">Jane Doe</p>
                            <p className="text-xs text-black/50">Appointment #1625 | {staff.name}</p>
                          </div>
                          <p className="text-xs text-black/40">22/11/2025</p>
                        </div>
                        <p className="text-xs text-black/60 mt-2">
                          Lorem ipsum dolor sit amet consectetur. Id metus arcu turpis ultricies. Integer venenatis est purus orci vivamus amet.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 mt-auto bg-white border-t border-gray-200 px-6 py-4 flex items-center">
          <Button
            variant="transparent"
            onClick={() => {
              onEditProfile();
              handleClose();
            }}
            className="w-[30%]"
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // Navigate to calendar view
              console.log("View Calendar");
            }}
            className="w-[70%] ml-4"
          >
            View Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddTeamMemberSidebar({
  editStaff,
  initialStep = 1,
  onClose,
  onSave,
}: {
  editStaff?: StaffMember | null;
  initialStep?: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const { branches, currentBranch } = useBranch();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);
  
  // Parse name into first and last name
  const parseName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  };

  // Initialize personal info from editStaff if provided
  const initializePersonalInfo = () => {
    if (editStaff) {
      const { firstName, lastName } = parseName(editStaff.name);
      // Extract phone number and country code from phoneNumber
      const phoneMatch = editStaff.phoneNumber.match(/^(\+\d+)\s*(.+)$/);
      const countryCode = phoneMatch ? phoneMatch[1] : "+961";
      const phone = phoneMatch ? phoneMatch[2] : editStaff.phoneNumber;
      
      return {
        profilePhoto: null as File | null,
        profilePhotoUrl: editStaff.avatar || null,
        firstName: firstName,
        lastName: lastName,
        email: editStaff.email,
        phone: phone,
        countryCode: countryCode,
        countryFlag: "🇱🇧", // Will be set by intl-tel-input
        jobTitle: editStaff.role,
        branch: editStaff.branchId ? String(editStaff.branchId) : (currentBranch?.id ? String(currentBranch.id) : ""), // Use branchId from staff member
        oldBranchId: editStaff.branchId || currentBranch?.id || "", // Store original branch ID
        calendarColor: editStaff.calendarColor || "#EF4444", // Use actual calendar color from API
        password: "", // Password not shown in edit mode
        passwordConfirmation: "", // Password confirmation not shown in edit mode
      };
    }
    return {
      profilePhoto: null as File | null,
      profilePhotoUrl: null as string | null,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+961",
      countryFlag: "🇱🇧",
      jobTitle: "",
      branch: currentBranch?.id || "",
      calendarColor: "#EF4444", // red
      password: "",
      passwordConfirmation: "",
    };
  };
  
  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState(initializePersonalInfo());
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Step 2: Assign Services
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectAllServices, setSelectAllServices] = useState(false);
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Step 3: Working Days & Hours
  // Day index mapping: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const [workingDays, setWorkingDays] = useState<{
    [key: number]: {
      enabled: boolean;
      shifts: Array<{ start_time: string; end_time: string }>;
    };
  }>({
    0: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Monday
    1: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Tuesday
    2: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Wednesday
    3: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Thursday
    4: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Friday
    5: { enabled: true, shifts: [{ start_time: "10:00 am", end_time: "02:00 pm" }] }, // Saturday
    6: { enabled: false, shifts: [] }, // Sunday
  });

  // Track which days exist in branch opening_hours (to disable toggles for days that don't exist)
  // null means we haven't fetched yet, empty Set means no days available, Set with values means those days are available
  const [branchAvailableDays, setBranchAvailableDays] = useState<Set<number> | null>(null);

  const steps = ["Personal Info", "Assign Services", "Working Days & Hours"];
  const calendarColors = [
    "#EF4444", // red
    "#F87171", // light red/pink
    "#F472B6", // pink
    "#A855F7", // purple
    "#22D3EE", // cyan
    "#3B82F6", // blue
    "#10B981", // green
    "#EAB308", // yellow
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesFull = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Helper function to format workingDays for API (with day names and 24-hour time format)
  const formatWorkingHoursForAPI = (workingDays: {
    [key: number]: {
      enabled: boolean;
      shifts: Array<{ start_time: string; end_time: string }>;
    };
  }) => {
    return Object.keys(workingDays).map((dayIndexStr) => {
      const dayIndex = parseInt(dayIndexStr, 10);
      const day = workingDays[dayIndex];
      
      return {
        day: dayNamesFull[dayIndex],
        enabled: day.enabled,
        shifts: day.shifts.map((shift) => ({
          start_time: convertTo24Hour(shift.start_time),
          end_time: convertTo24Hour(shift.end_time),
        })),
      };
    });
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convert24To12Hour = (time24h: string): string => {
    if (!time24h) return "10:00 am";
    
    const time = time24h.trim().replace(/\s+/g, ''); // Remove all spaces
    // Check if already in 12-hour format
    if (/^\d{1,2}:\d{2}(am|pm)$/i.test(time)) {
      // Format with space: "HH:MM am/pm"
      const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
      if (match) {
        return `${match[1]}:${match[2]} ${match[3].toLowerCase()}`;
      }
      return time;
    }
    
    // Parse 24-hour format (HH:MM or HH:MM:SS)
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
    
    // Fallback to default
    return "10:00 am";
  };

  // Helper function to parse opening_hours and convert to workingDays format
  const parseOpeningHours = (openingHours: any) => {
    // Initialize all days as disabled
    const initialWorkingDays: {
      [key: number]: {
        enabled: boolean;
        shifts: Array<{ start_time: string; end_time: string }>;
      };
    } = {
      0: { enabled: false, shifts: [] }, // Monday
      1: { enabled: false, shifts: [] }, // Tuesday
      2: { enabled: false, shifts: [] }, // Wednesday
      3: { enabled: false, shifts: [] }, // Thursday
      4: { enabled: false, shifts: [] }, // Friday
      5: { enabled: false, shifts: [] }, // Saturday
      6: { enabled: false, shifts: [] }, // Sunday
    };

    if (!openingHours) {
      return initialWorkingDays;
    }

    // Day name to index mapping
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

    // Handle both array and object formats
    let entries: any[] = [];
    
    if (Array.isArray(openingHours)) {
      entries = openingHours;
    } else if (typeof openingHours === 'object') {
      // Convert object with numeric keys to array
      entries = Object.values(openingHours);
    } else {
      return initialWorkingDays;
    }

    // Process each opening hour entry
    entries.forEach((entry: any) => {
      if (!entry || !entry.day || !entry.from || !entry.to) return;

      const dayStr = entry.day.trim().toLowerCase();
      const fromTime = convert24To12Hour(entry.from);
      const toTime = convert24To12Hour(entry.to);

      // Check if it's a range (e.g., "Monday - Friday")
      if (dayStr.includes("-") || dayStr.includes("to")) {
        const rangeMatch = dayStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*[-to]+\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
        if (rangeMatch) {
          const startDay = rangeMatch[1].toLowerCase();
          const endDay = rangeMatch[2].toLowerCase();
          const startIndex = dayNameToIndex[startDay];
          const endIndex = dayNameToIndex[endDay];

          if (startIndex !== undefined && endIndex !== undefined) {
            // Enable all days in the range
            for (let i = startIndex; i <= endIndex; i++) {
              initialWorkingDays[i] = {
                enabled: true,
                shifts: [{ start_time: fromTime, end_time: toTime }],
              };
            }
          }
        }
      } else {
        // Single day
        const dayIndex = dayNameToIndex[dayStr];
        if (dayIndex !== undefined) {
          initialWorkingDays[dayIndex] = {
            enabled: true,
            shifts: [{ start_time: fromTime, end_time: toTime }],
          };
        }
      }
    });

    return initialWorkingDays;
  };

  // Fetch services from API
  const fetchServices = async () => {
    if (!currentBranch?.id) return;
    
    setIsLoadingServices(true);
    try {
      const response = await axiosClient.get("/services/get", {
        params: { branch_id: currentBranch.id },
      });
      const servicesData = response.data?.data?.services || {};
      
      // Transform API response to match our format
      const transformedServices: Array<{ id: string; name: string; category: string }> = [];
      
      // Iterate through each category (e.g., "Hair", "Body")
      Object.keys(servicesData).forEach((categoryName) => {
        const categoryServices = servicesData[categoryName] || [];
        categoryServices.forEach((service: any) => {
          transformedServices.push({
            id: String(service.id),
            name: service.label || service.name || "Service",
            category: categoryName,
          });
        });
      });
      
      setServices(transformedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const categories = Array.from(new Set(services.map(s => s.category)));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Fetch services when step 2 is accessed or when branch changes
  useEffect(() => {
    if (currentStep === 2 && currentBranch?.id && services.length === 0 && !isLoadingServices) {
      fetchServices();
    }
  }, [currentStep, currentBranch?.id]);

  // Initialize selected services when in edit mode and navigating to step 2
  useEffect(() => {
    if (editStaff && currentStep === 2 && services.length > 0 && !isLoadingServices) {
      let validServiceIds: string[] = [];
      
      // First try to use service IDs if available (more reliable)
      if (editStaff.assignedServiceIds && editStaff.assignedServiceIds.length > 0) {
        // Filter to only include IDs that exist in the fetched services
        validServiceIds = editStaff.assignedServiceIds.filter(id => 
          services.some(s => s.id === id)
        );
        setSelectedServices(validServiceIds);
        setSelectAllServices(validServiceIds.length === services.length && services.length > 0);
      } else if (editStaff.assignedServices.length > 0) {
        // Fallback: Match staff's service names with service IDs (case-insensitive, trimmed)
        validServiceIds = services
          .filter(s => {
            const serviceName = s.name.trim().toLowerCase();
            return editStaff.assignedServices.some(
              assignedName => assignedName.trim().toLowerCase() === serviceName
            );
          })
          .map(s => s.id);
        
        setSelectedServices(validServiceIds);
        setSelectAllServices(validServiceIds.length === services.length && services.length > 0);
      }
      
      // Expand categories that contain selected services
      if (validServiceIds.length > 0) {
        const categoriesWithSelectedServices = new Set<string>();
        validServiceIds.forEach(serviceId => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            categoriesWithSelectedServices.add(service.category);
          }
        });
        setExpandedCategories(categoriesWithSelectedServices);
      }
    }
  }, [currentStep, services, editStaff, isLoadingServices]);

  // Helper function to get which days exist in branch opening_hours
  const getBranchAvailableDays = (openingHours: any): Set<number> => {
    const availableDays = new Set<number>();
    
    if (!openingHours) {
      return availableDays;
    }

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

    // Handle both array and object formats
    let entries: any[] = [];
    
    if (Array.isArray(openingHours)) {
      entries = openingHours;
    } else if (typeof openingHours === 'object') {
      // Convert object with numeric keys to array
      entries = Object.values(openingHours);
    } else {
      return availableDays;
    }

    entries.forEach((entry: any) => {
      if (!entry || !entry.day) return;

      const dayStr = entry.day.trim().toLowerCase();

      // Check if it's a range (e.g., "Monday - Friday")
      if (dayStr.includes("-") || dayStr.includes("to")) {
        const rangeMatch = dayStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*[-to]+\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
        if (rangeMatch) {
          const startDay = rangeMatch[1].toLowerCase();
          const endDay = rangeMatch[2].toLowerCase();
          const startIndex = dayNameToIndex[startDay];
          const endIndex = dayNameToIndex[endDay];

          if (startIndex !== undefined && endIndex !== undefined) {
            for (let i = startIndex; i <= endIndex; i++) {
              availableDays.add(i);
            }
          }
        }
      } else {
        // Single day
        const dayIndex = dayNameToIndex[dayStr];
        if (dayIndex !== undefined) {
          availableDays.add(dayIndex);
        }
      }
    });

    return availableDays;
  };

  // Initialize working days from branch opening_hours when step 3 is accessed (for new staff only)
  useEffect(() => {
    const fetchBranchDetails = async (branchId: string | number) => {
      try {
        const response = await axiosClient.get("/branch/get", {
          params: { branch_id: branchId },
        });
        
        console.log("🔍 Branch API Response:", response.data);
        
        const branchData = response.data?.data?.branch || response.data?.branch || response.data?.data || response.data;
        console.log("🔍 Branch Data:", branchData);
        
        const openingHours = branchData?.opening_hours;
        console.log("🔍 Opening Hours:", openingHours);
        console.log("🔍 Opening Hours Type:", typeof openingHours, "Is Array:", Array.isArray(openingHours), "Is Object:", typeof openingHours === 'object');
        
        // Check if opening_hours exists (can be array or object)
        const hasOpeningHours = openingHours && (
          (Array.isArray(openingHours) && openingHours.length > 0) ||
          (typeof openingHours === 'object' && Object.keys(openingHours).length > 0)
        );
        
        if (hasOpeningHours) {
          console.log("🔍 Parsing opening hours...");
          const parsedWorkingDays = parseOpeningHours(openingHours);
          console.log("🔍 Parsed Working Days:", parsedWorkingDays);
      setWorkingDays(parsedWorkingDays);
          const availableDays = getBranchAvailableDays(openingHours);
          console.log("🔍 Available Days:", Array.from(availableDays));
          setBranchAvailableDays(availableDays);
        } else {
          console.warn("⚠️ No opening_hours found or empty array");
          // If no opening_hours, allow all days to be enabled (user can set their own hours)
          // Don't restrict based on branch hours if branch has no hours defined
          setBranchAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6])); // Allow all days
          // Keep current workingDays state or initialize with defaults
          if (Object.values(workingDays).every(day => !day.enabled && day.shifts.length === 0)) {
            // Only reset if all days are disabled
            setWorkingDays({
              0: { enabled: false, shifts: [] },
              1: { enabled: false, shifts: [] },
              2: { enabled: false, shifts: [] },
              3: { enabled: false, shifts: [] },
              4: { enabled: false, shifts: [] },
              5: { enabled: false, shifts: [] },
              6: { enabled: false, shifts: [] },
            });
          }
        }
      } catch (error) {
        console.error("❌ Error fetching branch details:", error);
        // On error, allow all days (don't restrict if we can't fetch branch hours)
        setBranchAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6])); // Allow all days
        // Keep current workingDays state
        if (Object.values(workingDays).every(day => !day.enabled && day.shifts.length === 0)) {
          // Only reset if all days are disabled
          setWorkingDays({
            0: { enabled: false, shifts: [] },
            1: { enabled: false, shifts: [] },
            2: { enabled: false, shifts: [] },
            3: { enabled: false, shifts: [] },
            4: { enabled: false, shifts: [] },
            5: { enabled: false, shifts: [] },
            6: { enabled: false, shifts: [] },
          });
        }
      }
    };

    if (currentStep === 3 && !editStaff) {
      // Get the branch selected in step 1, not the global currentBranch
      const selectedBranchId = personalInfo.branch;
      
      if (selectedBranchId) {
        // Fetch branch details from API
        fetchBranchDetails(selectedBranchId);
      } else {
        // If no branch selected, allow all days
        setBranchAvailableDays(new Set([0, 1, 2, 3, 4, 5, 6])); // Allow all days
        // Keep current workingDays state
        if (Object.values(workingDays).every(day => !day.enabled && day.shifts.length === 0)) {
          // Only reset if all days are disabled
          setWorkingDays({
            0: { enabled: false, shifts: [] },
            1: { enabled: false, shifts: [] },
            2: { enabled: false, shifts: [] },
            3: { enabled: false, shifts: [] },
            4: { enabled: false, shifts: [] },
            5: { enabled: false, shifts: [] },
            6: { enabled: false, shifts: [] },
          });
        }
      }
    } else if (!editStaff && personalInfo.branch) {
      // Also update branchAvailableDays when branch selection changes (even if not on step 3 yet)
      const selectedBranchId = personalInfo.branch;
      fetchBranchDetails(selectedBranchId);
    }
  }, [currentStep, personalInfo.branch, editStaff]);

  // Initialize intl-tel-input
  useEffect(() => {
    if (phoneInputRef.current && currentStep === 1) {
      if (!itiRef.current) {
        itiRef.current = intlTelInput(phoneInputRef.current, {
          initialCountry: "lb",
          utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
        } as any);

        // Listen for country change
        phoneInputRef.current.addEventListener('countrychange', () => {
          if (itiRef.current) {
            const countryData = itiRef.current.getSelectedCountryData();
            setPersonalInfo(prev => ({
              ...prev,
              countryCode: `+${countryData.dialCode}`,
            }));
          }
        });

        // Listen for phone number input
        phoneInputRef.current.addEventListener('input', () => {
          if (phoneInputRef.current && itiRef.current) {
            setPersonalInfo(prev => ({
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
  }, [currentStep]);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSaveStep = async (step: number) => {
    if (!editStaff || !currentBranch) return;

    try {
      if (step === 1) {
        // Save personal info/details
        const phoneNumber = `${personalInfo.countryCode} ${personalInfo.phone}`;
        
        // Debug: Log branch values
        console.log("🔍 Branch Debug BEFORE API call:", {
          personalInfoBranch: personalInfo.branch,
          oldBranchId: (personalInfo as any).oldBranchId,
          branchType: typeof personalInfo.branch,
          currentBranchId: currentBranch?.id,
          fullPersonalInfo: personalInfo,
        });
        
        // Use FormData if profile image is being uploaded, otherwise use regular JSON
        if (personalInfo.profilePhoto) {
          const formData = new FormData();
          formData.append('staff_id', editStaff.id);
          formData.append('first_name', personalInfo.firstName);
          formData.append('last_name', personalInfo.lastName);
          formData.append('email', personalInfo.email);
          formData.append('phone_number', phoneNumber);
          formData.append('job_title', personalInfo.jobTitle);
          formData.append('branch_id', String(Number(currentBranch?.id))); // Current branch for permissions
          formData.append('old_branch_id', String(Number((personalInfo as any).oldBranchId || personalInfo.branch))); // Original branch
          formData.append('new_branch_id', String(Number(personalInfo.branch))); // New selected branch
          formData.append('calendar_color', personalInfo.calendarColor);
          formData.append('profile_image', personalInfo.profilePhoto);
          
          // Debug: Log FormData contents
          console.log("🔍 FormData contents:");
          for (let pair of formData.entries()) {
            console.log(pair[0] + ': ', pair[1] instanceof File ? `[File: ${pair[1].name}, ${pair[1].size} bytes, type: ${pair[1].type}]` : pair[1]);
          }
          console.log("🔍 Profile photo file:", personalInfo.profilePhoto);
          console.log("🔍 Is File instance?", personalInfo.profilePhoto instanceof File);
          
          // The interceptor will handle removing Content-Type for FormData
          // axios/browser will automatically set Content-Type with boundary
          await axiosClient.post(`/staff/edit/details`, formData);
        } else {
          // Ensure branch_id is an integer, not a string
          const requestData = {
            staff_id: editStaff.id,
            first_name: personalInfo.firstName,
            last_name: personalInfo.lastName,
            email: personalInfo.email,
            phone_number: phoneNumber,
            job_title: personalInfo.jobTitle,
            branch_id: Number(currentBranch?.id), // Current branch for permissions
            old_branch_id: Number((personalInfo as any).oldBranchId || personalInfo.branch), // Original branch
            new_branch_id: Number(personalInfo.branch), // New selected branch
            calendar_color: personalInfo.calendarColor,
          };
          
          console.log("🔍 Request data being sent:", requestData);
          
          await axiosClient.post(`/staff/edit/details`, requestData);
        }
      } else if (step === 2) {
        // Save services
        await axiosClient.post(`/staff/edit/services`, {
          staff_id: editStaff.id,
          services_ids: selectedServices,
        });
      } else if (step === 3) {
        // Save working hours - format with day names and 24-hour time format
        const formattedWorkingHours = formatWorkingHoursForAPI(workingDays);
        await axiosClient.post(`/staff/edit/hours`, {
          staff_id: editStaff.id,
          working_hours: formattedWorkingHours,
        });
      }
    } catch (error: any) {
      console.error(`Error saving step ${step}:`, error);
      console.error(`Error response:`, error?.response?.data);
      console.error(`Error status:`, error?.response?.status);
      console.error(`Error response full:`, JSON.stringify(error?.response?.data, null, 2));
      
      // Log detailed error message
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || `Failed to save step ${step}. Please try again.`;
      
      console.error(`Error message:`, errorMessage);
      
      // Log validation errors if present
      if (error?.response?.data?.errors) {
        console.error(`Validation errors:`, error?.response?.data?.errors);
      }
      
      throw error;
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAllServices) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s.id));
    }
    setSelectAllServices(!selectAllServices);
  };

  const addShift = (dayIndex: number) => {
    setWorkingDays(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        shifts: [...prev[dayIndex].shifts, { start_time: "10:00 am", end_time: "02:00 pm" }],
      },
    }));
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    setWorkingDays(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        shifts: prev[dayIndex].shifts.filter((_, i) => i !== shiftIndex),
      },
    }));
  };

  // Helper functions to convert between 12-hour format (with am/pm) and 24-hour format (for time input)
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return "10:00";
    
    // Remove all spaces and convert to lowercase
    const time = time12h.trim().replace(/\s+/g, '').toLowerCase();
    
    // Check if already in 24-hour format (HH:MM)
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      return time;
    }
    
    const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    
    if (!match) {
      // Try format without colon
      const match2 = time.match(/^(\d{1,2})\s*(am|pm)$/);
      if (match2) {
        let hours = parseInt(match2[1], 10);
        const period = match2[2];
        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, "0")}:00`;
      }
      return "10:00";
    }
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3];
    
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const convertTo12Hour = (time24h: string): string => {
    if (!time24h) return "10:00 am";
    
    const [hoursStr, minutesStr] = time24h.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || "00";
    
    if (isNaN(hours)) return "10:00 am";
    
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    
    return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
  };

  const updateShift = (dayIndex: number, shiftIndex: number, field: "start_time" | "end_time", value: string) => {
    // Convert from 24-hour format (from time input) to 12-hour format (stored format)
    const time12h = convertTo12Hour(value);
    
    setWorkingDays(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        shifts: prev[dayIndex].shifts.map((shift, i) =>
          i === shiftIndex ? { ...shift, [field]: time12h } : shift
        ),
      },
    }));
  };

  const toggleDay = (dayIndex: number) => {
    // Don't allow toggling days that don't exist in branch opening_hours (for new staff)
    // If branchAvailableDays is null, we haven't fetched yet, so allow toggling
    // If it's an empty Set, no days are available, so don't allow
    // If it has values, only allow those days
    if (!editStaff && branchAvailableDays !== null && !branchAvailableDays.has(dayIndex)) {
      return;
    }

    setWorkingDays(prev => {
      const newEnabled = !prev[dayIndex].enabled;
      return {
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          enabled: newEnabled,
          shifts: newEnabled && prev[dayIndex].shifts.length === 0 
            ? [{ start_time: "10:00 am", end_time: "02:00 pm" }]
            : prev[dayIndex].shifts,
        },
      };
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center gap-4 z-10">
          <button
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="cursor-pointer opacity-100"
          >
            {currentStep === 1 ? (
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.72909 12.5H19.7916" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4584 18.75C11.4584 18.75 5.20837 14.147 5.20837 12.5C5.20837 10.8529 11.4584 6.25 11.4584 6.25" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <h2 className="text-base font-semibold">{editStaff ? "Edit Team Member" : "Add New Team Member"}</h2>
          <div className="w-6"></div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 text-xs">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (editStaff) {
                      // In edit mode, allow navigation between steps
                      setCurrentStep(index + 1);
                    }
                  }}
                  className={`font-medium transition-colors ${
                    currentStep === index + 1 
                      ? "text-black" 
                      : editStaff 
                        ? "text-black/40 hover:text-black/60 cursor-pointer" 
                        : "text-black/40 cursor-default"
                  }`}
                  disabled={!editStaff}
                >
                  {step}
                </button>
                {index < steps.length - 1 && (
                  <Arrow direction="right" opacity={1} className="w-[17px] h-[17px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 pt-3">
              {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-base font-bold text-black mb-8">Enter Team Member Details</h3>
              
              <div className="space-y-4 pb-10">
                {/* Profile Photo */}
                <div>
                  <label className="main-label black">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {personalInfo.profilePhotoUrl ? (
                        <img
                          src={personalInfo.profilePhotoUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-black/10"
                        />
                      ) : (
                        <label className="cursor-pointer">
                          <div className="w-24 h-24 rounded-full border border-black/10 flex items-center justify-center hover:border-primary transition-colors bg-gray-50">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16 10.6667V21.3333M10.6667 16H21.3333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPersonalInfo({
                                  ...personalInfo,
                                  profilePhoto: file,
                                  profilePhotoUrl: URL.createObjectURL(file),
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex-1">
                      {personalInfo.profilePhotoUrl ? (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/jpeg,image/png,image/svg+xml,image/webp';
                              input.onchange = (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (personalInfo.profilePhotoUrl) {
                                    URL.revokeObjectURL(personalInfo.profilePhotoUrl);
                                  }
                                  setPersonalInfo({
                                    ...personalInfo,
                                    profilePhoto: file,
                                    profilePhotoUrl: URL.createObjectURL(file),
                                  });
                                }
                              };
                              input.click();
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10.1431 3.9881L11.0775 3.05359C11.5937 2.53748 12.4305 2.53748 12.9466 3.05359C13.4627 3.5697 13.4627 4.40649 12.9466 4.9226L12.0121 5.85711M10.1431 3.9881L4.65381 9.47737C3.95695 10.1742 3.6085 10.5226 3.37124 10.9472C3.13397 11.3718 2.89526 12.3744 2.66699 13.3332C3.62572 13.1049 4.62832 12.8662 5.05292 12.6289C5.47752 12.3916 5.82595 12.0432 6.52283 11.3464L12.0121 5.85711M10.1431 3.9881L12.0121 5.85711" stroke="black" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7.33301 13.3335H11.333" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                            </svg>
                            Edit Image
                          </button>
                          <button
                            onClick={() => {
                              if (personalInfo.profilePhotoUrl) {
                                URL.revokeObjectURL(personalInfo.profilePhotoUrl);
                              }
                              setPersonalInfo({
                                ...personalInfo,
                                profilePhoto: null,
                                profilePhotoUrl: null,
                              });
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13 3.6665L12.5869 10.3499C12.4813 12.0574 12.4285 12.9112 12.0005 13.5251C11.7889 13.8286 11.5165 14.0847 11.2005 14.2772C10.5614 14.6665 9.706 14.6665 7.99513 14.6665C6.28208 14.6665 5.42553 14.6665 4.78603 14.2764C4.46987 14.0836 4.19733 13.827 3.98579 13.523C3.55792 12.9082 3.5063 12.0532 3.40307 10.3433L3 3.6665" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M2 3.66683H14M10.7038 3.66683L10.2487 2.72798C9.9464 2.10434 9.7952 1.79251 9.53447 1.59804C9.47667 1.5549 9.4154 1.51652 9.35133 1.4833C9.0626 1.3335 8.71607 1.3335 8.023 1.3335C7.31253 1.3335 6.95733 1.3335 6.66379 1.48958C6.59873 1.52417 6.53665 1.5641 6.47819 1.60894C6.21443 1.8113 6.06709 2.13453 5.77241 2.781L5.36861 3.66683" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M6.33301 11V7" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                              <path d="M9.66699 11V7" stroke="black" strokeOpacity="0.5" strokeLinecap="round"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-black/50">
                          JPG, PNG, SVG, WEBP. Recommended 512 pixels minimum, aspect ratio 1:1
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="main-label black">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={personalInfo.firstName}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, firstName: e.target.value });
                      if (fieldErrors.first_name) {
                        setFieldErrors(prev => ({ ...prev, first_name: "" }));
                      }
                    }}
                    className="main-input"
                  />
                  {fieldErrors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="main-label black">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={personalInfo.lastName}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, lastName: e.target.value });
                      if (fieldErrors.last_name) {
                        setFieldErrors(prev => ({ ...prev, last_name: "" }));
                      }
                    }}
                    className="main-input"
                  />
                  {fieldErrors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.last_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="main-label black">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={personalInfo.email}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, email: e.target.value });
                      if (fieldErrors.email) {
                        setFieldErrors(prev => ({ ...prev, email: "" }));
                      }
                    }}
                    className="main-input"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                  )}
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
                    value={personalInfo.phone}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, phone: e.target.value });
                      if (fieldErrors.phone_number) {
                        setFieldErrors(prev => ({ ...prev, phone_number: "" }));
                      }
                    }}
                    className="main-input"
                  />
                  {fieldErrors.phone_number && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.phone_number}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="main-label black">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={personalInfo.password}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, password: e.target.value });
                        if (fieldErrors.password) {
                          setFieldErrors(prev => ({ ...prev, password: "" }));
                        }
                      }}
                      className="main-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Confirmation */}
                <div>
                  <label className="main-label black">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirmation ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={personalInfo.passwordConfirmation}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, passwordConfirmation: e.target.value });
                        if (fieldErrors.password_confirmation) {
                          setFieldErrors(prev => ({ ...prev, password_confirmation: "" }));
                        }
                      }}
                      className={`main-input pr-10 ${
                        personalInfo.passwordConfirmation && 
                        personalInfo.password !== personalInfo.passwordConfirmation 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirmation ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {personalInfo.passwordConfirmation && 
                   personalInfo.password !== personalInfo.passwordConfirmation && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {personalInfo.passwordConfirmation && 
                   personalInfo.password === personalInfo.passwordConfirmation && 
                   personalInfo.password.length > 0 && (
                    <p className="text-xs text-green-500 mt-1">Passwords match</p>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <label className="main-label black">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={personalInfo.jobTitle}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, jobTitle: e.target.value });
                      if (fieldErrors.job_title) {
                        setFieldErrors(prev => ({ ...prev, job_title: "" }));
                      }
                    }}
                    className="main-input"
                  />
                  {fieldErrors.job_title && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.job_title}</p>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label className="main-label black">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={personalInfo.branch}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        console.log("🔍 Branch selected:", selectedValue, "Type:", typeof selectedValue);
                        console.log("🔍 Current personalInfo.branch before update:", personalInfo.branch);
                        const updatedInfo = { ...personalInfo, branch: selectedValue };
                        console.log("🔍 Updated personalInfo.branch:", updatedInfo.branch);
                        setPersonalInfo(updatedInfo);
                        if (fieldErrors.selected_branch_id || fieldErrors.branch_id || fieldErrors.branch) {
                          setFieldErrors(prev => ({
                            ...prev,
                            selected_branch_id: "",
                            branch_id: "",
                            branch: "",
                          }));
                        }
                      }}
                      className="main-input-select appearance-none pr-10"
                    >
                      <option value="">-Select Branch-</option>
                      {branches.map((branch) => {
                        console.log("🔍 Rendering branch option:", branch.id, branch.label, "Value:", String(branch.id));
                        return (
                          <option key={branch.id} value={String(branch.id)}>
                            {branch.label}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Arrow direction="down" opacity={1} className="w-4 h-4" />
                    </div>
                  </div>
                  {(fieldErrors.selected_branch_id || fieldErrors.branch_id || fieldErrors.branch) && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.selected_branch_id || fieldErrors.branch_id || fieldErrors.branch}
                    </p>
                  )}
                </div>

                {/* Calendar Color */}
                <div>
                  <label className="main-label black">
                    Calendar Color <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {calendarColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setPersonalInfo({ ...personalInfo, calendarColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          personalInfo.calendarColor === color
                            ? "border-primary scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assign Services */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-base font-bold text-black mb-8">Assign Services</h3>
              
              {isLoadingServices ? (
                <div className="text-center py-8 text-gray-500">
                  Loading services...
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <SearchInput
                      placeholder="Search by service name"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                    />
                  </div>

                  <div>
                {/* All Services Checkbox */}
                <div className="flex items-center gap-3 py-3 cursor-pointer" onClick={handleSelectAll}>
                  <div className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                    selectAllServices 
                      ? "bg-primary border-primary" 
                      : "border-black/10"
                  }`}>
                    {selectAllServices && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-black">All Services</span>
                </div>

                {/* Categories */}
                {categories.map((category, index) => {
                  const categoryServices = services.filter(s => s.category === category && s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
                  const isExpanded = expandedCategories.has(category);
                  const categorySelectedServices = categoryServices.filter(s => selectedServices.includes(s.id));
                  const isCategorySelected = categoryServices.length > 0 && categorySelectedServices.length === categoryServices.length;

                  return (
                    <div key={category}>
                      {index > 0 && <div className="border-t border-black/10"></div>}
                      <div 
                        className="flex items-center gap-3 py-3 cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            const allSelected = categoryServices.every(s => selectedServices.includes(s.id));
                            if (allSelected) {
                              setSelectedServices(prev => prev.filter(id => !categoryServices.some(s => s.id === id)));
                            } else {
                              setSelectedServices(prev => [...prev, ...categoryServices.map(s => s.id).filter(id => !prev.includes(id))]);
                            }
                          }}
                          className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                            isCategorySelected 
                              ? "bg-primary border-primary" 
                              : "border-black/10"
                          }`}
                        >
                          {isCategorySelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-black flex-1">{category}</span>
                        <Arrow direction={isExpanded ? "up" : "down"} opacity={1} className="w-4" />
                      </div>
                      
                      {isExpanded && (
                        <div className="-translate-y-2">
                          {categoryServices.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                              <div 
                                key={service.id} 
                                className="flex items-center gap-3 py-2 pl-8 cursor-pointer"
                                onClick={() => toggleService(service.id)}
                              >
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleService(service.id);
                                  }}
                                  className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                                    isSelected 
                                      ? "bg-primary border-primary" 
                                      : "border-black/10"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-[13px] text-black">{service.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Working Days & Hours */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-base font-bold text-black mb-8">Working Days & Hours</h3>
              
              <div className="space-y-5">
                {dayNames.map((dayName, dayIndex) => {
                  const day = workingDays[dayIndex];
                  return (
                    <div key={dayIndex} className="flex items-start gap-3">
                      {/* Toggle Switch - smaller */}
                      {(() => {
                        // Check if day exists in branch opening_hours (for new staff only)
                        // In edit mode, allow all days. In add mode:
                        // - If branchAvailableDays is null (not fetched yet), allow all days
                        // - If branchAvailableDays is empty Set, disable all days
                        // - If branchAvailableDays has values, only allow those days
                        const isDayInBranchHours = editStaff || 
                          branchAvailableDays === null || 
                          (branchAvailableDays !== null && branchAvailableDays.has(dayIndex));
                        const isToggleDisabled = !editStaff && 
                          branchAvailableDays !== null && 
                          !branchAvailableDays.has(dayIndex);
                        
                        // Debug log on first render
                        if (dayIndex === 0 && currentStep === 3) {
                          console.log("🔍 Day 0 - enabled:", day.enabled, "isDayInBranchHours:", isDayInBranchHours, "branchAvailableDays:", branchAvailableDays ? Array.from(branchAvailableDays) : "null");
                        }
                        
                        return (
                      <button
                        onClick={() => toggleDay(dayIndex)}
                            disabled={isToggleDisabled}
                            className={`relative w-10 h-5 ${day.enabled ? "mt-[10px]" : ""} rounded-full transition-colors flex-shrink-0 ${
                          day.enabled ? "bg-primary" : "bg-gray-300"
                            } ${isToggleDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`absolute top-0.5  left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            day.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                        );
                      })()}
                      
                      {/* Day Name */}
                      <span className={`text-[13px] block ${day.enabled ? "mt-[10px]" : ""} font-semibold text-black w-12 flex-shrink-0`}>{dayName}</span>

                      {day.enabled ? (
                        <div className="flex-1 flex flex-col gap-2 relative">
                          {/* Add button always at the top */}
                          <div className="flex items-center gap-2 absolute top-[3px] right-0">
                            <button
                              onClick={() => addShift(dayIndex)}
                              className="flex-shrink-0"
                            >
                              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="40" height="40" rx="4.54545" fill="#F9F9F9"/>
                                <rect x="0.454545" y="0.454545" width="39.0909" height="39.0909" rx="4.09091" stroke="black" strokeOpacity="0.2" strokeWidth="0.909091"/>
                                <path d="M19.9998 12.7266V27.272M27.2725 19.9993H12.7271" stroke="black" strokeWidth="1.36364" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                          {/* Shifts list - new ones appear at bottom */}
                          {day.shifts.map((shift, shiftIndex) => (
                            <div key={shiftIndex} className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="relative flex-1">
                                  <input
                                    type="time"
                                    value={convertTo24Hour(shift.start_time)}
                                    onChange={(e) => updateShift(dayIndex, shiftIndex, "start_time", e.target.value)}
                                    className="w-full pl-2 pr-8 py-1.5 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white text-[11px] main-input"
                                  />
                                </div>
                                <div className="relative flex-1">
                                  <input
                                    type="time"
                                    value={convertTo24Hour(shift.end_time)}
                                    onChange={(e) => updateShift(dayIndex, shiftIndex, "end_time", e.target.value)}
                                    className="w-full pl-2 pr-8 py-1.5 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white text-[11px] main-input"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => removeShift(dayIndex, shiftIndex)}
                                className="text-gray-600 flex items-center justify-center hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <DeleteIcon onClick={() => {}} />
                              </button>
                              {/* Invisible placeholder to maintain consistent width */}
                              <div className="w-8 h-8 flex-shrink-0" aria-hidden="true"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 block">Unavailable</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 mt-auto bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          {currentStep === 1 ? (
            <>
              <Button
                variant="transparent"
                onClick={handleClose}
                className="w-[30%]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  // Validation
                  if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || !personalInfo.phone || !personalInfo.jobTitle || !personalInfo.branch) {
                    alert("Please fill in all required fields");
                    return;
                  }
                  // Save current step if in edit mode
                  if (editStaff) {
                    await handleSaveStep(1);
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="w-[70%] ml-4"
              >
                {editStaff ? "Save and Continue" : "Continue"}
              </Button>
            </>
          ) : (
            <>
              {currentStep > 1 && (
                <Button
                  variant="transparent"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-[30%]"
                >
                  Previous
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  onClick={async () => {
                    // Save current step if in edit mode
                    if (editStaff) {
                      await handleSaveStep(currentStep);
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className="w-[70%] ml-4"
                >
                  {editStaff ? "Save and Continue" : "Continue"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={async () => {
                    // Clear previous field errors before final submit
                    setFieldErrors({});
                    if (editStaff) {
                      // Save final step (hours)
                      await handleSaveStep(3);
                    } else {
                      // Add new team member - call /staff/add API with all data
                      try {
                        // Validation
                        if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || !personalInfo.phone || !personalInfo.password || !personalInfo.passwordConfirmation || !personalInfo.jobTitle || !personalInfo.branch) {
                          alert("Please fill in all required fields");
                          return;
                        }
                        
                        // Validate password confirmation - must be identical
                        if (personalInfo.password !== personalInfo.passwordConfirmation) {
                          alert("Password and password confirmation must be identical");
                          return;
                        }
                        
                        if (!personalInfo.password || personalInfo.password.trim() === "") {
                          alert("Password is required");
                          return;
                        }
                        
                        if (!personalInfo.passwordConfirmation || personalInfo.passwordConfirmation.trim() === "") {
                          alert("Password confirmation is required");
                          return;
                        }

                        const phoneNumber = `${personalInfo.countryCode} ${personalInfo.phone}`;
                        
                        // Prepare FormData if profile image exists, otherwise use JSON
                        if (personalInfo.profilePhoto) {
                          const formData = new FormData();
                          formData.append('first_name', personalInfo.firstName);
                          formData.append('last_name', personalInfo.lastName);
                          formData.append('email', personalInfo.email);
                          formData.append('phone_number', phoneNumber);
                          if (personalInfo.password) {
                            formData.append('password', personalInfo.password);
                            formData.append('password_confirmation', personalInfo.passwordConfirmation);
                          }
                          formData.append('job_title', personalInfo.jobTitle);
                          formData.append('branch_id', String(Number(currentBranch?.id))); // Current branch (website level)
                          formData.append('selected_branch_id', String(Number(personalInfo.branch))); // Selected branch from form
                          formData.append('calendar_color', personalInfo.calendarColor);
                          formData.append('profile_image', personalInfo.profilePhoto);
                          
                          // Append services_ids as array (FormData handles arrays)
                          selectedServices.forEach((serviceId) => {
                            formData.append('services_ids[]', serviceId);
                          });
                          
                          // Format working hours with day names and 24-hour time format
                          const formattedWorkingHours = formatWorkingHoursForAPI(workingDays);
                          formData.append('working_hours', JSON.stringify(formattedWorkingHours));
                          
                          await axiosClient.post('/staff/add', formData);
                        } else {
                          // Format working hours with day names and 24-hour time format
                          const formattedWorkingHours = formatWorkingHoursForAPI(workingDays);
                          
                          const requestData = {
                            first_name: personalInfo.firstName,
                            last_name: personalInfo.lastName,
                            email: personalInfo.email,
                            phone_number: phoneNumber,
                            ...(personalInfo.password && { 
                              password: personalInfo.password,
                              password_confirmation: personalInfo.passwordConfirmation 
                            }),
                            job_title: personalInfo.jobTitle,
                            branch_id: Number(currentBranch?.id), // Current branch (website level)
                            selected_branch_id: Number(personalInfo.branch), // Selected branch from form
                            calendar_color: personalInfo.calendarColor,
                            services_ids: selectedServices,
                            working_hours: formattedWorkingHours,
                          };
                          
                          console.log("🔍 Adding staff with data:", requestData);
                          await axiosClient.post('/staff/add', requestData);
                        }
                        
                        // Refresh staff list and close sidebar after successful addition
                        // onSave() already calls fetchStaffMembers() - see line 581-584
                      onSave();
                      } catch (error: any) {
                        console.error("Error adding staff member:", error);
                        console.error("Error response:", error?.response?.data);

                        const validation =
                          error?.response?.data?.validation_errors ||
                          error?.response?.data?.errors;

                        if (validation && typeof validation === "object") {
                          const newErrors: { [key: string]: string } = {};
                          Object.entries(validation).forEach(([field, messages]) => {
                            const msg = Array.isArray(messages)
                              ? String(messages[0])
                              : String(messages);
                            newErrors[field] = msg;
                          });

                          setFieldErrors(newErrors);

                          const step1Fields = [
                            "first_name",
                            "last_name",
                            "email",
                            "phone_number",
                            "password",
                            "password_confirmation",
                            "job_title",
                            "branch",
                            "branch_id",
                            "selected_branch_id",
                          ];
                          const step2Fields = ["services_ids", "services", "service_ids"];
                          const step3Fields = ["working_hours"];

                          const errorFields = Object.keys(newErrors);
                          if (errorFields.some((f) => step1Fields.includes(f))) {
                            setCurrentStep(1);
                          } else if (errorFields.some((f) => step2Fields.includes(f))) {
                            setCurrentStep(2);
                          } else if (errorFields.some((f) => step3Fields.includes(f))) {
                            setCurrentStep(3);
                          }
                        } else {
                          const errorMessage =
                            error?.response?.data?.message ||
                            error?.response?.data?.error ||
                            error?.message ||
                            "Failed to add staff member. Please try again.";
                          alert(errorMessage);
                        }
                      }
                    }
                  }}
                  className="w-[70%] ml-4"
                >
                  {editStaff ? "Save Changes" : "Add Team Member"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Services Sidebar Component
function EditServicesSidebar({
  staff,
  onClose,
  onSave,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSave: () => void;
}) {
  const { currentBranch } = useBranch();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectAllServices, setSelectAllServices] = useState(false);
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Fetch services and initialize selected services
  useEffect(() => {
    fetchServices();
  }, []);

  // Initialize selected services from staff's assigned services
  useEffect(() => {
    if (services.length > 0 && !isLoadingServices) {
      let validServiceIds: string[] = [];
      
      // First try to use service IDs if available (more reliable)
      if (staff.assignedServiceIds && staff.assignedServiceIds.length > 0) {
        // Filter to only include IDs that exist in the fetched services
        validServiceIds = staff.assignedServiceIds.filter(id => 
          services.some(s => s.id === id)
        );
        setSelectedServices(validServiceIds);
        setSelectAllServices(validServiceIds.length === services.length && services.length > 0);
      } else if (staff.assignedServices.length > 0) {
        // Fallback: Match staff's service names with service IDs (case-insensitive, trimmed)
        validServiceIds = services
          .filter(s => {
            const serviceName = s.name.trim().toLowerCase();
            return staff.assignedServices.some(
              assignedName => assignedName.trim().toLowerCase() === serviceName
            );
          })
          .map(s => s.id);
        
        setSelectedServices(validServiceIds);
        setSelectAllServices(validServiceIds.length === services.length && services.length > 0);
      } else {
        // If staff has no assigned services, clear selection
        setSelectedServices([]);
        setSelectAllServices(false);
      }
      
      // Expand categories that contain selected services
      if (validServiceIds.length > 0) {
        const categoriesWithSelectedServices = new Set<string>();
        validServiceIds.forEach(serviceId => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            categoriesWithSelectedServices.add(service.category);
          }
        });
        setExpandedCategories(categoriesWithSelectedServices);
      }
    }
  }, [services, staff.assignedServices, staff.assignedServiceIds, isLoadingServices]);

  const fetchServices = async () => {
    if (!currentBranch?.id) return;
    
    setIsLoadingServices(true);
    try {
      const response = await axiosClient.get("/services/get", {
        params: { branch_id: currentBranch.id },
      });
      const servicesData = response.data?.data?.services || {};
      
      const transformedServices: Array<{ id: string; name: string; category: string }> = [];
      
      Object.keys(servicesData).forEach((categoryName) => {
        const categoryServices = servicesData[categoryName] || [];
        categoryServices.forEach((service: any) => {
          transformedServices.push({
            id: String(service.id),
            name: service.label || service.name || "Service",
            category: categoryName,
          });
        });
      });
      
      setServices(transformedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAllServices) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s.id));
    }
    setSelectAllServices(!selectAllServices);
  };

  const handleSave = async () => {
    if (!currentBranch || !staff) return;

    setIsSaving(true);
    try {
      await axiosClient.post(`/staff/edit/services`, {
        staff_id: staff.id,
        services_ids: selectedServices,
      });

      onSave();
    } catch (error) {
      console.error("Error updating staff services:", error);
      console.error("Failed to update services. Please try again.", error);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(services.map(s => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center gap-4 z-10">
          <button
            onClick={handleClose}
            className="cursor-pointer opacity-100"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold">Edit Services</h2>
          <div className="w-6"></div>
        </div>

        {/* Content */}
        <div className="p-6 pt-3">
          <h3 className="text-base font-bold text-black mb-8">Assign Services</h3>
          
          {isLoadingServices ? (
            <div className="text-center py-8 text-gray-500">
              Loading services...
            </div>
          ) : (
            <>
              <div className="mb-4">
                <SearchInput
                  placeholder="Search by service name"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>

              <div>
                {/* All Services Checkbox */}
                <div className="flex items-center gap-3 py-3 cursor-pointer" onClick={handleSelectAll}>
                  <div className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                    selectAllServices 
                      ? "bg-primary border-primary" 
                      : "border-black/10"
                  }`}>
                    {selectAllServices && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-black">All Services</span>
                </div>

                {/* Categories */}
                {categories.map((category, index) => {
                  const categoryServices = services.filter(s => s.category === category && s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
                  const isExpanded = expandedCategories.has(category);
                  const categorySelectedServices = categoryServices.filter(s => selectedServices.includes(s.id));
                  const isCategorySelected = categoryServices.length > 0 && categorySelectedServices.length === categoryServices.length;

                  return (
                    <div key={category}>
                      {index > 0 && <div className="border-t border-black/10"></div>}
                      <div 
                        className="flex items-center gap-3 py-3 cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            const allSelected = categoryServices.every(s => selectedServices.includes(s.id));
                            if (allSelected) {
                              setSelectedServices(prev => prev.filter(id => !categoryServices.some(s => s.id === id)));
                            } else {
                              setSelectedServices(prev => [...prev, ...categoryServices.map(s => s.id).filter(id => !prev.includes(id))]);
                            }
                          }}
                          className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                            isCategorySelected 
                              ? "bg-primary border-primary" 
                              : "border-black/10"
                          }`}
                        >
                          {isCategorySelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-black flex-1">{category}</span>
                        <Arrow direction={isExpanded ? "up" : "down"} opacity={1} className="w-4" />
                      </div>
                      
                      {isExpanded && (
                        <div className="-translate-y-2">
                          {categoryServices.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                              <div 
                                key={service.id} 
                                className="flex items-center gap-3 py-2 pl-8 cursor-pointer"
                                onClick={() => toggleService(service.id)}
                              >
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleService(service.id);
                                  }}
                                  className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                                    isSelected 
                                      ? "bg-primary border-primary" 
                                      : "border-black/10"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-[13px] text-black">{service.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 mt-auto bg-white border-t border-gray-200 px-6 py-4 flex items-center">
          <Button
            variant="transparent"
            onClick={handleClose}
            className="w-[30%]"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="w-[70%] ml-4"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
