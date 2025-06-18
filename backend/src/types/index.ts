import { Document } from "mongoose";

// User roles
export enum UserRole {
  USER = "USER",
  VERIFIER = "VERIFIER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
}

export enum EmploymentStatus {
  EMPLOYED = "EMPLOYED",
  SELF_EMPLOYED = "SELF_EMPLOYED",
  UNEMPLOYED = "UNEMPLOYED",
  STUDENT = "STUDENT",
  RETIRED = "RETIRED",
}

// Main interfaces
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  toSafeObject(): Omit<IUser, "password">;
}

export interface IApplication extends Document {
  _id: string;
  userId: string;
  status: ApplicationStatus;
  tenure: number;
  amount: number;
  empStatus: EmploymentStatus;
  reason?: string;
  empAddress?: string;
  dateTime: Date;
  updatedOn: Date;
  verifierId?: string;
  adminId?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  canBeVerified(): boolean;
  canBeApproved(): boolean;
  isProcessed(): boolean;
}

export interface ILoan extends Document {
  _id: string;
  applicationId: string;
  approvalDate: Date;
  interestRate: number;
  principalLeft: number;
  tenureMonths: number;
  isPaid: boolean;
  emi: number;
  userId: string;
  nextPaymentDate: Date;
  totalAmount: number;
  calculateEMI(principal: number, rate: number, tenure: number): number;
  makePayment(amount: number): Promise<ILoan>;
  isOverdue(): boolean;
  getDaysOverdue(): number;
}

export interface ITransaction extends Document {
  _id: string;
  loanId: string;
  monthYear: string;
  date: Date;
  amount: number;
  transactionType: "EMI" | "PENALTY" | "PREPAYMENT";
  status: "PENDING" | "COMPLETED" | "FAILED";
  paymentMethod?: string;
  transactionId?: string;
}

export interface IStats extends Document {
  _id: string;
  liveUsers: number;
  borrowers: number;
  cashDisbursed: number;
  savings: number;
  repaidLoans: number;
  cashReceived: number;
  updatedOn: Date;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  updateStats(): Promise<IStats>;
}

// Request types - simplified
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateApplicationRequest {
  amount: number;
  tenure: number;
  empStatus: EmploymentStatus;
  reason?: string;
  empAddress?: string;
}

export interface VerifyApplicationRequest {
  applicationId: string;
  status: "VERIFIED" | "REJECTED";
  notes?: string;
  rejectionReason?: string;
}

export interface ApproveApplicationRequest {
  applicationId: string;
  status: "APPROVED" | "REJECTED";
  interestRate?: number;
  rejectionReason?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface PayEMIRequest {
  loanId: string;
  amount: number;
  paymentMethod?: string;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query types - basic ones
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApplicationQuery extends PaginationQuery {
  status?: ApplicationStatus;
  userId?: string;
  verifierId?: string;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LoanQuery extends PaginationQuery {
  userId?: string;
  isPaid?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UserQuery extends PaginationQuery {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

// Method interfaces - keeping it simple
export interface IUserMethods {
  toSafeObject(): Omit<IUser, "password">;
}

export interface ILoanMethods {
  calculateEMI(principal: number, rate: number, tenure: number): number;
  makePayment(amount: number): Promise<ILoan>;
  isOverdue(): boolean;
  getDaysOverdue(): number;
}

export interface IApplicationMethods {
  canBeVerified(): boolean;
  canBeApproved(): boolean;
  isProcessed(): boolean;
}

export interface IStatsMethods {
  updateStats(): Promise<IStats>;
}

// Document types
export interface IUserDocument extends IUser, IUserMethods {}
export interface ILoanDocument extends ILoan, ILoanMethods {}
export interface IApplicationDocument
  extends IApplication,
    IApplicationMethods {}
export interface IStatsDocument extends IStats, IStatsMethods {}
