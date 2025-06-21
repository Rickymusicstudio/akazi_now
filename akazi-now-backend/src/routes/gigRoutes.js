
// src/routes/gigRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config');
const verifyToken = require('../middleware/verifyToken');

// @route   POST /api/gigs
// @desc    Post a new gig
router.post('/', async (req, res) => {
  const { title, description, location, pay_amount, poster_id } = req.body;

  const { data, error } = await supabase
    .from('gigs')
    .insert([{ title, description, location, pay_amount, poster_id }])
    .select();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// @route   GET /api/gigs
// @desc    Fetch all open gigs
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
});

// @route   POST /api/gigs/:id/apply
// @desc    Assign a user to a gig
router.post('/:id/apply', async (req, res) => {
  const gigId = req.params.id;
  const { user_id } = req.body;

  const { data, error } = await supabase
    .from('gigs')
    .update({
      assigned_to: user_id,
      status: 'assigned'
    })
    .eq('id', gigId)
    .select();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data[0]);
});


// @route   POST /api/gigs/:id/complete
// @desc    Mark a gig as completed
router.post('/:id/complete', async (req, res) => {
  const gigId = req.params.id;

  const { data, error } = await supabase
    .from('gigs')
    .update({ status: 'completed' })
    .eq('id', gigId)
    .select();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data[0]);
});

router.post('/', verifyToken, async (req, res) => {
  const { title, description, location, pay_amount } = req.body;
  const poster_id = req.user.sub;

  const { data, error } = await supabase
    .from('gigs')
    .insert([{ title, description, location, pay_amount, poster_id }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

module.exports = router;
