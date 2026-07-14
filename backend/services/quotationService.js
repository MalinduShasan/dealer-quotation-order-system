const { supabase, unwrap, unwrapSingle, getActorId, mapQuotationWithItems } = require("../lib/supabaseUtils");
const {
  canApproveQuotation,
  canDealerRespond,
  canEditQuotation,
  canViewQuotation,
  isValidStatusTransition
} = require("../utils/quotationPermissions");
const { QUOTATION_APPROVAL_DISCOUNT_THRESHOLD } = require("../validators/quotationValidator");

const quotationSelect = `
  id,
  quotation_number,
  dealer_id,
  created_by,
  approved_by,
  subtotal,
  discount_amount,
  tax_amount,
  shipping_amount,
  grand_total,
  valid_until,
  terms,
  internal_notes,
  dealer_notes,
  status,
  currency_code,
  tax_percentage,
  discount_percentage,
  sent_at,
  accepted_at,
  rejected_at,
  cancelled_at,
  converted_at,
  rejection_reason,
  cancellation_reason,
  version,
  created_at,
  updated_at,
  updated_by,
  createdByUser:users!quotations_created_by_fkey(id, name, email),
  approvedByUser:users!quotations_approved_by_fkey(id, name, email),
  updatedByUser:users!quotations_updated_by_fkey(id, name, email),
  dealer:dealers(id, dealer_code, company_name, contact_person, email, phone),
  quotation_items(
    id,
    quantity,
    unit_price,
    discount_amount,
    tax_amount,
    line_total,
    product_id,
    product_name_snapshot,
    product_sku_snapshot,
    product_description_snapshot,
    brand_name_snapshot,
    category_name_snapshot,
    product:products(id, sku, name, dealer_price, unit_price, image_url, status, stock_quantity, minimum_stock)
  )
`;

const historySelect = `
  id,
  quotation_id,
  old_status,
  new_status,
  changed_by,
  note,
  created_at,
  changedByUser:users!quotation_status_history_changed_by_fkey(id, name, email)
`;

const roundCurrency = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const normalizeSearch = (value) => value?.trim() || "";

const getDealerForUser = async (userId) =>
  unwrapSingle(supabase.from("dealers").select("id").eq("user_id", userId).maybeSingle());

const getQuotationByIdRaw = async (quotationId) =>
  unwrapSingle(supabase.from("quotations").select(quotationSelect).eq("id", quotationId).single());

const getQuotationWithAccess = async (quotationId, user) => {
  const quotation = await getQuotationByIdRaw(quotationId);
  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  const dealer = user.role === "dealer" ? await getDealerForUser(getActorId(user)) : null;
  if (!canViewQuotation(user, quotation, dealer?.id || null)) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  return quotation;
};

const resolveTrustedPricing = (product, item, userRole) => {
  const requestedPrice = item.unit_price !== undefined ? Number(item.unit_price) : null;

  if (["admin", "manager"].includes(userRole) && requestedPrice !== null && requestedPrice >= 0) {
    return roundCurrency(requestedPrice);
  }

  return roundCurrency(product.dealer_price ?? product.unit_price ?? 0);
};

const fetchProductsForQuotation = async (items) => {
  const productIds = [...new Set(items.map((item) => item.product_id))];
  const products = await unwrap(
    supabase
      .from("products")
      .select(`
        id,
        sku,
        name,
        description,
        dealer_price,
        unit_price,
        stock_quantity,
        minimum_stock,
        status,
        deleted_at,
        brand:brands(name),
        category:categories(name)
      `)
      .in("id", productIds)
  );

  return new Map(products.map((product) => [product.id, product]));
};

