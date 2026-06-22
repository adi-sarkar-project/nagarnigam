
const mongoose = require("mongoose");
require("dotenv").config();

const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");
const Staff = require("../models/Staff");
const Complaint = require("../models/Complaint");

async function clearDatabase() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    console.log("🗑️ Clearing all collections...");

    // Clear all collections
    await Admin.deleteMany({});
    console.log("✅ Cleared Admin collection");

    await Citizen.deleteMany({});
    console.log("✅ Cleared Citizen collection");

    await Staff.deleteMany({});
    console.log("✅ Cleared Staff collection");

    await Complaint.deleteMany({});
    console.log("✅ Cleared Complaint collection");

    console.log("\n🎉 Database cleared successfully!");
    console.log("\nNote: You will need to re-create the admin account if needed.");
    console.log("Run 'node scripts/createAdmin.js' to create a new admin account.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();
