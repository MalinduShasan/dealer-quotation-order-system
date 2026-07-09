const express = require("express");
const router = express.Router();
const { protect, dealerOnly } = require("../middleware/authMiddleware");
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

router.get("/quotations", protect, dealerOnly, async (req, res) => {
  try {
    const quotations = await unwrap(
      supabase
        .from("quotations")
        .select(quotationSelect)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    );

    res.json(quotations.map(mapQuotationWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/quotations/:id/approve", protect, dealerOnly, async (req, res) => {
  try {
    const existingQuotation = await unwrapSingle(
      supabase.from("quotations").select("id, status").eq("id", req.params.id).maybeSingle()
    );

    if (!existingQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (existingQuotation.status !== "pending") {
      return res.status(400).json({ message: "Only pending quotations can be approved" });
    }

    const quotation = await unwrapSingle(
      supabase
        .from("quotations")
        .update({ status: "approved" })
        .eq("id", req.params.id)
        .select(quotationSelect)
        .single()
    );

    res.json({
      message: "Quotation approved successfully",
      quotation: mapQuotationWithItems(quotation)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/quotations/:id/reject", protect, dealerOnly, async (req, res) => {
  try {
    const existingQuotation = await unwrapSingle(
      supabase.from("quotations").select("id, status").eq("id", req.params.id).maybeSingle()
    );

    if (!existingQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (existingQuotation.status !== "pending") {
      return res.status(400).json({ message: "Only pending quotations can be rejected" });
    }

    const quotation = await unwrapSingle(
      supabase
        .from("quotations")
        .update({ status: "rejected" })
        .eq("id", req.params.id)
        .select(quotationSelect)
        .single()
    );

    res.json({
      message: "Quotation rejected successfully",
      quotation: mapQuotationWithItems(quotation)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
