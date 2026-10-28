const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["employee", "manager"], required: true },
  leaveBalance: {
    casual: { type: Number, default: 12, min: 0 },
    medical: { type: Number, default: 10, min: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
