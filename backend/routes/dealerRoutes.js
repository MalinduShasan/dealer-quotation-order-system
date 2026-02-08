const express = require("express");
const router = express.Router();
const { protect, dealerOnly } = require("../middleware/authMiddleware");
const Quotation = require("../models/Quotation");

// ==============================
// GET all pending quotations
// ==============================
router.get("/quotations", protect, dealerOnly, async (req, res) => {
  try {
    const quotations = await Quotation.find({ status: "pending" })
      .populate("customer", "name email")
      .populate("items.product", "name price");

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// APPROVE quotation
// ==============================
router.patch("/quotations/:id/approve", protect, dealerOnly, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.status = "approved";
    await quotation.save();

    res.json({
      message: "Quotation approved successfully",
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// REJECT quotation
// ==============================
router.patch("/quotations/:id/reject", protect, dealerOnly, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.status = "rejected";
    await quotation.save();

    res.json({
      message: "Quotation rejected successfully",
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
