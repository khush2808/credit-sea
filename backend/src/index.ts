import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { logger } from "./utils/logger";
import { globalErrorHandler, notFound } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";


dotenv.config();


import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import loanRoutes from "./routes/loanRoutes";
import statsRoutes from "./routes/statsRoutes";
import adminRoutes from "./routes/adminRoutes";


const app = express();
const PORT = process.env.PORT || 5000;


app.set("trust proxy", 1);


app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);


app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["http://localhost:3000"] 
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);


app.use(generalLimiter);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});


app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Loan Management API v1.0",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);


app.use(notFound);


app.use(globalErrorHandler);


const startServer = async () => {
  try {
    
    await connectDB();

    
    app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
      logger.info(
        `API documentation available at: http://localhost:${PORT}/api`
      );
    });

    
    await initializeSuperAdmin();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};


const initializeSuperAdmin = async () => {
  try {
    const { User } = await import("./models");
    const { hashPassword } = await import("./utils/auth");
    const { UserRole } = await import("./types");

    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || "admin@loanmanagement.com";

    
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
      logger.info(superAdmin);

      await superAdmin.save();
      logger.info(`Super admin created with email: ${superAdminEmail}`);
    } else {
      logger.info("Super admin already exists");
    }
  } catch (error) {
    logger.error("Failed to initialize super admin:", error);
  }
};


process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  logger.info("Shutting down server due to unhandled rejection...");
  process.exit(1);
});


process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", err);
  logger.info("Shutting down server due to uncaught exception...");
  process.exit(1);
});


process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});


startServer();

export default app;
