import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      
      Cookies.remove("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "VERIFIER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  userId: string;
  amount: number;
  tenure: number;
  empStatus: "EMPLOYED" | "SELF_EMPLOYED" | "UNEMPLOYED";
  reason: string;
  empAddress: string;
  status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";
  verifierId?: string;
  adminId?: string;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  _id: string;
  applicationId: string;
  userId: string;
  approvalDate: string;
  interestRate: number;
  principalLeft: number;
  tenureMonths: number;
  emi: number;
  nextPaymentDate: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  loanId: string;
  monthYear: string;
  date: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface DashboardStats {
  liveUsers: number;
  borrowers: number;
  cashDisbursed: number;
  cashReceived: number;
  repaidLoans: number;
  savings: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}


export const authAPI = {
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/auth/signup", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  getProfile: () => api.get("/auth/profile"),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
};


export const applicationAPI = {
  create: (data: {
    amount: number;
    tenure: number;
    empStatus: string;
    reason: string;
    empAddress: string;
  }) => api.post("/applications", data),

  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get("/applications", { params }),

  getById: (id: string) => api.get(`/applications/${id}`),

  update: (id: string, data: { reason?: string; empAddress?: string }) =>
    api.put(`/applications/${id}`, data),

  verify: (id: string, data: { status: string; notes?: string }) =>
    api.put(`/applications/${id}/verify`, data),

  approve: (id: string, data: { status: string; interestRate: number }) =>
    api.put(`/applications/${id}/approve`, data),

  getStats: () => api.get("/applications/stats/overview"),
};


export const loanAPI = {
  getAll: (params?: { page?: number; limit?: number; isPaid?: boolean }) =>
    api.get("/loans", { params }),

  getActive: () => api.get("/loans/active"),

  getById: (id: string) => api.get(`/loans/${id}`),

  makePayment: (data: {
    loanId: string;
    amount: number;
    paymentMethod: string;
  }) => api.post("/loans/payment", data),

  getTransactions: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/loans/${id}/transactions`, { params }),

  getSchedule: (id: string) => api.get(`/loans/${id}/schedule`),

  getStats: () => api.get("/loans/stats/overview"),

  getOverdue: (params?: { page?: number; limit?: number }) =>
    api.get("/loans/admin/overdue", { params }),

  getUpcomingPayments: (params?: {
    days?: number;
    page?: number;
    limit?: number;
  }) => api.get("/loans/admin/upcoming-payments", { params }),
};


export const adminAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => api.get("/admin/users", { params }),

  getUserById: (id: string) => api.get(`/admin/users/${id}`),

  createUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => api.post("/admin/users", data),

  updateUserRole: (id: string, data: { role: string }) =>
    api.put(`/admin/users/${id}/role`, data),

  toggleUserStatus: (id: string, data: { isActive: boolean }) =>
    api.put(`/admin/users/${id}/status`, data),

  getUserActivity: (id: string) => api.get(`/admin/users/${id}/activity`),

  resetPassword: (id: string, data: { newPassword: string }) =>
    api.put(`/admin/users/${id}/reset-password`, data),
};


export const statsAPI = {
  getDashboard: () => api.get("/stats/dashboard"),
  getUsers: () => api.get("/stats/users"),
};

export default api;
