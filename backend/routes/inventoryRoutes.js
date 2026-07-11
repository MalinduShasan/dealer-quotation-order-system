const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { supabase, unwrapSingle, mapProduct, mapStockMovement, getActorId } = require("../lib/supabaseUtils");

const router = express.Router();

const viewerRoles = ["admin", "manager", "sales_executive"];
const writeRoles = ["admin", "manager"];
const sortableColumns = {
  name: "name",
  sku: "sku",
  stock_quantity: "stock_quantity",
  minimum_stock: "minimum_stock",
  unit_price: "unit_price",
  created_at: "created_at",
  updated_at: "updated_at"
};
const movementTypes = ["initial_stock", "restock", "adjustment_in", "adjustment_out", "sale", "return", "order_cancelled"];

const productSelect = `
  id,
  sku,
  name,
  description,
  image_url,
  image_path,
  category_id,
  brand_id,
  unit_price,
  dealer_price,
  stock_quantity,
  minimum_stock,
  status,
  created_by,
  updated_by,
  created_at,
  updated_at,
  category:categories(id, name, status),
  brand:brands(id, name, status)
`;

const movementSelect = `
  id,
  product_id,
  movement_type,
  quantity,
  previous_quantity,
  new_quantity,
  reference_type,
  reference_id,
  reason,
  created_by,
  created_at,
  product:products(id, sku, name, image_url, status),
  createdByUser:users(id, name, email)
`;

const normalizeText = (value = "") => value.trim();

const buildProductQuery = ({ search, categoryId, brandId, condition }) => {
  let query = supabase.from("products").select(productSelect).is("deleted_at", null);

  if (search) {
    query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (brandId && brandId !== "all") {
    query = query.eq("brand_id", brandId);
  }

  if (condition === "out_of_stock") {
    query = query.eq("status", "out_of_stock");
  }

  return query;
};

const fetchLastMovementMap = async (productIds) => {
  if (!productIds.length) return {};

  const { data, error } = await supabase
    .from("stock_movements")
    .select("product_id, movement_type, new_quantity, created_at")
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).reduce((acc, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = {
        movementType: item.movement_type,
        newQuantity: item.new_quantity,
        createdAt: item.created_at
      };
    }
    return acc;
  }, {});
};

const enrichProducts = async (products) => {
  const mapped = (products || []).map(mapProduct);
  const lastMovementMap = await fetchLastMovementMap(mapped.map((item) => item.id));

  return mapped.map((product) => ({
    ...product,
    lastMovement: lastMovementMap[product.id] || null,
    stockHealth:
      product.status === "out_of_stock" || Number(product.stockQuantity) === 0
        ? "out_of_stock"
        : Number(product.stockQuantity) <= Number(product.minimumStock)
          ? "low_stock"
          : "healthy"
  }));
};

const buildSummary = (products) => {
  const summary = {
    totalProducts: products.length,
    totalUnitsInStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    inventoryValue: 0
  };

  products.forEach((product) => {
    const stock = Number(product.stockQuantity) || 0;
    const minimum = Number(product.minimumStock) || 0;
    const unitPrice = Number(product.unitPrice) || 0;

    summary.totalUnitsInStock += stock;
    summary.inventoryValue += stock * unitPrice;

    if (product.status === "out_of_stock" || stock === 0) {
      summary.outOfStockProducts += 1;
    } else if (stock <= minimum) {
      summary.lowStockProducts += 1;
    }
  });

  return summary;
};

const validateMovementPayload = async ({ productId, quantity, reason, adjustmentType }) => {
  const normalizedReason = normalizeText(reason);
  const parsedQuantity = Number(quantity);

  if (!productId) {
    return { error: "Product is required" };
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return { error: "Quantity must be a positive integer" };
  }

  if (!normalizedReason) {
    return { error: "Reason is required" };
  }

  if (adjustmentType && !["increase", "decrease"].includes(adjustmentType)) {
    return { error: "Invalid adjustment type" };
  }

  const product = await unwrapSingle(
    supabase
      .from("products")
      .select(productSelect)
      .eq("id", productId)
      .is("deleted_at", null)
      .maybeSingle()
  );

  if (!product) {
    return { error: "Product not found" };
  }

  return {
    product,
    quantity: parsedQuantity,
    reason: normalizedReason
  };
};

