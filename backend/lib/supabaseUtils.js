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
    categoryId: product.category_id,
    category: product.category || null,
    brandId: product.brand_id,
    brand: product.brand || null,
    unitPrice: product.unit_price,
    dealerPrice: product.dealer_price,
    stockQuantity: product.stock_quantity,
    minimumStock: product.minimum_stock,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at
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
    approvedBy: quotation.approved_by,
    subtotal: quotation.subtotal,
    discountAmount: quotation.discount_amount,
    taxAmount: quotation.tax_amount,
    shippingAmount: quotation.shipping_amount,
    grandTotal: quotation.grand_total,
    validUntil: quotation.valid_until,
    terms: quotation.terms,
    internalNotes: quotation.internal_notes,
    dealerNotes: quotation.dealer_notes,
    status: quotation.status,
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
            dealerPrice: item.product.dealer_price
          }
        : null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountAmount: item.discount_amount,
      taxAmount: item.tax_amount,
      lineTotal: item.line_total
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
  mapUser,
  mapDealer,
  mapProduct,
  mapQuotationWithItems,
  mapOrderWithItems
};