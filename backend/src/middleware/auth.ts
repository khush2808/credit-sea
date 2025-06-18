import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  extractTokenFromHeader,
  hasPermission,
} from "../utils/auth";
import { sendUnauthorized, sendForbidden } from "../utils/response";
import { UserRole, JWTPayload } from "../types";
import { User } from "../models";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      sendUnauthorized(res, "No token provided");
      return;
    }

    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      sendUnauthorized(res, "User not found or inactive");
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    sendUnauthorized(res, "Invalid or expired token");
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, "Authentication required");
      return;
    }

    const userHasPermission = allowedRoles.some((role) =>
      hasPermission(req.user!.role, role)
    );

    if (!userHasPermission) {
      sendForbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
};

/**
 * Middleware for customer-only routes
 */
export const customerOnly = authorize(UserRole.USER);

/**
 * Middleware for verifier and above
 */
export const verifierOrAbove = authorize(UserRole.VERIFIER);

/**
 * Middleware for admin and above
 */
export const adminOrAbove = authorize(UserRole.ADMIN);

/**
 * Middleware for super admin only
 */
export const superAdminOnly = authorize(UserRole.SUPER_ADMIN);

/**
 * Middleware to check if user owns the resource or has admin privileges
 */
export const ownerOrAdmin = (resourceUserIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, "Authentication required");
      return;
    }

    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = req.user.userId === resourceUserId;
    const isAdmin = hasPermission(req.user.role, UserRole.ADMIN);

    if (!isOwner && !isAdmin) {
      sendForbidden(
        res,
        "Access denied. You can only access your own resources."
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't require authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);

      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Don't return error for optional auth, just continue without user
    next();
  }
};

/**
 * Middleware to check if user can access specific application
 */
export const canAccessApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendUnauthorized(res, "Authentication required");
  }

  // Super admin and admin can access all applications
  if (hasPermission(req.user.role, UserRole.ADMIN)) {
    return next();
  }

  // Verifiers can access applications assigned to them or pending applications
  if (req.user.role === UserRole.VERIFIER) {
    return next(); // Will be handled in controller
  }

  // Users can only access their own applications
  if (req.user.role === UserRole.USER) {
    return next(); // Will be handled in controller to check ownership
  }

  return sendForbidden(res, "Access denied");
};

/**
 * Middleware to check if user can access specific loan
 */
export const canAccessLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendUnauthorized(res, "Authentication required");
  }

  // Admin and above can access all loans
  if (hasPermission(req.user.role, UserRole.ADMIN)) {
    return next();
  }

  // Users can only access their own loans
  if (req.user.role === UserRole.USER) {
    return next(); // Will be handled in controller to check ownership
  }

  return sendForbidden(res, "Access denied");
};
