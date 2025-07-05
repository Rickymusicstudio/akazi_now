const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_KEY,
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // ✅ Handle already registered users gracefully
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
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_KEY
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
});

module.exports = router;
