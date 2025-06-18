import { Request, Response } from "express";
import { Loan, Transaction, User, Application } from "../models";
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
  sendPaginatedResponse,
} from "../utils/response";
import { UserRole } from "../types";
import { logger } from "../utils/logger";


export const getLoans = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      isPaid,
      sortBy = "approvalDate",
      sortOrder = "desc",
    } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let query: any = {};

    
    switch (userRole) {
      case UserRole.USER:
        
        query.userId = userId;
        break;

      case UserRole.VERIFIER:
        
        return sendForbidden(
          res,
          "Verifiers do not have access to loan information"
        );

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        
        break;
    }

    
    if (isPaid !== undefined) {
      query.isPaid = isPaid === "true";
    }

    
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    
    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate("user", "name email phone")
        .populate("application", "amount tenure empStatus reason")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Loan.countDocuments(query),
    ]);

    return sendPaginatedResponse(
      res,
      loans,
      total,
      Number(page),
      Number(limit),
      "Loans retrieved successfully"
    );
  } catch (error) {
    logger.error("Get loans error:", error);
    return sendError(res, "Failed to retrieve loans");
  }
};


export const getLoanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const loan = await Loan.findById(id)
      .populate("user", "name email phone")
      .populate("application", "amount tenure empStatus reason dateTime");

    if (!loan) {
      return sendNotFound(res, "Loan not found");
    }

    
    const canAccess =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      (userRole === UserRole.USER && loan.userId.toString() === userId);

    if (!canAccess) {
      return sendForbidden(res, "Access denied");
    }

    
    const loanWithCalculations = {
      ...loan.toObject(),
      totalPaid: loan.totalAmount - loan.principalLeft,
      remainingAmount: loan.principalLeft,
      completionPercentage: Math.round(
        ((loan.totalAmount - loan.principalLeft) / loan.totalAmount) * 100
      ),
      isOverdue: loan.isOverdue(),
      daysOverdue: loan.getDaysOverdue(),
    };

    return sendSuccess(
      res,
      loanWithCalculations,
      "Loan retrieved successfully"
    );
  } catch (error) {
    logger.error("Get loan by ID error:", error);
    return sendError(res, "Failed to retrieve loan");
  }
};


export const makePayment = async (req: Request, res: Response) => {
  try {
    const { loanId, amount, paymentMethod } = req.body;
    const userId = req.user!.userId;

    
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return sendNotFound(res, "Loan not found");
    }

    
    if (loan.userId.toString() !== userId) {
      return sendForbidden(
        res,
        "You can only make payments for your own loans"
      );
    }

    
    if (loan.isPaid) {
      return sendError(res, "Loan is already fully paid", 400);
    }

    
    if (amount <= 0) {
      return sendError(res, "Payment amount must be positive", 400);
    }

    if (amount > loan.principalLeft) {
      return sendError(
        res,
        "Payment amount cannot exceed remaining principal",
        400
      );
    }

    
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    const transaction = new Transaction({
      loanId: loan._id,
      amount,
      transactionType: "EMI",
      status: "COMPLETED",
      paymentMethod: paymentMethod || "Online",
      date: currentDate,
      monthYear: monthYear,
    });

    await transaction.save();

    
    await loan.makePayment(amount);

    
    await loan.populate([
      { path: "user", select: "name email phone" },
      { path: "application", select: "amount tenure empStatus" },
    ]);

    logger.info(
      `Payment of ${amount} made for loan ${loanId} by user ${userId}`
    );

    const response = {
      loan,
      transaction,
      message: loan.isPaid
        ? "Congratulations! Your loan has been fully paid."
        : "Payment successful",
    };

    return sendSuccess(res, response, "Payment processed successfully");
  } catch (error) {
    logger.error("Make payment error:", error);
    return sendError(res, "Failed to process payment");
  }
};


export const getLoanTransactions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    
    const loan = await Loan.findById(id);
    if (!loan) {
      return sendNotFound(res, "Loan not found");
    }

    
    const canAccess =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      (userRole === UserRole.USER && loan.userId.toString() === userId);

    if (!canAccess) {
      return sendForbidden(res, "Access denied");
    }

    
    const skip = (Number(page) - 1) * Number(limit);

    
    const [transactions, total] = await Promise.all([
      Transaction.find({ loanId: id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments({ loanId: id }),
    ]);

    return sendPaginatedResponse(
      res,
      transactions,
      total,
      Number(page),
      Number(limit),
      "Loan transactions retrieved successfully"
    );
  } catch (error) {
    logger.error("Get loan transactions error:", error);
    return sendError(res, "Failed to retrieve loan transactions");
  }
};


