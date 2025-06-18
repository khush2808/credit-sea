import mongoose, { Schema } from "mongoose";
import { IStats } from "../types";

const statsSchema = new Schema<IStats>(
  {
    liveUsers: {
      type: Number,
      default: 0,
      min: [0, "Live users cannot be negative"],
    },
    borrowers: {
      type: Number,
      default: 0,
      min: [0, "Borrowers cannot be negative"],
    },
    cashDisbursed: {
      type: Number,
      default: 0,
      min: [0, "Cash disbursed cannot be negative"],
    },
    savings: {
      type: Number,
      default: 0,
      min: [0, "Savings cannot be negative"],
    },
    repaidLoans: {
      type: Number,
      default: 0,
      min: [0, "Repaid loans cannot be negative"],
    },
    cashReceived: {
      type: Number,
      default: 0,
      min: [0, "Cash received cannot be negative"],
    },
    updatedOn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    totalApplications: {
      type: Number,
      default: 0,
      min: [0, "Total applications cannot be negative"],
    },
    pendingApplications: {
      type: Number,
      default: 0,
      min: [0, "Pending applications cannot be negative"],
    },
    approvedApplications: {
      type: Number,
      default: 0,
      min: [0, "Approved applications cannot be negative"],
    },
    rejectedApplications: {
      type: Number,
      default: 0,
      min: [0, "Rejected applications cannot be negative"],
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


statsSchema.index({ updatedOn: -1 });


statsSchema.virtual("approvalRate").get(function () {
  if (this.totalApplications === 0) return 0;
  return Math.round((this.approvedApplications / this.totalApplications) * 100);
});

statsSchema.virtual("rejectionRate").get(function () {
  if (this.totalApplications === 0) return 0;
  return Math.round((this.rejectedApplications / this.totalApplications) * 100);
});

statsSchema.virtual("recoveryRate").get(function () {
  if (this.cashDisbursed === 0) return 0;
  return Math.round((this.cashReceived / this.cashDisbursed) * 100);
});

statsSchema.virtual("averageLoanAmount").get(function () {
  if (this.borrowers === 0) return 0;
  return Math.round(this.cashDisbursed / this.borrowers);
});


statsSchema.methods.updateStats = async function () {
  const User = mongoose.model("User");
  const Application = mongoose.model("Application");
  const Loan = mongoose.model("Loan");
  const Transaction = mongoose.model("Transaction");

  
  const liveUsers = await User.countDocuments({ isActive: true });

  
  const borrowers = await Loan.distinct("userId").then((ids) => ids.length);

  
  const applicationStats = await Application.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const appStats = applicationStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {} as any);

  
  const loanStats = await Loan.aggregate([
    {
      $group: {
        _id: null,
        totalDisbursed: { $sum: "$totalAmount" },
        totalRepaid: {
          $sum: { $subtract: ["$totalAmount", "$principalLeft"] },
        },
        repaidLoans: {
          $sum: {
            $cond: [{ $eq: ["$isPaid", true] }, 1, 0],
          },
        },
      },
    },
  ]);

  const loanData = loanStats[0] || {
    totalDisbursed: 0,
    totalRepaid: 0,
    repaidLoans: 0,
  };

  
  this.liveUsers = liveUsers;
  this.borrowers = borrowers;
  this.cashDisbursed = loanData.totalDisbursed;
  this.cashReceived = loanData.totalRepaid;
  this.repaidLoans = loanData.repaidLoans;
  this.totalApplications =
    appStats.PENDING +
      appStats.VERIFIED +
      appStats.APPROVED +
      appStats.REJECTED || 0;
  this.pendingApplications = appStats.PENDING || 0;
  this.approvedApplications = appStats.APPROVED || 0;
  this.rejectedApplications = appStats.REJECTED || 0;
  this.updatedOn = new Date();

  return this.save();
};


statsSchema.statics.getLatestStats = function () {
  return this.findOne().sort({ updatedOn: -1 });
};

statsSchema.statics.createOrUpdateStats = async function () {
  let stats = await this.findOne();

  if (!stats) {
    stats = new this({});
  }

  return stats.updateStats();
};

statsSchema.statics.getHistoricalStats = function (days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    updatedOn: { $gte: startDate },
  }).sort({ updatedOn: 1 });
};

statsSchema.statics.generateDashboardStats = async function () {
  const User = mongoose.model("User");
  const Application = mongoose.model("Application");
  const Loan = mongoose.model("Loan");
  const Transaction = mongoose.model("Transaction");

  const [userCounts, appCounts, loanStats, recentTransactions] =
    await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$isActive", true] }, 1, 0],
              },
            },
          },
        },
      ]),
      Application.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      Loan.aggregate([
        {
          $group: {
            _id: null,
            totalLoans: { $sum: 1 },
            totalDisbursed: { $sum: "$totalAmount" },
            totalOutstanding: { $sum: "$principalLeft" },
            activeLoans: {
              $sum: {
                $cond: [{ $eq: ["$isPaid", false] }, 1, 0],
              },
            },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "COMPLETED",
            date: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),
    ]);

  return {
    users: userCounts,
    applications: appCounts,
    loans: loanStats[0] || {
      totalLoans: 0,
      totalDisbursed: 0,
      totalOutstanding: 0,
      activeLoans: 0,
    },
    recentTransactions: recentTransactions[0] || {
      totalAmount: 0,
      totalTransactions: 0,
    },
  };
};


statsSchema.pre("save", function (next) {
  this.updatedOn = new Date();
  next();
});

export const Stats = mongoose.model<IStats>("Stats", statsSchema);
