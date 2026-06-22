const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
const {
  sendCitizenAccountApprovedEmail,
  sendStaffAccountApprovedEmail,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");
const {
  normalizeEmail,
  findAdminByEmail,
  findCitizenByEmail,
  findStaffByEmail,
  emailExistsInAnyCollection,
} = require("../utils/accountLookup");

function getClientUrl() {
  const url = process.env.CLIENT_URL || "http://localhost:8080";
  return url.split(",")[0].trim();
}

function accountWithRole(account, role) {
  account.role = role;
  return account;
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = normalizeEmail(email);

  if (await emailExistsInAnyCollection(normalizedEmail)) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const citizen = await Citizen.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpires: null,
    approvalStatus: "pending",
    isApproved: false,
  });

  res.status(201).json({
    message:
      "Account created successfully. Waiting for admin approval.",
    user: citizen.toJSON(),
  });
}

async function registerStaff(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = normalizeEmail(email);

  if (await emailExistsInAnyCollection(normalizedEmail)) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const staff = await Staff.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpires: null,
    approvalStatus: "pending",
    isApproved: false,
  });

  res.status(201).json({
    message:
      "Staff account created successfully. Waiting for admin approval.",
    user: staff.toJSON(),
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503);
    throw new Error("Database is not connected. Please try again later.");
  }

  const normalizedEmail = normalizeEmail(email);

  const admin = await findAdminByEmail(normalizedEmail);
  if (admin) {
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    const account = accountWithRole(admin, "admin");
    res.json({
      token: generateToken(account),
      user: account.toJSON(),
    });
    return;
  }

  const staff = await findStaffByEmail(normalizedEmail);
  if (staff) {
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (staff.approvalStatus === "rejected") {
      res.status(403);
      throw new Error(
        staff.rejectionReason
          ? `Your account was rejected: ${staff.rejectionReason}`
          : "Your account has been rejected by the administrator.",
      );
    }

    if (staff.approvalStatus === "pending") {
      res.status(403);
      throw new Error(
        "Your account is pending admin approval. Please wait for the administrator to approve your account.",
      );
    }

    const account = accountWithRole(staff, "staff");
    res.json({
      token: generateToken(account),
      user: account.toJSON(),
    });
    return;
  }

  const citizen = await findCitizenByEmail(normalizedEmail);
  if (!citizen) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, citizen.password);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (citizen.approvalStatus === "rejected") {
    res.status(403);
    throw new Error(
      citizen.rejectionReason
        ? `Your account was rejected: ${citizen.rejectionReason}`
        : "Your account has been rejected by the administrator.",
    );
  }

  if (citizen.approvalStatus === "pending") {
    res.status(403);
    throw new Error(
      "Your account is pending admin approval. Please wait for the administrator to approve your account.",
    );
  }

  const account = accountWithRole(citizen, "citizen");
  res.json({
    token: generateToken(account),
    user: account.toJSON(),
  });
}

async function getCurrentUser(req, res) {
  res.json({
    user: req.user.toJSON(),
  });
}

async function getPendingUsers(req, res) {
  const users = await Citizen.find({
    isEmailVerified: true,
    approvalStatus: "pending",
  })
    .select("-password")
    .sort({ createdAt: -1 });

  res.json({ users: users.map((u) => u.toJSON()) });
}

async function getActiveCitizens(req, res) {
  const users = await Citizen.find({
    approvalStatus: "approved",
    isApproved: true,
  })
    .select("-password")
    .sort({ updatedAt: -1 });

  const citizens = users.map((u) => u.toJSON());

  res.json({
    count: citizens.length,
    users: citizens,
  });
}

async function approveUser(req, res) {
  const { userId } = req.params;

  const citizen = await Citizen.findById(userId);

  if (!citizen) {
    res.status(404);
    throw new Error("Citizen not found");
  }

  citizen.approvalStatus = "approved";
  citizen.isApproved = true;
  citizen.rejectionReason = null;
  await citizen.save();

  // Send approval email
  try {
    await sendCitizenAccountApprovedEmail(citizen);
  } catch (err) {
    console.error("Error sending citizen approval email:", err);
  }

  res.json({
    message: "User approved successfully",
    user: citizen.toJSON(),
  });
}

