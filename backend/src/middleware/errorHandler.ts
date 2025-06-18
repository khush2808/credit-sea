import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { sendError, sendValidationError } from "../utils/response";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class OperationalError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleValidationError = (error: mongoose.Error.ValidationError) => {
  const errors = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message,
  }));

  return {
    message: "Validation failed",
    errors,
    statusCode: 400,
  };
};

const handleCastError = (error: mongoose.Error.CastError) => {
  return {
    message: `Invalid ${error.path}: ${error.value}`,
    statusCode: 400,
  };
};

const handleDuplicateKeyError = (error: MongoError & { keyValue?: any }) => {
  const field = Object.keys(error.keyValue || {})[0];
  const value = error.keyValue?.[field];

  return {
    message: `${field || "Field"} '${value}' already exists`,
    statusCode: 409,
  };
};

const handleZodError = (error: ZodError) => {
  const errors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return {
    message: "Validation failed",
    errors,
    statusCode: 400,
  };
};

const handleJWTError = () => {
  return {
    message: "Invalid token. Please log in again.",
    statusCode: 401,
  };
};

const handleJWTExpiredError = () => {
  return {
    message: "Your token has expired. Please log in again.",
    statusCode: 401,
  };
};

const sendErrorDev = (err: AppError, res: Response) => {
  logger.error("Error Details:", {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  logger.error("Production Error:", {
    message: err.message,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
  });

  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode || 500);
  }

  logger.error("Unknown Error:", err);
  return sendError(res, "Something went wrong!", 500);
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific MongoDB/Mongoose errors
    if (error.name === "ValidationError") {
      const validationError = handleValidationError(error);
      return sendValidationError(
        res,
        validationError.errors,
        validationError.message
      );
    }

    if (error.name === "CastError") {
      const castError = handleCastError(error);
      error = new OperationalError(castError.message, castError.statusCode);
    }

    if (error.code === 11000) {
      const duplicateError = handleDuplicateKeyError(error);
      error = new OperationalError(
        duplicateError.message,
        duplicateError.statusCode
      );
    }

    if (error instanceof ZodError) {
      const zodError = handleZodError(error);
      return sendValidationError(res, zodError.errors, zodError.message);
    }

    if (error.name === "JsonWebTokenError") {
      const jwtError = handleJWTError();
      error = new OperationalError(jwtError.message, jwtError.statusCode);
    }

    if (error.name === "TokenExpiredError") {
      const jwtExpiredError = handleJWTExpiredError();
      error = new OperationalError(
        jwtExpiredError.message,
        jwtExpiredError.statusCode
      );
    }

    return sendErrorProd(error, res);
  }
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new OperationalError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
