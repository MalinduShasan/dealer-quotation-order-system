const express = require("express");
const router = express.Router();

const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  supabase,
  unwrap,
  unwrapSingle,
  mapOrderWithItems
} = require("../lib/supabaseUtils");

const orderSelect = `
  id,
  order_number,
  dealer_id,
  source_quotation_id,
  subtotal,
  grand_total,
  status,
  created_at,
  updated_at,
  order_items(
    id,
    quantity,
    unit_price,
    line_total,
    product_id,
    product:products(id, sku, name, unit_price, dealer_price)
  )
`;

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
};

router.post("/", protect, allowRoles("admin", "manager", "sales_executive"), async (req, res) => {
  try {
    const { dealer_id, items } = req.body;

    if (!dealer_id) {
      return res.status(400).json({ message: "Dealer is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    const productIds = items.map((item) => item.product_id);

    const products = await unwrap(
      supabase.from("products").select("id, unit_price, dealer_price").in("id", productIds)
    );

    const productMap = new Map(products.map((product) => [product.id, product]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || Number(item.quantity) < 1) {
        return res.status(400).json({ message: "Each item needs product_id and quantity" });
      }

      const product = productMap.get(item.product_id);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product_id}` });
      }

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price ?? product.dealer_price ?? product.unit_price);
      const lineTotal = quantity * unitPrice;

      subtotal += lineTotal;

      orderItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal
      });
    }

    const order = await unwrapSingle(
      supabase
        .from("orders")
        .insert({
          order_number: generateOrderNumber(),
          dealer_id,
          subtotal,
          grand_total: subtotal,
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

router.post(
  "/from-quotation/:id",
  protect,
  allowRoles("admin", "manager", "sales_executive", "dealer"),
  async (req, res) => {
    try {
      const quotation = await unwrapSingle(
        supabase
          .from("quotations")
          .select(`
            id,
            dealer_id,
            subtotal,
            grand_total,
            status,
            quotation_items(id, product_id, quantity, unit_price, line_total)
          `)
          .eq("id", req.params.id)
          .maybeSingle()
      );

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      if (!["accepted", "approved", "sent"].includes(quotation.status)) {
        return res.status(400).json({
          message: "Only approved, sent, or accepted quotations can be converted to orders"
        });
      }

      if (req.user.role === "dealer") {
        const dealer = await unwrapSingle(
          supabase.from("dealers").select("id").eq("user_id", req.user._id).maybeSingle()
        );

        if (!dealer || dealer.id !== quotation.dealer_id) {
          return res.status(403).json({ message: "Not authorized for this quotation" });
        }
      }

      const existingOrder = await unwrapSingle(
        supabase
          .from("orders")
          .select("id")
          .eq("source_quotation_id", quotation.id)
          .maybeSingle()
      );

      if (existingOrder) {
        return res.status(400).json({ message: "Order already created for this quotation" });
      }

      const order = await unwrapSingle(
        supabase
          .from("orders")
          .insert({
            order_number: generateOrderNumber(),
            dealer_id: quotation.dealer_id,
            source_quotation_id: quotation.id,
            subtotal: quotation.subtotal,
            grand_total: quotation.grand_total,
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
            unit_price: item.unit_price,
            line_total: item.line_total
          }))
        )
      );

      await unwrap(
        supabase
          .from("quotations")
          .update({
            status: "converted",
            updated_at: new Date().toISOString()
          })
          .eq("id", quotation.id)
      );

      const createdOrder = await unwrapSingle(
        supabase.from("orders").select(orderSelect).eq("id", order.id).single()
      );

      res.status(201).json({
        message: "Order created from quotation successfully",
        order: mapOrderWithItems(createdOrder)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/", protect, async (req, res) => {
  try {
    let query = supabase
      .from("orders")
      .select(orderSelect)
      .order("created_at", { ascending: false });

    if (req.user.role === "dealer") {
      const dealer = await unwrapSingle(
        supabase.from("dealers").select("id").eq("user_id", req.user._id).maybeSingle()
      );

      if (!dealer) {
        return res.status(404).json({ message: "Dealer profile not found" });
      }

      query = query.eq("dealer_id", dealer.id);
    }

    const orders = await unwrap(query);
    res.json(orders.map(mapOrderWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;