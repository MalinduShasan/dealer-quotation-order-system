const jwt = require("jsonwebtoken");
const { supabase, unwrapSingle, mapUser } = require("../lib/supabaseUtils");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRecord = await unwrapSingle(
      supabase
        .from("users")
        .select("id, name, email, role, status, created_at, updated_at")
        .eq("id", decoded.id)
        .is("deleted_at", null)
        .maybeSingle()
    );

    if (!userRecord) {
      return res.status(401).json({ message: "User not found" });
    }

    if (userRecord.status !== "active") {
      return res.status(403).json({ message: "User account is not active" });
    }

    const dealerProfile =
      userRecord.role === "dealer"
        ? await unwrapSingle(
            supabase
              .from("dealers")
              .select("id")
              .eq("user_id", userRecord.id)
              .eq("email", userRecord.email)
              .is("deleted_at", null)
              .maybeSingle()
          )
        : null;

    if (userRecord.role === "dealer" && !dealerProfile) {
      return res.status(403).json({ message: "Dealer account is not linked to a dealer profile" });
    }

    req.user = mapUser({
      ...userRecord,
      dealer_id: dealerProfile?.id || null
    });
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

const adminOnly = allowRoles("admin");
const managerOnly = allowRoles("manager");
const salesOnly = allowRoles("sales_executive");
const dealerOnly = allowRoles("dealer");

module.exports = {
  protect,
  allowRoles,
  adminOnly,
  managerOnly,
  salesOnly,
  dealerOnly
};
