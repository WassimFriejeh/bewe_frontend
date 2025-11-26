"use client";

import { useState, useEffect } from "react";
import { getUser } from "@/utils/token";
import ProtectedPage from "@/components/ProtectedPage";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <ProtectedPage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden mr-6">
                <img
                  src={user?.profileImage || `https://picsum.photos/seed/${user?.id || 'user-avatar'}/80/80.jpg`}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'User Name'
                  }
                </h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">First Name</label>
                  <p className="text-white">{user?.first_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Last Name</label>
                  <p className="text-white">{user?.last_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white">{user?.email || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Account Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">User ID</label>
                  <p className="text-white">{user?.id || 'Not available'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Role</label>
                  <p className="text-white">{user?.role || 'User'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Account Status</label>
                  <p className="text-green-400">Active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                Change Password
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                Notification Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
