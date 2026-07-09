import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY must be set");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
