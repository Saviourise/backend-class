const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    verifyCode: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String,
      default: "https://i.imgur.com/1Q9ZQ9r.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
