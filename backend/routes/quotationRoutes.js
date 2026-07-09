const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  supabase,
  unwrap,
  unwrapSingle,
  mapQuotationWithItems
} = require("../lib/supabaseUtils");

const router = express.Router();

const quotationSelect = `
  id,
  quotation_number,
  dealer_id,
  created_by,
  approved_by,
  subtotal,
  discount_amount,
  tax_amount,
  shipping_amount,
  grand_total,
  valid_until,
  terms,
  internal_notes,
  dealer_notes,
  status,
  created_at,
  updated_at,
  dealer:dealers(id, dealer_code, company_name, contact_person, email, phone),
  quotation_items(
    id,
    quantity,
    unit_price,
    discount_amount,
    tax_amount,
    line_total,
    product_id,
    product:products(id, sku, name, dealer_price, unit_price)
  )
`;

const generateQuotationNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `QT-${year}-${random}`;
};

router.post("/", protect, allowRoles("admin", "manager", "sales_executive"), async (req, res) => {
  try {
    const {
      dealer_id,
      items,
      discount_amount = 0,
      tax_amount = 0,
      shipping_amount = 0,
      valid_until,
      terms,
      internal_notes,
      dealer_notes,
      status = "draft"
    } = req.body;

    if (!dealer_id) {
      return res.status(400).json({ message: "Dealer is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Quotation items are required" });
    }

    const productIds = items.map((item) => item.product_id);
    const products = await unwrap(
      supabase.from("products").select("id, dealer_price, unit_price").in("id", productIds)
    );

    const productMap = new Map(products.map((product) => [product.id, product]));

    let subtotal = 0;
    const quotationItems = [];

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
      const itemDiscount = Number(item.discount_amount ?? 0);
      const itemTax = Number(item.tax_amount ?? 0);
      const lineTotal = quantity * unitPrice - itemDiscount + itemTax;

      subtotal += quantity * unitPrice;

      quotationItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        discount_amount: itemDiscount,
        tax_amount: itemTax,
        line_total: lineTotal
      });
    }

    const grandTotal =
      subtotal - Number(discount_amount) + Number(tax_amount) + Number(shipping_amount);

    const quotation = await unwrapSingle(
      supabase
        .from("quotations")
        .insert({
          quotation_number: generateQuotationNumber(),
          dealer_id,
          created_by: req.user._id,
          subtotal,
          discount_amount: Number(discount_amount),
          tax_amount: Number(tax_amount),
          shipping_amount: Number(shipping_amount),
          grand_total: grandTotal,
          valid_until: valid_until || null,
          terms: terms || "",
          internal_notes: internal_notes || "",
          dealer_notes: dealer_notes || "",
          status
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

    await unwrap(
      supabase.from("quotation_status_history").insert({
        quotation_id: quotation.id,
        old_status: null,
        new_status: status,
        changed_by: req.user._id,
        note: "Quotation created"
      })
    );

    const createdQuotation = await unwrapSingle(
      supabase.from("quotations").select(quotationSelect).eq("id", quotation.id).single()
    );

    res.status(201).json(mapQuotationWithItems(createdQuotation));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, allowRoles("admin", "manager", "sales_executive"), async (req, res) => {
  try {
    const quotations = await unwrap(
      supabase
        .from("quotations")
        .select(quotationSelect)
        .order("created_at", { ascending: false })
    );

    res.json(quotations.map(mapQuotationWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, allowRoles("dealer"), async (req, res) => {
  try {
    const dealer = await unwrapSingle(
      supabase.from("dealers").select("id").eq("user_id", req.user._id).maybeSingle()
    );

    if (!dealer) {
      return res.status(404).json({ message: "Dealer profile not found" });
    }

    const quotations = await unwrap(
      supabase
        .from("quotations")
        .select(quotationSelect)
        .eq("dealer_id", dealer.id)
        .order("created_at", { ascending: false })
    );

    res.json(quotations.map(mapQuotationWithItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, allowRoles("admin", "manager", "dealer"), async (req, res) => {
  try {
    const { status, note } = req.body;

    const allowedStatuses = [
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "accepted",
      "rejected",
      "expired",
      "cancelled",
      "converted"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid quotation status" });
    }

    const existingQuotation = await unwrapSingle(
      supabase.from("quotations").select("*").eq("id", req.params.id).maybeSingle()
    );

    if (!existingQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const updatedQuotation = await unwrapSingle(
      supabase
        .from("quotations")
        .update({
          status,
          approved_by: status === "approved" ? req.user._id : existingQuotation.approved_by,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.params.id)
        .select(quotationSelect)
        .single()
    );

    await unwrap(
      supabase.from("quotation_status_history").insert({
        quotation_id: req.params.id,
        old_status: existingQuotation.status,
        new_status: status,
        changed_by: req.user._id,
        note: note || ""
      })
    );

    res.json(mapQuotationWithItems(updatedQuotation));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;