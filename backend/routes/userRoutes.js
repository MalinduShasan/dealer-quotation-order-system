const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { supabase, unwrap, unwrapSingle, mapUser } = require("../lib/supabaseUtils");

const router = express.Router();

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isValidPassword = (password = "") => password.length >= 8;

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

    if (!isValidPassword(password)) {
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
          role: "customer"
        })
        .select("id, name, email, role, created_at, updated_at")
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

module.exports = router;
