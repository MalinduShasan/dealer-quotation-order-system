const QUOTATION_APPROVAL_DISCOUNT_THRESHOLD = Number(process.env.QUOTATION_APPROVAL_DISCOUNT_THRESHOLD || 5);

const VALID_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
  "converted"
];

const isValidDate = (value) => !value || !Number.isNaN(new Date(value).getTime());

const validateQuotationPayload = (payload = {}, { isUpdate = false } = {}) => {
  const errors = {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!payload.dealer_id) {
    errors.dealer_id = "Dealer is required";
  }

  if (!isUpdate || items.length > 0) {
    if (!items.length) {
      errors.items = "At least one quotation item is required";
    }
  }

  items.forEach((item, index) => {
    if (!item?.product_id) {
      errors[`items.${index}.product_id`] = "Product is required";
    }

    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors[`items.${index}.quantity`] = "Quantity must be a positive integer";
    }

    if (item?.discount_amount !== undefined && Number(item.discount_amount) < 0) {
      errors[`items.${index}.discount_amount`] = "Discount must be zero or greater";
    }

    if (item?.tax_amount !== undefined && Number(item.tax_amount) < 0) {
      errors[`items.${index}.tax_amount`] = "Tax must be zero or greater";
    }
  });

  ["discount_amount", "tax_amount", "shipping_amount", "discount_percentage", "tax_percentage"].forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 0) {
      errors[field] = "Value must be zero or greater";
    }
  });

  if (payload.discount_percentage !== undefined && Number(payload.discount_percentage) > 100) {
    errors.discount_percentage = "Discount percentage must be between 0 and 100";
  }

  if (payload.tax_percentage !== undefined && Number(payload.tax_percentage) > 100) {
    errors.tax_percentage = "Tax percentage must be between 0 and 100";
  }

  if (payload.valid_until && !isValidDate(payload.valid_until)) {
    errors.valid_until = "Valid until date is invalid";
  }

  if (payload.status && !VALID_STATUSES.includes(payload.status)) {
    errors.status = "Invalid quotation status";
  }

  return errors;
};

module.exports = {
  QUOTATION_APPROVAL_DISCOUNT_THRESHOLD,
  VALID_STATUSES,
  validateQuotationPayload
};
