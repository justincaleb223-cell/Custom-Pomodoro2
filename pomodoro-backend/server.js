const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck / keep-alive route (use this for Render cron / uptime monitors)
app.get('/api/ping', (_req, res) => {
  res.status(200).send('hi ping');
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

