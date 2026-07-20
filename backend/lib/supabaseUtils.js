const supabase = require("../config/db");

const unwrap = async (query) => {
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const unwrapSingle = async (query) => {
  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
};

const getActorId = (user) => user?.id || user?._id || null;

const mapUser = (user) => {
  if (!user) return null;

  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    status: user.status,
    dealerId: user.dealerId || user.dealer_id || null,
    dealerProfileExists: Boolean(user.dealerId || user.dealer_id),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

const mapDealer = (dealer) => {
  if (!dealer) return null;

  return {
    _id: dealer.id,
    id: dealer.id,
    userId: dealer.user_id,
    dealerCode: dealer.dealer_code,
    companyName: dealer.company_name,
    contactPerson: dealer.contact_person,
    email: dealer.email,
    phone: dealer.phone,
    address: dealer.address,
    city: dealer.city,
    province: dealer.province,
    country: dealer.country,
    creditLimit: dealer.credit_limit,
    paymentTerms: dealer.payment_terms,
    status: dealer.status,
    notes: dealer.notes,
    createdAt: dealer.created_at,
    updatedAt: dealer.updated_at
  };
};

const mapProduct = (product) => {
  if (!product) return null;

  return {
    _id: product.id,
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url || null,
    imagePath: product.image_path || null,
    categoryId: product.category_id,
    category: product.category || null,
    categoryName: product.category?.name || null,
    brandId: product.brand_id,
    brand: product.brand || null,
    brandName: product.brand?.name || null,
    unitPrice: product.unit_price,
    dealerPrice: product.dealer_price,
    stockQuantity: product.stock_quantity,
    minimumStock: product.minimum_stock,
    isLowStock: Number(product.stock_quantity) <= Number(product.minimum_stock),
    hasTransactionHistory: Boolean(product.hasTransactionHistory),
    status: product.status,
    createdBy: product.created_by || null,
    createdByName: product.createdByUser?.name || null,
    updatedBy: product.updated_by || null,
    updatedByName: product.updatedByUser?.name || null,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
};

const mapStockMovement = (movement) => {
  if (!movement) return null;

  return {
    id: movement.id,
    productId: movement.product_id,
    movementType: movement.movement_type,
    quantity: movement.quantity,
    previousQuantity: movement.previous_quantity,
    newQuantity: movement.new_quantity,
    referenceType: movement.reference_type || null,
    referenceId: movement.reference_id || null,
    reason: movement.reason,
    createdBy: movement.created_by || null,
    createdByName: movement.createdByUser?.name || null,
    createdAt: movement.created_at,
    product: movement.product
      ? {
          id: movement.product.id,
          sku: movement.product.sku,
          name: movement.product.name,
          imageUrl: movement.product.image_url || null,
          status: movement.product.status
        }
      : null
  };
};

const mapQuotationWithItems = (quotation) => {
  if (!quotation) return null;

  return {
    _id: quotation.id,
    id: quotation.id,
    quotationNumber: quotation.quotation_number,
    dealerId: quotation.dealer_id,
    dealer: quotation.dealer
      ? {
          id: quotation.dealer.id,
          dealerCode: quotation.dealer.dealer_code,
          companyName: quotation.dealer.company_name,
          contactPerson: quotation.dealer.contact_person,
          email: quotation.dealer.email,
          phone: quotation.dealer.phone
        }
      : null,
    createdBy: quotation.created_by,
    createdByName: quotation.createdByUser?.name || null,
    approvedBy: quotation.approved_by,
    approvedByName: quotation.approvedByUser?.name || null,
    updatedBy: quotation.updated_by || null,
    updatedByName: quotation.updatedByUser?.name || null,
    subtotal: quotation.subtotal,
    discountAmount: quotation.discount_amount,
    taxAmount: quotation.tax_amount,
    shippingAmount: quotation.shipping_amount,
    grandTotal: quotation.grand_total,
    currencyCode: quotation.currency_code || "USD",
    taxPercentage: quotation.tax_percentage || 0,
    discountPercentage: quotation.discount_percentage || 0,
    validUntil: quotation.valid_until,
    terms: quotation.terms,
    internalNotes: quotation.internal_notes,
    dealerNotes: quotation.dealer_notes,
    status: quotation.status,
    sentAt: quotation.sent_at || null,
    acceptedAt: quotation.accepted_at || null,
    rejectedAt: quotation.rejected_at || null,
    cancelledAt: quotation.cancelled_at || null,
    convertedAt: quotation.converted_at || null,
    rejectionReason: quotation.rejection_reason || "",
    cancellationReason: quotation.cancellation_reason || "",
    version: quotation.version || 1,
    items: (quotation.quotation_items || []).map((item) => ({
      _id: item.id,
      id: item.id,
      productId: item.product_id,
      product: item.product
        ? {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            unitPrice: item.product.unit_price,
            dealerPrice: item.product.dealer_price,
            imageUrl: item.product.image_url || null,
            status: item.product.status || null,
            stockQuantity: item.product.stock_quantity ?? null,
            minimumStock: item.product.minimum_stock ?? null
          }
        : null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountAmount: item.discount_amount,
      taxAmount: item.tax_amount,
      lineTotal: item.line_total,
      productNameSnapshot: item.product_name_snapshot || item.product?.name || null,
      productSkuSnapshot: item.product_sku_snapshot || item.product?.sku || null,
      productDescriptionSnapshot: item.product_description_snapshot || null,
      brandNameSnapshot: item.brand_name_snapshot || null,
      categoryNameSnapshot: item.category_name_snapshot || null
    })),
    createdAt: quotation.created_at,
    updatedAt: quotation.updated_at
  };
};

const mapOrderWithItems = (order) => {
  if (!order) return null;

  return {
    _id: order.id,
    id: order.id,
    orderNumber: order.order_number,
    dealerId: order.dealer_id,
    sourceQuotationId: order.source_quotation_id,
    subtotal: order.subtotal,
    grandTotal: order.grand_total,
    status: order.status,
    items: (order.order_items || []).map((item) => ({
      _id: item.id,
      id: item.id,
      productId: item.product_id,
      product: item.product
        ? {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            unitPrice: item.product.unit_price,
            dealerPrice: item.product.dealer_price
          }
        : null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
};

module.exports = {
  supabase,
  unwrap,
  unwrapSingle,
  getActorId,
  mapUser,
  mapDealer,
  mapProduct,
  mapStockMovement,
  mapQuotationWithItems,
  mapOrderWithItems
};
