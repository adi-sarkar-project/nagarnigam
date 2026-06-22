const mongoose = require("mongoose");
const dns = require("dns");

function isSrvDnsError(error) {
  const message = error?.message || "";
  return message.includes("querySrv") && message.includes("ECONNREFUSED");
}

async function connectWithUri(mongoUri) {
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    await connectWithUri(mongoUri);
  } catch (error) {
    // Windows/private DNS resolvers can block SRV lookups used by mongodb+srv.
    // Retry once with public resolvers to make Atlas connections more reliable.
    if (mongoUri.startsWith("mongodb+srv://") && isSrvDnsError(error)) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      await connectWithUri(mongoUri);
      return;
    }

    throw error;
  }
}

module.exports = connectDB;
