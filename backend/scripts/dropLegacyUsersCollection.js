/**
 * Migrates any remaining docs from legacy "users" collection,
 * then drops that collection.
 *
 * Run: npm run drop:users
 */
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");

async function dropLegacyUsers() {
  await connectDB();

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "users" }).toArray();

  if (collections.length === 0) {
    console.log('Collection "users" does not exist. Nothing to remove.');
    process.exit(0);
  }

  const legacyUsers = db.collection("users");
  const docs = await legacyUsers.find({}).toArray();

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

  if (admins > 0 || citizens > 0) {
    console.log(`Copied before drop: ${admins} admin(s), ${citizens} citizen(s).`);
  }

  await legacyUsers.drop();
  console.log('Legacy "users" collection has been removed from MongoDB.');
  console.log("Use admins and citizens collections only.");
  process.exit(0);
}

dropLegacyUsers().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
