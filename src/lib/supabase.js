import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SB_URL || !SB_KEY) {
    console.error("Missing Supabase credentials in .env file");
}

export const supabase = createClient(SB_URL, SB_KEY);
