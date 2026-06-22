const Complaint = require("../models/Complaint");
const Staff = require("../models/Staff");
const Citizen = require("../models/Citizen");
const { uploadBuffer } = require("../config/cloudinary");
const { generateComplaintPdf } = require("../utils/pdfGenerator");
const {
  sendComplaintRaisedEmail,
  sendComplaintAssignedEmail,
  sendComplaintResolvedEmail,
} = require("../utils/sendEmail");

function getComplaintFolder(type) {
  const baseFolder = process.env.CLOUDINARY_FOLDER || "urban-resolve";
  return `${baseFolder}/${type}`;
}

async function createComplaint(req, res) {
  const { category, description, district, city, address } = req.body;

  if (!category || !description || !district || !city || !address) {
    res.status(400);
    throw new Error(
      "Category, description, district, city, and address are required",
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("A before-work image is required");
  }

  const beforeImageUpload = await uploadBuffer(
    req.file.buffer,
    getComplaintFolder("before"),
    req.file.mimetype,
  );
  const complaint = await Complaint.create({
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    category,
    location: {
      district,
      city,
      address: address.trim(),
    },
    address: address.trim(),
    description: description.trim(),
    beforeImageUrl: beforeImageUpload.secure_url,
    status: "pending",
  });

  // Send complaint raised email
  try {
    const citizen = {
      name: req.user.name,
      email: req.user.email,
    };
    await sendComplaintRaisedEmail(complaint, citizen);
  } catch (err) {
    console.error("Error sending complaint raised email:", err);
  }

  res.status(201).json({
    message: "Complaint created successfully",
    complaint: complaint.toJSON(),
  });
}

async function getAllComplaints(req, res) {
  const { category, year, month, day, status } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }
  if (status) {
    filter.status = status;
  }

  if (year) {
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    if (month) {
      const monthNum = parseInt(month, 10);
      startDate.setMonth(monthNum - 1);
      startDate.setDate(1);
      endDate.setMonth(monthNum);
      endDate.setDate(0);
    }
    if (day) {
      const dayNum = parseInt(day, 10);
      const currentMonth = startDate.getMonth();
      const currentYear = startDate.getFullYear();
      startDate.setFullYear(currentYear, currentMonth, dayNum);
      startDate.setHours(0, 0, 0, 0);
      endDate.setFullYear(currentYear, currentMonth, dayNum);
      endDate.setHours(23, 59, 59, 999);
    }
    filter.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const complaintList = await Complaint.find(filter)
    .populate("assignedStaff", "-password")
    .sort({ createdAt: -1 });

  res.json({
    complaints: complaintList.map((complaint) => complaint.toJSON()),
  });
}

async function getMyComplaints(req, res) {
  const complaintList = await Complaint.find({ userId: req.user.id })
    .populate("assignedStaff", "-password")
    .sort({ createdAt: -1 });

  res.json({
    complaints: complaintList.map((complaint) => complaint.toJSON()),
  });
}

async function uploadAfterImage(req, res) {
  if (!req.file) {
    res.status(400);
    throw new Error("An after-work image is required");
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  const afterImageUpload = await uploadBuffer(
    req.file.buffer,
    getComplaintFolder("after"),
    req.file.mimetype,
  );
  complaint.afterImageUrl = afterImageUpload.secure_url;
  await complaint.save();

  res.json({
    message: "After-work image uploaded successfully",
    complaint: complaint.toJSON(),
  });
}

async function updateStatus(req, res) {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  if (!complaint.afterImageUrl) {
    res.status(400);
    throw new Error("Upload after image first");
  }

  complaint.status = "resolved";
  complaint.resolvedAt = new Date();
  await complaint.save();

  // Send complaint resolved email
  try {
    const citizen = {
      name: complaint.userName,
      email: complaint.userEmail,
    };
    await sendComplaintResolvedEmail(complaint, citizen);
  } catch (err) {
    console.error("Error sending complaint resolved email:", err);
  }

  res.json({
    message: "Complaint marked as resolved",
    complaint: complaint.toJSON(),
  });
}

async function assignComplaintToStaff(req, res) {
  const { complaintId, staffId } = req.params;

  const complaint = await Complaint.findById(complaintId);
  const staff = await Staff.findById(staffId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }
  if (!staff) {
    res.status(404);
    throw new Error("Staff not found");
  }

  complaint.assignedStaff = staffId;
  complaint.status = "assigned";
  await complaint.save();

  const updatedComplaint = await Complaint.findById(complaintId)
    .populate("assignedStaff", "-password");

  // Send complaint assigned email
  try {
    const citizen = {
      name: complaint.userName,
      email: complaint.userEmail,
    };
    await sendComplaintAssignedEmail(complaint, staff, citizen);
  } catch (err) {
    console.error("Error sending complaint assigned email:", err);
  }

  res.json({
    message: "Complaint assigned to staff successfully",
    complaint: updatedComplaint.toJSON(),
  });
}

async function getAssignedComplaints(req, res) {
  const staff = req.user;

  const complaints = await Complaint.find({
    $or: [
      { assignedStaff: staff._id, $or: [{ status: "assigned" }, { status: "resolution_pending" }] },
      { "location.city": { $in: staff.assignedCities }, $or: [{ status: "pending" }, { status: "resolution_pending" }] }
    ]
  }).sort({ createdAt: -1 });

  res.json({
    complaints: complaints.map((c) => c.toJSON()),
  });
}

async function submitPendingResolution(req, res) {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  const isDirectlyAssigned = complaint.assignedStaff?.toString() === req.user._id.toString();
  const isInAssignedCity = req.user.assignedCities.includes(complaint.location.city);
  if (!isDirectlyAssigned && !isInAssignedCity) {
    res.status(403);
    throw new Error("You are not authorized to submit resolution for this complaint");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("After image is required");
  }

  const uploadResult = await uploadBuffer(
    req.file.buffer,
    getComplaintFolder("pending"),
    req.file.mimetype,
  );

  complaint.status = "resolution_pending";
  complaint.pendingAfterImageUrl = uploadResult.secure_url;
  complaint.pendingSubmittedBy = req.user._id;
  await complaint.save();

  res.json({
    message: "Resolution submitted for admin approval",
    complaint: complaint.toJSON(),
  });
}

async function approvePendingResolution(req, res) {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  complaint.status = "resolved";
  complaint.afterImageUrl = complaint.pendingAfterImageUrl;
  complaint.pendingAfterImageUrl = "";
  complaint.pendingSubmittedBy = null;
  complaint.resolvedAt = new Date();
  await complaint.save();

  // Send complaint resolved email
  try {
    const citizen = {
      name: complaint.userName,
      email: complaint.userEmail,
    };
    await sendComplaintResolvedEmail(complaint, citizen);
  } catch (err) {
    console.error("Error sending complaint resolved email:", err);
  }

  res.json({
    message: "Resolution approved, complaint marked as resolved",
    complaint: complaint.toJSON(),
  });
}

async function rejectPendingResolution(req, res) {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  complaint.status = complaint.assignedStaff ? "assigned" : "pending";
  complaint.pendingAfterImageUrl = "";
  complaint.pendingSubmittedBy = null;
  await complaint.save();

  res.json({
    message: "Resolution rejected, complaint sent back to staff",
    complaint: complaint.toJSON(),
  });
}

module.exports = {
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
};
