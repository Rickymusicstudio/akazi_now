// src/config.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Debug check
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Missing ❌');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Loaded ✅' : 'Missing ❌');

// Create the client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
