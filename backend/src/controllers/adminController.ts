import { Request, Response } from "express";
import { User, Application, Loan } from "../models";
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
  sendPaginatedResponse,
} from "../utils/response";
import { UserRole } from "../types";
import { logger } from "../utils/logger";
import { hashPassword } from "../utils/auth";


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const currentUserRole = req.user!.role;

    let query: any = {};

    
    if (currentUserRole === UserRole.ADMIN) {
      query.role = { $ne: UserRole.SUPER_ADMIN };
    }

    
    if (role) {
      query.role = role;
    }

    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return sendPaginatedResponse(
      res,
      users,
      total,
      Number(page),
      Number(limit),
      "Users retrieved successfully"
    );
  } catch (error) {
    logger.error("Get all users error:", error);
    return sendError(res, "Failed to retrieve users");
  }
};


export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserRole = req.user!.role;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    
    if (
      currentUserRole === UserRole.ADMIN &&
      user.role === UserRole.SUPER_ADMIN
    ) {
      return sendForbidden(res, "Access denied");
    }

    
    const [applicationCount, loanCount, activeLoans] = await Promise.all([
      Application.countDocuments({ userId: id }),
      Loan.countDocuments({ userId: id }),
      Loan.countDocuments({ userId: id, isPaid: false }),
    ]);

    const userWithStats = {
      ...user.toObject(),
      statistics: {
        totalApplications: applicationCount,
        totalLoans: loanCount,
        activeLoans,
      },
    };

    return sendSuccess(res, userWithStats, "User retrieved successfully");
  } catch (error) {
    logger.error("Get user by ID error:", error);
    return sendError(res, "Failed to retrieve user");
  }
};


export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const currentUserRole = req.user!.role;

    
    if (role === UserRole.SUPER_ADMIN) {
      return sendForbidden(res, "Cannot create super admin users");
    }

    if (
      currentUserRole === UserRole.ADMIN &&
      (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN)
    ) {
      return sendForbidden(
        res,
        "Admins cannot create admin or super admin users"
      );
    }

    
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return sendError(
        res,
        "User with this email or phone already exists",
        400
      );
    }

    
    const hashedPassword = await hashPassword(password);

    
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || UserRole.USER,
    });

    await user.save();

    
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    logger.info(
      `New user created: ${user._id} with role ${role} by admin ${
        req.user!.userId
      }`
    );

    return sendSuccess(res, userResponse, "User created successfully", 201);
  } catch (error) {
    logger.error("Create user error:", error);
    return sendError(res, "Failed to create user");
  }
};


export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    
    if (id === currentUserId) {
      return sendError(res, "Cannot update your own role", 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    
    if (user.role === UserRole.SUPER_ADMIN) {
      return sendForbidden(res, "Cannot modify super admin users");
    }

    if (role === UserRole.SUPER_ADMIN) {
      return sendForbidden(res, "Cannot assign super admin role");
    }

    if (
      currentUserRole === UserRole.ADMIN &&
      (role === UserRole.ADMIN || user.role === UserRole.ADMIN)
    ) {
      return sendForbidden(res, "Admins cannot modify admin roles");
    }

    
    user.role = role;
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    logger.info(`User ${id} role updated to ${role} by admin ${currentUserId}`);

    return sendSuccess(res, userResponse, "User role updated successfully");
  } catch (error) {
    logger.error("Update user role error:", error);
    return sendError(res, "Failed to update user role");
  }
};


export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    
    if (id === currentUserId) {
      return sendError(res, "Cannot modify your own status", 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    
    if (user.role === UserRole.SUPER_ADMIN) {
      return sendForbidden(res, "Cannot modify super admin users");
    }

    if (currentUserRole === UserRole.ADMIN && user.role === UserRole.ADMIN) {
      return sendForbidden(res, "Admins cannot modify other admin users");
    }

    
    user.isActive = isActive;
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    logger.info(
      `User ${id} ${
        isActive ? "activated" : "deactivated"
      } by admin ${currentUserId}`
    );

    return sendSuccess(
      res,
      userResponse,
      `User ${isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    logger.error("Toggle user status error:", error);
    return sendError(res, "Failed to update user status");
  }
};


export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    
    const [applicationCount, loanCount, activeLoans] = await Promise.all([
      Application.countDocuments({ userId: id }),
      Loan.countDocuments({ userId: id }),
      Loan.countDocuments({ userId: id, isPaid: false }),
    ]);

    const activity = {
      user,
      summary: {
        totalApplications: applicationCount,
        totalLoans: loanCount,
        activeLoans,
      },
    };

    return sendSuccess(res, activity, "User activity retrieved successfully");
  } catch (error) {
    logger.error("Get user activity error:", error);
    return sendError(res, "Failed to retrieve user activity");
  }
};


export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    
    if (id === currentUserId) {
      return sendError(
        res,
        "Use profile update to change your own password",
        400
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return sendNotFound(res, "User not found");
    }

    
    if (user.role === UserRole.SUPER_ADMIN) {
      return sendForbidden(res, "Cannot modify super admin users");
    }

    if (currentUserRole === UserRole.ADMIN && user.role === UserRole.ADMIN) {
      return sendForbidden(res, "Admins cannot modify other admin users");
    }

    
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password reset for user ${id} by admin ${currentUserId}`);

    return sendSuccess(
      res,
      { message: "Password reset successfully" },
      "Password reset successfully"
    );
  } catch (error) {
    logger.error("Reset user password error:", error);
    return sendError(res, "Failed to reset password");
  }
};
