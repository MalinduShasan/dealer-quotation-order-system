const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { supabase, unwrap, unwrapSingle, mapProduct } = require("../lib/supabaseUtils");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const products = await unwrap(
      supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          brand:brands(id, name)
        `)
        .order("created_at", { ascending: false })
    );

    res.json(products.map(mapProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, allowRoles("admin", "manager"), async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category_id,
      brand_id,
      unit_price,
      dealer_price,
      stock_quantity,
      minimum_stock,
      status
    } = req.body;

    if (!sku?.trim() || !name?.trim()) {
      return res.status(400).json({ message: "SKU and product name are required" });
    }

    if (unit_price === undefined || dealer_price === undefined) {
      return res.status(400).json({ message: "Unit price and dealer price are required" });
    }

    const product = await unwrapSingle(
      supabase
        .from("products")
        .insert({
          sku: sku.trim(),
          name: name.trim(),
          description: description?.trim() || "",
          category_id: category_id || null,
          brand_id: brand_id || null,
          unit_price: Number(unit_price),
          dealer_price: Number(dealer_price),
          stock_quantity: Number(stock_quantity ?? 0),
          minimum_stock: Number(minimum_stock ?? 0),
          status: status || "active"
        })
        .select("*")
        .single()
    );

    res.status(201).json(mapProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const product = await unwrapSingle(
      supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name),
          brand:brands(id, name)
        `)
        .eq("id", req.params.id)
        .maybeSingle()
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(mapProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles("admin", "manager"), async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category_id,
      brand_id,
      unit_price,
      dealer_price,
      stock_quantity,
      minimum_stock,
      status
    } = req.body;

    const updatedProduct = await unwrapSingle(
      supabase
        .from("products")
        .update({
          sku: sku?.trim(),
          name: name?.trim(),
          description: description?.trim() || "",
          category_id: category_id || null,
          brand_id: brand_id || null,
          unit_price: Number(unit_price),
          dealer_price: Number(dealer_price),
          stock_quantity: Number(stock_quantity ?? 0),
          minimum_stock: Number(minimum_stock ?? 0),
          status: status || "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", req.params.id)
        .select("*")
        .single()
    );

    res.json(mapProduct(updatedProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    await unwrap(
      supabase.from("products").delete().eq("id", req.params.id)
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;