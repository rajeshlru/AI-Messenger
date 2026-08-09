const mongoose = require("mongoose");

const originalPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    originalPassword: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const OriginalPassword = mongoose.model(
  "OriginalPassword",
  originalPasswordSchema,
);

module.exports = OriginalPassword;
