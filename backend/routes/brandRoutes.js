const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { supabase, unwrapSingle, getActorId } = require("../lib/supabaseUtils");
const { brandLogoUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();
const allowedStatuses = ["active", "inactive"];
const BRAND_LOGO_BUCKET = "brand-logos";

const normalizeText = (value = "") => value.trim();
const sanitizeFilename = (filename = "brand-logo") =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "brand-logo";

const serializeBrand = (brand) => ({
  id: brand.id,
  name: brand.name,
  description: brand.description || "",
  logoUrl: brand.logo_url || null,
  logoPath: brand.logo_path || null,
  status: brand.status,
  createdAt: brand.created_at,
  updatedAt: brand.updated_at || null
});

const validateBrandPayload = async (payload, existingId = null) => {
  const name = normalizeText(payload.name);
  const description = normalizeText(payload.description);
  const logoUrl = typeof payload.logoUrl === "string" ? payload.logoUrl.trim() : null;
  const logoPath = typeof payload.logoPath === "string" ? payload.logoPath.trim() : null;
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
    let duplicateQuery = supabase.from("brands").select("id, name").ilike("name", name).is("deleted_at", null).maybeSingle();

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
      logo_url: logoUrl || null,
      logo_path: logoPath || null,
      status
    }
  };
};

const getBrandById = async (brandId) =>
  unwrapSingle(
    supabase
      .from("brands")
      .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
      .eq("id", brandId)
      .is("deleted_at", null)
      .maybeSingle()
  );

const removeStorageObject = async (logoPath) => {
  if (!logoPath) return;

  const { error } = await supabase.storage.from(BRAND_LOGO_BUCKET).remove([logoPath]);
  if (error) {
    throw new Error(error.message);
  }
};

const uploadLogoToStorage = async (brandId, file) => {
  const timestamp = Date.now();
  const safeName = sanitizeFilename(file.originalname);
  const logoPath = `${brandId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage.from(BRAND_LOGO_BUCKET).upload(logoPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BRAND_LOGO_BUCKET).getPublicUrl(logoPath);

  return {
    logoPath,
    logoUrl: data?.publicUrl || null
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

    let query = supabase.from("brands").select("id, name, description, logo_url, logo_path, status, created_at, updated_at", { count: "exact" }).is("deleted_at", null);

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

    const brand = await getBrandById(req.params.id);

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
      supabase
        .from("brands")
        .insert({
          ...values,
          updated_at: new Date().toISOString(),
          created_by: getActorId(req.user),
          updated_by: getActorId(req.user)
        })
        .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
        .single()
    );

    res.status(201).json(serializeBrand(createdBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const existingBrand = await unwrapSingle(supabase.from("brands").select("id").eq("id", req.params.id).is("deleted_at", null).maybeSingle());

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const { errors, values } = await validateBrandPayload(req.body, req.params.id);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const updatedBrand = await unwrapSingle(
      supabase
        .from("brands")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
        .single()
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

    const existingBrand = await unwrapSingle(supabase.from("brands").select("id").eq("id", req.params.id).is("deleted_at", null).maybeSingle());

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updatedBrand = await unwrapSingle(
      supabase
        .from("brands")
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
        .single()
    );

    res.json(serializeBrand(updatedBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/logo", protect, allowRoles("admin"), (req, res, next) => {
  brandLogoUpload.single("logo")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    return next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Logo file is required" });
    }

    const existingBrand = await getBrandById(req.params.id);

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const uploadedLogo = await uploadLogoToStorage(existingBrand.id, req.file);

    try {
      const updatedBrand = await unwrapSingle(
        supabase
          .from("brands")
          .update({
            logo_url: uploadedLogo.logoUrl,
            logo_path: uploadedLogo.logoPath,
            updated_at: new Date().toISOString(),
            updated_by: getActorId(req.user)
          })
          .eq("id", req.params.id)
          .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
          .single()
      );

      if (existingBrand.logo_path) {
        try {
          await removeStorageObject(existingBrand.logo_path);
        } catch (storageError) {
          return res.status(500).json({
            message: `Logo saved but previous logo cleanup failed: ${storageError.message}`
          });
        }
      }

      return res.json(serializeBrand(updatedBrand));
    } catch (dbError) {
      try {
        await removeStorageObject(uploadedLogo.logoPath);
      } catch {
        // Best-effort cleanup only.
      }
      throw dbError;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id/logo", protect, allowRoles("admin"), async (req, res) => {
  try {
    const existingBrand = await getBrandById(req.params.id);

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    if (!existingBrand.logo_path) {
      const clearedBrand = await unwrapSingle(
        supabase
          .from("brands")
          .update({
            logo_url: null,
            logo_path: null,
            updated_at: new Date().toISOString(),
            updated_by: getActorId(req.user)
          })
          .eq("id", req.params.id)
          .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
          .single()
      );

      return res.json(serializeBrand(clearedBrand));
    }

    await removeStorageObject(existingBrand.logo_path);

    const updatedBrand = await unwrapSingle(
      supabase
        .from("brands")
        .update({
          logo_url: null,
          logo_path: null,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", req.params.id)
        .select("id, name, description, logo_url, logo_path, status, created_at, updated_at")
        .single()
    );

    return res.json(serializeBrand(updatedBrand));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
