const express = require("express");
const router = express.Router();
const { protect, customerOnly } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Quotation = require("../models/Quotation");
const Product = require("../models/Product");

// ==============================
// CREATE ORDER MANUALLY
// ==============================
router.post("/", protect, customerOnly, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items provided" });

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: "Product not found" });

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// GET ALL ORDERS
// ==============================
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.product", "name price");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// PLACE ORDER FROM APPROVED QUOTATION
// ==============================
router.post("/from-quotation/:id", protect, customerOnly, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) return res.status(404).json({ message: "Quotation not found" });

    if (quotation.status !== "approved")
      return res.status(400).json({ message: "Quotation not approved yet" });

    const order = await Order.create({
      customer: quotation.customer,
      items: quotation.items,
      totalAmount: quotation.totalPrice
    });

    quotation.status = "ordered";
    await quotation.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
