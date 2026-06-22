const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    location: {
      district: { type: String, required: true },
      city: { type: String, required: true },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    beforeImageUrl: {
      type: String,
      required: true,
    },
    afterImageUrl: {
      type: String,
      default: "",
    },
    pendingAfterImageUrl: {
      type: String,
      default: "",
    },
    pendingSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "resolution_pending", "resolved"],
      default: "pending",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        if (ret.assignedStaff) ret.assignedStaff = ret.assignedStaff.toString();
        if (ret.pendingSubmittedBy) ret.pendingSubmittedBy = ret.pendingSubmittedBy.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Complaint", ComplaintSchema);
