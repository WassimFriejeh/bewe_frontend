"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBranch } from "../../contexts/BranchContext";
import axiosClient from "../../libs/axiosClient";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import EditIcon from "../../components/Icons/EditIcon";
import DeleteIcon from "../../components/Icons/DeleteIcon";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

type CustomerType = "Offline" | "bewe App" | string;

interface CustomerRow {
  id: string;
  name: string;
  initial: string;
  type: CustomerType;
  email: string;
  phone: string;
  notes: string;
  createdOn: string;
  totalSpending: string;
}

export default function Customers() {
  const { currentBranch, branchChangeKey } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [clientTypeFilter, setClientTypeFilter] = useState<"All" | CustomerType>("All");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isAddCustomerSidebarOpen, setIsAddCustomerSidebarOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [isEditCustomerSidebarOpen, setIsEditCustomerSidebarOpen] = useState(false);
  const [customerAddedMessage, setCustomerAddedMessage] = useState<string | null>(null);

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
      const response = await axiosClient.get("/customers/get");

      const data =
        response.data?.data?.customers ||
        response.data?.customers ||
        response.data?.data ||
        response.data ||
        [];

      const customersArray = Array.isArray(data) ? data : Array.isArray((data as any)?.customers) ? (data as any).customers : [];
      setRawCustomers(customersArray);
    } catch (error) {
      console.error("Error fetching customers data:", error);
      setRawCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const customers: CustomerRow[] = useMemo(() => {
    const source =
      rawCustomers.length > 0
        ? rawCustomers
        : [
            // Fallback mock data so the UI looks populated while wiring the API
            {
              id: "1",
              first_name: "Jane",
              last_name: "Doe",
              email: "janedoe@gmail.com",
              phone: "+961 123 456",
              notes: "Lorem ipsum dolor sit amet consectetur vestibulum tortor.",
              created_at: "2025-08-29T00:00:00Z",
              total_spending: 126,
              type: "Offline",
            },
          ];

    return source.map((customer: any, index: number): CustomerRow => {
      const firstName = customer.first_name || "";
      const lastName = customer.last_name || "";
      const fullName = (customer.name || `${firstName} ${lastName}` || "Jane Doe").trim();
      const email = customer.email || "janedoe@gmail.com";
      const phone = customer.phone || customer.phone_number || "+961 123 456";
      const type: CustomerType = (customer.type || customer.source || "Offline") as CustomerType;
      const notes =
        customer.notes ||
        customer.comment ||
        "Lorem ipsum dolor sit amet consectetur vestibulum tortor.";

      const rawCreated = customer.created_at || customer.createdOn || customer.created || new Date().toISOString();
      const createdDate = new Date(rawCreated);
      const createdOn = createdDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const totalSpendingNumber = customer.total_spending ?? customer.totalSpending ?? 126;
      const totalSpending =
        typeof totalSpendingNumber === "number" ? `$${totalSpendingNumber.toFixed(2)}` : String(totalSpendingNumber);

      const initials =
        (fullName
          .split(" ")
          .filter(Boolean)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "J") as string;

      return {
        id: String(customer.id ?? index + 1),
        name: fullName,
        initial: initials,
        type,
        email,
        phone,
        notes,
        createdOn,
        totalSpending,
      };
    });
  }, [rawCustomers]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((customer) => {
  return (
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query)
        );
      });
    }

    if (clientTypeFilter !== "All") {
      result = result.filter((customer) => customer.type === clientTypeFilter);
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valueA = (a as any)[sortColumn];
        const valueB = (b as any)[sortColumn];

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, clientTypeFilter, searchQuery, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const handleChangePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6">
      {/* Top Bar */}
      <div>
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Customers</span>
          </h1>
          <div className="flex items-center gap-4">
            <BranchSelector />
            <button className="relative text-gray-600 hover:text-gray-900 cursor-pointer">
              <svg
                width="20"
                height="20"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.1458 18.75C16.1458 20.7635 14.5135 22.3958 12.5 22.3958C10.4864 22.3958 8.85416 20.7635 8.85416 18.75"
                  stroke="currentColor"
                  strokeWidth="1.5625"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.0324 18.7503H4.96757C3.94995 18.7503 3.125 17.9253 3.125 16.9077C3.125 16.4191 3.31912 15.9504 3.66468 15.6048L4.29304 14.9765C4.87909 14.3904 5.20833 13.5955 5.20833 12.7668V9.89616C5.20833 5.86909 8.47293 2.60449 12.5 2.60449C16.5271 2.60449 19.7917 5.86908 19.7917 9.89616V12.7668C19.7917 13.5955 20.1209 14.3904 20.707 14.9765L21.3353 15.6048C21.6808 15.9504 21.875 16.4191 21.875 16.9077C21.875 17.9253 21.05 18.7503 20.0324 18.7503Z"
                  stroke="currentColor"
                  strokeWidth="1.5625"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute top-[-10px] right-[4px] translate-x-1.5 translate-y-1.5 w-3 h-3 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                2
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {customerAddedMessage && (
        <div className="main-container mt-3">
          <div className="flex items-center justify-between rounded-lg bg-[#E7F9EF] border border-[#34C759] px-4 py-2 text-xs md:text-sm text-[#065F46]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#34C759] text-white text-xs">
                ✓
              </span>
              <span>
                <span className="font-semibold">{customerAddedMessage}</span> was added.
              </span>
            </div>
            <button
              onClick={() => setCustomerAddedMessage(null)}
              className="text-[#065F46] hover:text-[#064E3B] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-3 md:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header / Actions */}
          <div className="p-3 md:p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-black">Customers</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant="primary"
                  className="whitespace-nowrap flex items-center gap-2 cursor-pointer flex-shrink-0 text-sm md:text-base px-5 py-2.5"
                  onClick={() => {
                    setIsAddCustomerSidebarOpen(true);
                  }}
                >
                  <span className="hidden sm:inline">Add New Customer</span>
                  <span className="sm:hidden">Add</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z"
                      stroke="currentColor"
                      strokeWidth="1.125"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 6V12M12 9H6"
                      stroke="currentColor"
                      strokeWidth="1.125"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
                <div className="relative flex-shrink-0 w-full">
                  <select
                    value={clientTypeFilter}
                    onChange={(e) => {
                      setClientTypeFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs md:text-sm border border-black/20 rounded-[10px] bg-white text-black cursor-pointer focus:outline-none transition-colors hover:bg-black hover:text-white"
                  >
                    <option value="All">Client Type: Select</option>
                    <option value="Offline">Client Type: Offline</option>
                    <option value="bewe App">Client Type: bewe App</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="w-full max-w-md">
              <SearchInput
                placeholder="Search by customer name, email or phone number"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {([
                    "customer",
                    "type",
                    "email",
                    "phone",
                    "notes",
                    "createdOn",
                    "totalSpending",
                  ] as const).map((column) => (
                    <th
                      key={column}
                      className="px-6 py-4 text-left text-sm font-medium text-black cursor-pointer hover:bg-gray-100 first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap"
                      onClick={() => handleSort(column === "customer" ? "name" : column)}
                    >
                      <div className="flex items-center gap-2">
                        {column === "customer" && "Customer"}
                        {column === "type" && "Type"}
                        {column === "email" && "Email Address"}
                        {column === "phone" && "Phone Number"}
                        {column === "notes" && "Notes"}
                        {column === "createdOn" && "Created on"}
                        {column === "totalSpending" && "Total Spending"}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6L8 2L12 6M4 10L8 14L12 10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-sm font-medium text-black whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
        {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-black/60">
                      Loading customers...
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-black/60">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsCustomerDetailsOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold text-black">
                            {customer.initial}
              </div>
                          <div>
                            <div className="text-sm font-medium text-black">{customer.name}</div>
                            <div className="text-xs text-black/40">ID #{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/5 text-black">
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-black/80">{customer.email}</td>
                      <td className="px-6 py-4 align-top text-sm text-black/80">{customer.phone}</td>
                      <td className="px-6 py-4 align-top text-sm text-black/60 max-w-xs">
                        <span className="line-clamp-2">{customer.notes}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-black/80 whitespace-nowrap">
                        {customer.createdOn}
                      </td>
                      <td className="px-6 py-4 align-top text-sm font-semibold text-black whitespace-nowrap">
                        {customer.totalSpending}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div
                          className="flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomer(customer);
                            setIsEditCustomerSidebarOpen(true);
                          }}
                        >
                          <EditIcon />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet List */}
          <div className="md:hidden">
        {isLoading ? (
              <div className="p-4 text-center text-sm text-black/60">Loading customers...</div>
            ) : paginatedCustomers.length === 0 ? (
              <div className="p-4 text-center text-sm text-black/60">No customers found.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {paginatedCustomers.map((customer) => (
                  <li 
                    key={customer.id} 
                    className="p-4 flex flex-col gap-3 bg-white cursor-pointer"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsCustomerDetailsOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold text-black">
                          {customer.initial}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black">{customer.name}</div>
                          <div className="text-xs text-black/40">{customer.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomer(customer);
                            setIsEditCustomerSidebarOpen(true);
                          }}
                        >
                          <EditIcon 
                            className="!w-8 !h-8" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-black/60">
                      <span>
                        <span className="font-medium text-black/80">Phone: </span>
                        {customer.phone}
                      </span>
                      <span>
                        <span className="font-medium text-black/80">Type: </span>
                        {customer.type}
                      </span>
                      <span>
                        <span className="font-medium text-black/80">Created: </span>
                        {customer.createdOn}
                      </span>
                      <span>
                        <span className="font-medium text-black/80">Spending: </span>
                        {customer.totalSpending}
                      </span>
                    </div>
                    <p className="text-xs text-black/60 line-clamp-2">{customer.notes}</p>
                  </li>
                ))}
              </ul>
        )}
      </div>

          {/* Footer / Pagination */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-3 md:px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
            <p className="text-xs md:text-sm text-black/50">
              Showing {paginatedCustomers.length > 0 ? startIndex + 1 : 0}–
              {startIndex + paginatedCustomers.length} out of {filteredCustomers.length}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => handleChangePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-md border border-black/10 text-black/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                  return (
                    <button
                      key={page}
                      onClick={() => handleChangePage(page)}
                      className={`px-3 py-1.5 text-xs rounded-md cursor-pointer ${
                        currentPage === page
                          ? "bg-black text-white"
                          : "border border-black/10 text-black/70 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (Math.abs(page - currentPage) === 2) {
                  return (
                    <span key={page} className="px-2 text-xs text-black/40">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                onClick={() => handleChangePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-md border border-black/10 text-black/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Next
              </button>
    </div>
          </div>
        </div>
              </div>

      {/* Add New Customer Sidebar */}
      {isAddCustomerSidebarOpen && (
        <AddNewCustomerSidebar
          onClose={() => setIsAddCustomerSidebarOpen(false)}
          onSaved={(fullName) => {
            if (fullName) {
              setCustomerAddedMessage(fullName);
              setTimeout(() => {
                setCustomerAddedMessage((prev) =>
                  prev === fullName ? null : prev
                );
              }, 4000);
            }
            setIsAddCustomerSidebarOpen(false);
            fetchCustomersData();
          }}
        />
      )}

      {/* Edit Customer Sidebar */}
      {isEditCustomerSidebarOpen && editingCustomer && (
        <EditCustomerSidebar
          customer={editingCustomer}
          onClose={() => {
            setIsEditCustomerSidebarOpen(false);
            setEditingCustomer(null);
          }}
          onSaved={(updatedCustomer) => {
            // Optimistically update local data so the table reflects edits immediately
            setRawCustomers((prev) =>
              prev.map((c: any) => {
                const id = String(c.id ?? c.customer_id ?? "");
                if (id !== updatedCustomer.id) return c;
                return {
                  ...c,
                  name: updatedCustomer.name,
                  email: updatedCustomer.email,
                  phone: updatedCustomer.phone,
                  notes: updatedCustomer.notes,
                };
              })
            );

            setIsEditCustomerSidebarOpen(false);
            setEditingCustomer(null);

            // Also refresh from server to stay in sync with backend
            fetchCustomersData();
          }}
        />
      )}

      {/* Customer Details Sidebar */}
      {isCustomerDetailsOpen && (
        <CustomerDetailsSidebar
          customer={selectedCustomer}
          onClose={() => {
            setIsCustomerDetailsOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}

// Add New Customer Sidebar - matches design
function AddNewCustomerSidebar({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (fullName: string) => void;
}) {
  const { currentBranch } = useBranch();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+961",
    dateOfBirth: "",
    gender: "",
    preferences: "",
  });

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Initialize intl-tel-input for customer phone (same as profile page)
  useEffect(() => {
    if (phoneInputRef.current && !itiRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: "lb",
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
      } as any);

      // Set initial number if present
      if (formData.phone) {
        phoneInputRef.current.value = formData.phone;
      }

      // Listen for country changes
      phoneInputRef.current.addEventListener("countrychange", () => {
        if (itiRef.current) {
          const countryData = itiRef.current.getSelectedCountryData();
          setFormData((prev) => ({
            ...prev,
            countryCode: `+${countryData.dialCode}`,
          }));
        }
      });

      // Listen for input changes
      phoneInputRef.current.addEventListener("input", () => {
        if (phoneInputRef.current) {
          setFormData((prev) => ({
            ...prev,
            phone: phoneInputRef.current?.value || "",
          }));
        }
      });
    }

    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    if (!currentBranch) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please fill in first name and last name");
      return;
    }
    if (!formData.email.trim()) {
      alert("Please fill in email address");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Please fill in phone number");
      return;
    }
    if (!formData.dateOfBirth.trim()) {
      alert("Please fill in date of birth");
      return;
    }
    if (!formData.gender.trim()) {
      alert("Please select gender");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim()
          ? `${formData.countryCode} ${formData.phone.trim()}`
          : null,
        country_code: formData.countryCode,
        date_of_birth: formData.dateOfBirth.trim(),
        gender: formData.gender,
        notes: formData.preferences.trim() || null,
        branch_id: currentBranch.id,
      };

      await axiosClient.post("/customers/add", payload);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "+961",
        dateOfBirth: "",
        gender: "",
        preferences: "",
      });

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || "Customer";
      onSaved(fullName);
    } catch (error: any) {
      console.error("Error adding customer:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add customer. Please try again.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    `${formData.firstName.charAt(0) || ""}${formData.lastName.charAt(0) || ""}`.toUpperCase() ||
    "?";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={`relative flex flex-col w-full md:w-[36%] lg:w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
          isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <div className="text-base md:text-lg font-semibold text-black">Add New Customer</div>
          <button
            onClick={handleClose}
            className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089"
                stroke="currentColor"
                strokeWidth="1.5625"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-black mb-2">Profile Photo</span>
              <button
                type="button"
                className="w-24 h-24 rounded-full border border-dashed border-black/15 bg-white flex items-center justify-center text-3xl text-black/40 cursor-pointer hover:bg-gray-50"
              >
                {initials ? initials.charAt(0) : "+"}
              </button>
            </div>
            <p className="text-[11px] leading-4 text-black/60 max-w-[220px]">
              JPG, PNG, SVG, WEBP. Recommended 512 pixels minimum, aspect ratio 1:1
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="X XXX XXX"
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Date of Birth - styled like Marketing Start Date & Time but date-only */}
            <div>
              <label className="main-label black">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="main-input"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary appearance-none pr-8"
                >
                  <option value="">-Select Gender-</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Preferences & Allergies */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Preferences & Allergies
              </label>
              <textarea
                placeholder="Write your preferences & allergies here"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <Button
            variant="transparent"
            onClick={handleClose}
            className="flex-1 text-xs md:text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 text-xs md:text-sm"
          >
            {isSaving ? "Adding..." : "Add Customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Customer Sidebar - similar layout to Add, prefilled with customer data
function EditCustomerSidebar({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRow;
  onClose: () => void;
  onSaved: (updated: CustomerRow) => void;
}) {
  const { currentBranch } = useBranch();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+961",
    dateOfBirth: "",
    gender: "",
    preferences: "",
  });

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    // Prefill from customer
    const nameParts = customer.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    let countryCode = "+961";
    let phone = customer.phone || "";

    if (phone.startsWith("+")) {
      const pieces = phone.split(" ");
      if (pieces.length > 1) {
        countryCode = pieces[0];
        phone = pieces.slice(1).join(" ");
      }
    }

    setFormData({
      firstName,
      lastName,
      email: customer.email,
      phone,
      countryCode,
      dateOfBirth: "",
      gender: "",
      preferences: customer.notes || "",
    });
  }, [customer]);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Initialize intl-tel-input for edit phone (run once)
  useEffect(() => {
    if (phoneInputRef.current && !itiRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: "lb",
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
      } as any);

      // Set initial number if available
      if (customer.phone && itiRef.current) {
        try {
          itiRef.current.setNumber(customer.phone);
        } catch {
          phoneInputRef.current.value = formData.phone;
        }
      } else if (formData.phone) {
        phoneInputRef.current.value = formData.phone;
      }

      phoneInputRef.current.addEventListener("countrychange", () => {
        if (itiRef.current) {
          const countryData = itiRef.current.getSelectedCountryData();
          setFormData((prev) => ({
            ...prev,
            countryCode: `+${countryData.dialCode}`,
          }));
        }
      });

      phoneInputRef.current.addEventListener("input", () => {
        if (phoneInputRef.current) {
          setFormData((prev) => ({
            ...prev,
            phone: phoneInputRef.current?.value || "",
          }));
        }
      });
    }

    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    if (!currentBranch) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please fill in first name and last name");
      return;
    }
    if (!formData.email.trim()) {
      alert("Please fill in email address");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Please fill in phone number");
      return;
    }

    setIsSaving(true);
    try {
      const fullPhone = formData.phone.trim()
        ? `${formData.countryCode} ${formData.phone.trim()}`
        : "";

      const payload = {
        id: customer.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: fullPhone || null,
        country_code: formData.countryCode,
        date_of_birth: formData.dateOfBirth.trim() || null,
        gender: formData.gender || null,
        notes: formData.preferences.trim() || null,
        branch_id: currentBranch.id,
      };

      // TODO: adjust endpoint/method based on backend API
      await axiosClient.post("/customers/update", payload);

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || "Customer";

      const updatedCustomer: CustomerRow = {
        id: customer.id,
        name: fullName,
        initial:
          (fullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "J") as string,
        type: customer.type,
        email: formData.email.trim(),
        phone: fullPhone || customer.phone,
        notes: formData.preferences.trim() || "",
        createdOn: customer.createdOn,
        totalSpending: customer.totalSpending,
      };

      onSaved(updatedCustomer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update customer. Please try again.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    `${formData.firstName.charAt(0) || ""}${formData.lastName.charAt(0) || ""}`.toUpperCase() ||
    "?";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={`relative flex flex-col w-full md:w-[36%] lg:w-[32%] bg-[#F9F9F9] h-full shadow-xl overflow-y-auto transform transition-all duration-300 ease-in-out ${
          isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <div className="text-base md:text-lg font-semibold text-black">Edit Customer</div>
          <button
            onClick={handleClose}
            className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089"
                stroke="currentColor"
                strokeWidth="1.5625"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-black mb-2">Profile Photo</span>
              <button
                type="button"
                className="w-24 h-24 rounded-full border border-dashed border-black/15 bg-white flex items-center justify-center text-3xl text-black/40 cursor-pointer hover:bg-gray-50"
              >
                {initials ? initials.charAt(0) : "+"}
              </button>
            </div>
            <p className="text-[11px] leading-4 text-black/60 max-w-[220px]">
              JPG, PNG, SVG, WEBP. Recommended 512 pixels minimum, aspect ratio 1:1
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="X XXX XXX"
                className="w-full px-3 py-2.5 border border-black/10 rounded-md bg-white text-xs md:text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="main-label black">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="main-input"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-black mb-1.5">
                Gender
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="appearance-none w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-lg bg-white text-black text-xs md:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/30 pr-10"
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Preferences & Allergies */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-black mb-1.5">
                Preferences & Allergies
              </label>
              <textarea
                placeholder="Write your preferences & allergies here"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                rows={4}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-black/10 rounded-md bg-white text-black text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <Button
            variant="transparent"
            onClick={handleClose}
            className="flex-1 text-xs md:text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 text-xs md:text-sm"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Customer Details Sidebar Component
function CustomerDetailsSidebar({
  customer,
  onClose,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Past Bookings" | "Rating & Reviews">(
    "Overview"
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<
    "All Statuses" | "Completed" | "No Show" | "Cancelled"
  >("All Statuses");
  const [currentReviewsPage, setCurrentReviewsPage] = useState(1);

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

  // Mock data for customer details
  const customerData = customer || {
    id: "",
    name: "New Customer",
    initial: "?",
    type: "Offline",
    email: "",
    phone: "",
    notes: "",
    createdOn: "",
    totalSpending: "$0.00",
  };

  const overviewStats = {
    totalSales: customer ? customer.totalSpending : "$0.00",
    numAppointments: customer ? "100" : "0",
    numRatings: customer ? "10" : "0",
    cancelledAppointments: customer ? "2" : "0",
    noShowAppointments: customer ? "0" : "0",
  };

  const pastBookings = [
    {
      id: "123",
      date: "Fri 29 Aug, 2025 - 10:24 am",
      status: "Completed" as const,
      services: [
        {
          name: "Haircut",
          staff: "Mia Smith",
          time: "6:30 pm",
          duration: "30 min",
          price: "$20.00",
        },
        {
          name: "Brushing",
          staff: "Mia Smith",
          time: "6:30 pm",
          duration: "30 min",
          price: "$20.00",
        },
      ],
      note:
        "Lorem ipsum dolor sit amet consectetur. Nulla elementum augue leo odio arcu. Mattis in magna porta dolor donec.",
    },
    {
      id: "124",
      date: "Fri 29 Aug, 2025 - 10:24 am",
      status: "No Show" as const,
      services: [
        {
          name: "Haircut",
          staff: "Mia Smith",
          time: "6:30 pm",
          duration: "30 min",
          price: "$20.00",
        },
      ],
      note: "",
    },
    {
      id: "125",
      date: "Fri 29 Aug, 2025 - 10:24 am",
      status: "Cancelled" as const,
      services: [
        {
          name: "Haircut",
          staff: "Mia Smith",
          time: "6:30 pm",
          duration: "30 min",
          price: "$20.00",
        },
        {
          name: "Brushing",
          staff: "Mia Smith",
          time: "6:30 pm",
          duration: "30 min",
          price: "$20.00",
        },
      ],
      note:
        "Lorem ipsum dolor sit amet consectetur. Nulla elementum augue leo odio arcu. Mattis in magna porta dolor donec.",
    },
  ];

  const filteredBookings =
    bookingStatus === "All Statuses"
      ? pastBookings
      : pastBookings.filter((b) => b.status === bookingStatus);

  const baseRatingReviews = [
    {
      id: "1",
      customerName: customerData.name || "Jane Doe",
      initials: customerData.initial || "J",
      appointmentId: "#1625",
      staffName: "Karen Taylor",
      date: "22/11/2025",
      text:
        "Lorem ipsum dolor sit amet consectetur. Id metus arcu turpis ultricies. Integer venenatis est purus orci vivamus amet. Tellus sem tristique nisl nunc consectetur eu suspendisse elementum. Nulla varius tortor et eget proin quis viverra mattis.",
    },
    {
      id: "2",
      customerName: customerData.name || "Jane Doe",
      initials: customerData.initial || "J",
      appointmentId: "#1625",
      staffName: "Karen Taylor",
      date: "22/11/2025",
      text:
        "Lorem ipsum dolor sit amet consectetur. Id metus arcu turpis ultricies. Integer venenatis est purus orci vivamus amet. Tellus sem tristique nisl nunc consectetur eu suspendisse elementum. Nulla varius tortor et eget proin quis viverra mattis.",
    },
    {
      id: "3",
      customerName: customerData.name || "Jane Doe",
      initials: customerData.initial || "J",
      appointmentId: "#1625",
      staffName: "Karen Taylor",
      date: "22/11/2025",
      text:
        "Lorem ipsum dolor sit amet consectetur. Id metus arcu turpis ultricies. Integer venenatis est purus orci vivamus amet. Tellus sem tristique nisl nunc consectetur eu suspendisse elementum. Nulla varius tortor et eget proin quis viverra mattis.",
    },
    {
      id: "4",
      customerName: customerData.name || "Jane Doe",
      initials: customerData.initial || "J",
      appointmentId: "#1625",
      staffName: "Karen Taylor",
      date: "22/11/2025",
      text:
        "Lorem ipsum dolor sit amet consectetur. Id metus arcu turpis ultricies. Integer venenatis est purus orci vivamus amet. Tellus sem tristique nisl nunc consectetur eu suspendisse elementum. Nulla varius tortor et eget proin quis viverra mattis.",
    },
  ];

  const ratingReviews = [...baseRatingReviews, ...baseRatingReviews, ...baseRatingReviews];

  const totalReviews = 125;
  const reviewsPerPage = 12;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isAnimating && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div className={`flex flex-col relative w-full md:w-[32%] lg:w-[28%] bg-white h-full shadow-xl overflow-hidden transform transition-all duration-300 ease-in-out ${
        isAnimating && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        {/* Header */}
        <div className="bg-white text-black p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold">Customer Details</h2>
          <button
            onClick={handleClose}
            className="text-black/60 hover:text-black transition-colors cursor-pointer flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="currentColor" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Customer Info */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-black">
              {customerData.initial}
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{customerData.name}</div>
              {customerData.email && (
                <div className="text-sm text-black/60 mt-1">{customerData.email}</div>
              )}
              {customerData.phone && (
                <div className="text-sm text-black/60">{customerData.phone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white px-4 md:px-6 pt-2 md:pt-4 gap-3">
          {(["Overview", "Past Bookings", "Rating & Reviews"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none min-w-[130px] px-5 py-2.5 text-sm md:text-base font-medium rounded-md border transition-colors ${
                  isActive
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/10 hover:bg-black hover:text-white hover:border-black"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === "Overview" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-black">Overview</h3>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4">
                {/* Total Sales - Full Width */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-black/60 mb-1">Total Sales</div>
                  <div className="text-xl font-bold text-black">{overviewStats.totalSales}</div>
                </div>

                {/* Two Column Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-black/60 mb-1">Nb of appointments</div>
                    <div className="text-lg font-bold text-black">{overviewStats.numAppointments}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-black/60 mb-1">Nb of ratings</div>
                    <div className="text-lg font-bold text-black">{overviewStats.numRatings}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-black/60 mb-1">Cancelled Appointments</div>
                    <div className="text-lg font-bold text-black">{overviewStats.cancelledAppointments}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-black/60 mb-1">No Show Appointments</div>
                    <div className="text-lg font-bold text-black">{overviewStats.noShowAppointments}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Past Bookings" && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-black">Past Bookings</h3>

              {/* Status Filter */}
              <div className="w-full max-w-xs">
                <label className="block text-xs font-medium text-black mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={bookingStatus}
                    onChange={(e) =>
                      setBookingStatus(
                        e.target.value as "All Statuses" | "Completed" | "No Show" | "Cancelled"
                      )
                    }
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs md:text-sm border border-black/10 rounded-lg bg-white text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/30"
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="No Show">No Show</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-black/10 rounded-xl bg-white shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                      <div>
                        <div className="text-sm font-semibold text-black">
                          Booking #{booking.id}
                        </div>
                        <div className="text-xs text-black/50 mt-0.5">{booking.date}</div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-medium ${
                          booking.status === "Completed"
                            ? "bg-[#F3E8FF] text-[#7C3AED]"
                            : booking.status === "No Show"
                            ? "bg-[#FEF3C7] text-[#C05621]"
                            : "bg-[#FEE2E2] text-[#B91C1C]"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {booking.services.map((service, idx) => (
                        <div
                          key={`${booking.id}-${service.name}-${idx}`}
                          className="flex items-start justify-between gap-3 text-xs md:text-sm"
                        >
                          <div>
                            <div className="font-semibold text-black">{service.name}</div>
                            <div className="mt-1 flex items-center gap-1 text-black/60">
                              <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[11px] font-semibold text-black">
                                {service.staff
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                              <span>{service.staff}</span>
                              <span className="mx-1">•</span>
                              <span>{service.time}</span>
                              <span className="mx-1">|</span>
                              <span>{service.duration}</span>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-black">
                            {service.price}
                          </div>
                        </div>
                      ))}

                      {booking.note && (
                        <div className="mt-2 rounded-lg bg-[#F4F3FF] px-3 py-2 text-xs text-black/70">
                          {booking.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Rating & Reviews" && (
            <div className="space-y-6 mt-6">
              <h3 className="text-lg md:text-xl font-semibold text-black">
                Rating & Reviews Placed
              </h3>

              {/* Reviews List */}
              <div className="space-y-4">
                {ratingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border border-black/10 rounded-xl px-4 py-3 md:px-5 md:py-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold text-black">
                          {review.initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-black">
                            {review.customerName}
                          </div>
                          <div className="text-xs text-black/50 mt-0.5">
                            Appointment {review.appointmentId} | {review.staffName}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-black/40 whitespace-nowrap">
                        {review.date}
                      </div>
                    </div>
                    <p className="mt-3 text-xs md:text-sm text-black/70 leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
                <p className="text-xs text-black/50">
                  Showing {Math.min(reviewsPerPage, totalReviews)} out {totalReviews}
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentReviewsPage(page)}
                      className={`w-8 h-8 rounded-md text-xs flex items-center justify-center cursor-pointer ${
                        currentReviewsPage === page
                          ? "bg-black text-white"
                          : "border border-black/10 text-black/70 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <span className="text-xs text-black/40 px-1">...</span>
                  <button
                    onClick={() => setCurrentReviewsPage(10)}
                    className={`w-8 h-8 rounded-md text-xs flex items-center justify-center cursor-pointer ${
                      currentReviewsPage === 10
                        ? "bg-black text-white"
                        : "border border-black/10 text-black/70 hover:bg-gray-50"
                    }`}
                  >
                    10
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 flex items-center gap-4">
          <button
            onClick={handleClose}
            className="flex-[0.4] px-5 py-3 text-sm md:text-base font-medium rounded-lg bg-transparent border border-gray-300 text-black hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <Button
            variant="primary"
            onClick={() => {
              // TODO: Navigate to booking page or open booking modal
              console.log("Book an Appointment");
            }}
            className="flex-1 text-sm md:text-base flex items-center justify-center gap-2 py-3 rounded-lg"
          >
            Book an Appointment
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z"
                stroke="currentColor"
                strokeWidth="1.125"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 6V12M12 9H6"
                stroke="currentColor"
                strokeWidth="1.125"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
