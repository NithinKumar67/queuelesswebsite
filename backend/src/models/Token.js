const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    officeId: {
      type: Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    counterId: {
      type: Schema.Types.ObjectId,
      ref: "Counter",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "WAITING",
        "CALLED",
        "SERVING",
        "COMPLETED",
        "SKIPPED",
        "CANCELLED",
      ],
      default: "WAITING",
    },

    calledAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;