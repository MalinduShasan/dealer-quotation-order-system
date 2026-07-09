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
  if (!user) {
    return null;
  }

  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

const mapProduct = (product) => {
  if (!product) {
    return null;
  }

  return {
    _id: product.id,
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    dealer: product.dealer_id,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
};

const mapQuotationWithItems = (quotation) => {
  if (!quotation) {
    return null;
  }

  return {
    _id: quotation.id,
    id: quotation.id,
    customer: quotation.customer
      ? {
          _id: quotation.customer.id,
          id: quotation.customer.id,
          name: quotation.customer.name,
          email: quotation.customer.email
        }
      : quotation.customer_id,
    items: (quotation.quotation_items || []).map((item) => ({
      _id: item.id,
      id: item.id,
      product: item.product
        ? {
            _id: item.product.id,
            id: item.product.id,
            name: item.product.name,
            price: item.product.price
          }
        : item.product_id,
      quantity: item.quantity,
      price: item.price
    })),
    totalPrice: quotation.total_price,
    status: quotation.status,
    createdAt: quotation.created_at,
    updatedAt: quotation.updated_at
  };
};

const mapOrderWithItems = (order) => {
  if (!order) {
    return null;
  }

  return {
    _id: order.id,
    id: order.id,
    customer: order.customer_id,
    sourceQuotation: order.source_quotation_id,
    items: (order.order_items || []).map((item) => ({
      _id: item.id,
      id: item.id,
      product: item.product
        ? {
            _id: item.product.id,
            id: item.product.id,
            name: item.product.name,
            price: item.product.price
          }
        : item.product_id,
      quantity: item.quantity,
      price: item.price
    })),
    totalPrice: order.total_price,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
};

module.exports = {
  supabase,
  unwrap,
  unwrapSingle,
  mapUser,
  mapProduct,
  mapQuotationWithItems,
  mapOrderWithItems
};
