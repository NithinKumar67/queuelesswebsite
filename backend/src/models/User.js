const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongooseRaw = require("passport-local-mongoose");
const passportLocalMongoose =
  passportLocalMongooseRaw.default || passportLocalMongooseRaw;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["citizen", "operator", "admin"],
      default: "citizen",
    },

    phone: {
      type: String,
      trim: true,
    },

    officeId: {
      type: Schema.Types.ObjectId,
      ref: "Office",
    },

    counterId: {
      type: Schema.Types.ObjectId,
      ref: "Counter",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  usernameLowerCase: true,
});

const User = mongoose.model("User", userSchema);

module.exports = User;