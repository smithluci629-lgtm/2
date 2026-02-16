import { createClient } from '@supabase/supabase-js';

// Credentials from the user's provided file
const SUPABASE_URL = 'https://dnfkodjijrolqlqplwxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZmtvZGppanJvbHFscXBsd3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDI4NjIsImV4cCI6MjA4NjY3ODg2Mn0.QnkqQl8ZPs-iKomXMWYWpEknigBijIHbBvsl9tJM1kU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);