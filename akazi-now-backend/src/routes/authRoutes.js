const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// ✅ Secure Supabase admin client using Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.status === 422 && (data.msg === 'User already registered' || data.error === 'User already registered')) {
      return res.status(200).json({
        message: 'User already registered. Please log in.',
        alreadyRegistered: true
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.msg || data.error_description || data.error });
    }

    res.status(200).json({ message: 'Signup successful. Check your email to confirm.', data });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ✅ POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Supabase login error:', data);
      return res.status(response.status).json({ error: data.error_description || data.error });
    }

    res.status(200).json({
      message: 'Login successful',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ✅ POST /api/auth/delete-user
router.post('/delete-user', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  try {
    console.log("🔍 Checking user in Supabase with ID:", user_id);

    // Step 1: Confirm user exists
    const { data: foundUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user_id);

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError.message);
    } else if (!foundUser || foundUser.length === 0) {
      console.warn("⚠️ No user found in users table for ID:", user_id);
      return res.status(404).json({ error: "User not found" });
    } else {
      console.log("✅ Found user in users table:", foundUser);
    }

    // Step 2: Delete related records
    const tablesWithUserId = ['carpools', 'applications', 'ratings', 'messages'];
    for (const table of tablesWithUserId) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', user_id);
      if (error) {
        console.warn(`⚠️ Failed to delete from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted from ${table} where user_id = ${user_id}`);
      }
    }

    // Step 3: Delete from users table
    const { error: userTableError } = await supabase
      .from('users')
      .delete()
      .eq('auth_user_id', user_id);

    if (userTableError) {
      console.warn('⚠️ Error deleting from users table:', userTableError.message);
    } else {
      console.log('✅ Deleted user from users table');
    }

    // Step 4: Delete from Supabase Auth (skip if already gone)
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
    if (authError && authError.message !== 'User not found') {
      console.error('❌ Failed to delete from auth.users:', authError.message);
      return res.status(500).json({ error: authError.message });
    }

    console.log(`✅ Fully deleted user ${user_id}`);
    return res.status(200).json({ message: '✅ User deleted successfully' });

  } catch (err) {
    console.error('❌ Unhandled delete-user error:', err.message);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ✅ GET /api/auth/ping
router.get('/ping', (req, res) => {
  res.json({ message: '✅ Auth route is working' });
});

module.exports = router;
