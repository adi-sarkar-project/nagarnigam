# Staff Panel Implementation Guide

## Overview
This guide provides a step-by-step implementation plan for adding a Staff panel to the UrbanResolve complaint management system.

## Key Requirements
- Staff can register and login (same as citizens)
- Staff accounts require admin approval
- Admin can assign designation and assigned cities to staff
- Staff can view and resolve complaints in their assigned cities
- Real-time updates without page refresh

## Technology Stack
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, TypeScript, Vite, React Query, React Router

---

## Step 1: Backend Implementation

### 1.1 Create Staff Model
**File**: `backend/models/Staff.js`

```javascript
const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      default: null,
    },
    assignedCities: {
      type: [String],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpires: {
      type: Date,
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "staffs",
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.resetPasswordToken;
        ret.role = "staff";
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Staff", StaffSchema);
```

### 1.2 Update Account Lookup Utils
**File**: `backend/utils/accountLookup.js`

```javascript
const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");
const Staff = require("../models/Staff"); // Add this

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

async function findAdminByEmail(email) {
  return Admin.findOne({ email: normalizeEmail(email) });
}

async function findCitizenByEmail(email) {
  return Citizen.findOne({ email: normalizeEmail(email) });
}

// Add staff lookup
async function findStaffByEmail(email) {
  return Staff.findOne({ email: normalizeEmail(email) });
}

async function emailExistsInAnyCollection(email) {
  const normalized = normalizeEmail(email);
  const [admin, citizen, staff] = await Promise.all([
    Admin.findOne({ email: normalized }),
    Citizen.findOne({ email: normalized }),
    Staff.findOne({ email: normalized }), // Add this
  ]);
  return Boolean(admin || citizen || staff);
}

async function findAccountById(id, role) {
  if (role === "admin") {
    return Admin.findById(id);
  }
  if (role === "staff") {
    return Staff.findById(id); // Add this
  }
  return Citizen.findById(id);
}

module.exports = {
  normalizeEmail,
  findAdminByEmail,
  findCitizenByEmail,
  findStaffByEmail, // Add this
  emailExistsInAnyCollection,
  findAccountById,
};
```

### 1.3 Update Auth Controller
**File**: `backend/controllers/authController.js`

#### 1.3.1 Add Imports
```javascript
const Staff = require("../models/Staff"); // Add this
```

#### 1.3.2 Add Staff Registration
```javascript
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
```

#### 1.3.3 Update Login to Support Staff
```javascript
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

  // Add staff login support
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
```

#### 1.3.4 Add Staff Management Endpoints
```javascript
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
```

#### 1.3.5 Update Exports
```javascript
module.exports = {
  register,
  registerStaff, // Add this
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  getPendingUsers,
  getActiveCitizens,
  approveUser,
  rejectUser,
  getPendingStaff, // Add this
  getActiveStaff, // Add this
  approveStaff, // Add this
  rejectStaff, // Add this
};
```

### 1.4 Update Auth Routes
**File**: `backend/routes/authRoutes.js`

```javascript
const express = require("express");
const {
  register,
  registerStaff, // Add this
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  getPendingUsers,
  getActiveCitizens,
  approveUser,
  rejectUser,
  getPendingStaff, // Add this
  getActiveStaff, // Add this
  approveStaff, // Add this
  rejectStaff, // Add this
} = require("../controllers/authController");
const { protect, authorizeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/register/staff", registerStaff); // Add this
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getCurrentUser);

router.get("/admin/pending-users", protect, authorizeAdmin, getPendingUsers);
router.get("/admin/active-citizens", protect, authorizeAdmin, getActiveCitizens);
router.patch("/admin/approve-user/:userId", protect, authorizeAdmin, approveUser);
router.patch("/admin/reject-user/:userId", protect, authorizeAdmin, rejectUser);

// Add staff management routes
router.get("/admin/pending-staff", protect, authorizeAdmin, getPendingStaff);
router.get("/admin/active-staff", protect, authorizeAdmin, getActiveStaff);
router.patch("/admin/approve-staff/:userId", protect, authorizeAdmin, approveStaff);
router.patch("/admin/reject-staff/:userId", protect, authorizeAdmin, rejectStaff);

module.exports = router;
```

