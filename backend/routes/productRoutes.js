const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { productImageUpload } = require("../middleware/uploadMiddleware");
const { supabase, unwrapSingle, mapProduct, getActorId } = require("../lib/supabaseUtils");

const router = express.Router();

const PRODUCT_IMAGE_BUCKET = "product-images";
const allowedStatuses = ["active", "inactive", "low_stock", "out_of_stock"];
const managerWriteRoles = ["admin", "manager"];
const viewerRoles = ["admin", "manager", "sales_executive", "dealer"];
const sortableColumns = {
  name: "name",
  unit_price: "unit_price",
  dealer_price: "dealer_price",
  stock_quantity: "stock_quantity",
  created_at: "created_at"
};

const normalizeText = (value = "") => value.trim();
const sanitizeFilename = (filename = "product-image") =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product-image";

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
  createdByUser:users!products_created_by_fkey(id, name, email),
  updatedByUser:users!products_updated_by_fkey(id, name, email),
  category:categories(id, name, status),
  brand:brands(id, name, status)
`;

const getProductById = async (productId) =>
  unwrapSingle(
    supabase
      .from("products")
      .select(productSelect)
      .eq("id", productId)
      .is("deleted_at", null)
      .maybeSingle()
  );

const getLookupRecord = async (table, id) => {
  if (!id) return null;
  return unwrapSingle(supabase.from(table).select("id, name, status").eq("id", id).is("deleted_at", null).maybeSingle());
};

const hasProductTransactionHistory = async (productId) => {
  const [quotationItem, orderItem, stockMovement] = await Promise.all([
    unwrapSingle(supabase.from("quotation_items").select("id").eq("product_id", productId).limit(1).maybeSingle()),
    unwrapSingle(supabase.from("order_items").select("id").eq("product_id", productId).limit(1).maybeSingle()),
    unwrapSingle(supabase.from("stock_movements").select("id").eq("product_id", productId).limit(1).maybeSingle())
  ]);

  return Boolean(quotationItem || orderItem || stockMovement);
};

const attachTransactionHistoryFlag = async (product) => {
  if (!product) return null;

  return {
    ...product,
    hasTransactionHistory: await hasProductTransactionHistory(product.id)
  };
};

const removeStorageObject = async (imagePath) => {
  if (!imagePath) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
  if (error) {
    throw new Error(error.message);
  }
};

const uploadImageToStorage = async (productId, file) => {
  const timestamp = Date.now();
  const safeName = sanitizeFilename(file.originalname);
  const imagePath = `${productId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(imagePath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(imagePath);
  return {
    imagePath,
    imageUrl: data?.publicUrl || null
  };
};

const validateProductPayload = async (
  payload,
  existingId = null,
  { allowInactiveLookups = false, allowStockEdit = !existingId, currentStockQuantity = 0 } = {}
) => {
  const sku = normalizeText(payload.sku);
  const name = normalizeText(payload.name);
  const description = normalizeText(payload.description);
  const categoryId = payload.categoryId || payload.category_id || null;
  const brandId = payload.brandId || payload.brand_id || null;
  const unitPrice = Number(payload.unitPrice ?? payload.unit_price);
  const dealerPrice = Number(payload.dealerPrice ?? payload.dealer_price);
  const stockQuantity = Number(payload.stockQuantity ?? payload.stock_quantity ?? 0);
  const minimumStock = Number(payload.minimumStock ?? payload.minimum_stock ?? 0);
  let status = payload.status || "active";
  const errors = [];

  if (!sku) {
    errors.push("SKU is required");
  } else {
    if (sku.length > 100) {
      errors.push("SKU must be at most 100 characters");
    }

    let duplicateQuery = supabase.from("products").select("id, sku").ilike("sku", sku).is("deleted_at", null).maybeSingle();
    if (existingId) {
      duplicateQuery = duplicateQuery.neq("id", existingId);
    }

    const duplicateProduct = await unwrapSingle(duplicateQuery);
    if (duplicateProduct && normalizeText(duplicateProduct.sku).toLowerCase() === sku.toLowerCase()) {
      errors.push("SKU already exists");
    }
  }

  if (!name) {
    errors.push("Product name is required");
  } else if (name.length > 255) {
    errors.push("Product name must be at most 255 characters");
  }

  if (!categoryId) {
    errors.push("Category is required");
  }

  if (!brandId) {
    errors.push("Brand is required");
  }

  if (description.length > 1000) {
    errors.push("Description must be at most 1000 characters");
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    errors.push("Unit price must be 0 or greater");
  }

  if (!Number.isFinite(dealerPrice) || dealerPrice < 0) {
    errors.push("Dealer price must be 0 or greater");
  }

  if (allowStockEdit && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
    errors.push("Stock quantity must be 0 or greater");
  }

  if (!Number.isFinite(minimumStock) || minimumStock < 0) {
    errors.push("Minimum stock must be 0 or greater");
  }

  if (!allowedStatuses.includes(status)) {
    errors.push("Invalid product status");
  }

  const effectiveStockQuantity = allowStockEdit ? stockQuantity : Number(currentStockQuantity ?? 0);

  if (status !== "inactive") {
    if (effectiveStockQuantity === 0) {
      status = "out_of_stock";
    } else if (effectiveStockQuantity <= minimumStock) {
      status = "low_stock";
    } else {
      status = "active";
    }
  }

  const [category, brand] = await Promise.all([getLookupRecord("categories", categoryId), getLookupRecord("brands", brandId)]);

  if (!category) {
    errors.push("Selected category was not found");
  } else if (!allowInactiveLookups && category.status !== "active") {
    errors.push("Selected category must be active");
  }

  if (!brand) {
    errors.push("Selected brand was not found");
  } else if (!allowInactiveLookups && brand.status !== "active") {
    errors.push("Selected brand must be active");
  }

  return {
    errors,
    values: {
      sku,
      name,
      description,
      category_id: categoryId,
      brand_id: brandId,
      unit_price: unitPrice,
      dealer_price: dealerPrice,
      stock_quantity: allowStockEdit ? stockQuantity : undefined,
      minimum_stock: minimumStock,
      status
    }
  };
};

router.get("/", protect, async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (!viewerRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = normalizeText(req.query.search || "");
    const status = req.query.status || "all";
    const categoryId = req.query.categoryId || "all";
    const brandId = req.query.brandId || "all";
    const lowStock = req.query.lowStock === "true";
    const sortBy = sortableColumns[req.query.sortBy] ? req.query.sortBy : "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? true : false;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("products").select(productSelect, { count: "exact" }).is("deleted_at", null);

    if (search) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (userRole === "dealer") {
      query = query.in("status", ["active", "low_stock"]);
    } else if (status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query = query.eq("status", status);
    }

    if (categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    }

    if (brandId !== "all") {
      query = query.eq("brand_id", brandId);
    }

    if (lowStock) {
      query = query.lte("stock_quantity", Number(req.query.lowStockThreshold || Number.MAX_SAFE_INTEGER));
    }

    const { data, error, count } = await query.order(sortableColumns[sortBy], { ascending: sortOrder }).range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const itemsWithHistory = await Promise.all((data || []).map(attachTransactionHistoryFlag));
    const mappedItems = itemsWithHistory.map(mapProduct).filter((item) => {
      if (!lowStock) return true;
      return item.stockQuantity <= item.minimumStock;
    });

    res.json({
      items: mappedItems,
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

router.get("/:id", protect, async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (!viewerRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (userRole === "dealer" && !["active", "low_stock"].includes(product.status)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(mapProduct(await attachTransactionHistoryFlag(product)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, allowRoles(...managerWriteRoles), async (req, res) => {
  try {
    const { errors, values } = await validateProductPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const actorId = getActorId(req.user);
    const { data: productId, error } = await supabase.rpc("create_product_with_initial_stock", {
      p_sku: values.sku,
      p_name: values.name,
      p_description: values.description,
      p_category_id: values.category_id,
      p_brand_id: values.brand_id,
      p_unit_price: values.unit_price,
      p_dealer_price: values.dealer_price,
      p_minimum_stock: values.minimum_stock,
      p_status: values.status,
      p_initial_stock: values.stock_quantity ?? 0,
      p_created_by: actorId
    });

    if (error) {
      throw new Error(error.message);
    }

    const createdProduct = await unwrapSingle(
      supabase.from("products").select(productSelect).eq("id", productId).is("deleted_at", null).single()
    );

    res.status(201).json(mapProduct(await attachTransactionHistoryFlag(createdProduct)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles(...managerWriteRoles), async (req, res) => {
  try {
    const existingProduct = await getProductById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { errors, values } = await validateProductPayload(req.body, req.params.id, {
      allowInactiveLookups: true,
      allowStockEdit: false,
      currentStockQuantity: existingProduct.stock_quantity ?? existingProduct.stockQuantity ?? 0
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const submittedSku = normalizeText(req.body.sku);
    const currentSku = normalizeText(existingProduct.sku);

    if (submittedSku.toLowerCase() !== currentSku.toLowerCase()) {
      const hasTransactionHistory = await hasProductTransactionHistory(req.params.id);

      if (hasTransactionHistory) {
        return res.status(409).json({
          message: "SKU cannot be changed because this product has transaction history"
        });
      }
    }

    const updatedProduct = await unwrapSingle(
      supabase
        .from("products")
        .update({
          sku: values.sku,
          name: values.name,
          description: values.description,
          category_id: values.category_id,
          brand_id: values.brand_id,
          unit_price: values.unit_price,
          dealer_price: values.dealer_price,
          minimum_stock: values.minimum_stock,
          status: values.status,
          image_url: existingProduct.image_url || existingProduct.imageUrl || null,
          image_path: existingProduct.image_path || existingProduct.imagePath || null,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select(productSelect)
        .single()
    );

    res.json(mapProduct(await attachTransactionHistoryFlag(updatedProduct)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, allowRoles(...managerWriteRoles), async (req, res) => {
  try {
    const existingProduct = await getProductById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    let { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid product status" });
    }

    if (status !== "inactive") {
      const currentStock = Number(existingProduct.stock_quantity ?? existingProduct.stockQuantity ?? 0);
      const minimumStock = Number(existingProduct.minimum_stock ?? existingProduct.minimumStock ?? 0);

      if (currentStock === 0) {
        status = "out_of_stock";
      } else if (currentStock <= minimumStock) {
        status = "low_stock";
      } else {
        status = "active";
      }
    }

    const updatedProduct = await unwrapSingle(
      supabase
        .from("products")
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select(productSelect)
        .single()
    );

    res.json(mapProduct(await attachTransactionHistoryFlag(updatedProduct)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/:id/image",
  protect,
  allowRoles(...managerWriteRoles),
  (req, res, next) => {
    productImageUpload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      return next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Product image file is required" });
      }

      const existingProduct = await getProductById(req.params.id);

      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const uploadedImage = await uploadImageToStorage(existingProduct.id, req.file);

      try {
        const updatedProduct = await unwrapSingle(
          supabase
            .from("products")
            .update({
              image_url: uploadedImage.imageUrl,
              image_path: uploadedImage.imagePath,
              updated_at: new Date().toISOString(),
              updated_by: getActorId(req.user)
            })
            .eq("id", req.params.id)
            .select(productSelect)
            .single()
        );

        if (existingProduct.image_path) {
          try {
            await removeStorageObject(existingProduct.image_path);
          } catch (storageError) {
            return res.status(500).json({
              message: `Image saved but previous image cleanup failed: ${storageError.message}`
            });
          }
        }

        return res.json(mapProduct(await attachTransactionHistoryFlag(updatedProduct)));
      } catch (dbError) {
        try {
          await removeStorageObject(uploadedImage.imagePath);
        } catch {
          // Best-effort cleanup only.
        }

        throw dbError;
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/:id/image", protect, allowRoles(...managerWriteRoles), async (req, res) => {
  try {
    const existingProduct = await getProductById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.image_path) {
      await removeStorageObject(existingProduct.image_path);
    }

    const updatedProduct = await unwrapSingle(
      supabase
        .from("products")
        .update({
          image_url: null,
          image_path: null,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select(productSelect)
        .single()
    );

    res.json(mapProduct(await attachTransactionHistoryFlag(updatedProduct)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