export const getLoanStats = async (req: Request, res: Response) => {
  try {
    const stats = await Loan.getLoanStats();

    
    const [overdueLoans, upcomingPayments] = await Promise.all([
      Loan.find({
        isPaid: false,
        nextPaymentDate: { $lt: new Date() },
      }).countDocuments(),
      Loan.find({
        isPaid: false,
        nextPaymentDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        },
      }).countDocuments(),
    ]);

    const response = {
      ...stats,
      overdueLoans,
      upcomingPayments,
      updatedAt: new Date(),
    };

    return sendSuccess(res, response, "Loan statistics retrieved successfully");
  } catch (error) {
    logger.error("Get loan stats error:", error);
    return sendError(res, "Failed to retrieve loan statistics");
  }
};


export const getActiveLoan = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const loan = await Loan.findOne({ userId, isPaid: false }).populate(
      "application",
      "amount tenure empStatus reason dateTime"
    );

    if (!loan) {
      return sendNotFound(res, "No active loan found");
    }

    
    const loanWithCalculations = {
      ...loan.toObject(),
      totalPaid: loan.totalAmount - loan.principalLeft,
      remainingAmount: loan.principalLeft,
      completionPercentage: Math.round(
        ((loan.totalAmount - loan.principalLeft) / loan.totalAmount) * 100
      ),
      isOverdue: loan.isOverdue(),
      daysOverdue: loan.getDaysOverdue(),
      remainingTenure: Math.ceil(loan.principalLeft / loan.emi),
    };

    return sendSuccess(
      res,
      loanWithCalculations,
      "Active loan retrieved successfully"
    );
  } catch (error) {
    logger.error("Get active loan error:", error);
    return sendError(res, "Failed to retrieve active loan");
  }
};


export const getOverdueLoans = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const overdueLoans = await Loan.find({
      isPaid: false,
      nextPaymentDate: { $lt: new Date() },
    })
      .populate("user", "name email phone")
      .populate("application", "amount tenure")
      .sort({ nextPaymentDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Loan.countDocuments({
      isPaid: false,
      nextPaymentDate: { $lt: new Date() },
    });

    
    const loansWithOverdueInfo = overdueLoans.map((loan) => ({
      ...loan.toObject(),
      daysOverdue: loan.getDaysOverdue(),
    }));

    return sendPaginatedResponse(
      res,
      loansWithOverdueInfo,
      total,
      Number(page),
      Number(limit),
      "Overdue loans retrieved successfully"
    );
  } catch (error) {
    logger.error("Get overdue loans error:", error);
    return sendError(res, "Failed to retrieve overdue loans");
  }
};


export const getUpcomingPayments = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    const upcomingLoans = await Loan.find({
      isPaid: false,
      nextPaymentDate: {
        $gte: new Date(),
        $lte: futureDate,
      },
    })
      .populate("user", "name email phone")
      .populate("application", "amount tenure")
      .sort({ nextPaymentDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Loan.countDocuments({
      isPaid: false,
      nextPaymentDate: {
        $gte: new Date(),
        $lte: futureDate,
      },
    });

    return sendPaginatedResponse(
      res,
      upcomingLoans,
      total,
      Number(page),
      Number(limit),
      "Upcoming payments retrieved successfully"
    );
  } catch (error) {
    logger.error("Get upcoming payments error:", error);
    return sendError(res, "Failed to retrieve upcoming payments");
  }
};


export const getPaymentSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendNotFound(res, "Loan not found");
    }

    
    const canAccess =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      (userRole === UserRole.USER && loan.userId.toString() === userId);

    if (!canAccess) {
      return sendForbidden(res, "Access denied");
    }

    
    const schedule = [];
    const startDate = new Date(loan.approvalDate);
    let currentDate = new Date(startDate);
    let remainingPrincipal = loan.totalAmount;

    for (let i = 1; i <= loan.tenureMonths; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);

      const interestComponent =
        (remainingPrincipal * loan.interestRate) / (12 * 100);
      const principalComponent = loan.emi - interestComponent;
      remainingPrincipal -= principalComponent;

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(currentDate),
        emiAmount: loan.emi,
        principalComponent: Math.round(principalComponent * 100) / 100,
        interestComponent: Math.round(interestComponent * 100) / 100,
        remainingPrincipal: Math.max(
          0,
          Math.round(remainingPrincipal * 100) / 100
        ),
        status:
          i <= (loan.totalAmount - loan.principalLeft) / loan.emi
            ? "PAID"
            : "PENDING",
      });
    }

    return sendSuccess(
      res,
      {
        loan: {
          id: loan._id,
          totalAmount: loan.totalAmount,
          emi: loan.emi,
          interestRate: loan.interestRate,
          tenureMonths: loan.tenureMonths,
        },
        schedule,
      },
      "Payment schedule retrieved successfully"
    );
  } catch (error) {
    logger.error("Get payment schedule error:", error);
    return sendError(res, "Failed to retrieve payment schedule");
  }
};