### 1.5 Update Auth Middleware
**File**: `backend/middleware/authMiddleware.js`

```javascript
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { findAccountById } = require("../utils/accountLookup");

function protect(req, res, next) {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await findAccountById(decoded.id, decoded.role);
      req.user.role = decoded.role;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
}

function authorizeAdmin(req, res, next) {
  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as admin");
  }
}

// Add authorizeStaff middleware
function authorizeStaff(req, res, next) {
  if (req.user.role === "staff") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as staff");
  }
}

module.exports = {
  protect,
  authorizeAdmin,
  authorizeStaff,
};
```

### 1.6 Update Complaints Controller
**File**: `backend/controllers/complaintController.js`

#### 1.6.1 Add Get Assigned Complaints for Staff
```javascript
async function getAssignedComplaints(req, res) {
  const staff = req.user;

  // Get complaints in staff's assigned cities
  const complaints = await Complaint.find({
    "location.city": { $in: staff.assignedCities },
    status: "pending",
  }).sort({ createdAt: -1 });

  res.json({
    complaints: complaints.map((c) => c.toJSON()),
  });
}
```

#### 1.6.2 Add Resolve Complaint by Staff
```javascript
async function resolveComplaintByStaff(req, res) {
  const { complaintId } = req.params;
  const { afterImage } = req.body;

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  // Verify complaint is in staff's assigned cities
  const isAssignedCity = req.user.assignedCities.includes(complaint.location.city);
  if (!isAssignedCity) {
    res.status(403);
    throw new Error("You are not authorized to resolve complaints in this city");
  }

  complaint.status = "resolved";
  complaint.resolvedAt = new Date();

  if (afterImage) {
    const mimetype = afterImage.split(";")[0].split("/")[1];
    const buffer = Buffer.from(
      afterImage.split(",")[1],
      "base64",
    );

    const uploadResult = await uploadBuffer(
      buffer,
      process.env.CLOUDINARY_COMPLAINTS_FOLDER || "complaints",
      mimetype,
    );

    complaint.afterImageUrl = uploadResult.secure_url;
  }

  await complaint.save();

  res.json({
    message: "Complaint resolved successfully",
    complaint: complaint.toJSON(),
  });
}
```

#### 1.6.3 Update Exports
```javascript
module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  resolveComplaint,
  getAssignedComplaints, // Add this
  resolveComplaintByStaff, // Add this
};
```

### 1.7 Update Complaints Routes
**File**: `backend/routes/complaintRoutes.js`

```javascript
const express = require("express");
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  resolveComplaint,
  getAssignedComplaints, // Add this
  resolveComplaintByStaff, // Add this
} = require("../controllers/complaintController");
const { protect, authorizeAdmin, authorizeStaff } = require("../middleware/authMiddleware"); // Add authorizeStaff
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  "/",
  protect,
  upload.single("image"),
  createComplaint,
);

router.get("/my", protect, getMyComplaints);
router.get("/all", protect, authorizeAdmin, getAllComplaints);
router.patch("/resolve/:complaintId", protect, authorizeAdmin, resolveComplaint);

// Add staff routes
router.get("/assigned", protect, authorizeStaff, getAssignedComplaints);
router.patch("/staff-resolve/:complaintId", protect, authorizeStaff, resolveComplaintByStaff);

module.exports = router;
```

---

## Step 2: Frontend Implementation

### 2.1 Update Types
**File**: `frontend/src/types/app.ts`

```typescript
export type Role = "admin" | "citizen" | "staff"; // Add staff
export type ComplaintCategory = string;
export type ComplaintStatus = "pending" | "resolved";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified?: boolean;
  isApproved?: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  designation?: string; // Add this
  assignedCities?: string[]; // Add this
  createdAt?: string;
  updatedAt?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: ComplaintCategory;
  location: {
    district: string;
    city: string;
  };
  address: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
```

### 2.2 Update API
**File**: `frontend/src/api/auth.ts`

#### 2.2.1 Add Staff Registration
```typescript
export async function registerStaff({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await axios.post("/auth/register/staff", {
    name,
    email,
    password,
  });
  return data;
}
```

