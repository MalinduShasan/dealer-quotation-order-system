const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { supabase, unwrap, unwrapSingle, mapUser } = require("../lib/supabaseUtils");

const router = express.Router();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

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
      supabase.from("users").select("*").eq("email", normalizedEmail).maybeSingle()
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
          status: "active"
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
      supabase.from("users").select("*").eq("email", normalizedEmail).maybeSingle()
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
    const users = await unwrap(
      supabase
        .from("users")
        .select("id, name, email, role, status, created_at, updated_at")
        .order("created_at", { ascending: false })
    );

    res.json(users.map(mapUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const allowedRoles = ["admin", "manager", "sales_executive", "dealer"];
    const trimmedName = name?.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName || !normalizedEmail || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
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
          status: "active"
        })
        .select("id, name, email, role, status, created_at, updated_at")
        .single()
    );

    res.status(201).json(mapUser(createdUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;