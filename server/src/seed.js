require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/leave_management");
  const accounts = [
    {
      name: "Demo Manager", email: "manager@demo.com", password: "Manager@123",
      role: "manager", leaveBalance: { casual: 12, medical: 10 }
    },
    {
      name: "Demo Employee", email: "employee@demo.com", password: "Employee@123",
      role: "employee", leaveBalance: { casual: 12, medical: 10 }
    }
  ];
  for (const account of accounts) {
    const password = await bcrypt.hash(account.password, 10);
    await User.findOneAndUpdate(
      { email: account.email },
      { ...account, password },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log("Demo accounts ready:");
  console.log("Manager: manager@demo.com / Manager@123");
  console.log("Employee: employee@demo.com / Employee@123");
  await mongoose.disconnect();
}
seed().catch((err) => { console.error(err); process.exit(1); });