#### 2.2.2 Add Staff Management APIs
```typescript
export async function getPendingStaff() {
  const { data } = await axios.get("/auth/admin/pending-staff");
  return data;
}

export async function getActiveStaff() {
  const { data } = await axios.get("/auth/admin/active-staff");
  return data;
}

export async function approveStaff({
  userId,
  designation,
  assignedCities,
}: {
  userId: string;
  designation?: string;
  assignedCities?: string[];
}) {
  const { data } = await axios.patch(`/auth/admin/approve-staff/${userId}`, {
    designation,
    assignedCities,
  });
  return data;
}

export async function rejectStaff({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}) {
  const { data } = await axios.patch(`/auth/admin/reject-staff/${userId}`, {
    reason,
  });
  return data;
}
```

### 2.3 Update Complaints API
**File**: `frontend/src/api/complaints.ts`

```typescript
export async function getAssignedComplaints() {
  const { data } = await axios.get("/complaints/assigned");
  return data;
}

export async function resolveComplaintByStaff({
  complaintId,
  afterImage,
}: {
  complaintId: string;
  afterImage?: string;
}) {
  const { data } = await axios.patch(`/complaints/staff-resolve/${complaintId}`, {
    afterImage,
  });
  return data;
}
```

### 2.4 Create Staff Pages

#### 2.4.1 Staff Login Page
**File**: `frontend/src/pages/StaffLogin.tsx`

(Create this file, similar to AdminLogin but for staff)

#### 2.4.2 Staff Registration Page
**File**: `frontend/src/pages/StaffRegister.tsx`

(Create this file, similar to Register but for staff)

#### 2.4.3 Staff Panel Page
**File**: `frontend/src/pages/StaffPanel.tsx`

(Create this file, similar to CitizenPanel but for staff)

### 2.5 Update App Routes
**File**: `frontend/src/App.tsx`

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import StaffLogin from "./pages/StaffLogin.tsx"; // Add this
import Register from "./pages/Register.tsx";
import StaffRegister from "./pages/StaffRegister.tsx"; // Add this
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import ApprovalPending from "./pages/ApprovalPending.tsx";
import CitizenPanel from "./pages/CitizenPanel.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import StaffPanel from "./pages/StaffPanel.tsx"; // Add this
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/staff/login" element={<StaffLogin />} /> {/* Add this */}
            <Route path="/register" element={<Register />} />
            <Route path="/staff/register" element={<StaffRegister />} /> {/* Add this */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/approval-pending" element={<ApprovalPending />} />
            <Route
              path="/citizen"
              element={
                <ProtectedRoute role="citizen">
                  <CitizenPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute role="staff">
                  <StaffPanel />
                </ProtectedRoute>
              }
            /> {/* Add this */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

### 2.6 Update Protected Route
**File**: `frontend/src/components/ProtectedRoute.tsx`

(Ensure it supports "staff" role)

### 2.7 Update Auth Hook
**File**: `frontend/src/hooks/useAuth.tsx`

(Ensure it handles staff role correctly)

---

## Step 3: Update Home Page
**File**: `frontend/src/pages/Index.tsx`

Add a Staff Portal section similar to Citizen Portal and Admin Portal.

---

## Step 4: Update Admin Dashboard
Add staff management section to `AdminDashboard.tsx` for:
- Approving/rejecting staff
- Assigning designation and cities
- Viewing active staff

---

## Summary of Changes

| Component | Changes |
|-----------|---------|
| Backend Models | Add Staff.js |
| Backend Utils | Update accountLookup.js |
| Backend Controllers | Update authController.js, complaintController.js |
| Backend Routes | Update authRoutes.js, complaintRoutes.js |
| Backend Middleware | Update authMiddleware.js |
| Frontend Types | Update app.ts |
| Frontend API | Update auth.ts, complaints.ts |
| Frontend Pages | Add StaffLogin.tsx, StaffRegister.tsx, StaffPanel.tsx |
| Frontend Routing | Update App.tsx |
| Frontend Home | Update Index.tsx |
| Frontend Admin | Update AdminDashboard.tsx |
