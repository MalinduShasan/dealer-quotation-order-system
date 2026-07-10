const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { supabase, unwrapSingle, getActorId } = require("../lib/supabaseUtils");

const router = express.Router();
const managerViewAccess = allowRoles("admin", "manager", "sales_executive");
const allowedStatuses = ["active", "inactive"];

const normalizeText = (value = "") => value.trim();

const serializeCategory = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description || "",
  status: category.status,
  createdAt: category.created_at
});

const validateCategoryPayload = async (payload, existingId = null) => {
  const name = normalizeText(payload.name);
  const description = normalizeText(payload.description);
  const status = payload.status || "active";
  const errors = [];

  if (!name) {
    errors.push("Category name is required");
  } else if (name.length < 2) {
    errors.push("Category name must be at least 2 characters");
  } else if (name.length > 100) {
    errors.push("Category name must be at most 100 characters");
  }

  if (description.length > 500) {
    errors.push("Description must be at most 500 characters");
  }

  if (!allowedStatuses.includes(status)) {
    errors.push("Invalid category status");
  }

  if (name) {
    let duplicateQuery = supabase
      .from("categories")
      .select("id, name")
      .ilike("name", name)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingId) {
      duplicateQuery = duplicateQuery.neq("id", existingId);
    }

    const duplicateCategory = await unwrapSingle(duplicateQuery);
    if (duplicateCategory && normalizeText(duplicateCategory.name).toLowerCase() === name.toLowerCase()) {
      errors.push("Category name already exists");
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

    let query = supabase
      .from("categories")
      .select("id, name, description, status, created_at", { count: "exact" })
      .is("deleted_at", null);

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

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    res.json({
      items: (data || []).map(serializeCategory),
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

    const category = await unwrapSingle(
      supabase
        .from("categories")
        .select("id, name, description, status, created_at")
        .eq("id", req.params.id)
        .is("deleted_at", null)
        .maybeSingle()
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (userRole === "dealer" && category.status !== "active") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(serializeCategory(category));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { errors, values } = await validateCategoryPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const createdCategory = await unwrapSingle(
      supabase
        .from("categories")
        .insert(values)
        .select("id, name, description, status, created_at")
        .single()
    );

    const createdCategoryWithAudit = await unwrapSingle(
      supabase
        .from("categories")
        .update({
          created_by: getActorId(req.user),
          updated_by: getActorId(req.user)
        })
        .eq("id", createdCategory.id)
        .select("id, name, description, status, created_at")
        .single()
    );

    res.status(201).json(serializeCategory(createdCategoryWithAudit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const existingCategory = await unwrapSingle(
      supabase.from("categories").select("id").eq("id", req.params.id).is("deleted_at", null).maybeSingle()
    );

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { errors, values } = await validateCategoryPayload(req.body, req.params.id);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const updatedCategory = await unwrapSingle(
      supabase
        .from("categories")
        .update({
          ...values,
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select("id, name, description, status, created_at")
        .single()
    );

    res.json(serializeCategory(updatedCategory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid category status" });
    }

    const existingCategory = await unwrapSingle(
      supabase.from("categories").select("id").eq("id", req.params.id).is("deleted_at", null).maybeSingle()
    );

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await unwrapSingle(
      supabase
        .from("categories")
        .update({
          status,
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select("id, name, description, status, created_at")
        .single()
    );

    res.json(serializeCategory(updatedCategory));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
