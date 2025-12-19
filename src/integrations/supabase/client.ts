import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fptwkzjypjvooxeywpsm.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdHdremp5cGp2b294ZXl3cHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzk2MTcsImV4cCI6MjA4MTY1NTYxN30.2h8BEhqchn5MjUp-1h4iYMZInBuJ9qRjfp2d8_hYbWU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// For React:
// import { supabase } from "@/integrations/supabase/client";
// For React Native:
// import { supabase } from "@/src/integrations/supabase/client";

