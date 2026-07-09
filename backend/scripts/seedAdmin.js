require("dotenv").config();

const bcrypt = require("bcryptjs");
const { supabase } = require("../lib/supabaseUtils");

async function seedAdmin() {
  try {
    const email = "admin@quoteflow.com";

    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      console.log("✅ Admin user already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@12345", 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: "System Administrator",
        email,
        password: hashedPassword,
        role: "admin",
        status: "active"
      })
      .select("id, name, email, role, status")
      .single();

    if (error) throw error;

    console.log("✅ Admin created successfully!");
    console.table(data);
    console.log("\nLogin Credentials:");
    console.log("Email    : admin@quoteflow.com");
    console.log("Password : Admin@12345");
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
  }

  process.exit();
}

seedAdmin();