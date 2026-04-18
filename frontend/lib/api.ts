// API Configuration and Helper Functions

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types based on Django models
export interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "ORG_ADMIN" | "DONOR";
  phone_number: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User; // Optional because standard JWT response might only have tokens, but we'll try to include user or fetch it separately
}

export interface NeedItem {
  id: number;
  section: number;
  name: string;
  priority: "CRITICAL" | "ESSENTIAL" | "NICE";
  quantity_required: number;
  quantity_received: number;
  unit: "UNIT" | "BOX" | "KG" | "LITER";
  description: string;
  created_at: string;
  section_detail?: {
    id: number;
    name: string;
    organization: number;
    organization_name: string;
    created_by?: number;
    created_by_username?: string;
    created_by_role?: "ADMIN" | "ORG_ADMIN" | "DONOR";
  };
}

export interface Section {
  id: number;
  organization: number;
  name: string;
  head_of_section: string;
  needs: NeedItem[];
  created_by?: number;
  created_by_username?: string;
  created_by_role?: "ADMIN" | "ORG_ADMIN" | "DONOR";
}

export interface Organization {
  id: number;
  name: string;
  registration_number: string;
  address?: string;
  district: string;
  org_type?:
    | "HOSPITAL"
    | "CLINIC"
    | "SCHOOL"
    | "NGO"
    | "CHARITY"
    | "GOVERNMENT"
    | "OTHER";
  description?: string;
  phone?: string;
  email_contact?: string;
  website?: string;
  established_year?: number;
  sections: Section[];
}

export interface DocumentUpload {
  id: number;
  uploaded_by: number;
  organization: number;
  file: string;
  uploaded_at: string;
  status: "PENDING" | "PROCESSED" | "APPROVED" | "FAILED";
  ai_extracted_json: Record<string, unknown> | null;
}

export interface Donation {
  id: number;
  donor: number | null;
  need_item: number;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
  message: string;
  estimated_delivery_date: string | null;
  created_at: string;
  donor_type: "private" | "government";
  donor_name: string;
  donor_contact: string;
  donor_organization: string;
  donor_address: string;
  donor_email: string;
  donor_phone: string;
  government_department: string;
  government_program: string;
  government_officer_name: string;
  government_officer_designation: string;
  government_officer_contact: string;
  donation_letter_file: string | null;
  need_item_detail?: {
    id: number;
    name: string;
    unit: string;
  };
}

