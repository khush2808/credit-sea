import { Request, Response } from "express";
import { User } from "../models";
import {
  hashPassword,
  comparePassword,
  generateToken,
  validatePasswordStrength,
} from "../utils/auth";
import {
  sendSuccess,
  sendError,
  sendConflict,
  sendNotFound,
  sendUnauthorized,
} from "../utils/response";
import { UserRole } from "../types";
import { logger } from "../utils/logger";

/**
 * Sign up new customer (USER role only)
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return sendConflict(res, "Email already registered");
      }
      return sendConflict(res, "Phone number already registered");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, passwordValidation.message!, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with USER role only
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: UserRole.USER, // Signup only creates customers
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    logger.info(`New user registered: ${email}`);

    return sendSuccess(
      res,
      {
        user: user.toSafeObject(),
        token,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    logger.error("Signup error:", error);
    return sendError(res, "Failed to register user");
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendUnauthorized(res, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      return sendUnauthorized(res, "Account has been deactivated");
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return sendUnauthorized(res, "Invalid email or password");
    }

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${email}`);

    return sendSuccess(
      res,
      {
        user: user.toSafeObject(),
        token,
      },
      "Login successful"
    );
  } catch (error) {
    logger.error("Login error:", error);
    return sendError(res, "Failed to login");
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    return sendSuccess(
      res,
      user.toSafeObject(),
      "Profile retrieved successfully"
    );
  } catch (error) {
    logger.error("Get profile error:", error);
    return sendError(res, "Failed to retrieve profile");
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    // Check if phone number is already taken by another user
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return sendConflict(res, "Phone number already in use");
      }
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    return sendSuccess(
      res,
      user.toSafeObject(),
      "Profile updated successfully"
    );
  } catch (error) {
    logger.error("Update profile error:", error);
    return sendError(res, "Failed to update profile");
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return sendUnauthorized(res, "Current password is incorrect");
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return sendError(res, passwordValidation.message!, 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return sendSuccess(res, null, "Password changed successfully");
  } catch (error) {
    logger.error("Change password error:", error);
    return sendError(res, "Failed to change password");
  }
};

/**
 * Create user (Admin/Super Admin only)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return sendConflict(res, "Email already registered");
      }
      return sendConflict(res, "Phone number already registered");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, passwordValidation.message!, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    await user.save();

    logger.info(`New user created by admin: ${email} with role ${role}`);

    return sendSuccess(
      res,
      user.toSafeObject(),
      "User created successfully",
      201
    );
  } catch (error) {
    logger.error("Create user error:", error);
    return sendError(res, "Failed to create user");
  }
};

/**
 * Deactivate user (Admin/Super Admin only)
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    // Prevent deactivating super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      return sendError(res, "Cannot deactivate super admin", 403);
    }

    user.isActive = false;
    await user.save();

    logger.info(`User deactivated: ${user.email}`);

    return sendSuccess(
      res,
      user.toSafeObject(),
      "User deactivated successfully"
    );
  } catch (error) {
    logger.error("Deactivate user error:", error);
    return sendError(res, "Failed to deactivate user");
  }
};

/**
 * Reactivate user (Admin/Super Admin only)
 */
export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    user.isActive = true;
    await user.save();

    logger.info(`User reactivated: ${user.email}`);

    return sendSuccess(
      res,
      user.toSafeObject(),
      "User reactivated successfully"
    );
  } catch (error) {
    logger.error("Reactivate user error:", error);
    return sendError(res, "Failed to reactivate user");
  }
};
