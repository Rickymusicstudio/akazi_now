const express = require('express');
const router = express.Router();
const supabase = require('../config');

// @route   POST /api/users
// @desc    Register a new user
router.post('/', async (req, res) => {
  const { full_name, phone_number, location, skills } = req.body;

  const { data, error } = await supabase
    .from('users')
    .insert([
      { full_name, phone_number, location, skills }
    ])
    .select();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// ✅ @route   GET /api/users/:id/gigs
// ✅ @desc    Get gigs assigned to a user
router.get('/:id/gigs', async (req, res) => {
  const userId = req.params.id;

  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
});

module.exports = router;
