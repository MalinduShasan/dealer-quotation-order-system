const express = require("express");
const Quotation = require("../models/Quotation");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE quotation (cart → quotation)
router.post("/", protect, async (req, res) => {
  try {
    const { items } = req.body;
    let totalAmount = 0;

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      totalAmount += product.price * item.quantity;
    }

    const quotation = await Quotation.create({
      customer: req.user._id,
      items,
      totalAmount
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET logged-in user's quotations
router.get("/my", protect, async (req, res) => {
  try {
    const quotations = await Quotation.find({
      customer: req.user._id
    }).populate("items.product", "name price");
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
