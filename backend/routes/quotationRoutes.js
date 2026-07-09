const express = require("express");
const router = express.Router();
const { protect, customerOnly } = require("../middleware/authMiddleware");
const {
  supabase,
  unwrap,
  unwrapSingle,
  mapQuotationWithItems
} = require("../lib/supabaseUtils");

const quotationSelect = `
  id,
  customer_id,
  total_price,
  status,
  created_at,
  updated_at,
  customer:users!quotations_customer_id_fkey(id, name, email),
  quotation_items(
    id,
    quantity,
    price,
    product_id,
    product:products!quotation_items_product_id_fkey(id, name, price)
  )
`;

router.post("/", protect, customerOnly, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const productIds = items.map((item) => item.product);
    const products = await unwrap(
      supabase.from("products").select("id, price").in("id", productIds)
    );

    const productMap = new Map(products.map((product) => [product.id, product]));
    let total = 0;
    const quotationItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: "Each item needs a product and quantity" });
      }

      const product = productMap.get(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      total += Number(product.price) * Number(item.quantity);
      quotationItems.push({
        product_id: product.id,
        quantity: Number(item.quantity),
        price: Number(product.price)
      });
    }

    const quotation = await unwrapSingle(
      supabase
        .from("quotations")
        .insert({
          customer_id: req.user._id,
          total_price: total,
          status: "pending"
        })
        .select("id")
        .single()
    );

    await unwrap(
      supabase.from("quotation_items").insert(
        quotationItems.map((item) => ({
          quotation_id: quotation.id,
          ...item
        }))
      )
    );

    const createdQuotation = await unwrapSingle(
      supabase.from("quotations").select(quotationSelect).eq("id", quotation.id).single()
    );

    res.status(201).json(mapQuotationWithItems(createdQuotation));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, customerOnly, async (req, res) => {
  try {
    const quotations = await unwrap(
      supabase
        .from("quotations")
        .select(quotationSelect)
        .eq("customer_id", req.user._id)
        .order("created_at", { ascending: false })
    );

    res.json(quotations.map(mapQuotationWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
