import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://glgtlskuaazjarqtomhr.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AGkkrWF4iy1yNb89iJ5QEA_0S7iBOcj";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
