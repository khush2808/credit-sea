import { Request, Response } from "express";
import { Stats, User, Application, Loan, Transaction } from "../models";
import { sendSuccess, sendError } from "../utils/response";
import { logger } from "../utils/logger";


export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    
    let stats = await Stats.findOne().sort({ _id: -1 });
    if (!stats) {
      stats = new Stats();
      await stats.save();
    }

    
    await stats.updateStats();

    return sendSuccess(
      res,
      stats,
      "Dashboard statistics retrieved successfully"
    );
  } catch (error) {
    logger.error("Get dashboard stats error:", error);
    return sendError(res, "Failed to retrieve dashboard statistics");
  }
};


export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          role: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const response = {
      roleBreakdown: userStats,
      totalUsers: await User.countDocuments(),
    };

    return sendSuccess(res, response, "User statistics retrieved successfully");
  } catch (error) {
    logger.error("Get user stats error:", error);
    return sendError(res, "Failed to retrieve user statistics");
  }
};
