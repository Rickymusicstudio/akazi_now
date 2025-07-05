import { createClient } from '@supabase/supabase-js';

// ✅ Load from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Debug logs
console.log('✅ supabaseUrl:', supabaseUrl || '❌ MISSING');
console.log('✅ supabaseAnonKey:', supabaseAnonKey ? 'Loaded ✅' : '❌ MISSING');

// ✅ Create Supabase client with sessionStorage (logout on browser close)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
