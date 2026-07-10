const multer = require("multer");

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!ALLOWED_LOGO_TYPES.includes(file.mimetype)) {
    return callback(new Error("Only PNG, JPEG, and WebP images are allowed"));
  }

  return callback(null, true);
};

const brandLogoUpload = multer({
  storage,
  limits: {
    fileSize: MAX_LOGO_SIZE
  },
  fileFilter
});

module.exports = {
  brandLogoUpload,
  MAX_LOGO_SIZE,
  ALLOWED_LOGO_TYPES
};
