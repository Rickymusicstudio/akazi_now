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
        'apikey': process.env.SUPABASE_ANON_KEY, // 👈 make sure to use ANON KEY here
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
        'apikey': process.env.SUPABASE_ANON_KEY // 👈 use anon key here too
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
    // Step 1: Delete from 'users' table (cascades will clean other tables)
    const { error: userTableError } = await supabase
      .from('users')
      .delete()
      .eq('auth_user_id', user_id);

    if (userTableError) {
      console.warn('⚠️ Error deleting from users table:', userTableError.message);
    }

    // Step 2: Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
    if (authError) {
      console.error('❌ Failed to delete from auth.users:', authError.message);
      return res.status(500).json({ error: authError.message });
    }

    console.log(`✅ Deleted user ${user_id}`);
    return res.status(200).json({ message: '✅ User deleted successfully' });

  } catch (err) {
    console.error('❌ Unhandled delete-user error:', err.message);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;