const buildItemSnapshotsAndTotals = ({ items, productMap, userRole }) => {
  let subtotal = 0;
  const quotationItems = items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product || product.deleted_at) {
      const error = new Error("One or more products no longer exist");
      error.statusCode = 404;
      throw error;
    }

    if (product.status === "inactive" || product.status === "out_of_stock" || Number(product.stock_quantity) <= 0) {
      const error = new Error(`${product.name} is unavailable for quotation`);
      error.statusCode = 409;
      throw error;
    }

    if (Number(item.quantity) > Number(product.stock_quantity)) {
      const error = new Error(`${product.name} exceeds current stock`);
      error.statusCode = 409;
      throw error;
    }

    const quantity = Number(item.quantity);
    const unitPrice = resolveTrustedPricing(product, item, userRole);
    const discountAmount = roundCurrency(item.discount_amount || 0);
    const taxAmount = roundCurrency(item.tax_amount || 0);
    const baseAmount = roundCurrency(quantity * unitPrice);
    const lineTotal = roundCurrency(baseAmount - discountAmount + taxAmount);

    if (lineTotal < 0) {
      const error = new Error(`${product.name} line total cannot be negative`);
      error.statusCode = 422;
      throw error;
    }

    subtotal = roundCurrency(subtotal + baseAmount);

    return {
      product_id: product.id,
      quantity,
      unit_price: unitPrice,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      line_total: lineTotal,
      product_name_snapshot: product.name,
      product_sku_snapshot: product.sku,
      product_description_snapshot: product.description,
      brand_name_snapshot: product.brand?.name || null,
      category_name_snapshot: product.category?.name || null
    };
  });

  return { quotationItems, subtotal: roundCurrency(subtotal) };
};

const determineInitialStatus = (payload, userRole) => {
  if (payload.status === "draft") return "draft";
  if (userRole === "admin") return payload.status === "pending_approval" ? "pending_approval" : "approved";
  const discountPercentage = Number(payload.discount_percentage || 0);
  return discountPercentage > QUOTATION_APPROVAL_DISCOUNT_THRESHOLD ? "pending_approval" : "approved";
};

const listQuotations = async (user, params = {}) => {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(Math.max(Number(params.limit) || 10, 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const actorId = getActorId(user);
  const dealer = user.role === "dealer" ? await getDealerForUser(actorId) : null;

  let query = supabase.from("quotations").select(quotationSelect, { count: "exact" });

  if (user.role === "sales_executive") {
    query = query.eq("created_by", actorId);
  }

  if (user.role === "dealer") {
    if (!dealer) {
      return { items: [], summary: {}, pagination: { page, limit, total: 0, totalPages: 1 } };
    }
    query = query.eq("dealer_id", dealer.id);
  }

  const search = normalizeSearch(params.search);
  if (search) {
    query = query.or(`quotation_number.ilike.%${search}%,dealer.company_name.ilike.%${search}%`);
  }

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.dealer_id && user.role !== "dealer") query = query.eq("dealer_id", params.dealer_id);
  if (params.created_by && ["admin", "manager"].includes(user.role)) query = query.eq("created_by", params.created_by);
  if (params.date_from) query = query.gte("created_at", params.date_from);
  if (params.date_to) query = query.lte("created_at", params.date_to);

  if (params.validity === "active") query = query.gte("valid_until", new Date().toISOString().slice(0, 10));
  if (params.validity === "expired") query = query.lt("valid_until", new Date().toISOString().slice(0, 10));
  if (params.validity === "expiring_soon") {
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 7);
    query = query.gte("valid_until", today.toISOString().slice(0, 10)).lte("valid_until", soon.toISOString().slice(0, 10));
  }

  const sortByMap = {
    created_at: "created_at",
    valid_until: "valid_until",
    grand_total: "grand_total",
    quotation_number: "quotation_number",
    status: "status"
  };

  const sortBy = sortByMap[params.sort_by] || "created_at";
  const ascending = params.sort_order === "asc";

  const { data, count, error } = await query.order(sortBy, { ascending }).range(from, to);
  if (error) throw new Error(error.message);

  const items = (data || []).map(mapQuotationWithItems);
  const expiringSoon = items.filter((item) => {
    if (!item.validUntil) return false;
    const validUntil = new Date(item.validUntil);
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 7);
    return validUntil >= now && validUntil <= soon;
  }).length;

  const summary = {
    total: count || 0,
    draft: items.filter((item) => item.status === "draft").length,
    pendingApproval: items.filter((item) => item.status === "pending_approval").length,
    approved: items.filter((item) => item.status === "approved").length,
    sent: items.filter((item) => item.status === "sent").length,
    accepted: items.filter((item) => item.status === "accepted").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    expiringSoon,
    estimatedValue: roundCurrency(items.reduce((sum, item) => sum + Number(item.grandTotal || 0), 0))
  };

  return {
    items,
    summary,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.max(Math.ceil((count || 0) / limit), 1)
    }
  };
};

