/**
 * Test utility for simulating real API response structure
 */

import { setToken, setUser } from "./token";

// Simulate the real API response structure
const realApiResponse = {
  token: "28|fimTDvRVlHyEWWe9zkBEtJ9Ibmp7MmsdYKt6XUGUcbe97539",
  user: {
    id: 1,
    created_at: "2025-11-15T17:16:25.000000Z",
    updated_at: "2025-11-15T22:51:03.000000Z",
    deleted_at: null,
    locked: 0,
    archived: 0,
    cancelled: 0,
    version: 12,
    cms_attributes: "{\"version\":1}",
    seo_attributes: null,
    uuid: "7aa706e5-3dfa-4336-bf8c-2608f8d7e38f",
    orders: 4,
    first_name: "Manager",
    last_name: "1",
    email: "wassim.friejeh@thewebaddicts.com",
    phone_number: "71484101",
    birthdate: "2025-11-14",
    image: {
      alt: null,
      image: "",
      thumb: ""
    },
    extension_image: null,
    alt_image: null,
    "00_cms_files_image": null,
    password: "25f9e794323b453885f5181f1b624d0b",
    password_reset_token: "556f88d5a027a3e7ff386273bc5cc590",
    password_reset_token_expiry_date: "2025-11-15 23:21:03"
  },
  branch: {
    id: 1,
    created_at: "2025-11-15T17:42:44.000000Z",
    updated_at: "2025-11-15T17:42:44.000000Z",
    deleted_at: null,
    locked: 0,
    archived: 0,
    cancelled: 0,
    version: 3,
    cms_attributes: "{\"version\":1}",
    seo_attributes: null,
    uuid: "d00ed2ab-33c0-4fa9-85f1-25aa2d43adbf",
    orders: 1,
    salon_id: 1,
    name: "The Styles Beirut",
    manager_name: "Wassim",
    manager_email: "wassim.friejeh@thewebaddicts.com",
    address: "Beirut",
    opening_hours: [
      {
        day: "Monday - Friday",
        from: "8 am",
        to: "5 pm"
      },
      {
        day: "Saturday",
        from: "8 am",
        to: "2 pm"
      }
    ],
    label: "The Styles Beirut",
    slug: "the-styles-beirut"
  },
  permissions: [
    "Reports",
    "Dashboard",
    "Staff",
    "Customers",
    "Services & Pricing",
    "Marketing",
    "Memberships",
    "Balance and earnings",
    "Settings",
    "Edit Booking"
  ]
};

export const setupRealAuth = () => {
  // Set the token
  setToken(realApiResponse.token);
  
  // Store the complete API response as user data
  // The getUser() function will handle extracting the user object and permissions
  localStorage.setItem("user_data", JSON.stringify(realApiResponse));
  
  console.log("Real auth setup complete:", {
    token: realApiResponse.token,
    user: realApiResponse.user.first_name + " " + realApiResponse.user.last_name,
    branch: realApiResponse.branch.label,
    permissions: realApiResponse.permissions.length
  });
};

export const clearAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
};
