import { createClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://tlvmibiravosluvhwsct.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdm1pYmlyYXZvc2x1dmh3c2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzAzNjksImV4cCI6MjEwMDY0NjM2OX0.eVZIKVkaDvfJbUI7dA0QGXZpXhsA0emMliy58knTGgo";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(SB_URL, SB_KEY);
