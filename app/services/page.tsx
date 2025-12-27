"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import Arrow from "../../components/ui/Arrow";
import Popup from "../../components/Popup";

interface Service {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  duration: string;
  price: string;
}

export default function Services() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddServiceSidebarOpen, setIsAddServiceSidebarOpen] = useState(false);
  const [isEditServiceSidebarOpen, setIsEditServiceSidebarOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const itemsPerPage = 12;

  // Mock data for testing
  const mockServices: Service[] = [
    { id: "1", title: "Classic Haircut", category: "Hair", subCategory: "Cut", duration: "30 min", price: "$25.00" },
    { id: "2", title: "Premium Haircut", category: "Hair", subCategory: "Cut", duration: "45 min", price: "$40.00" },
    { id: "3", title: "Hair Wash", category: "Hair", subCategory: "Wash", duration: "20 min", price: "$15.00" },
    { id: "4", title: "Hair Coloring", category: "Hair", subCategory: "Color", duration: "2h", price: "$120.00" },
    { id: "5", title: "Hair Highlighting", category: "Hair", subCategory: "Color", duration: "2h 30 min", price: "$150.00" },
    { id: "6", title: "Full Body Massage", category: "Body", subCategory: "Massage", duration: "1h", price: "$80.00" },
    { id: "7", title: "Back Massage", category: "Body", subCategory: "Massage", duration: "30 min", price: "$45.00" },
    { id: "8", title: "Facial Treatment", category: "Face", subCategory: "Facial", duration: "1h", price: "$75.00" },
    { id: "9", title: "Deep Cleansing Facial", category: "Face", subCategory: "Facial", duration: "1h 30 min", price: "$95.00" },
    { id: "10", title: "Manicure", category: "Nails", subCategory: "Hands", duration: "45 min", price: "$35.00" },
    { id: "11", title: "Pedicure", category: "Nails", subCategory: "Feet", duration: "1h", price: "$40.00" },
    { id: "12", title: "Hair Styling", category: "Hair", subCategory: "Style", duration: "1h", price: "$50.00" },
    { id: "13", title: "Beard Trim", category: "Hair", subCategory: "Beard", duration: "20 min", price: "$20.00" },
    { id: "14", title: "Waxing - Legs", category: "Body", subCategory: "Waxing", duration: "45 min", price: "$55.00" },
    { id: "15", title: "Waxing - Bikini", category: "Body", subCategory: "Waxing", duration: "30 min", price: "$40.00" },
    { id: "16", title: "Eyebrow Threading", category: "Face", subCategory: "Threading", duration: "15 min", price: "$15.00" },
    { id: "17", title: "Hair Treatment", category: "Hair", subCategory: "Treatment", duration: "1h", price: "$60.00" },
    { id: "18", title: "Acrylic Nails", category: "Nails", subCategory: "Hands", duration: "1h 30 min", price: "$50.00" },
    { id: "19", title: "Gel Manicure", category: "Nails", subCategory: "Hands", duration: "1h", price: "$45.00" },
    { id: "20", title: "Full Body Scrub", category: "Body", subCategory: "Scrub", duration: "1h", price: "$70.00" },
    { id: "21", title: "Hot Stone Massage", category: "Body", subCategory: "Massage", duration: "1h 30 min", price: "$100.00" },
    { id: "22", title: "Scalp Treatment", category: "Hair", subCategory: "Treatment", duration: "45 min", price: "$55.00" },
  ];

  const fetchServicesData = useCallback(async () => {
    if (!currentBranch) {
      // Use mock data when no branch is selected
      setServices(mockServices);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosClient.get("/services/get", {
        params: { branch_id: currentBranch.id },
      });
      
      const servicesData = response.data?.data?.services || {};
      
      // Transform API response to flat array
      const transformedServices: Service[] = [];
      
      Object.keys(servicesData).forEach((categoryName) => {
        const categoryServices = servicesData[categoryName] || [];
        categoryServices.forEach((service: any) => {
          // Format duration (assuming it's in minutes)
          const durationMinutes = service.duration || 0;
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          let durationStr = "";
          if (hours > 0) {
            durationStr = `${hours}h`;
            if (minutes > 0) {
              durationStr += ` ${minutes} min`;
            }
          } else {
            durationStr = `${minutes} min`;
          }
          
          // Format price
          const price = Number(service.price) || 0;
          const priceStr = `$${price.toFixed(2)}`;
          
          transformedServices.push({
            id: String(service.id),
            title: service.label || service.name || "Service Title",
            category: categoryName,
            subCategory: service.sub_category || service.subCategory || "Sub-category Name",
            duration: durationStr,
            price: priceStr,
          });
        });
      });

      // Use mock data for testing (uncomment to use API data: setServices(transformedServices.length > 0 ? transformedServices : mockServices))
      setServices(mockServices);
    } catch (error) {
      console.error("Error fetching services data:", error);
      setServices(mockServices);
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    if (currentBranch?.id) {
      fetchServicesData();
    }
  }, [currentBranch?.id, branchChangeKey, fetchServicesData]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedServices = () => {
    if (!sortColumn) return services;

    return [...services].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "Service Title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "Category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "Sub-Category":
          aValue = a.subCategory.toLowerCase();
          bValue = b.subCategory.toLowerCase();
          break;
        case "Duration":
          // Extract numeric value for sorting
          const aDuration = parseInt(a.duration.replace(/\D/g, "")) || 0;
          const bDuration = parseInt(b.duration.replace(/\D/g, "")) || 0;
          aValue = aDuration;
          bValue = bDuration;
          break;
        case "Price":
          // Extract numeric value for sorting
          const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
          const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          aValue = aPrice;
          bValue = bPrice;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredServices = () => {
    const sorted = getSortedServices();
    let filtered = sorted;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query) ||
          service.subCategory.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Reset to page 1 when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredServices = getFilteredServices();
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(services.map((s) => s.category)));

  const handleEditClick = (service: Service) => {
    setServiceToEdit(service);
    setIsEditServiceSidebarOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setIsDeletePopupOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeletePopupOpen(false);
    setServiceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete || !currentBranch) return;

    try {
      await axiosClient.delete("/services/delete", {
        data: {
          service_id: serviceToDelete.id,
          branch_id: currentBranch.id,
        },
      });

      // Remove from local state
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      
      setIsDeletePopupOpen(false);
      setServiceToDelete(null);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete service. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div className="">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Services & Pricing</span>
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
      <div className="p-3 md:p-6">
        {/* Top Section: Heading and Add Service Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-black">Services & Pricing</h2>
        </div>
        
        {/* Bottom Section: Category Filter, Search and Add Button */}
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Category Filter */}
            <CategoryDropdown 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
            
            {/* Search Input */}
            <div className="w-[45%]">
              <SearchInput
                placeholder="Search by service title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
          
          {/* Add New Service Button */}
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => setIsAddServiceSidebarOpen(true)}
          >
            Add New Service
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="flex md:hidden flex-col gap-3 mb-4">
          {/* Category Filter and Add Button Row */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="relative flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none bg-white cursor-pointer"
              >
                <option value="All">Category: All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* Add New Service Button */}
            <Button 
              variant="primary" 
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={() => setIsAddServiceSidebarOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="w-full">
            <SearchInput
              placeholder="Search by service title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        {/* Services Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  {["Service Title", "Category", "Sub-Category", "Duration", "Price", "Action"].map((header) => {
                    const isSorted = sortColumn === header;
                    return (
                      <th
                        key={header}
                        onClick={() => handleSort(header)}
                        className={`group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize ${
                          header !== "Action" ? "cursor-pointer" : ""
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
                              header === "Action" 
                                ? "text-gray-400 opacity-50" 
                                : isSorted 
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
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading services...
                    </td>
                  </tr>
                ) : paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No services found
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((service) => (
                    <tr 
                      key={service.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 text-xs font-normal text-black/80">{service.title}</td>
                      <td className="px-5 py-4 text-xs font-normal text-black/80">{service.category}</td>
                      <td className="px-5 py-4 text-xs font-normal text-black/80">{service.subCategory}</td>
                      <td className="px-5 py-4 text-xs font-normal text-black/80">{service.duration}</td>
                      <td className="px-5 py-4 text-xs font-normal text-black/80">{service.price}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <EditIcon onClick={() => handleEditClick(service)} />
                          <DeleteIcon onClick={() => handleDeleteClick(service)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Desktop */}
          {filteredServices.length > 0 && (
            <div className="hidden md:flex px-4 py-3 bg-gray-50 border-t border-gray-200 items-center justify-between">
              <div className="text-sm text-gray-700" style={{ width: "160px", height: "17px", opacity: "0.4" }}>
                Showing {paginatedServices.length} out of {filteredServices.length}
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded ${
                      currentPage === page
                        ? "bg-black text-white"
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

        {/* Services Table - Mobile/Tablet */}
        <div className="block md:hidden bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Loading services...
            </div>
          ) : paginatedServices.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No services found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedServices.map((service) => (
                <div key={service.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-black mb-1">{service.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-black/60 mb-1">
                        <span>{service.category}</span>
                        <span>•</span>
                        <span>{service.subCategory}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-black/80 mt-2">
                        <span>Duration: {service.duration}</span>
                        <span>Price: {service.price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <EditIcon onClick={() => handleEditClick(service)} />
                      <DeleteIcon onClick={() => handleDeleteClick(service)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination - Mobile/Tablet */}
          {filteredServices.length > 0 && (
            <div className="block md:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-700 mb-3 text-center" style={{ width: "160px", height: "17px", opacity: "0.4", margin: "0 auto" }}>
                Showing {paginatedServices.length} out of {filteredServices.length}
              </div>
              <div className="flex items-center justify-center gap-2 overflow-x-auto">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-xs rounded whitespace-nowrap ${
                      currentPage === page
                        ? "bg-black text-white"
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
      </div>

      {/* Add New Service Sidebar */}
      {isAddServiceSidebarOpen && (
        <AddNewServiceSidebar
          onClose={() => setIsAddServiceSidebarOpen(false)}
          onSave={() => {
            fetchServicesData();
            setIsAddServiceSidebarOpen(false);
          }}
        />
      )}

      {/* Edit Service Sidebar */}
      {isEditServiceSidebarOpen && serviceToEdit && (
        <EditServiceSidebar
          service={serviceToEdit}
          onClose={() => {
            setIsEditServiceSidebarOpen(false);
            setServiceToEdit(null);
          }}
          onSave={() => {
            fetchServicesData();
            setIsEditServiceSidebarOpen(false);
            setServiceToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleDeleteCancel}
        title="Delete Service"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete "{serviceToDelete?.title}"? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="transparent"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}

// Category Dropdown Component
function CategoryDropdown({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (category: string) => {
    onSelect(category);
    setIsOpen(false);
  };

  const displayText = selectedCategory === "All" ? "Category: All" : selectedCategory;

  return (
    <div className="relative w-[200px]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 cursor-pointer text-xs font-medium border border-black/20 rounded-[10px] transition-colors focus:outline-none whitespace-nowrap w-full bg-white"
      >
        <span className="flex-1 text-left whitespace-nowrap truncate min-w-0">{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-white border border-black/20 rounded-[10px] shadow-lg z-50 max-h-60 overflow-auto">
          <div>
            <button
              onClick={() => handleCategoryChange("All")}
              className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors rounded-[10px] ${
                selectedCategory === "All" ? "bg-black/10 text-black" : "text-gray-700"
              }`}
            >
              Category: All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors rounded-[10px] ${
                  selectedCategory === category ? "bg-black/10 text-black" : "text-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add New Service Sidebar Component
function AddNewServiceSidebar({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { currentBranch } = useBranch();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Step 1: Service Details
  const [serviceDetails, setServiceDetails] = useState({
    title: "",
    category: "",
    subCategory: "",
    description: "",
  });

  // Step 2: Staff Selection
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<Array<{
    id: string;
    name: string;
    avatar?: string;
    calendarColor?: string;
  }>>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Step 3: Pricing & Duration
  const [pricingDetails, setPricingDetails] = useState({
    priceType: "fixed",
    price: "",
    duration: "",
    requiresDeposit: false,
    depositAmount: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const steps = ["Service Details", "Staff", "Pricing & Duration"];

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
      // Reset form state when closing
      setCurrentStep(1);
      setServiceDetails({
        title: "",
        category: "",
        subCategory: "",
        description: "",
      });
      setSelectedStaffIds([]);
      setPricingDetails({
        priceType: "fixed",
        price: "",
        duration: "",
        requiresDeposit: false,
        depositAmount: "",
      });
      onClose();
    }, 300);
  };

  const handleContinue = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // On last step, save and close
      await handleSaveService();
    }
  };

  const handleSaveService = async () => {
    if (!currentBranch) return;

    // Validation
    if (!serviceDetails.title || !serviceDetails.category || !serviceDetails.subCategory) {
      alert("Please fill in all required fields in Service Details");
      return;
    }

    if (selectedStaffIds.length === 0) {
      alert("Please select at least one staff member");
      return;
    }

    if (!pricingDetails.price || !pricingDetails.duration) {
      alert("Please fill in Price and Duration");
      return;
    }

    setIsSaving(true);
    try {
      // Convert duration to minutes (assuming format like "1h 30 min" or "30 min")
      const durationMinutes = convertDurationToMinutes(pricingDetails.duration);
      
      const requestData = {
        label: serviceDetails.title,
        category: serviceDetails.category,
        sub_category: serviceDetails.subCategory,
        description: serviceDetails.description || "",
        price: parseFloat(pricingDetails.price),
        price_type: pricingDetails.priceType, // "fixed" or "starting"
        duration: durationMinutes,
        requires_deposit: pricingDetails.requiresDeposit,
        deposit_amount: pricingDetails.requiresDeposit && pricingDetails.depositAmount ? parseFloat(pricingDetails.depositAmount) : 0,
        staff_ids: selectedStaffIds.map(id => Number(id)),
        branch_id: currentBranch.id,
      };

      await axiosClient.post("/services/add", requestData);
      
      // Reset form state
      setCurrentStep(1);
      setServiceDetails({
        title: "",
        category: "",
        subCategory: "",
        description: "",
      });
      setSelectedStaffIds([]);
      setPricingDetails({
        priceType: "fixed",
        price: "",
        duration: "",
        requiresDeposit: false,
        depositAmount: "",
      });
      
      // Close modal and refresh services list
      onSave();
    } catch (error: any) {
      console.error("Error saving service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save service. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const convertDurationToMinutes = (duration: string): number => {
    // Handle formats like "1h 30 min", "30 min", "1h", etc.
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minutesMatch = duration.match(/(\d+)\s*min/i);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    return hours * 60 + minutes;
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Fetch staff members when step 2 is accessed
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (currentStep === 2 && currentBranch?.id && staffMembers.length === 0 && !isLoadingStaff) {
        setIsLoadingStaff(true);
        try {
          const response = await axiosClient.get("/staff/get", {
            params: { branch_id: currentBranch.id },
          });
          
          const staffData = response.data?.data?.staff || [];
          
          // Transform API data to match our format
          const transformedData = staffData.map((member: any) => {
            const firstName = member.first_name || "";
            const lastName = member.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim() || "Staff Member";
            
            // Get avatar from image object
            const avatarUrl = (member.image?.image && member.image.image.trim() !== "")
              ? member.image.image
              : null;
            
            return {
              id: String(member.id),
              name: fullName,
              avatar: avatarUrl,
              calendarColor: member.calendar_color || "#9CA3AF",
            };
          });

          setStaffMembers(transformedData);
        } catch (error) {
          console.error("Error fetching staff members:", error);
          setStaffMembers([]);
        } finally {
          setIsLoadingStaff(false);
        }
      }
    };

    fetchStaffMembers();
  }, [currentStep, currentBranch?.id, staffMembers.length, isLoadingStaff]);

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  // Get unique categories from existing services (you might want to fetch this from API)
  const availableCategories = ["Hair", "Body", "Face", "Nails"]; // Placeholder - should come from API
  const availableSubCategories: { [key: string]: string[] } = {
    "Hair": ["Haircut", "Coloring", "Styling"],
    "Body": ["Massage", "Waxing", "Treatment"],
    "Face": ["Facial", "Cleansing", "Treatment"],
    "Nails": ["Manicure", "Pedicure", "Gel"],
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-full md:w-[573px] bg-[#F9F9F9] h-full shadow-xl transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 z-10">
          <button
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="cursor-pointer opacity-100 flex-shrink-0"
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
          <h2 className="text-sm md:text-base font-semibold flex-1">Add New Service</h2>
          <div className="w-6"></div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <div className="flex items-center gap-1 md:gap-2 text-xs overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span
                  className={`font-medium transition-colors whitespace-nowrap ${
                    currentStep === index + 1 
                      ? "text-black" 
                      : "text-black/40"
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <Arrow direction="right" opacity={1} className="w-[12px] h-[12px] md:w-[17px] md:h-[17px] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 md:p-6 pt-3 flex-1 overflow-y-auto">
          {/* Step 1: Service Details */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Enter Service Details</h3>
              
              <div className="space-y-4 pb-8 md:pb-10">
                {/* Service Title */}
                <div>
                  <label className="main-label black">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={serviceDetails.title}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, title: e.target.value })}
                    className="main-input"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="main-label black">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={serviceDetails.category}
                      onChange={(e) => {
                        setServiceDetails({ 
                          ...serviceDetails, 
                          category: e.target.value,
                          subCategory: "" // Reset sub-category when category changes
                        });
                      }}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">-Select Category-</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="main-label black">
                    Sub-Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={serviceDetails.subCategory}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, subCategory: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                      disabled={!serviceDetails.category}
                    >
                      <option value="">-Select Sub-Category-</option>
                      {serviceDetails.category && availableSubCategories[serviceDetails.category]?.map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="main-label black">
                    Description
                  </label>
                  <textarea
                    placeholder="Description goes here"
                    value={serviceDetails.description}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, description: e.target.value })}
                    className="main-input min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Staff Selection */}
          {currentStep === 2 && (
            <div className="flex flex-col flex-1 min-h-0">
              <h3 className="text-sm md:text-base font-bold text-black mb-4 md:mb-6 flex-shrink-0">Choose who is providing this service</h3>
              
              {isLoadingStaff ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Loading staff members...
                </div>
              ) : staffMembers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No staff members found
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                  {staffMembers.map((staff) => {
                    const isSelected = selectedStaffIds.includes(staff.id);
                    return (
                      <div
                        key={staff.id}
                        onClick={() => toggleStaffSelection(staff.id)}
                        className="flex items-center justify-between w-[513px] h-[72px] bg-white border border-black/10 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        style={{ padding: "13px 20px 13px 13px" }}
                      >
                        {/* Avatar */}
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-normal text-white flex-shrink-0"
                            style={{ backgroundColor: staff.calendarColor || "#9CA3AF" }}
                          >
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        
                        {/* Name */}
                        <div className="flex-1 min-w-0 ml-3">
                          <span className="text-xs font-normal text-black/80 truncate">{staff.name}</span>
                        </div>
                        
                        {/* Checkbox */}
                        <div className={`w-4 h-4 border-[1.5px] flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-black/10"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing & Duration */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Pricing & Duration</h3>
              
              <div className="space-y-4 pb-8 md:pb-10">
                {/* Price Type */}
                <div>
                  <label className="main-label black">
                    Price Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={pricingDetails.priceType}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, priceType: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="fixed">Fixed or starting price (From)</option>
                      <option value="starting">Starting price</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Price (in USD) */}
                <div>
                  <label className="main-label black">
                    Price (in USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Price (in USD)"
                    value={pricingDetails.price}
                    onChange={(e) => setPricingDetails({ ...pricingDetails, price: e.target.value })}
                    className="main-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="main-label black">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={pricingDetails.duration}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, duration: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">-Select Duration-</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1h">1h</option>
                      <option value="1h 15 min">1h 15 min</option>
                      <option value="1h 30 min">1h 30 min</option>
                      <option value="1h 45 min">1h 45 min</option>
                      <option value="2h">2h</option>
                      <option value="2h 30 min">2h 30 min</option>
                      <option value="3h">3h</option>
                      <option value="3h 30 min">3h 30 min</option>
                      <option value="4h">4h</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Requires Deposit */}
                <div>
                  <label className="main-label black">
                    Requires Deposit
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPricingDetails({ ...pricingDetails, requiresDeposit: !pricingDetails.requiresDeposit })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        pricingDetails.requiresDeposit ? "bg-primary" : "bg-gray-300"
                      } cursor-pointer`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          pricingDetails.requiresDeposit ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-black/60">
                      {pricingDetails.requiresDeposit ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Deposit Amount - Only shown when Requires Deposit is enabled */}
                {pricingDetails.requiresDeposit && (
                  <div>
                    <label className="main-label black">
                      Deposit Amount (in USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Deposit Amount (in USD)"
                      value={pricingDetails.depositAmount}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, depositAmount: e.target.value })}
                      className="main-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-gray-200 bg-[#F9F9F9] p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="transparent"
                  onClick={handleClose}
                  className="flex-[1] text-xs md:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-[3] text-xs md:text-sm"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="transparent"
                  onClick={handlePrevious}
                  className="flex-[1] text-xs md:text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-[3] text-xs md:text-sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : currentStep === steps.length ? "Add Service" : "Continue"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Service Sidebar Component
function EditServiceSidebar({
  service,
  onClose,
  onSave,
}: {
  service: Service;
  onClose: () => void;
  onSave: () => void;
}) {
  const { currentBranch } = useBranch();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Step 1: Service Details
  const [serviceDetails, setServiceDetails] = useState({
    title: service.title,
    category: service.category,
    subCategory: service.subCategory,
    description: "",
  });

  // Step 2: Staff Selection
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<Array<{
    id: string;
    name: string;
    avatar?: string;
    calendarColor?: string;
  }>>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Step 3: Pricing & Duration
  // Extract price from string like "$45.00"
  const priceValue = service.price.replace(/[^0-9.]/g, "");
  const [pricingDetails, setPricingDetails] = useState({
    priceType: "fixed",
    price: priceValue,
    duration: service.duration,
    requiresDeposit: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const steps = ["Service Details", "Staff", "Pricing & Duration"];

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
      setCurrentStep(1);
      onClose();
    }, 300);
  };

  const handleContinue = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSaveService();
    }
  };

  const handleSaveService = async () => {
    if (!currentBranch) return;

    // Validation
    if (!serviceDetails.title || !serviceDetails.category || !serviceDetails.subCategory) {
      alert("Please fill in all required fields in Service Details");
      return;
    }

    if (!pricingDetails.price || !pricingDetails.duration) {
      alert("Please fill in Price and Duration");
      return;
    }

    setIsSaving(true);
    try {
      // Convert duration to minutes
      const durationMinutes = convertDurationToMinutes(pricingDetails.duration);
      
      const requestData = {
        service_id: service.id,
        label: serviceDetails.title,
        category: serviceDetails.category,
        sub_category: serviceDetails.subCategory,
        description: serviceDetails.description || "",
        price: parseFloat(pricingDetails.price),
        price_type: pricingDetails.priceType,
        duration: durationMinutes,
        requires_deposit: pricingDetails.requiresDeposit,
        deposit_amount: pricingDetails.requiresDeposit && pricingDetails.depositAmount ? parseFloat(pricingDetails.depositAmount) : 0,
        staff_ids: selectedStaffIds.map(id => Number(id)),
        branch_id: currentBranch.id,
      };

      await axiosClient.put("/services/update", requestData);
      
      onSave();
    } catch (error: any) {
      console.error("Error updating service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update service. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const convertDurationToMinutes = (duration: string): number => {
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minutesMatch = duration.match(/(\d+)\s*min/i);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    
    return hours * 60 + minutes;
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Fetch staff members when step 2 is accessed
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (currentStep === 2 && currentBranch?.id && staffMembers.length === 0 && !isLoadingStaff) {
        setIsLoadingStaff(true);
        try {
          const response = await axiosClient.get("/staff/get", {
            params: { branch_id: currentBranch.id },
          });
          
          const staffData = response.data?.data?.staff || [];
          
          const transformedData = staffData.map((member: any) => {
            const firstName = member.first_name || "";
            const lastName = member.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim() || "Staff Member";
            
            const avatarUrl = (member.image?.image && member.image.image.trim() !== "")
              ? member.image.image
              : null;
            
            return {
              id: String(member.id),
              name: fullName,
              avatar: avatarUrl,
              calendarColor: member.calendar_color || "#9CA3AF",
            };
          });

          setStaffMembers(transformedData);
        } catch (error) {
          console.error("Error fetching staff members:", error);
          setStaffMembers([]);
        } finally {
          setIsLoadingStaff(false);
        }
      }
    };

    fetchStaffMembers();
  }, [currentStep, currentBranch?.id, staffMembers.length, isLoadingStaff]);

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const availableCategories = ["Hair", "Body", "Face", "Nails"];
  const availableSubCategories: { [key: string]: string[] } = {
    "Hair": ["Haircut", "Coloring", "Styling"],
    "Body": ["Massage", "Waxing", "Treatment"],
    "Face": ["Facial", "Cleansing", "Treatment"],
    "Nails": ["Manicure", "Pedicure", "Gel"],
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className={`flex flex-col relative w-full md:w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center gap-3 md:gap-4 z-10">
          <button
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="cursor-pointer opacity-100 flex-shrink-0"
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
          <h2 className="text-sm md:text-base font-semibold flex-1">Edit Service</h2>
          <div className="w-6"></div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <div className="flex items-center gap-1 md:gap-2 text-xs overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span
                  className={`font-medium transition-colors whitespace-nowrap ${
                    currentStep === index + 1 
                      ? "text-black" 
                      : "text-black/40"
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <Arrow direction="right" opacity={1} className="w-[12px] h-[12px] md:w-[17px] md:h-[17px] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 md:p-6 pt-3">
          {/* Step 1: Service Details */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Enter Service Details</h3>
              
              <div className="space-y-4 pb-8 md:pb-10">
                {/* Service Title */}
                <div>
                  <label className="main-label black">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={serviceDetails.title}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, title: e.target.value })}
                    className="main-input"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="main-label black">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={serviceDetails.category}
                      onChange={(e) => {
                        setServiceDetails({ 
                          ...serviceDetails, 
                          category: e.target.value,
                          subCategory: ""
                        });
                      }}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">-Select Category-</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="main-label black">
                    Sub-Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={serviceDetails.subCategory}
                      onChange={(e) => setServiceDetails({ ...serviceDetails, subCategory: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                      disabled={!serviceDetails.category}
                    >
                      <option value="">-Select Sub-Category-</option>
                      {serviceDetails.category && availableSubCategories[serviceDetails.category]?.map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="main-label black">
                    Description
                  </label>
                  <textarea
                    placeholder="Description goes here"
                    value={serviceDetails.description}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, description: e.target.value })}
                    className="main-input min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Staff Selection */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-4 md:mb-6">Choose who is providing this service</h3>
              
              {isLoadingStaff ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Loading staff members...
                </div>
              ) : staffMembers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No staff members found
                </div>
              ) : (
                <div className="space-y-3 pb-8 md:pb-10 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                  {staffMembers.map((staff) => {
                    const isSelected = selectedStaffIds.includes(staff.id);
                    return (
                      <div
                        key={staff.id}
                        onClick={() => toggleStaffSelection(staff.id)}
                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-black/10 rounded-[10px] cursor-pointer hover:border-primary transition-colors"
                      >
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-normal text-white flex-shrink-0"
                            style={{ backgroundColor: staff.calendarColor || "#9CA3AF" }}
                          >
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <span className="text-xs md:text-sm font-normal text-black/80 truncate">{staff.name}</span>
                        </div>
                        
                        <div className={`w-4 h-4 md:w-5 md:h-5 border-[1.5px] flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-black/10"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing & Duration */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-black mb-6 md:mb-8">Pricing & Duration</h3>
              
              <div className="space-y-4 pb-8 md:pb-10">
                {/* Price Type */}
                <div>
                  <label className="main-label black">
                    Price Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={pricingDetails.priceType}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, priceType: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="fixed">Fixed or starting price (From)</option>
                      <option value="starting">Starting price</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Price (in USD) */}
                <div>
                  <label className="main-label black">
                    Price (in USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Price (in USD)"
                    value={pricingDetails.price}
                    onChange={(e) => setPricingDetails({ ...pricingDetails, price: e.target.value })}
                    className="main-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="main-label black">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={pricingDetails.duration}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, duration: e.target.value })}
                      className="main-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">-Select Duration-</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1h">1h</option>
                      <option value="1h 15 min">1h 15 min</option>
                      <option value="1h 30 min">1h 30 min</option>
                      <option value="1h 45 min">1h 45 min</option>
                      <option value="2h">2h</option>
                      <option value="2h 30 min">2h 30 min</option>
                      <option value="3h">3h</option>
                      <option value="3h 30 min">3h 30 min</option>
                      <option value="4h">4h</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Requires Deposit */}
                <div>
                  <label className="main-label black">
                    Requires Deposit
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPricingDetails({ ...pricingDetails, requiresDeposit: !pricingDetails.requiresDeposit })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        pricingDetails.requiresDeposit ? "bg-primary" : "bg-gray-300"
                      } cursor-pointer`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          pricingDetails.requiresDeposit ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-black/60">
                      {pricingDetails.requiresDeposit ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Deposit Amount - Only shown when Requires Deposit is enabled */}
                {pricingDetails.requiresDeposit && (
                  <div>
                    <label className="main-label black">
                      Deposit Amount (in USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Deposit Amount (in USD)"
                      value={pricingDetails.depositAmount}
                      onChange={(e) => setPricingDetails({ ...pricingDetails, depositAmount: e.target.value })}
                      className="main-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200 sticky bottom-0 bg-[#F9F9F9] pb-4 md:pb-0">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="transparent"
                  onClick={handleClose}
                  className="flex-1 text-xs md:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-1 text-xs md:text-sm"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="transparent"
                  onClick={handlePrevious}
                  className="flex-1 text-xs md:text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="flex-1 text-xs md:text-sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : currentStep === steps.length ? "Update Service" : "Continue"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
