"use client";

import { useState } from "react";
import { useBranch } from "../../contexts/BranchContext";
import BranchSelector from "../../components/BranchSelector";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";

export default function Settings() {
  const { currentBranch } = useBranch();
  const [selectedSection, setSelectedSection] = useState<"Salon Profile" | "Business Policies" | "Team Roles & Access">("Salon Profile");
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    online: false,
  });
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState("");
  const [taxLabel, setTaxLabel] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamSortColumn, setTeamSortColumn] = useState<string | null>(null);
  const [teamSortDirection, setTeamSortDirection] = useState<"asc" | "desc">("asc");
  const [isAddUserSidebarOpen, setIsAddUserSidebarOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    branch: "",
    role: "",
    permissions: "",
  });

  interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    branch: string;
    permissions: string[];
  }

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "2", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "3", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "4", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "5", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "6", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
    { id: "7", name: "Elie Smith", email: "eliesmith@gmail.com", role: "Role", branch: "Branch Title", permissions: ["Permission 1", "Permission 2", "Permission 3", "Permission 4"] },
  ]);

  const handleTeamSort = (column: string) => {
    if (teamSortColumn === column) {
      setTeamSortDirection(teamSortDirection === "asc" ? "desc" : "asc");
    } else {
      setTeamSortColumn(column);
      setTeamSortDirection("asc");
    }
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-screen bg-[#F9F9F9] -ml-6 -mr-6 -mt-6 flex flex-col">
      {/* Top Bar */}
      <div className="flex-shrink-0">
        <div className="main-container flex items-center justify-between bg-white border-b border-gray-200 py-3">
          <h1 className="text-sm font-medium text-black flex items-center">
            <span className="opacity-30">bewe</span>
            <span className="mx-3 block">/</span>
            <span>Settings</span>
          </h1>
          <div className="flex items-center gap-4">
            <BranchSelector />
            <button className="relative text-gray-600 hover:text-gray-900 cursor-pointer">
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
      <div className="main-container py-6 flex-1 flex">
        <div className="flex gap-6 items-stretch w-full">
          {/* Settings Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-full" style={{ width: "314px" }}>
            <h2 className="text-lg font-bold text-black mb-4">Settings</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedSection("Salon Profile")}
                className={`w-full text-left px-6 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedSection === "Salon Profile"
                    ? "text-black"
                    : "text-black/60"
                }`}
                style={{
                  backgroundColor: selectedSection === "Salon Profile" ? "#F5F3F7" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (selectedSection !== "Salon Profile") {
                    e.currentTarget.style.backgroundColor = "#F5F3F7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSection !== "Salon Profile") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                Salon Profile
              </button>
              <button
                onClick={() => setSelectedSection("Business Policies")}
                className={`w-full text-left px-6 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedSection === "Business Policies"
                    ? "text-black"
                    : "text-black/60"
                }`}
                style={{
                  backgroundColor: selectedSection === "Business Policies" ? "#F5F3F7" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (selectedSection !== "Business Policies") {
                    e.currentTarget.style.backgroundColor = "#F5F3F7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSection !== "Business Policies") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                Business Policies
              </button>
              <button
                onClick={() => setSelectedSection("Team Roles & Access")}
                className={`w-full text-left px-6 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedSection === "Team Roles & Access"
                    ? "text-black"
                    : "text-black/60"
                }`}
                style={{
                  backgroundColor: selectedSection === "Team Roles & Access" ? "#F5F3F7" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (selectedSection !== "Team Roles & Access") {
                    e.currentTarget.style.backgroundColor = "#F5F3F7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSection !== "Team Roles & Access") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                Team Roles & Access
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className={`p-6 flex-1 ${selectedSection === "Business Policies" || selectedSection === "Team Roles & Access" || selectedSection === "Salon Profile" ? "" : "bg-white rounded-lg shadow-sm"}`}>
            {selectedSection === "Salon Profile" && (
              <div className="space-y-6">
                {/* Top Section with Logo */}
                <div className="flex items-start justify-between pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-full bg-pink-200 flex items-center justify-center flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-medium text-pink-700 mb-1">Emily Beauty</div>
                        <div className="text-[10px] text-pink-600">Your Tagline Here</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-black/60 mb-1">ID 173836</div>
                      <h3 className="text-lg font-bold text-black mb-2">Salon Name</h3>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-black">5.0</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    className="cursor-pointer"
                  >
                    Contact bewe to Update Profile
                  </Button>
                </div>

                {/* Profile Details - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">About</h4>
                      <p className="text-sm text-black/60">Lorem ipsum dolor sit amet consectetur nec ut est.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Business Address</h4>
                      <p className="text-sm text-black/60">Lorem ipsum dolor sit amet consectetur nec ut est.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Email Address</h4>
                      <p className="text-sm text-black/60">info@business.com</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Social Media</h4>
                      <div className="text-sm text-black/60 space-y-1">
                        <p>Instagram: @businessname</p>
                        <p>Facebook: @business name</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Business Category</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Hair Salon
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Beauty Center
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Phone Number</h4>
                      <p className="text-sm text-black/60">+961 1 272 273</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Website</h4>
                      <p className="text-sm text-black/60">www.website.com</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-black mb-2">Opening hours</h4>
                      <p className="text-sm text-black/60">
                        Monday to Friday - 09:00 am to 07:00 pm | Saturday - 20:00 am to 07:00 pm | Sunday - Closed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="pt-6">
                  <h4 className="text-sm font-semibold text-black mb-4">Gallery Images</h4>
                  <div className="flex gap-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      >
                        <div className="text-xs text-gray-400">Image {i + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "Business Policies" && (
              <div className="space-y-6">
                {/* Payment Rules */}
                <div>
                  <h3 className="text-lg font-bold text-black mb-2">Payment Rules</h3>
                  <p className="text-sm text-black/60 mb-4">Choose payment methods</p>
                  <div className="space-y-3">
                    <label htmlFor="cash" className="flex items-center w-full px-4 py-3 bg-white border border-black/10 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="cash"
                        checked={paymentMethods.cash}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, cash: e.target.checked })}
                        className="w-4 h-4 accent-[#7B2CBF] border-gray-300 rounded focus:ring-primary cursor-pointer"
                      />
                      <span className="ml-3 text-sm text-black">Cash</span>
                    </label>
                    <label htmlFor="online" className="flex items-center w-full px-4 py-3 bg-white border border-black/10 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="online"
                        checked={paymentMethods.online}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, online: e.target.checked })}
                        className="w-4 h-4 accent-[#7B2CBF] border-gray-300 rounded focus:ring-primary cursor-pointer"
                      />
                      <span className="ml-3 text-sm text-black">Online</span>
                    </label>
                  </div>
                </div>

                {/* Tax Settings */}
                <div className="pt-6">
                  <h3 className="text-lg font-bold text-black mb-4">Tax Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTaxEnabled(!taxEnabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          taxEnabled ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            taxEnabled ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <label className="text-sm font-medium text-black cursor-pointer" onClick={() => setTaxEnabled(!taxEnabled)}>
                        Enable Tax
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-0">
                      <div>
                        <label className={`block text-sm font-medium text-black mb-2 ${
                          !taxEnabled || paymentMethods.online ? "opacity-60" : ""
                        }`}>
                          Tax Rate (in %) <span className="text-primary">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Tax Rate (in %)"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          disabled={!taxEnabled || paymentMethods.online}
                          className={`w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm ${
                            !taxEnabled || paymentMethods.online ? "bg-gray-50 cursor-not-allowed opacity-60" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium text-black mb-2 ${
                          !taxEnabled || paymentMethods.online ? "opacity-60" : ""
                        }`}>
                          Tax Label <span className="text-primary">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Tax Label"
                          value={taxLabel}
                          onChange={(e) => setTaxLabel(e.target.value)}
                          disabled={!taxEnabled || paymentMethods.online}
                          className={`w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm ${
                            !taxEnabled || paymentMethods.online ? "bg-gray-50 cursor-not-allowed opacity-60" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-6">
                  <Button
                    variant="primary"
                    className="w-auto min-w-[180px] cursor-pointer"
                    onClick={() => {
                      // Handle save changes
                      console.log("Saving business policies...");
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {selectedSection === "Team Roles & Access" && (
              <div className="space-y-6">
                {/* Row 1: Title and Add Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-black">Team Roles & Access</h3>
                  <Button 
                    variant="primary" 
                    className="flex items-center gap-2 cursor-pointer px-6 py-3"
                    onClick={() => setIsAddUserSidebarOpen(true)}
                  >
                    Add New User
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9Z" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 6V12M12 9H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                </div>

                {/* Row 2: Search and Branch Dropdown */}
                <div className="flex items-center justify-between gap-4 -mt-2">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-[16px] h-[16px]" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.75 12.75L15.75 15.75" stroke="black" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25Z" stroke="black" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by user name"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                  </div>
                  <BranchSelector />
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white border-b border-gray-200">
                        <tr>
                          {["User", "Email", "Role", "Branch", "Permission(s)"].map((header) => {
                            const columnMap: { [key: string]: string } = {
                              "User": "user",
                              "Email": "email",
                              "Role": "role",
                              "Branch": "branch",
                              "Permission(s)": "permissions"
                            };
                            const columnKey = columnMap[header];
                            const isSorted = teamSortColumn === columnKey;
                            return (
                              <th
                                key={header}
                                onClick={() => handleTeamSort(columnKey)}
                                className="group px-5 pb-4 pt-5 text-left text-xs font-medium text-black/50 capitalize cursor-pointer"
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
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTeamMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 text-xs font-normal text-black/80">
                              {member.name}
                            </td>
                            <td className="px-5 py-4 text-xs font-normal text-black/80">
                              {member.email}
                            </td>
                            <td className="px-5 py-4 text-xs font-normal text-black/80 capitalize">
                              {member.role}
                            </td>
                            <td className="px-5 py-4 text-xs font-normal text-black/80">
                              {member.branch}
                            </td>
                            <td className="px-5 py-4 text-xs font-normal text-black/80">
                              {member.permissions.join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New User Sidebar */}
      {isAddUserSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsAddUserSidebarOpen(false)}
          />
          <div className="relative w-[400px] min-w-[400px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-gray-200">
              <button
                onClick={() => setIsAddUserSidebarOpen(false)}
                className="cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.75 6.25L6.25084 18.7492M18.7492 18.75L6.25 6.25089" stroke="black" strokeWidth="1.5625" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-black">Add New User</h2>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={newUserForm.firstName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newUserForm.lastName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newUserForm.branch}
                    onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })}
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-sm pr-8"
                  >
                    <option value="">-Select Branch-</option>
                    <option value="Branch 1">Branch 1</option>
                    <option value="Branch 2">Branch 2</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-sm pr-8"
                  >
                    <option value="">-Select Role-</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Permissions <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newUserForm.permissions}
                    onChange={(e) => setNewUserForm({ ...newUserForm, permissions: e.target.value })}
                    className="w-full px-4 py-2.5 border border-black/10 rounded-lg appearance-none bg-white cursor-pointer focus:outline-none focus:border-primary text-sm pr-8"
                  >
                    <option value="">-Select Permissions-</option>
                    <option value="Permission 1">Permission 1</option>
                    <option value="Permission 2">Permission 2</option>
                    <option value="Permission 3">Permission 3</option>
                    <option value="Permission 4">Permission 4</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-gray-200 p-6 flex gap-4">
              <button
                onClick={() => setIsAddUserSidebarOpen(false)}
                className="flex-1 px-6 py-2.5 bg-white border border-black/10 rounded-lg text-sm font-medium text-black/60 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle add user
                  console.log("Adding user:", newUserForm);
                  setIsAddUserSidebarOpen(false);
                  setNewUserForm({
                    firstName: "",
                    lastName: "",
                    email: "",
                    branch: "",
                    role: "",
                    permissions: "",
                  });
                }}
                className="flex-1 px-6 py-2.5 bg-primary rounded-lg text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Add User
              </button>
            </div>
      </div>
        </div>
      )}
    </div>
  );
}
