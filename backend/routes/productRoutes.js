const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { supabase, unwrap, unwrapSingle, mapProduct } = require("../lib/supabaseUtils");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await unwrap(
      supabase.from("products").select("*").order("created_at", { ascending: false })
    );

    res.json(products.map(mapProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    if (!["dealer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Dealer or admin access only" });
    }

    const { name, description, price, stock } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName || price === undefined) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    if (Number(price) < 0 || Number(stock ?? 0) < 0) {
      return res.status(400).json({ message: "Price and stock must be non-negative" });
    }

    const product = await unwrapSingle(
      supabase
        .from("products")
        .insert({
          name: trimmedName,
          description: description?.trim() || "",
          price: Number(price),
          stock: Number(stock ?? 0),
          dealer_id: req.user._id
        })
        .select("*")
        .single()
    );

    res.status(201).json(mapProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await unwrapSingle(
      supabase.from("products").select("*").eq("id", req.params.id).maybeSingle()
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(mapProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