async function rejectUser(req, res) {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error("Rejection reason is required");
  }

  const citizen = await Citizen.findById(userId);

  if (!citizen) {
    res.status(404);
    throw new Error("Citizen not found");
  }

  citizen.approvalStatus = "rejected";
  citizen.isApproved = false;
  citizen.rejectionReason = reason.trim();
  await citizen.save();

  res.json({
    message: "User rejected successfully",
    user: citizen.toJSON(),
  });
}

async function getPendingStaff(req, res) {
  const users = await Staff.find({
    isEmailVerified: true,
    approvalStatus: "pending",
  })
    .select("-password")
    .sort({ createdAt: -1 });

  res.json({ users: users.map((u) => u.toJSON()) });
}

async function getActiveStaff(req, res) {
  const users = await Staff.find({
    approvalStatus: "approved",
    isApproved: true,
  })
    .select("-password")
    .sort({ updatedAt: -1 });

  res.json({
    count: users.length,
    users: users.map((u) => u.toJSON()),
  });
}

async function approveStaff(req, res) {
  const { userId } = req.params;
  const { designation, assignedCities } = req.body;

  const staff = await Staff.findById(userId);

  if (!staff) {
    res.status(404);
    throw new Error("Staff not found");
  }

  staff.approvalStatus = "approved";
  staff.isApproved = true;
  staff.rejectionReason = null;
  staff.designation = designation || null;
  staff.assignedCities = assignedCities || [];
  await staff.save();

  // Send approval email
  try {
    await sendStaffAccountApprovedEmail(staff);
  } catch (err) {
    console.error("Error sending staff approval email:", err);
  }

  res.json({
    message: "Staff approved successfully",
    user: staff.toJSON(),
  });
}

async function rejectStaff(req, res) {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error("Rejection reason is required");
  }

  const staff = await Staff.findById(userId);

  if (!staff) {
    res.status(404);
    throw new Error("Staff not found");
  }

  staff.approvalStatus = "rejected";
  staff.isApproved = false;
  staff.rejectionReason = reason.trim();
  await staff.save();

  res.json({
    message: "Staff rejected successfully",
    user: staff.toJSON(),
  });
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const normalizedEmail = normalizeEmail(email);

  // Find user in Citizen or Staff (NOT Admin)
  let user = await findCitizenByEmail(normalizedEmail);
  let role = "citizen";
  if (!user) {
    user = await findStaffByEmail(normalizedEmail);
    role = "staff";
  }

  if (!user) {
    // For security reasons, don't tell them the email doesn't exist
    res.status(200).json({
      message: "If an account exists with that email, we have sent an OTP to reset your password.",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP and set expiry (10 minutes)
  const hashedOtp = await bcrypt.hash(otp, 10);
  user.resetPasswordToken = hashedOtp;
  user.resetPasswordTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // Send email
  try {
    await sendPasswordResetEmail(user.email, otp);
    res.status(200).json({
      message: "If an account exists with that email, we have sent an OTP to reset your password.",
    });
  } catch (error) {
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;
    await user.save();
    res.status(500);
    throw new Error("Email could not be sent. Please try again later.");
  }
}

async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error("Email, OTP, and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = normalizeEmail(email);

  // Find user in Citizen or Staff (NOT Admin)
  let user = await findCitizenByEmail(normalizedEmail);
  if (!user) {
    user = await findStaffByEmail(normalizedEmail);
  }

  if (!user) {
    res.status(400);
    throw new Error("Invalid OTP or OTP has expired");
  }

  // Check if OTP is valid and not expired
  const isOtpValid =
    user.resetPasswordToken &&
    (await bcrypt.compare(otp, user.resetPasswordToken)) &&
    user.resetPasswordTokenExpires > Date.now();

  if (!isOtpValid) {
    res.status(400);
    throw new Error("Invalid OTP or OTP has expired");
  }

  // Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpires = null;
  await user.save();

  res.status(200).json({
    message: "Password reset successfully! You can now login with your new password.",
  });
}

module.exports = {
  register,
  registerStaff,
  login,
  getCurrentUser,
  getPendingUsers,
  getActiveCitizens,
  approveUser,
  rejectUser,
  getPendingStaff,
  getActiveStaff,
  approveStaff,
  rejectStaff,
  forgotPassword,
  resetPassword,
};
