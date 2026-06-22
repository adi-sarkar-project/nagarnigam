const express = require("express");
const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  updateStatus,
  uploadAfterImage,
  getAssignedComplaints,
  assignComplaintToStaff,
  submitPendingResolution,
  approvePendingResolution,
  rejectPendingResolution,
} = require("../controllers/complaintController");
const { protect, authorizeAdmin, authorizeStaff } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/create", protect, authorize("citizen"), uploadSingle("beforeImage"), createComplaint);
router.get("/my", protect, getMyComplaints);
router.get("/", protect, authorize("admin"), getAllComplaints);
router.patch(
  "/:id/after-image",
  protect,
  authorize("admin"),
  uploadSingle("afterImage"),
  uploadAfterImage,
);
router.patch("/:id/resolve", protect, authorize("admin"), updateStatus);
router.patch("/assign/:complaintId/:staffId", protect, authorizeAdmin, assignComplaintToStaff);

router.get("/assigned", protect, authorizeStaff, getAssignedComplaints);

router.patch("/submit-pending-resolution/:complaintId", protect, authorizeStaff, uploadSingle("afterImage"), submitPendingResolution);
router.patch("/approve-pending-resolution/:complaintId", protect, authorizeAdmin, approvePendingResolution);
router.patch("/reject-pending-resolution/:complaintId", protect, authorizeAdmin, rejectPendingResolution);

module.exports = router;
