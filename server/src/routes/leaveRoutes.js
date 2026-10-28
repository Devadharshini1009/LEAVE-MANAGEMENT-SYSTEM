const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

function inclusiveDays(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  a.setUTCHours(0, 0, 0, 0);
  b.setUTCHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000) + 1;
}

router.get("/balance", allowRoles("employee"), async (req, res) => {
  const user = await User.findById(req.user._id).select("leaveBalance");
  res.json(user.leaveBalance);
});

router.post("/", allowRoles("employee"), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!["Casual Leave", "Medical Leave"].includes(leaveType)) {
      return res.status(400).json({ message: "Select a valid leave type." });
    }
    if (!startDate || !endDate || !reason || !reason.trim()) {
      return res.status(400).json({ message: "Complete all fields before submitting." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: "End date must be on or after the start date." });
    }
    const days = inclusiveDays(startDate, endDate);
    const user = await User.findById(req.user._id);
    const balanceKey = leaveType === "Casual Leave" ? "casual" : "medical";
    if (days > user.leaveBalance[balanceKey]) {
      return res.status(400).json({ message: `You have only ${user.leaveBalance[balanceKey]} days of ${leaveType} remaining.` });
    }

    const leave = await Leave.create({
      employee: user._id, leaveType, startDate: start, endDate: end, days, reason: reason.trim()
    });
    const populated = await Leave.findById(leave._id).populate("employee", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not submit leave request.", error: err.message });
  }
});

router.get("/mine", allowRoles("employee"), async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json(leaves);
});

router.get("/all", allowRoles("manager"), async (_req, res) => {
  const leaves = await Leave.find()
    .populate("employee", "name email")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 });
  res.json(leaves);
});

router.patch("/:id/review", allowRoles("manager"), async (req, res) => {
  try {
    const { status, managerComment = "" } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be Approved or Rejected." });
    }
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found." });
    if (leave.status !== "Pending") {
      return res.status(400).json({ message: "This request has already been reviewed." });
    }

    if (status === "Approved") {
      const balanceKey = leave.leaveType === "Casual Leave" ? "casual" : "medical";
      const employee = await User.findById(leave.employee);
      if (!employee || employee.leaveBalance[balanceKey] < leave.days) {
        return res.status(400).json({ message: "Insufficient leave balance to approve this request." });
      }
      employee.leaveBalance[balanceKey] -= leave.days;
      await employee.save();
    }

    leave.status = status;
    leave.managerComment = String(managerComment).trim().slice(0, 500);
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    const populated = await Leave.findById(leave._id)
      .populate("employee", "name email")
      .populate("reviewedBy", "name");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Could not review leave request.", error: err.message });
  }
});

module.exports = router;
