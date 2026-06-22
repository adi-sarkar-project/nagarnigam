/**
 * One-time migration: moves documents from legacy "users" collection
 * into "admins" and "citizens" collections.
 *
 * Run: node scripts/migrateUsersToCollections.js
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");

async function migrate() {
  await connectDB();

  const db = mongoose.connection.db;
  const legacyUsers = db.collection("users");
  const docs = await legacyUsers.find({}).toArray();

  if (docs.length === 0) {
    console.log("No documents in users collection. Nothing to migrate.");
    process.exit(0);
  }

  let admins = 0;
  let citizens = 0;

  for (const doc of docs) {
    const email = (doc.email || "").toLowerCase().trim();
    if (!email) continue;

    if (doc.role === "admin") {
      const exists = await Admin.findOne({ email });
      if (!exists) {
        await Admin.create({
          name: doc.name,
          email,
          password: doc.password,
        });
        admins += 1;
      }
      continue;
    }

    const exists = await Citizen.findOne({ email });
    if (!exists) {
      await Citizen.create({
        name: doc.name,
        email,
        password: doc.password,
        isEmailVerified: doc.isEmailVerified ?? false,
        emailVerificationToken: doc.emailVerificationToken ?? null,
        emailVerificationTokenExpires: doc.emailVerificationTokenExpires ?? null,
        resetPasswordToken: doc.resetPasswordToken ?? null,
        resetPasswordTokenExpires: doc.resetPasswordTokenExpires ?? null,
        isApproved: doc.isApproved ?? false,
        approvalStatus: doc.approvalStatus ?? "pending",
        rejectionReason: doc.rejectionReason ?? null,
      });
      citizens += 1;
    }
  }

  console.log(`Migration complete: ${admins} admin(s), ${citizens} citizen(s) copied.`);
  console.log('Legacy "users" collection was not deleted. You may remove it manually after verifying.');
  process.exit(0);
}

migrate().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
