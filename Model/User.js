const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: String,
  email: String,
  picture: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