const getQuotationById = async (user, quotationId) => mapQuotationWithItems(await getQuotationWithAccess(quotationId, user));

const createQuotation = async (user, payload) => {
  const actorId = getActorId(user);
  const productMap = await fetchProductsForQuotation(payload.items);
  const { quotationItems, subtotal } = buildItemSnapshotsAndTotals({
    items: payload.items,
    productMap,
    userRole: user.role
  });

  const discountAmount = roundCurrency(payload.discount_amount || 0);
  const taxAmount = roundCurrency(payload.tax_amount || 0);
  const shippingAmount = roundCurrency(payload.shipping_amount || 0);
  const grandTotal = roundCurrency(subtotal - discountAmount + taxAmount + shippingAmount);
  const status = determineInitialStatus(payload, user.role);

  const rpcItems = quotationItems.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    tax_amount: item.tax_amount
  }));

  const created = await unwrap(
    supabase.rpc("create_quotation_with_items", {
      p_dealer_id: payload.dealer_id,
      p_created_by: actorId,
      p_discount_amount: discountAmount,
      p_tax_amount: taxAmount,
      p_shipping_amount: shippingAmount,
      p_valid_until: payload.valid_until || null,
      p_terms: payload.terms || "",
      p_internal_notes: payload.internal_notes || "",
      p_dealer_notes: payload.dealer_notes || "",
      p_status: status,
      p_currency_code: payload.currency_code || "USD",
      p_tax_percentage: Number(payload.tax_percentage || 0),
      p_discount_percentage: Number(payload.discount_percentage || 0),
      p_items: rpcItems
    })
  );

  const createdId = created?.[0]?.quotation_id;
  if (!createdId) {
    const error = new Error("Unable to create quotation");
    error.statusCode = 500;
    throw error;
  }

  const quotation = await getQuotationByIdRaw(createdId);
  if (!quotation) {
    const error = new Error("Quotation created but could not be loaded");
    error.statusCode = 500;
    throw error;
  }

  if (roundCurrency(quotation.grand_total) !== grandTotal) {
    const error = new Error("Server total verification failed");
    error.statusCode = 422;
    throw error;
  }

  return mapQuotationWithItems(quotation);
};

const updateQuotation = async (user, quotationId, payload) => {
  const actorId = getActorId(user);
  const existing = await getQuotationWithAccess(quotationId, user);

  if (!canEditQuotation(user, existing)) {
    const error = new Error("Quotation cannot be edited in its current state");
    error.statusCode = 409;
    throw error;
  }

  const productMap = await fetchProductsForQuotation(payload.items);
  const { quotationItems, subtotal } = buildItemSnapshotsAndTotals({
    items: payload.items,
    productMap,
    userRole: user.role
  });

  const discountAmount = roundCurrency(payload.discount_amount || 0);
  const taxAmount = roundCurrency(payload.tax_amount || 0);
  const shippingAmount = roundCurrency(payload.shipping_amount || 0);
  const grandTotal = roundCurrency(subtotal - discountAmount + taxAmount + shippingAmount);

  const nextStatus =
    user.role === "sales_executive" && Number(payload.discount_percentage || 0) > QUOTATION_APPROVAL_DISCOUNT_THRESHOLD
      ? "pending_approval"
      : payload.status || existing.status;

  const updatedQuotation = await unwrapSingle(
    supabase
      .from("quotations")
      .update({
        dealer_id: payload.dealer_id,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        grand_total: grandTotal,
        valid_until: payload.valid_until || null,
        terms: payload.terms || "",
        internal_notes: payload.internal_notes || "",
        dealer_notes: payload.dealer_notes || "",
        status: nextStatus,
        currency_code: payload.currency_code || existing.currency_code || "USD",
        tax_percentage: Number(payload.tax_percentage || 0),
        discount_percentage: Number(payload.discount_percentage || 0),
        updated_by: actorId,
        version: Number(existing.version || 1) + 1
      })
      .eq("id", quotationId)
      .select("id")
      .single()
  );

  await unwrap(supabase.from("quotation_items").delete().eq("quotation_id", quotationId));
  await unwrap(
    supabase.from("quotation_items").insert(
      quotationItems.map((item) => ({
        quotation_id: quotationId,
        ...item
      }))
    )
  );

  if (existing.status !== nextStatus) {
    await unwrap(
      supabase.from("quotation_status_history").insert({
        quotation_id: quotationId,
        old_status: existing.status,
        new_status: nextStatus,
        changed_by: actorId,
        note: "Quotation updated"
      })
    );
  }

  return mapQuotationWithItems(await getQuotationByIdRaw(updatedQuotation.id));
};

