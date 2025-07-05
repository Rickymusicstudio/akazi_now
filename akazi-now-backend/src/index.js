// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config');
const userRoutes = require('./routes/userRoutes');
const gigRoutes = require('./routes/gigRoutes');
const authRoutes = require('./routes/authRoutes');
const carpoolRoutes = require('./routes/carpools');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/auth', authRoutes);
app.use('/carpools', carpoolRoutes);


app.get('/', (req, res) => {
  res.send('✅ AkaziNow Backend Connected to Supabase');
});

// Test route to fetch users (if the 'users' table exists)
app.get('/api/test-users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


