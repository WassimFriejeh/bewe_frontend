"use client";
import { useEffect, useState } from "react";
import axiosClient from "../../libs/axiosClient";
import { getToken, getUser, User } from "../../utils/token";
import { logout } from "../../utils/logout";
import Popup from "../../components/Popup";

export default function Home() {
  const [message, setMessage] = useState("Loading...");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get token and user data
    const storedToken = getToken();
    const storedUser = getUser();
    
    console.log("Retrieved Token:", storedToken);
    console.log("Retrieved User:", storedUser);
    console.log("localStorage auth_token:", typeof window !== "undefined" ? localStorage.getItem("auth_token") : "N/A");
    
    setToken(storedToken);
    setUser(storedUser);

    // Fetch data - authentication is handled by ProtectedLayout
    axiosClient.get("/hello")
      .then(res => setMessage(res.data.message))
      .catch((error) => {
        console.log("Full error:", error);
      });
  }, []);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);
  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* User Info Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-3">User Information</h2>
        
        <div className="space-y-2">
          <div>
            <strong>Token:</strong>
            <div className="mt-1 p-2 bg-white rounded border border-gray-300 break-all text-sm font-mono">
              
              {token || "No token found"}
            </div>
          </div>
          
          {user && (
            <div className="mt-3">
              <strong>User Data:</strong>
              <pre className="mt-1 p-2 bg-white rounded border border-gray-300 text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
        >
          Logout
        </button>
      </div>

      <div className="h-screen bg-red-400"></div>
      
      <h1 className="text-3xl font-bold underline text-blue-500">
        Hello world!
      </h1>

      <p>{message}</p>

      <button
        onClick={openPopup}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
      >
        Open Popup
      </button>

      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title="Example Popup"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This is an example popup component! You can put any content here.
          </p>
          <p className="text-gray-600">
            The popup can be closed by clicking the X icon in the top-right corner.
          </p>
          <button
            onClick={closePopup}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </Popup>
    </div>
  );
}
