const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, customerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * CREATE ORDER FROM APPROVED QUOTATION OR DIRECT
 */
router.post("/", protect, customerOnly, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    let totalPrice = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });

      totalPrice += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = await Order.create({
      customer: req.user._id,  // automatically assign customer
      items: orderItems,
      totalPrice,              // consistent naming
      status: "ordered"        // default status
    });

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET ALL ORDERS (customer can see their own orders)
 */
router.get("/my", protect, customerOnly, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).populate("items.product", "name price");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
