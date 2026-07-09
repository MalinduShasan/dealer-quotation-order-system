const express = require("express");
const router = express.Router();
const { protect, customerOnly } = require("../middleware/authMiddleware");
const {
  supabase,
  unwrap,
  unwrapSingle,
  mapOrderWithItems
} = require("../lib/supabaseUtils");

const orderSelect = `
  id,
  customer_id,
  source_quotation_id,
  total_price,
  status,
  created_at,
  updated_at,
  order_items(
    id,
    quantity,
    price,
    product_id,
    product:products!order_items_product_id_fkey(id, name, price)
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
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: "Each item needs a product and quantity" });
      }

      const product = productMap.get(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      orderItems.push({
        product_id: product.id,
        quantity: Number(item.quantity),
        price: Number(product.price)
      });

      totalAmount += Number(product.price) * Number(item.quantity);
    }

    const order = await unwrapSingle(
      supabase
        .from("orders")
        .insert({
          customer_id: req.user._id,
          total_price: totalAmount,
          status: "ordered"
        })
        .select("id")
        .single()
    );

    await unwrap(
      supabase.from("order_items").insert(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item
        }))
      )
    );

    const createdOrder = await unwrapSingle(
      supabase.from("orders").select(orderSelect).eq("id", order.id).single()
    );

    res.status(201).json(mapOrderWithItems(createdOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/from-quotation/:id", protect, customerOnly, async (req, res) => {
  try {
    const quotation = await unwrapSingle(
      supabase
        .from("quotations")
        .select("id, customer_id, total_price, status, quotation_items(id, product_id, quantity, price)")
        .eq("id", req.params.id)
        .maybeSingle()
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.customer_id !== req.user._id) {
      return res.status(403).json({ message: "Not authorized for this quotation" });
    }

    if (quotation.status !== "approved") {
      return res.status(400).json({ message: "Quotation not approved yet" });
    }

    const existingOrder = await unwrapSingle(
      supabase.from("orders").select("id").eq("source_quotation_id", quotation.id).maybeSingle()
    );

    if (existingOrder) {
      return res.status(400).json({ message: "Order already created for this quotation" });
    }

    const order = await unwrapSingle(
      supabase
        .from("orders")
        .insert({
          customer_id: quotation.customer_id,
          source_quotation_id: quotation.id,
          total_price: quotation.total_price,
          status: "ordered"
        })
        .select("id")
        .single()
    );

    await unwrap(
      supabase.from("order_items").insert(
        quotation.quotation_items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      )
    );

    await unwrap(
      supabase.from("quotations").update({ status: "ordered" }).eq("id", quotation.id)
    );

    const createdOrder = await unwrapSingle(
      supabase.from("orders").select(orderSelect).eq("id", order.id).single()
    );

    res.status(201).json({
      message: "Order placed successfully",
      order: mapOrderWithItems(createdOrder)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    let query = supabase.from("orders").select(orderSelect).order("created_at", { ascending: false });

    if (req.user.role === "customer") {
      query = query.eq("customer_id", req.user._id);
    }

    const orders = await unwrap(query);
    res.json(orders.map(mapOrderWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
