import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    // For production, you MUST set MONGODB_URI environment variable
    // For local development, it defaults to local MongoDB
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "MONGODB_URI environment variable is required in production"
        );
        throw new Error(
          "MONGODB_URI environment variable is required in production"
        );
      }
      // Only use localhost for development
      logger.warn(
        "Using local MongoDB for development. Set MONGODB_URI for production."
      );
    }

    const finalURI = mongoURI || "mongodb://localhost:27017/loan-management";


    await mongoose.connect(finalURI);

    logger.info(
      `MongoDB connected successfully to: ${
        mongoURI ? "Cloud Database" : "Local Database"
      }`
    );

    // Connection event listeners
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
