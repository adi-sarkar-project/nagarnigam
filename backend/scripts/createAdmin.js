require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

async function createAdmin() {
  await connectDB();

  const name = process.env.ADMIN_NAME || "Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@nagarnigam.gov.in").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  await Admin.deleteOne({ email });

  const hashedPassword = await bcrypt.hash(password, 10);
  await Admin.create({
    name,
    email,
    password: hashedPassword,
  });

  console.log(`Admin created in admins collection for ${email}`);
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
