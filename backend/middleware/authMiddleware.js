const jwt = require("jsonwebtoken");
const { supabase, unwrapSingle, mapUser } = require("../lib/supabaseUtils");

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await unwrapSingle(
        supabase
          .from("users")
          .select("id, name, email, role, created_at, updated_at")
          .eq("id", decoded.id)
          .maybeSingle()
      );

      req.user = mapUser(user);
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Role-based middleware
const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    next();
  } else {
    res.status(403).json({ message: "Customer access only" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

const dealerOnly = (req, res, next) => {
  if (req.user && req.user.role === "dealer") {
    next();
  } else {
    res.status(403).json({ message: "Dealer access only" });
  }
};

module.exports = { protect, customerOnly, dealerOnly, adminOnly };
