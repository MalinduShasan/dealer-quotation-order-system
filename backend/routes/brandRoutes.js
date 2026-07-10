const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { supabase, unwrapSingle } = require("../lib/supabaseUtils");

const router = express.Router();
const allowedStatuses = ["active", "inactive"];

const normalizeText = (value = "") => value.trim();

const serializeBrand = (brand) => ({
  id: brand.id,
  name: brand.name,
  description: brand.description || "",
  status: brand.status,
  createdAt: brand.created_at
});

const validateBrandPayload = async (payload, existingId = null) => {
  const name = normalizeText(payload.name);
  const description = normalizeText(payload.description);
  const status = payload.status || "active";
  const errors = [];

  if (!name) {
    errors.push("Brand name is required");
  } else if (name.length < 2) {
    errors.push("Brand name must be at least 2 characters");
  } else if (name.length > 100) {
    errors.push("Brand name must be at most 100 characters");
  }

  if (description.length > 500) {
    errors.push("Description must be at most 500 characters");
  }

  if (!allowedStatuses.includes(status)) {
    errors.push("Invalid brand status");
  }

  if (name) {
    let duplicateQuery = supabase.from("brands").select("id, name").ilike("name", name).maybeSingle();

    if (existingId) {
      duplicateQuery = duplicateQuery.neq("id", existingId);
    }

    const duplicateBrand = await unwrapSingle(duplicateQuery);
    if (duplicateBrand && normalizeText(duplicateBrand.name).toLowerCase() === name.toLowerCase()) {
      errors.push("Brand name already exists");
    }
  }

  return {
    errors,
    values: {
      name,
      description,
      status
    }
  };
};

router.get("/", protect, async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (!["admin", "manager", "sales_executive", "dealer"].includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = normalizeText(req.query.search || "");
    const status = req.query.status || "all";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("brands").select("id, name, description, status, created_at", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (userRole === "dealer") {
      query = query.eq("status", "active");
    } else if (status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query = query.eq("status", status);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) throw new Error(error.message);

    res.json({
      items: (data || []).map(serializeBrand),
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

router.get("/:id", protect, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!["admin", "manager", "sales_executive", "dealer"].includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const brand = await unwrapSingle(
      supabase.from("brands").select("id, name, description, status, created_at").eq("id", req.params.id).maybeSingle()
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    if (userRole === "dealer" && brand.status !== "active") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(serializeBrand(brand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { errors, values } = await validateBrandPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const createdBrand = await unwrapSingle(
      supabase.from("brands").insert(values).select("id, name, description, status, created_at").single()
    );

    res.status(201).json(serializeBrand(createdBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const existingBrand = await unwrapSingle(supabase.from("brands").select("id").eq("id", req.params.id).maybeSingle());

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const { errors, values } = await validateBrandPayload(req.body, req.params.id);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const updatedBrand = await unwrapSingle(
      supabase.from("brands").update(values).eq("id", req.params.id).select("id, name, description, status, created_at").single()
    );

    res.json(serializeBrand(updatedBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid brand status" });
    }

    const existingBrand = await unwrapSingle(supabase.from("brands").select("id").eq("id", req.params.id).maybeSingle());

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updatedBrand = await unwrapSingle(
      supabase.from("brands").update({ status }).eq("id", req.params.id).select("id, name, description, status, created_at").single()
    );

    res.json(serializeBrand(updatedBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
