const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(`[AUTH] Signup attempt for email: ${email}, username: ${username}`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    console.log(`[AUTH] User created successfully: ${user._id}`);
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username, email } });
    console.log(`[AUTH] Signup successful for user: ${user._id}`);
  } catch (error) {
    console.error(`[AUTH] Signup error:`, error.message);
    res.status(400).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for email: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`[AUTH] Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    console.log(`[AUTH] Login successful for user: ${user._id} (${user.username})`);
    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    console.error(`[AUTH] Login error:`, error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

