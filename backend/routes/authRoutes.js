const express = require("express");
const {
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
} = require("../controllers/authController");
const { protect, authorizeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/register/staff", registerStaff);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getCurrentUser);

router.get("/admin/pending-users", protect, authorizeAdmin, getPendingUsers);
router.get("/admin/active-citizens", protect, authorizeAdmin, getActiveCitizens);
router.patch("/admin/approve-user/:userId", protect, authorizeAdmin, approveUser);
router.patch("/admin/reject-user/:userId", protect, authorizeAdmin, rejectUser);

router.get("/admin/pending-staff", protect, authorizeAdmin, getPendingStaff);
router.get("/admin/active-staff", protect, authorizeAdmin, getActiveStaff);
router.patch("/admin/approve-staff/:userId", protect, authorizeAdmin, approveStaff);
router.patch("/admin/reject-staff/:userId", protect, authorizeAdmin, rejectStaff);

module.exports = router;
