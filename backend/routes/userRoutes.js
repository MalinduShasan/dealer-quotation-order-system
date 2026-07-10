const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { supabase, unwrap, unwrapSingle, mapUser, getActorId } = require("../lib/supabaseUtils");

const router = express.Router();
const allowedRoles = ["admin", "manager", "sales_executive", "dealer"];
const allowedStatuses = ["active", "inactive", "suspended"];

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeText = (value = "") => value.trim();
const serializeUser = (user, dealerProfile = null) => {
  const mappedUser = mapUser(user);

  if (!mappedUser) return null;

  return {
    _id: mappedUser._id,
    id: mappedUser.id,
    name: mappedUser.name,
    email: mappedUser.email,
    role: mappedUser.role,
    status: mappedUser.status,
    dealerProfileExists: Boolean(dealerProfile),
    dealerId: dealerProfile?.id || null,
    dealerCode: dealerProfile?.dealer_code || null,
    companyName: dealerProfile?.company_name || null,
    createdAt: mappedUser.createdAt,
    updatedAt: mappedUser.updatedAt
  };
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const trimmedName = name?.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await unwrapSingle(
      supabase.from("users").select("*").eq("email", normalizedEmail).is("deleted_at", null).maybeSingle()
    );

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await unwrapSingle(
      supabase
        .from("users")
        .insert({
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "dealer",
          status: "active",
          created_by: getActorId(req.user)
        })
        .select("id, name, email, role, status, created_at, updated_at")
        .single()
    );

    const user = mapUser(createdUser);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const userRecord = await unwrapSingle(
      supabase.from("users").select("*").eq("email", normalizedEmail).is("deleted_at", null).maybeSingle()
    );

    if (!userRecord) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (userRecord.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const isMatch = await bcrypt.compare(password, userRecord.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = mapUser(userRecord);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = normalizeText(req.query.search || "");
    const role = req.query.role || "all";
    const status = req.query.status || "all";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("users")
      .select("id, name, email, role, status, created_at, updated_at", { count: "exact" })
      .is("deleted_at", null);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role !== "all") {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role filter" });
      }
      query = query.eq("role", role);
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

    if (error) {
      throw new Error(error.message);
    }

    const userRows = data || [];
    const dealerUserIds = userRows
      .filter((user) => user.role === "dealer")
      .map((user) => user.id);

    let dealerProfilesByUserId = new Map();

    if (dealerUserIds.length > 0) {
      const dealerProfiles = await unwrap(
        supabase
          .from("dealers")
          .select("id, user_id, dealer_code, company_name")
          .is("deleted_at", null)
          .in("user_id", dealerUserIds)
      );

      dealerProfilesByUserId = new Map(
        dealerProfiles.map((dealerProfile) => [dealerProfile.user_id, dealerProfile])
      );
    }

    res.json({
      items: userRows.map((user) => serializeUser(user, dealerProfilesByUserId.get(user.id))),
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

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;
    const trimmedName = normalizeText(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedStatus = status || "active";

    if (!trimmedName || !normalizedEmail || !password || !role || !normalizedStatus) {
      return res.status(400).json({ message: "Name, email, password, role and status are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await unwrapSingle(
      supabase.from("users").select("id").eq("email", normalizedEmail).is("deleted_at", null).maybeSingle()
    );

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await unwrapSingle(
      supabase
        .from("users")
        .insert({
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role,
          status: normalizedStatus,
          created_by: getActorId(req.user)
        })
        .select("id, name, email, role, status, created_at, updated_at")
        .single()
    );

    res.status(201).json(serializeUser(createdUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;
    const trimmedName = normalizeText(name);
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName || !normalizedEmail || !role || !status) {
      return res.status(400).json({ message: "Name, email, role and status are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (password && password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await unwrapSingle(
      supabase.from("users").select("id").eq("id", id).is("deleted_at", null).maybeSingle()
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const duplicateUser = await unwrapSingle(
      supabase.from("users").select("id").eq("email", normalizedEmail).neq("id", id).is("deleted_at", null).maybeSingle()
    );

    if (duplicateUser) {
      return res.status(400).json({ message: "Email address is already in use" });
    }

    const updates = {
      name: trimmedName,
      email: normalizedEmail,
      role,
      status,
      updated_at: new Date().toISOString(),
      updated_by: getActorId(req.user)
    };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await unwrapSingle(
      supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select("id, name, email, role, status, created_at, updated_at")
        .single()
    );

    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingUser = await unwrapSingle(
      supabase.from("users").select("id").eq("id", id).is("deleted_at", null).maybeSingle()
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await unwrapSingle(
      supabase
        .from("users")
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: getActorId(req.user)
        })
        .eq("id", id)
        .select("id, name, email, role, status, created_at, updated_at")
        .single()
    );

    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
