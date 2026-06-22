const crypto = require("crypto");

// Always use base64 storage to avoid Cloudinary errors
function uploadBuffer(buffer, folder, mimetype = "image/jpeg") {
  const base64Data = buffer.toString("base64");
  return Promise.resolve({
    secure_url: `data:${mimetype};base64,${base64Data}`,
    public_id: `db_${crypto.randomBytes(8).toString("hex")}`,
  });
}

module.exports = {
  uploadBuffer,
};
