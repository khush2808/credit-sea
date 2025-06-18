import mongoose, { Schema ,Types} from "mongoose";
import { IApplication, ApplicationStatus, EmploymentStatus } from "../types";

const applicationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId ,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
      required: true,
      index: true,
    },
    tenure: {
      type: Number,
      required: [true, "Tenure is required"],
      min: [1, "Minimum tenure is 1 month"],
      max: [360, "Maximum tenure is 360 months"],
    },
    amount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [1000, "Minimum loan amount is 1000"],
      max: [10000000, "Maximum loan amount is 10,000,000"],
    },
    empStatus: {
      type: String,
      enum: Object.values(EmploymentStatus),
      required: [true, "Employment status is required"],
    },
    reason: {
      type: String,
      maxlength: [500, "Reason must not exceed 500 characters"],
      trim: true,
    },
    empAddress: {
      type: String,
      maxlength: [200, "Employment address must not exceed 200 characters"],
      trim: true,
    },
    dateTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedOn: {
      type: Date,
      default: Date.now,
    },
    verifierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    verificationNotes: {
      type: String,
      maxlength: [1000, "Verification notes must not exceed 1000 characters"],
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason must not exceed 500 characters"],
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
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ verifierId: 1, status: 1 });
applicationSchema.index({ adminId: 1, status: 1 });
applicationSchema.index({ dateTime: -1 });
applicationSchema.index({ updatedOn: -1 });
applicationSchema.index({ amount: 1 });
applicationSchema.index({ empStatus: 1 });

// Compound indexes for common queries
applicationSchema.index({ status: 1, dateTime: -1 });
applicationSchema.index({ userId: 1, dateTime: -1 });
applicationSchema.index({ verifierId: 1, dateTime: -1 });
applicationSchema.index({ adminId: 1, dateTime: -1 });

// Virtual for populated references
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

applicationSchema.virtual("loan", {
  ref: "Loan",
  localField: "_id",
  foreignField: "applicationId",
  justOne: true,
});

// Instance methods
applicationSchema.methods.canBeVerified = function () {
  return this.status === ApplicationStatus.PENDING;
};

applicationSchema.methods.canBeApproved = function () {
  return this.status === ApplicationStatus.VERIFIED;
};

applicationSchema.methods.isProcessed = function () {
  return [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(
    this.status
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

applicationSchema.statics.findVerifiedApplications = function () {
  return this.find({ status: ApplicationStatus.VERIFIED }).sort({
    dateTime: 1,
  });
};

applicationSchema.statics.findByVerifier = function (verifierId: string) {
  return this.find({ verifierId }).sort({ updatedOn: -1 });
};

applicationSchema.statics.findByAdmin = function (adminId: string) {
  return this.find({ adminId }).sort({ updatedOn: -1 });
};

applicationSchema.statics.getApplicationStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
    };
    return acc;
  }, {});
};

// Pre-save middleware
applicationSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedOn = new Date();
  }
  next();
});

// Pre-update middleware
applicationSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function () {
    this.set({ updatedOn: new Date() });
  }
);

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema
);
 