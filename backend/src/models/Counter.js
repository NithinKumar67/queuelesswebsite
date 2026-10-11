const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const counterSchema = new Schema(
  {
    officeId: {
      type: Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    number: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "PAUSED", "OFFLINE"],
      default: "AVAILABLE",
    },

    currentTokenId: {
      type: Schema.Types.ObjectId,
      ref: "Token",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A counter number must be unique within an office (also enforced in the
// admin controller; the index closes the simultaneous-request race).
counterSchema.index({ officeId: 1, number: 1 }, { unique: true });

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;