const express = require("express");
const router = express.Router();
const { protect, customerOnly } = require("../middleware/authMiddleware");
const Quotation = require("../models/Quotation");
const Product = require("../models/Product");

// POST create a new quotation
router.post("/", protect, customerOnly, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    let total = 0;
    const quotationItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      // Calculate total for this item
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      // Push item with price at time of quotation
      quotationItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create quotation
    const quotation = await Quotation.create({
      customer: req.user._id,
      items: quotationItems,
      totalPrice: total // updated field name
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all quotations of logged-in customer
router.get("/my", protect, customerOnly, async (req, res) => {
  try {
    const quotations = await Quotation.find({ customer: req.user._id }).populate("items.product", "name price");
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
