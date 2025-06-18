import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../types";

const transactionSchema = new Schema(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan ID is required"],
      index: true,
    },
    monthYear: {
      type: String,
      required: [true, "Month-Year is required"],
      match: [/^\d{4}-\d{2}$/, "Month-Year must be in YYYY-MM format"],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be at least 0.01"],
    },
    transactionType: {
      type: String,
      enum: ["EMI", "PENALTY", "PREPAYMENT"],
      default: "EMI",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      maxlength: [50, "Payment method must not exceed 50 characters"],
      default: "Online",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: [100, "Transaction ID must not exceed 100 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
transactionSchema.index({ loanId: 1, date: -1 });
transactionSchema.index({ monthYear: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ status: 1, date: -1 });
transactionSchema.index({ transactionType: 1, date: -1 });

// Compound indexes for common queries
transactionSchema.index({ loanId: 1, monthYear: 1 });
transactionSchema.index({ loanId: 1, status: 1 });
transactionSchema.index({ loanId: 1, transactionType: 1 });

// Virtual for populated references
transactionSchema.virtual("loan", {
  ref: "Loan",
  localField: "loanId",
  foreignField: "_id",
  justOne: true,
});

// Instance methods
transactionSchema.methods.generateTransactionId = function () {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
};

transactionSchema.methods.markAsCompleted = function () {
  this.status = "COMPLETED";
  return this.save();
};

transactionSchema.methods.markAsFailed = function () {
  this.status = "FAILED";
  return this.save();
};

transactionSchema.methods.isEMI = function () {
  return this.transactionType === "EMI";
};

transactionSchema.methods.isPenalty = function () {
  return this.transactionType === "PENALTY";
};

transactionSchema.methods.isPrepayment = function () {
  return this.transactionType === "PREPAYMENT";
};

// Static methods
transactionSchema.statics.findByLoan = function (loanId: string) {
  return this.find({ loanId }).sort({ date: -1 });
};

transactionSchema.statics.findByMonthYear = function (monthYear: string) {
  return this.find({ monthYear }).sort({ date: -1 });
};

transactionSchema.statics.findCompletedTransactions = function (
  loanId?: string
) {
  const query: any = { status: "COMPLETED" };
  if (loanId) query.loanId = loanId;
  return this.find(query).sort({ date: -1 });
};

transactionSchema.statics.findPendingTransactions = function () {
  return this.find({ status: "PENDING" }).sort({ date: 1 });
};

transactionSchema.statics.findFailedTransactions = function () {
  return this.find({ status: "FAILED" }).sort({ date: -1 });
};

transactionSchema.statics.getTotalAmountByLoan = async function (
  loanId: string
) {
  const result = await this.aggregate([
    {
      $match: {
        loanId: new mongoose.Types.ObjectId(loanId),
        status: "COMPLETED",
      },
    },
    {
      $group: {
        _id: "$loanId",
        totalAmount: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        emiPayments: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "EMI"] }, "$amount", 0],
          },
        },
        penalties: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "PENALTY"] }, "$amount", 0],
          },
        },
        prepayments: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "PREPAYMENT"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalAmount: 0,
      totalTransactions: 0,
      emiPayments: 0,
      penalties: 0,
      prepayments: 0,
    }
  );
};

transactionSchema.statics.getMonthlyStats = async function (year?: number) {
  const matchStage: any = { status: "COMPLETED" };

  if (year) {
    matchStage.date = {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalAmount: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        emiCount: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "EMI"] }, 1, 0],
          },
        },
        penaltyAmount: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "PENALTY"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  return stats;
};

// Pre-save middleware
transactionSchema.pre("save", function (next) {
  // Generate transaction ID if not provided
  if (this.isNew && !this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set monthYear if not provided
  if (!this.monthYear) {
    const date = this.date || new Date();
    this.monthYear = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  next();
});

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
