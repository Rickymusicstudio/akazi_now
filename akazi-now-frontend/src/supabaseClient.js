import { createClient } from '@supabase/supabase-js';

// ✅ Load from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Debug logs
console.log('✅ supabaseUrl:', supabaseUrl || '❌ MISSING');
console.log('✅ supabaseAnonKey:', supabaseAnonKey ? 'Loaded ✅' : '❌ MISSING');

// ✅ Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