router.get("/", protect, allowRoles(...viewerRoles), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = normalizeText(req.query.search || "");
    const categoryId = req.query.categoryId || "all";
    const brandId = req.query.brandId || "all";
    const condition = req.query.condition || "all";
    const sortBy = sortableColumns[req.query.sortBy] ? req.query.sortBy : "updated_at";
    const ascending = req.query.sortOrder === "asc";

    const { data, error } = await buildProductQuery({ search, categoryId, brandId, condition }).order(sortableColumns[sortBy], {
      ascending
    });

    if (error) {
      throw new Error(error.message);
    }

    const summaryProducts = await enrichProducts(data || []);
    let filteredItems = [...summaryProducts];

    if (condition === "low_stock") {
      filteredItems = filteredItems.filter((item) => item.stockHealth === "low_stock");
    }

    if (condition === "healthy") {
      filteredItems = filteredItems.filter((item) => item.stockHealth === "healthy");
    }

    const total = filteredItems.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * limit;
    const items = filteredItems.slice(from, from + limit);

    res.json({
      items,
      summary: buildSummary(summaryProducts),
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/low-stock", protect, allowRoles(...viewerRoles), async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const { data, error } = await supabase
      .from("products")
      .select(productSelect)
      .is("deleted_at", null)
      .gt("stock_quantity", 0)
      .order("stock_quantity", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const items = (await enrichProducts(data || [])).filter((item) => item.stockHealth === "low_stock");
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/movements", protect, allowRoles(...viewerRoles), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = normalizeText(req.query.search || "");
    const movementType = req.query.movementType || "all";
    const productId = req.query.productId || "all";

    let query = supabase.from("stock_movements").select(movementSelect, { count: "exact" });

    if (movementType !== "all") {
      if (!movementTypes.includes(movementType)) {
        return res.status(400).json({ message: "Invalid movement type filter" });
      }
      query = query.eq("movement_type", movementType);
    }

    if (productId !== "all") {
      query = query.eq("product_id", productId);
    }

    if (search) {
      const { data: matchedProducts, error: productError } = await supabase
        .from("products")
        .select("id")
        .is("deleted_at", null)
        .or(`sku.ilike.%${search}%,name.ilike.%${search}%`);

      if (productError) {
        throw new Error(productError.message);
      }

      const productIds = (matchedProducts || []).map((item) => item.id);
      if (!productIds.length) {
        return res.json({
          items: [],
          pagination: { page, limit, total: 0, totalPages: 1 }
        });
      }

      query = query.in("product_id", productIds);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      items: (data || []).map(mapStockMovement),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(Math.ceil((count || 0) / limit), 1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/products/:productId/movements", protect, allowRoles(...viewerRoles), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const product = await unwrapSingle(
      supabase.from("products").select("id").eq("id", req.params.productId).is("deleted_at", null).maybeSingle()
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { data, error, count } = await supabase
      .from("stock_movements")
      .select(movementSelect, { count: "exact" })
      .eq("product_id", req.params.productId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      items: (data || []).map(mapStockMovement),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(Math.ceil((count || 0) / limit), 1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/restock", protect, allowRoles(...writeRoles), async (req, res) => {
  try {
    const validation = await validateMovementPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { product, quantity, reason } = validation;
    const { error } = await supabase.rpc("apply_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "restock",
      p_quantity: quantity,
      p_reason: reason,
      p_created_by: getActorId(req.user),
      p_reference_type: req.body.referenceType || null,
      p_reference_id: req.body.referenceId || null
    });

    if (error) {
      throw new Error(error.message);
    }

    const updatedProduct = await unwrapSingle(
      supabase.from("products").select(productSelect).eq("id", product.id).is("deleted_at", null).single()
    );

    res.status(201).json({
      message: "Stock restocked successfully",
      product: mapProduct(updatedProduct)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/adjustment", protect, allowRoles(...writeRoles), async (req, res) => {
  try {
    const validation = await validateMovementPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { product, quantity, reason } = validation;
    const movementType = req.body.adjustmentType === "decrease" ? "adjustment_out" : "adjustment_in";

    const { error } = await supabase.rpc("apply_stock_movement", {
      p_product_id: product.id,
      p_movement_type: movementType,
      p_quantity: quantity,
      p_reason: reason,
      p_created_by: getActorId(req.user),
      p_reference_type: req.body.referenceType || null,
      p_reference_id: req.body.referenceId || null
    });

    if (error) {
      throw new Error(error.message);
    }

    const updatedProduct = await unwrapSingle(
      supabase.from("products").select(productSelect).eq("id", product.id).is("deleted_at", null).single()
    );

    res.status(201).json({
      message: "Stock adjusted successfully",
      product: mapProduct(updatedProduct)
    });
  } catch (error) {
    const statusCode = error.message === "Stock cannot become negative" ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

module.exports = router;
