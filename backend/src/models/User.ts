import mongoose, { Schema } from "mongoose";
import { IUser, UserRole } from "../types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must not exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[+]?[\d\s\-()]{10,15}$/, "Invalid phone number format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Instance methods
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ phone });
};

userSchema.statics.findActiveUsers = function (role?: UserRole) {
  const query = { isActive: true };
  if (role) {
    (query as any).role = role;
  }
  return this.find(query);
};

userSchema.statics.searchUsers = function (
  searchTerm: string,
  role?: UserRole
) {
  const searchRegex = new RegExp(searchTerm, "i");
  const query: any = {
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ],
  };

  if (role) {
    query.role = role;
  }

  return this.find(query);
};

// Pre-save middleware
userSchema.pre("save", function (next) {
  // Convert email to lowercase
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-update middleware
userSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  const update = this.getUpdate() as any;
  if (update.email) {
    update.email = update.email.toLowerCase();
  }
});

export const User = mongoose.model<IUser>("User", userSchema);
