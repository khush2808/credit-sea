import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  extractTokenFromHeader,
  hasPermission,
} from "../utils/auth";
import { sendUnauthorized, sendForbidden } from "../utils/response";
import { UserRole, JWTPayload } from "../types";
import { User } from "../models";


declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}


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


export const customerOnly = authorize(UserRole.USER);


export const verifierOrAbove = authorize(UserRole.VERIFIER);


export const adminOrAbove = authorize(UserRole.ADMIN);


export const superAdminOnly = authorize(UserRole.SUPER_ADMIN);


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


export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);

      
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    
    next();
  }
};


export const canAccessApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendUnauthorized(res, "Authentication required");
  }

  
  if (hasPermission(req.user.role, UserRole.ADMIN)) {
    return next();
  }

  
  if (req.user.role === UserRole.VERIFIER) {
    return next(); 
  }

  
  if (req.user.role === UserRole.USER) {
    return next(); 
  }

  return sendForbidden(res, "Access denied");
};


export const canAccessLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendUnauthorized(res, "Authentication required");
  }

  
  if (hasPermission(req.user.role, UserRole.ADMIN)) {
    return next();
  }

  
  if (req.user.role === UserRole.USER) {
    return next(); 
  }

  return sendForbidden(res, "Access denied");
};
