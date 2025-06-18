import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { logger } from "./utils/logger";
import { globalErrorHandler, notFound } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import loanRoutes from "./routes/loanRoutes";
import statsRoutes from "./routes/statsRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration - Fixed for production
app.use(
  cors({
    origin: ["http://localhost:3000", "https://credit-sea-rho.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Basic health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Loan Management API v1.0",
    version: "1.0.0",
    documentation: "/api/docs", // TODO: add swagger docs
  });
});

// Debug endpoint - remove this later
if (process.env.NODE_ENV !== "production") {
  app.get("/debug", (req, res) => {
    res.json({
      env: process.env.NODE_ENV,
      jwt_secret_set: !!process.env.JWT_SECRET,
      db_uri_set: !!process.env.MONGODB_URI,
    });
  });
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(globalErrorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API docs: http://localhost:${PORT}/api`);

      // console.log for quick debugging
      console.log(`🚀 Server started on port ${PORT}`);
    });

    // Initialize super admin
    await initializeSuperAdmin();
  } catch (error) {
    logger.error("Failed to start server:", error);
    console.error("Startup error:", error); // Keep console.error for debugging
    process.exit(1);
  }
};

// Initialize super admin user
const initializeSuperAdmin = async () => {
  try {
    const { User } = await import("./models");
    const { hashPassword } = await import("./utils/auth");
    const { UserRole } = await import("./types");

    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || "admin@loanmanagement.com";

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      role: UserRole.SUPER_ADMIN,
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await hashPassword(
        process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!"
      );

      const superAdmin = new User({
        name: process.env.SUPER_ADMIN_NAME || "Super Administrator",
        email: superAdminEmail,
        phone: process.env.SUPER_ADMIN_PHONE || "+1234567890",
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      });

      // Debug log - remove this eventually
      console.log("Creating super admin:", superAdminEmail);

      await superAdmin.save();
      logger.info(`Super admin created with email: ${superAdminEmail}`);
    } else {
      logger.info("Super admin already exists");
    }
  } catch (error) {
    logger.error("Failed to initialize super admin:", error);
    // Don't exit here, server can still run without super admin
  }
};

// Process error handlers
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  console.error("Unhandled Rejection:", err); // Keep for debugging
  logger.info("Shutting down server due to unhandled rejection...");
  process.exit(1);
});

process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", err);
  console.error("Uncaught Exception:", err);
  logger.info("Shutting down server due to uncaught exception...");
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

export default app;
