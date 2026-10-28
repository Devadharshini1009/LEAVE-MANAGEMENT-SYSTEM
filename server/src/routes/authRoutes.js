const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required." });
    }
    if (!["employee", "manager"].includes(role)) {
      return res.status(400).json({ message: "Choose Employee or Manager." });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.role !== role || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email, password, or selected role." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "development_secret_change_me",
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        leaveBalance: user.leaveBalance
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id, name: req.user.name, email: req.user.email,
    role: req.user.role, leaveBalance: req.user.leaveBalance
  });
});

module.exports = router;