const statusTimestampFields = {
  sent: "sent_at",
  accepted: "accepted_at",
  rejected: "rejected_at",
  cancelled: "cancelled_at",
  converted: "converted_at"
};

const transitionQuotationStatus = async (user, quotationId, nextStatus, note = "", metadata = {}) => {
  const actorId = getActorId(user);
  const existing = await getQuotationWithAccess(quotationId, user);

  if (!isValidStatusTransition(existing.status, nextStatus)) {
    const error = new Error(`Quotation cannot move from ${existing.status} to ${nextStatus}`);
    error.statusCode = 409;
    throw error;
  }

  if (["approved", "rejected"].includes(nextStatus) && !canApproveQuotation(user)) {
    const error = new Error("Only admin or manager can approve or reject quotations");
    error.statusCode = 403;
    throw error;
  }

  if (["accepted", "rejected"].includes(nextStatus) && user.role === "dealer" && !canDealerRespond(user, existing)) {
    const error = new Error("Dealer can only respond to sent quotations");
    error.statusCode = 403;
    throw error;
  }

  if (["rejected", "cancelled"].includes(nextStatus) && !note.trim()) {
    const error = new Error("A reason is required for this action");
    error.statusCode = 422;
    throw error;
  }

  const updatePayload = {
    status: nextStatus,
    updated_by: actorId,
    version: Number(existing.version || 1) + 1
  };

  if (statusTimestampFields[nextStatus]) {
    updatePayload[statusTimestampFields[nextStatus]] = new Date().toISOString();
  }

  if (nextStatus === "approved") {
    updatePayload.approved_by = actorId;
  }

  if (nextStatus === "rejected") {
    updatePayload.rejection_reason = note.trim();
  }

  if (nextStatus === "cancelled") {
    updatePayload.cancellation_reason = note.trim();
  }

  await unwrapSingle(supabase.from("quotations").update(updatePayload).eq("id", quotationId).select("id").single());

  await unwrap(
    supabase.from("quotation_status_history").insert({
      quotation_id: quotationId,
      old_status: existing.status,
      new_status: nextStatus,
      changed_by: actorId,
      note: note.trim() || metadata.defaultNote || ""
    })
  );

  return mapQuotationWithItems(await getQuotationByIdRaw(quotationId));
};

const duplicateQuotation = async (user, quotationId) => {
  const existing = await getQuotationWithAccess(quotationId, user);
  return createQuotation(user, {
    dealer_id: existing.dealerId,
    items: existing.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_amount: item.discountAmount,
      tax_amount: item.taxAmount
    })),
    discount_amount: existing.discountAmount,
    tax_amount: existing.taxAmount,
    shipping_amount: existing.shippingAmount,
    valid_until: existing.validUntil,
    terms: existing.terms,
    internal_notes: existing.internalNotes,
    dealer_notes: existing.dealerNotes,
    status: "draft",
    currency_code: existing.currencyCode || "USD",
    discount_percentage: existing.discountPercentage || 0,
    tax_percentage: existing.taxPercentage || 0
  });
};

const getQuotationHistory = async (user, quotationId) => {
  await getQuotationWithAccess(quotationId, user);
  const items = await unwrap(
    supabase.from("quotation_status_history").select(historySelect).eq("quotation_id", quotationId).order("created_at", { ascending: false })
  );

  return items.map((item) => ({
    id: item.id,
    quotationId: item.quotation_id,
    oldStatus: item.old_status,
    newStatus: item.new_status,
    changedBy: item.changed_by,
    changedByName: item.changedByUser?.name || null,
    note: item.note || "",
    createdAt: item.created_at
  }));
};

module.exports = {
  listQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  transitionQuotationStatus,
  duplicateQuotation,
  getQuotationHistory
};
