import mongoose, { Schema } from "mongoose";
import { IApplication, ApplicationStatus, EmploymentStatus } from "../types";

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: String,
      ref: "User",
      required: [true, "User ID is required"],
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [1000, "Minimum loan amount is $1,000"],
      max: [1000000, "Maximum loan amount is $1,000,000"],
    },
    tenure: {
      type: Number,
      required: [true, "Loan tenure is required"],
      min: [6, "Minimum tenure is 6 months"],
      max: [360, "Maximum tenure is 360 months"],
    },
    empStatus: {
      type: String,
      enum: Object.values(EmploymentStatus),
      required: [true, "Employment status is required"],
    },
    reason: {
      type: String,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    empAddress: {
      type: String,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    dateTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
    verifierId: {
      type: String,
      ref: "User",
    },
    adminId: {
      type: String,
      ref: "User",
    },
    verificationNotes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
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

// Indexes
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ dateTime: -1 });
applicationSchema.index({ status: 1, dateTime: -1 });
applicationSchema.index({ verifierId: 1, status: 1 });
applicationSchema.index({ adminId: 1, status: 1 });

// Virtual relationships
applicationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

applicationSchema.virtual("verifier", {
  ref: "User",
  localField: "verifierId",
  foreignField: "_id",
  justOne: true,
});

applicationSchema.virtual("admin", {
  ref: "User",
  localField: "adminId",
  foreignField: "_id",
  justOne: true,
});

// Instance methods
applicationSchema.methods.canBeVerified = function (): boolean {
  return this.status === ApplicationStatus.PENDING;
};

applicationSchema.methods.canBeApproved = function (): boolean {
  return this.status === ApplicationStatus.VERIFIED;
};

applicationSchema.methods.isProcessed = function (): boolean {
  return (
    this.status === ApplicationStatus.APPROVED ||
    this.status === ApplicationStatus.REJECTED
  );
};

// Static methods
applicationSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).sort({ dateTime: -1 });
};

applicationSchema.statics.findByStatus = function (status: ApplicationStatus) {
  return this.find({ status }).sort({ dateTime: -1 });
};

applicationSchema.statics.findPendingApplications = function () {
  return this.find({ status: ApplicationStatus.PENDING }).sort({ dateTime: 1 });
};

applicationSchema.statics.getApplicationStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalApplications: { $sum: 1 },
        pendingApplications: {
          $sum: {
            $cond: [{ $eq: ["$status", ApplicationStatus.PENDING] }, 1, 0],
          },
        },
        verifiedApplications: {
          $sum: {
            $cond: [{ $eq: ["$status", ApplicationStatus.VERIFIED] }, 1, 0],
          },
        },
        approvedApplications: {
          $sum: {
            $cond: [{ $eq: ["$status", ApplicationStatus.APPROVED] }, 1, 0],
          },
        },
        rejectedApplications: {
          $sum: {
            $cond: [{ $eq: ["$status", ApplicationStatus.REJECTED] }, 1, 0],
          },
        },
        totalAmount: { $sum: "$amount" },
        averageAmount: { $avg: "$amount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalApplications: 0,
      pendingApplications: 0,
      verifiedApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      totalAmount: 0,
      averageAmount: 0,
    }
  );
};

// Pre-save middleware - fix the updatedOn issue
applicationSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    (this as any).updatedOn = new Date();
  }
  next();
});

// Add static method declarations to fix TypeScript
interface ApplicationModel extends mongoose.Model<IApplication> {
  getApplicationStats(): Promise<any>;
}

export const Application = mongoose.model<IApplication, ApplicationModel>(
  "Application",
  applicationSchema
);
