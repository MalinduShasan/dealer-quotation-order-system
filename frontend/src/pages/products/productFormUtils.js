export const initialFormState = {
  sku: "",
  name: "",
  description: "",
  categoryId: "",
  brandId: "",
  unitPrice: "0.00",
  dealerPrice: "0.00",
  stockQuantity: "0",
  minimumStock: "0",
  status: "active"
};

export function validateProductForm(values, { allowStockEdit = true } = {}) {
  const errors = {};

  if (!values.sku.trim()) errors.sku = "SKU is required";
  if (!values.name.trim()) errors.name = "Product name is required";
  if (!values.categoryId) errors.categoryId = "Category is required";
  if (!values.brandId) errors.brandId = "Brand is required";
  if (values.description.trim().length > 1000) errors.description = "Description must be at most 1000 characters";

  const unitPrice = Number(values.unitPrice);
  const dealerPrice = Number(values.dealerPrice);
  const stockQuantity = Number(values.stockQuantity);
  const minimumStock = Number(values.minimumStock);

  if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.unitPrice = "Unit price must be 0 or greater";
  if (!Number.isFinite(dealerPrice) || dealerPrice < 0) errors.dealerPrice = "Dealer price must be 0 or greater";
  if (allowStockEdit && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
    errors.stockQuantity = "Stock quantity must be 0 or greater";
  }
  if (!Number.isFinite(minimumStock) || minimumStock < 0) errors.minimumStock = "Minimum stock must be 0 or greater";
  if (!values.status) errors.status = "Status is required";

  return errors;
}

export function buildProductFormValues(product) {
  return {
    sku: product.sku || "",
    name: product.name || "",
    description: product.description || "",
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    unitPrice: String(product.unitPrice ?? "0.00"),
    dealerPrice: String(product.dealerPrice ?? "0.00"),
    stockQuantity: String(product.stockQuantity ?? "0"),
    minimumStock: String(product.minimumStock ?? "0"),
    status: product.status || "active"
  };
}

export function buildProductPayload(values, { includeStockQuantity = true } = {}) {
  const payload = {
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId,
    brandId: values.brandId,
    unitPrice: Number(values.unitPrice),
    dealerPrice: Number(values.dealerPrice),
    minimumStock: Number(values.minimumStock),
    status: values.status
  };

  if (includeStockQuantity) {
    payload.stockQuantity = Number(values.stockQuantity);
  }

  return payload;
}
