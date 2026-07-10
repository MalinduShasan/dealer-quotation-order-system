const multer = require("multer");

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_PRODUCT_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_PRODUCT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const storage = multer.memoryStorage();

const createUploadMiddleware = ({ allowedTypes, maxFileSize, errorMessage }) =>
  multer({
    storage,
    limits: {
      fileSize: maxFileSize
    },
    fileFilter(req, file, callback) {
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new Error(errorMessage));
      }

      return callback(null, true);
    }
  });

const brandLogoUpload = createUploadMiddleware({
  allowedTypes: ALLOWED_LOGO_TYPES,
  maxFileSize: MAX_LOGO_SIZE,
  errorMessage: "Only PNG, JPEG, and WebP images are allowed"
});

const productImageUpload = createUploadMiddleware({
  allowedTypes: ALLOWED_PRODUCT_IMAGE_TYPES,
  maxFileSize: MAX_PRODUCT_IMAGE_SIZE,
  errorMessage: "Only PNG, JPEG, and WebP product images are allowed"
});

module.exports = {
  brandLogoUpload,
  productImageUpload,
  MAX_LOGO_SIZE,
  ALLOWED_LOGO_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
  ALLOWED_PRODUCT_IMAGE_TYPES
};
