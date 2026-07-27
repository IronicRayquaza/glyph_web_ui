import { createClient } from "@supabase/supabase-js";

const SB_URL = 'https://tlvmibiravosluvhwsct.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdm1pYmlyYXZvc2x1dmh3c2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzAzNjksImV4cCI6MjEwMDY0NjM2OX0.eVZIKVkaDvfJbUI7dA0QGXZpXhsA0emMliy58knTGgo';

export const supabase = createClient(SB_URL, SB_KEY);
