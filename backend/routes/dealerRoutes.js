const express = require("express");
const { protect, dealerOnly, allowRoles } = require("../middleware/authMiddleware");
const {
  supabase,
  unwrap,
  unwrapSingle,
  mapDealer,
  mapQuotationWithItems
} = require("../lib/supabaseUtils");

const router = express.Router();
const managerAccess = allowRoles("admin", "manager");
const allowedStatuses = ["active", "inactive", "blocked"];

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

const dealerSelect = `
  id,
  user_id,
  dealer_code,
  company_name,
  contact_person,
  email,
  phone,
  address,
  city,
  province,
  country,
  credit_limit,
  payment_terms,
  status,
  notes,
  created_at,
  updated_at
`;

const normalizeText = (value = "") => value.trim();
const normalizeEmail = (email = "") => email.trim().toLowerCase();

const validateDealerPayload = async (payload, existingId = null) => {
  const errors = [];
  const companyName = normalizeText(payload.company_name);
  const contactPerson = normalizeText(payload.contact_person);
  const email = normalizeEmail(payload.email);
  const status = payload.status || "active";
  const userId = payload.user_id || null;

  if (!companyName) errors.push("Company name is required");
  if (!contactPerson) errors.push("Contact person is required");
  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email must be valid");
  }

  if (!allowedStatuses.includes(status)) {
    errors.push("Invalid dealer status");
  }

  if (userId) {
    const dealerUser = await unwrapSingle(
      supabase.from("users").select("id, role").eq("id", userId).maybeSingle()
    );

    if (!dealerUser) {
      errors.push("Selected dealer user was not found");
    } else if (dealerUser.role !== "dealer") {
      errors.push("Selected user must have dealer role");
    }

    const duplicateLinkedProfileQuery = supabase.from("dealers").select("id").eq("user_id", userId);
    if (existingId) {
      duplicateLinkedProfileQuery.neq("id", existingId);
    }
    const duplicateLinkedProfile = await unwrapSingle(duplicateLinkedProfileQuery.maybeSingle());
    if (duplicateLinkedProfile) {
      errors.push("Dealer profile already exists for this user");
    }
  }

  const duplicateEmailQuery = supabase.from("dealers").select("id").eq("email", email);
  const duplicateDealerCodeQuery = payload.dealer_code
    ? supabase.from("dealers").select("id").eq("dealer_code", payload.dealer_code)
    : null;

  if (existingId) {
    duplicateEmailQuery.neq("id", existingId);
    if (duplicateDealerCodeQuery) duplicateDealerCodeQuery.neq("id", existingId);
  }

  const duplicateEmail = await unwrapSingle(duplicateEmailQuery.maybeSingle());
  if (duplicateEmail) errors.push("Dealer email is already in use");

  if (duplicateDealerCodeQuery) {
    const duplicateCode = await unwrapSingle(duplicateDealerCodeQuery.maybeSingle());
    if (duplicateCode) errors.push("Dealer code is already in use");
  }

  return {
    errors,
    values: {
      dealer_code: normalizeText(payload.dealer_code),
      user_id: userId,
      company_name: companyName,
      contact_person: contactPerson,
      email,
      phone: normalizeText(payload.phone),
      address: normalizeText(payload.address),
      city: normalizeText(payload.city),
      province: normalizeText(payload.province),
      country: normalizeText(payload.country) || "Sri Lanka",
      credit_limit: payload.credit_limit === "" || payload.credit_limit == null ? 0 : Number(payload.credit_limit),
      payment_terms: normalizeText(payload.payment_terms),
      status,
      notes: normalizeText(payload.notes)
    }
  };
};

const generateDealerCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `DLR-${year}-`;
  const latestDealer = await unwrapSingle(
    supabase
      .from("dealers")
      .select("dealer_code")
      .ilike("dealer_code", `${prefix}%`)
      .order("dealer_code", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  const lastNumber = latestDealer?.dealer_code
    ? Number(latestDealer.dealer_code.split("-").pop()) || 0
    : 0;

  return `${prefix}${String(lastNumber + 1).padStart(4, "0")}`;
};

router.get("/", protect, managerAccess, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = normalizeText(req.query.search || "");
    const status = req.query.status || "all";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("dealers").select(dealerSelect, { count: "exact" });

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    if (status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    res.json({
      items: (data || []).map(mapDealer),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(Math.ceil((count || 0) / limit), 1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, managerAccess, async (req, res) => {
  try {
    const { errors, values } = await validateDealerPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const dealerCode = values.dealer_code || (await generateDealerCode());
    const createdDealer = await unwrapSingle(
      supabase
        .from("dealers")
        .insert({
          ...values,
          dealer_code: dealerCode
        })
        .select(dealerSelect)
        .single()
    );

    res.status(201).json(mapDealer(createdDealer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, managerAccess, async (req, res) => {
  try {
    const existingDealer = await unwrapSingle(
      supabase.from("dealers").select("id").eq("id", req.params.id).maybeSingle()
    );

    if (!existingDealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const { errors, values } = await validateDealerPayload(req.body, req.params.id);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const updatedDealer = await unwrapSingle(
      supabase
        .from("dealers")
        .update({
          ...values,
          dealer_code: values.dealer_code || req.body.dealer_code || undefined,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.params.id)
        .select(dealerSelect)
        .single()
    );

    res.json(mapDealer(updatedDealer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, managerAccess, async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid dealer status" });
    }

    const existingDealer = await unwrapSingle(
      supabase.from("dealers").select("id").eq("id", req.params.id).maybeSingle()
    );

    if (!existingDealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const updatedDealer = await unwrapSingle(
      supabase
        .from("dealers")
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.params.id)
        .select(dealerSelect)
        .single()
    );

    res.json(mapDealer(updatedDealer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const loadPendingQuotations = async (req, res) => {
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
};

router.get("/quotations", protect, dealerOnly, loadPendingQuotations);
router.get("/quotations/pending", protect, dealerOnly, loadPendingQuotations);

router.get("/:id", protect, managerAccess, async (req, res) => {
  try {
    const dealer = await unwrapSingle(
      supabase.from("dealers").select(dealerSelect).eq("id", req.params.id).maybeSingle()
    );

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    res.json(mapDealer(dealer));
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