// Token refresh function
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.access;
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    } else {
      // Refresh token is invalid, clear tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

// API Functions
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // Get token from localStorage if available
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as HeadersInit),
  };

  // Add debugging for authentication issues
  if (
    !token &&
    (options?.method === "POST" ||
      options?.method === "PATCH" ||
      options?.method === "DELETE")
  ) {
    console.warn(
      `[API] No authentication token found for ${options?.method} ${endpoint}`,
    );
  } else if (token) {
    console.debug(
      `[API] Sending request with authentication token to ${endpoint}`,
    );
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If we get a 401 and have a refresh token, try to refresh and retry
  if (response.status === 401 && typeof window !== "undefined") {
    console.warn(
      `[API] Received 401 for ${endpoint}, attempting token refresh`,
    );
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        console.debug(`[API] Token refreshed, retrying request`);
        // Retry with new token
        const retryHeaders: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newAccessToken}`,
          ...(options?.headers as HeadersInit),
        };
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
        });
      } else {
        console.error(`[API] Failed to refresh token`);
      }
    } else {
      console.warn(`[API] No refresh token available for retry`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail) {
        errorMessage = errorJson.detail;
      } else {
        // Django REST Framework returns field-level errors like {"password": ["Too common."]}
        const messages: string[] = [];
        for (const [field, errors] of Object.entries(errorJson)) {
          if (Array.isArray(errors)) {
            messages.push(`${field}: ${(errors as string[]).join(", ")}`);
          } else if (typeof errors === "string") {
            messages.push(`${field}: ${errors}`);
          }
        }
        if (messages.length > 0) {
          errorMessage = messages.join("\n");
        }
      }
    } catch {}

    console.error(`[API] Request failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- AUTH FUNCTIONS (Phase 2: Real Backend) ---

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(data: any): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function registerOrgAdmin(data: {
  username: string;
  password: string;
  password2: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  organization_type?: string;
}): Promise<any> {
  return fetchAPI<any>("/auth/register-org-admin/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminApprovals(): Promise<any> {
  return fetchAPI<any>("/admin/approvals/", {
    method: "GET",
  });
}

export async function approveOrgAdmin(userId: number): Promise<any> {
  return fetchAPI<any>(`/admin/approvals/${userId}/approve/`, {
    method: "POST",
  });
}

export async function rejectOrgAdmin(
  userId: number,
  reason: string,
): Promise<any> {
  return fetchAPI<any>(`/admin/approvals/${userId}/reject/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getApprovedOrgAdmins(): Promise<any> {
  return fetchAPI<any>("/admin/approvals/approved_list/", {
    method: "GET",
  });
}

export async function getRejectedOrgAdmins(): Promise<any> {
  return fetchAPI<any>("/admin/approvals/rejected_list/", {
    method: "GET",
  });
}

export async function getCurrentUser(): Promise<User> {
  return fetchAPI<User>("/auth/me/", {
    method: "GET",
  });
}

export async function updateCurrentUser(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  current_password?: string;
  new_password?: string;
  new_password2?: string;
}): Promise<User> {
  return fetchAPI<User>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- END AUTH FUNCTIONS ---

// Organizations
export const getOrganizations = async () => {
  const response = await fetchAPI<any>("/organizations/");
  return (response.results || response) as Organization[];
};
export const getOrganization = (id: number) =>
  fetchAPI<Organization>(`/organizations/${id}/`);
export const getOrganizationHierarchy = (id: number) =>
  fetchAPI<Organization>(`/organizations/${id}/hierarchy/`);
export const createOrganization = (data: Partial<Organization>) =>
  fetchAPI<Organization>("/organizations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateOrganization = (id: number, data: Partial<Organization>) =>
  fetchAPI<Organization>(`/organizations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteOrganization = (id: number) =>
  fetchAPI<void>(`/organizations/${id}/`, { method: "DELETE" });

// Sections
export const getSections = async () => {
  const response = await fetchAPI<any>("/sections/");
  return (response.results || response) as Section[];
};
export const getSection = (id: number) => fetchAPI<Section>(`/sections/${id}/`);
export const createSection = (data: Partial<Section>) =>
  fetchAPI<Section>("/sections/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSection = (id: number, data: Partial<Section>) =>
  fetchAPI<Section>(`/sections/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteSection = (id: number) =>
  fetchAPI<void>(`/sections/${id}/`, { method: "DELETE" });

// Needs
export const getNeeds = async (priority?: string) => {
  const query = priority ? `?priority=${priority}` : "";
  const response = await fetchAPI<any>(`/needs/${query}`);
  return (response.results || response) as NeedItem[];
};
export const getNeed = (id: number) => fetchAPI<NeedItem>(`/needs/${id}/`);
export const createNeed = (data: Partial<NeedItem>) =>
  fetchAPI<NeedItem>("/needs/", { method: "POST", body: JSON.stringify(data) });
export const updateNeed = (id: number, data: Partial<NeedItem>) =>
  fetchAPI<NeedItem>(`/needs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteNeed = (id: number) =>
  fetchAPI<void>(`/needs/${id}/`, { method: "DELETE" });

// Documents
export const getDocuments = async () => {
  const response = await fetchAPI<any>("/documents/");
  return (response.results || response) as DocumentUpload[];
};
export const uploadDocument = async (
  file: File,
  organizationId: number,
  userId: number,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("organization", organizationId.toString());
  formData.append("uploaded_by", userId.toString());

  // Get token for authenticated upload
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken");
  }

  const response = await fetch(`${API_BASE_URL}/documents/`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload Error: ${response.status}`);
  }

  return response.json();
};

// Donations
export const createDonation = (data: Partial<Donation>) =>
  fetchAPI<Donation>("/donations/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getDonations = async () => {
  const response = await fetchAPI<any>("/donations/");
  return (response.results || response) as Donation[];
};

export const getDonation = (id: number) =>
  fetchAPI<Donation>(`/donations/${id}/`);

export const updateDonation = (id: number, data: Partial<Donation>) =>
  fetchAPI<Donation>(`/donations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteDonation = (id: number) =>
  fetchAPI<void>(`/donations/${id}/`, { method: "DELETE" });

// Priority helpers
export const priorityColors = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  ESSENTIAL: "bg-yellow-100 text-yellow-800 border-yellow-300",
  NICE: "bg-green-100 text-green-800 border-green-300",
};

export const priorityLabels = {
  CRITICAL: "Critical",
  ESSENTIAL: "Essential",
  NICE: "Nice to Have",
};

export const unitLabels = {
  UNIT: "Units",
  BOX: "Boxes",
  KG: "Kilograms",
  LITER: "Liters",
};

export const statusColors = {
  PENDING: "bg-gray-100 text-gray-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

// Search interface and function
export interface SearchResult {
  organizations: Organization[];
  needs: NeedItem[];
  total: number;
}

export async function search(
  query: string,
  type: "organization" | "need" | "all" = "all",
  options?: {
    priority?: string;
    org_type?: string;
    limit?: number;
    offset?: number;
  },
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    type,
    ...(options?.priority && { priority: options.priority }),
    ...(options?.org_type && { org_type: options.org_type }),
    limit: String(options?.limit || 50),
    offset: String(options?.offset || 0),
  });

  const response = await fetch(`${API_BASE_URL}/search/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json();
}
