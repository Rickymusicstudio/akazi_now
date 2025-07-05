const express = require('express');
const router = express.Router();
const supabase = require('../config');

// Create a new carpool ride
router.post('/', async (req, res) => {
  const {
    origin,
    destination,
    date,
    time,
    available_seats,
    price,
    notes
  } = req.body;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }

  const { error } = await supabase.from('carpools').insert([
    {
      driver_id: user.id,
      origin,
      destination,
      date,
      time,
      available_seats,
      price,
      notes,
    },
  ]);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ message: '✅ Carpool created successfully' });
});

module.exports = router;
