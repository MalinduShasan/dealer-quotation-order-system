export const MAX_BRAND_LOGO_SIZE = 2 * 1024 * 1024;
export const ALLOWED_BRAND_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const sanitizeFilename = (filename = "brand-logo") =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "brand-logo";

export const validateBrandLogoFile = (file) => {
  if (!file) {
    return "Please choose a logo file";
  }

  if (!ALLOWED_BRAND_LOGO_TYPES.includes(file.type)) {
    return "Allowed file types: PNG, JPG, WEBP";
  }

  if (file.size > MAX_BRAND_LOGO_SIZE) {
    return "Logo file must be 2 MB or smaller";
  }

  return "";
};
