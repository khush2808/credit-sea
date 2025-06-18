import { z } from "zod";
import { UserRole, EmploymentStatus, ApplicationStatus } from "../types";


export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});


export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string().email("Invalid email format").toLowerCase(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$/, "Invalid phone number format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});


export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: z.string().email("Invalid email format").toLowerCase(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$/, "Invalid phone number format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .optional(),
  email: z.string().email("Invalid email format").toLowerCase().optional(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$/, "Invalid phone number format")
    .optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});


export const createApplicationSchema = z.object({
  amount: z
    .number()
    .min(1000, "Minimum loan amount is 1000")
    .max(10000000, "Maximum loan amount is 10,000,000"),
  tenure: z
    .number()
    .int("Tenure must be a whole number")
    .min(1, "Minimum tenure is 1 month")
    .max(360, "Maximum tenure is 360 months"),
  empStatus: z.nativeEnum(EmploymentStatus),
  reason: z
    .string()
    .max(500, "Reason must not exceed 500 characters")
    .optional(),
  empAddress: z
    .string()
    .max(200, "Employment address must not exceed 200 characters")
    .optional(),
});

export const verifyApplicationSchema = z.object({
  applicationId: mongoIdSchema,
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
  rejectionReason: z
    .string()
    .max(500, "Rejection reason must not exceed 500 characters")
    .optional(),
});

export const approveApplicationSchema = z.object({
  applicationId: mongoIdSchema,
  status: z.enum(["APPROVED", "REJECTED"]),
  interestRate: z
    .number()
    .min(0.01, "Interest rate must be at least 0.01%")
    .max(50, "Interest rate cannot exceed 50%")
    .optional(),
  rejectionReason: z
    .string()
    .max(500, "Rejection reason must not exceed 500 characters")
    .optional(),
});


export const payEMISchema = z.object({
  loanId: mongoIdSchema,
  amount: z.number().min(1, "Payment amount must be at least 1"),
  paymentMethod: z
    .string()
    .max(50, "Payment method must not exceed 50 characters")
    .optional(),
});


export const applicationQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(ApplicationStatus).optional(),
  userId: mongoIdSchema.optional(),
  verifierId: mongoIdSchema.optional(),
  adminId: mongoIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const loanQuerySchema = paginationSchema.extend({
  userId: mongoIdSchema.optional(),
  isPaid: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined
    ),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const userQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined
    ),
  search: z.string().optional(),
});

export const transactionQuerySchema = paginationSchema.extend({
  loanId: mongoIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
});


export const updateStatsSchema = z.object({
  liveUsers: z.number().int().min(0).optional(),
  borrowers: z.number().int().min(0).optional(),
  cashDisbursed: z.number().min(0).optional(),
  savings: z.number().min(0).optional(),
  repaidLoans: z.number().int().min(0).optional(),
  cashReceived: z.number().min(0).optional(),
  totalApplications: z.number().int().min(0).optional(),
  pendingApplications: z.number().int().min(0).optional(),
});


export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  approvedApplications: z.number().int().min(0).optional(),
  rejectedApplications: z.number().int().min(0).optional(),
});


export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params,
      });

      
      req.body = { ...req.body, ...validated };
      req.query = { ...req.query, ...validated };
      req.params = { ...req.params, ...validated };

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
          statusCode: 400,
        });
      }
      next(error);
    }
  };
};
