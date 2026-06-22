require("dotenv").config();

const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const Admin = require("./models/Admin");
const Citizen = require("./models/Citizen");
const bcrypt = require("bcryptjs");

const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

function getAllowedOrigins() {
  const configuredOrigins = process.env.CLIENT_URL;

  if (!configuredOrigins) {
    return true;
  }

  const allowedOrigins = configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  };
}

app.use(
  cors({
    origin: getAllowedOrigins(),
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: error.message || "Something went wrong",
  });
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  try {
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@nagarnigam.gov.in")
      .toLowerCase()
      .trim();
    const adminExists = await Admin.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log(
        `Admin ${adminEmail} not found in admins collection. Seeding...`,
      );
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await Admin.create({
        name: process.env.ADMIN_NAME || "Municipal Admin",
        email: adminEmail,
        password: hashedPassword,
      });
      console.log(`Admin created in admins collection: ${adminEmail}`);
    } else {
      console.log(`Admin ready in admins collection: ${adminEmail}`);
    }

    // Auto-verify email for all existing citizens
    const updateResult = await Citizen.updateMany(
      { isEmailVerified: false },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpires: null,
        },
      }
    );
    if (updateResult.modifiedCount > 0) {
      console.log(`Auto-verified email for ${updateResult.modifiedCount} citizen(s)`);
    }
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    console.log(
      "Server is running without database connection. Some features will not work.",
    );
  }
});
