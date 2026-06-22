const Admin = require("../models/Admin");
const Citizen = require("../models/Citizen");
const Staff = require("../models/Staff");

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

async function findAdminByEmail(email) {
  return Admin.findOne({ email: normalizeEmail(email) });
}

async function findCitizenByEmail(email) {
  return Citizen.findOne({ email: normalizeEmail(email) });
}

async function findStaffByEmail(email) {
  return Staff.findOne({ email: normalizeEmail(email) });
}

async function emailExistsInAnyCollection(email) {
  const normalized = normalizeEmail(email);
  const [admin, citizen, staff] = await Promise.all([
    Admin.findOne({ email: normalized }),
    Citizen.findOne({ email: normalized }),
    Staff.findOne({ email: normalized }),
  ]);
  return Boolean(admin || citizen || staff);
}

async function findAccountById(id, role) {
  if (role === "admin") {
    return Admin.findById(id);
  }
  if (role === "staff") {
    return Staff.findById(id);
  }
  return Citizen.findById(id);
}

module.exports = {
  normalizeEmail,
  findAdminByEmail,
  findCitizenByEmail,
  findStaffByEmail,
  emailExistsInAnyCollection,
  findAccountById,
};
