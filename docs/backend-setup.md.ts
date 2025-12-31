
/**
 * ============================================
 * MERN BACKEND SETUP GUIDE FOR POMODORO APP
 * ============================================
 * 
 * This guide will help you set up the Node.js + Express + MongoDB backend
 * for your Pomodoro React Native app.
 * 
 * 
 * STEP 1: Initialize Node.js Project
 * -----------------------------------
 * 
 * mkdir pomodoro-backend
 * cd pomodoro-backend
 * npm init -y
 * 
 * 
 * STEP 2: Install Dependencies
 * -----------------------------
 * 
 * npm install express mongoose jsonwebtoken bcryptjs cors dotenv
 * npm install --save-dev nodemon
 * 
 * 
 * STEP 3: Create MongoDB Models
 * ------------------------------
 * 
 * Create models/User.js:
 * 
 * const mongoose = require('mongoose');
 * 
 * const userSchema = new mongoose.Schema({
 *   username: { type: String, required: true, unique: true },
 *   email: { type: String, required: true, unique: true },
 *   password: { type: String, required: true },
 *   createdAt: { type: Date, default: Date.now }
 * });
 * 
 * module.exports = mongoose.model('User', userSchema);
 * 
 * 
 * Create models/Task.js:
 * 
 * const mongoose = require('mongoose');
 * 
 * const taskSchema = new mongoose.Schema({
 *   name: { type: String, required: true },
 *   description: String,
 *   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 *   createdAt: { type: Date, default: Date.now },
 *   updatedAt: { type: Date, default: Date.now }
 * });
 * 
 * module.exports = mongoose.model('Task', taskSchema);
 * 
 * 
 * Create models/Session.js:
 * 
 * const mongoose = require('mongoose');
 * 
 * const sessionSchema = new mongoose.Schema({
 *   taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
 *   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 *   startTime: { type: Date, required: true },
 *   endTime: { type: Date, required: true },
 *   duration: { type: Number, required: true },
 *   completed: { type: Boolean, default: true },
 *   createdAt: { type: Date, default: Date.now }
 * });
 * 
 * module.exports = mongoose.model('Session', sessionSchema);
 * 
 * 
 * STEP 4: Create Authentication Middleware
 * -----------------------------------------
 * 
 * Create middleware/auth.js:
 * 
 * const jwt = require('jsonwebtoken');
 * 
 * module.exports = (req, res, next) => {
 *   try {
 *     const token = req.header('Authorization')?.replace('Bearer ', '');
 *     if (!token) throw new Error();
 *     
 *     const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *     req.userId = decoded.userId;
 *     next();
 *   } catch (error) {
 *     res.status(401).json({ message: 'Authentication required' });
 *   }
 * };
 * 
 * 
 * STEP 5: Create API Routes
 * --------------------------
 * 
 * Create routes/auth.js:
 * 
 * const express = require('express');
 * const bcrypt = require('bcryptjs');
 * const jwt = require('jsonwebtoken');
 * const User = require('../models/User');
 * 
 * const router = express.Router();
 * 
 * router.post('/signup', async (req, res) => {
 *   try {
 *     const { username, email, password } = req.body;
 *     const hashedPassword = await bcrypt.hash(password, 10);
 *     
 *     const user = new User({ username, email, password: hashedPassword });
 *     await user.save();
 *     
 *     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
 *     res.json({ token, user: { id: user._id, username, email } });
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * router.post('/login', async (req, res) => {
 *   try {
 *     const { email, password } = req.body;
 *     const user = await User.findOne({ email });
 *     
 *     if (!user || !(await bcrypt.compare(password, user.password))) {
 *       return res.status(401).json({ message: 'Invalid credentials' });
 *     }
 *     
 *     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
 *     res.json({ token, user: { id: user._id, username: user.username, email } });
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * module.exports = router;
 * 
 * 
 * Create routes/tasks.js:
 * 
 * const express = require('express');
 * const Task = require('../models/Task');
 * const auth = require('../middleware/auth');
 * 
 * const router = express.Router();
 * 
 * router.get('/', auth, async (req, res) => {
 *   try {
 *     const tasks = await Task.find({ userId: req.userId });
 *     res.json(tasks);
 *   } catch (error) {
 *     res.status(500).json({ message: error.message });
 *   }
 * });
 * 
 * router.post('/', auth, async (req, res) => {
 *   try {
 *     const task = new Task({ ...req.body, userId: req.userId });
 *     await task.save();
 *     res.json(task);
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * router.put('/:id', auth, async (req, res) => {
 *   try {
 *     const task = await Task.findOneAndUpdate(
 *       { _id: req.params.id, userId: req.userId },
 *       { ...req.body, updatedAt: Date.now() },
 *       { new: true }
 *     );
 *     res.json(task);
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * router.delete('/:id', auth, async (req, res) => {
 *   try {
 *     await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
 *     res.json({ message: 'Task deleted' });
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * module.exports = router;
 * 
 * 
 * Create routes/sessions.js:
 * 
 * const express = require('express');
 * const Session = require('../models/Session');
 * const auth = require('../middleware/auth');
 * 
 * const router = express.Router();
 * 
 * router.post('/', auth, async (req, res) => {
 *   try {
 *     const session = new Session({ ...req.body, userId: req.userId });
 *     await session.save();
 *     res.json(session);
 *   } catch (error) {
 *     res.status(400).json({ message: error.message });
 *   }
 * });
 * 
 * router.get('/stats/daily', auth, async (req, res) => {
 *   try {
 *     const sessions = await Session.aggregate([
 *       { $match: { userId: req.userId } },
 *       {
 *         $group: {
 *           _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
 *           completedPomodoros: { $sum: 1 },
 *           totalFocusTime: { $sum: '$duration' }
 *         }
 *       },
 *       { $sort: { _id: -1 } },
 *       { $limit: 30 }
 *     ]);
 *     
 *     const formatted = sessions.map(s => ({
 *       date: s._id,
 *       completedPomodoros: s.completedPomodoros,
 *       totalFocusTime: s.totalFocusTime
 *     }));
 *     
 *     res.json(formatted);
 *   } catch (error) {
 *     res.status(500).json({ message: error.message });
 *   }
 * });
 * 
 * router.get('/stats/tasks', auth, async (req, res) => {
 *   try {
 *     const sessions = await Session.aggregate([
 *       { $match: { userId: req.userId } },
 *       {
 *         $lookup: {
 *           from: 'tasks',
 *           localField: 'taskId',
 *           foreignField: '_id',
 *           as: 'task'
 *         }
 *       },
 *       { $unwind: '$task' },
 *       {
 *         $group: {
 *           _id: '$taskId',
 *           taskName: { $first: '$task.name' },
 *           completedPomodoros: { $sum: 1 },
 *           totalFocusTime: { $sum: '$duration' }
 *         }
 *       }
 *     ]);
 *     
 *     const formatted = sessions.map(s => ({
 *       taskId: s._id,
 *       taskName: s.taskName,
 *       completedPomodoros: s.completedPomodoros,
 *       totalFocusTime: s.totalFocusTime
 *     }));
 *     
 *     res.json(formatted);
 *   } catch (error) {
 *     res.status(500).json({ message: error.message });
 *   }
 * });
 * 
 * module.exports = router;
 * 
 * 
 * STEP 6: Create Main Server File
 * --------------------------------
 * 
 * Create server.js:
 * 
 * const express = require('express');
 * const mongoose = require('mongoose');
 * const cors = require('cors');
 * require('dotenv').config();
 * 
 * const authRoutes = require('./routes/auth');
 * const taskRoutes = require('./routes/tasks');
 * const sessionRoutes = require('./routes/sessions');
 * 
 * const app = express();
 * 
 * app.use(cors());
 * app.use(express.json());
 * 
 * mongoose.connect(process.env.MONGODB_URI)
 *   .then(() => console.log('Connected to MongoDB'))
 *   .catch(err => console.error('MongoDB connection error:', err));
 * 
 * app.use('/api/auth', authRoutes);
 * app.use('/api/tasks', taskRoutes);
 * app.use('/api/sessions', sessionRoutes);
 * 
 * const PORT = process.env.PORT || 5000;
 * app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 * 
 * 
 * STEP 7: Create .env File
 * ------------------------
 * 
 * Create .env:
 * 
 * MONGODB_URI=mongodb://localhost:27017/pomodoro
 * JWT_SECRET=your-secret-key-here
 * PORT=5000
 * 
 * 
 * STEP 8: Update package.json Scripts
 * ------------------------------------
 * 
 * Add to package.json:
 * 
 * "scripts": {
 *   "start": "node server.js",
 *   "dev": "nodemon server.js"
 * }
 * 
 * 
 * STEP 9: Run the Backend
 * -----------------------
 * 
 * npm run dev
 * 
 * 
 * STEP 10: Update React Native App
 * ---------------------------------
 * 
 * In your React Native app, update services/api.ts:
 * 
 * - For local development with physical device:
 *   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
 * 
 * - For local development with iOS simulator:
 *   const API_BASE_URL = 'http://localhost:5000/api';
 * 
 * - For local development with Android emulator:
 *   const API_BASE_URL = 'http://10.0.2.2:5000/api';
 * 
 * - For production:
 *   const API_BASE_URL = 'https://your-backend.com/api';
 * 
 * 
 * DEPLOYMENT OPTIONS:
 * -------------------
 * 
 * 1. Heroku: Easy deployment with MongoDB Atlas
 * 2. Railway: Modern platform with automatic deployments
 * 3. Render: Free tier available
 * 4. DigitalOcean App Platform: Scalable option
 * 5. AWS/GCP/Azure: Enterprise solutions
 * 
 * 
 * MONGODB OPTIONS:
 * ----------------
 * 
 * 1. MongoDB Atlas (Cloud): Free tier available, recommended for production
 * 2. Local MongoDB: Good for development
 * 3. MongoDB Docker: Containerized option
 * 
 */

export {};
