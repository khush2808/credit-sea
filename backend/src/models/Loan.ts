import mongoose, { Schema } from "mongoose";
import { ILoan } from "../types";

const loanSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: [true, "Application ID is required"],
      unique: true,
      index: true,
    },
    approvalDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0.01, "Interest rate must be at least 0.01%"],
      max: [50, "Interest rate cannot exceed 50%"],
    },
    principalLeft: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [0, "Principal left cannot be negative"],
    },
    tenureMonths: {
      type: Number,
      required: [true, "Tenure in months is required"],
      min: [1, "Minimum tenure is 1 month"],
      max: [360, "Maximum tenure is 360 months"],
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    emi: {
      type: Number,
      required: [true, "EMI amount is required"],
      min: [1, "EMI must be at least 1"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    nextPaymentDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total loan amount is required"],
      min: [1, "Total amount must be at least 1"],
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
loanSchema.index({ userId: 1, isPaid: 1 });
loanSchema.index({ approvalDate: -1 });
loanSchema.index({ nextPaymentDate: 1 });
loanSchema.index({ isPaid: 1, nextPaymentDate: 1 });

// Compound indexes
loanSchema.index({ userId: 1, approvalDate: -1 });
loanSchema.index({ isPaid: 1, approvalDate: -1 });

// Virtual relationships
loanSchema.virtual("application", {
  ref: "Application",
  localField: "applicationId",
  foreignField: "_id",
  justOne: true,
});

loanSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

loanSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "loanId",
});

// Virtual computed fields
loanSchema.virtual("totalPaid").get(function () {
  return this.totalAmount - this.principalLeft;
});

loanSchema.virtual("remainingTenure").get(function () {
  const totalPaid = this.totalAmount - this.principalLeft;
  const remainingAmount = this.principalLeft;

  if (remainingAmount <= 0) return 0;

  return Math.ceil(remainingAmount / this.emi);
});

loanSchema.virtual("completionPercentage").get(function () {
  return Math.round(
    ((this.totalAmount - this.principalLeft) / this.totalAmount) * 100
  );
});

// EMI calculation method
loanSchema.methods.calculateEMI = function (
  principal: number,
  rate: number,
  tenure: number
): number {
  const monthlyRate = rate / (12 * 100);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi * 100) / 100; // Round to 2 decimal places
};

// Payment processing
loanSchema.methods.makePayment = function (amount: number) {
  if (amount <= 0) {
    throw new Error("Payment amount must be positive");
  }

  this.principalLeft = Math.max(0, this.principalLeft - amount);

  if (this.principalLeft === 0) {
    this.isPaid = true;
  } else {
    // Update next payment date
    const nextDate = new Date(this.nextPaymentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    this.nextPaymentDate = nextDate;
  }

  return this.save();
};

// Check if loan is overdue
loanSchema.methods.isOverdue = function (): boolean {
  return !this.isPaid && new Date() > this.nextPaymentDate;
};

// Get days overdue
loanSchema.methods.getDaysOverdue = function (): number {
  if (!this.isOverdue()) return 0;

  const today = new Date();
  const timeDiff = today.getTime() - this.nextPaymentDate.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
};

// Static methods for common queries
loanSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).sort({ approvalDate: -1 });
};

loanSchema.statics.findActiveLoan = function (userId: string) {
  return this.findOne({ userId, isPaid: false });
};

loanSchema.statics.findOverdueLoans = function () {
  return this.find({
    isPaid: false,
    nextPaymentDate: { $lt: new Date() },
  }).sort({ nextPaymentDate: 1 });
};

loanSchema.statics.findUpcomingPayments = function (days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    isPaid: false,
    nextPaymentDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  }).sort({ nextPaymentDate: 1 });
};

// TODO: Add method to calculate penalty for overdue payments
// TODO: Add method to generate payment schedule

export const Loan = mongoose.model<ILoan>("Loan", loanSchema);
