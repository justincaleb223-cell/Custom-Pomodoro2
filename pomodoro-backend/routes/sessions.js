const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const requestId = req.requestId || 'unknown';
  console.log(`[SESSION] [REQ-${requestId}] ⚡ POST /api/sessions route handler called at ${new Date().toISOString()}`);
  try {
    const { taskId, startTime, endTime, duration, completed } = req.body;
    console.log(`[SESSION] [REQ-${requestId}] Creating session for user: ${req.userId}`);
    console.log(`[SESSION] [REQ-${requestId}] Session data:`, JSON.stringify({ 
      taskId, 
      startTime, 
      endTime, 
      duration, 
      completed,
      userId: req.userId 
    }));
    
    // Try to get task name for better logging
    let taskName = 'Unknown';
    if (taskId) {
      try {
        const task = await Task.findById(taskId);
        if (task) taskName = task.name;
      } catch (e) {
        console.log(`[SESSION] [REQ-${requestId}] Could not fetch task name:`, e.message);
      }
    }
    
    console.log(`[SESSION] [REQ-${requestId}] Task name: "${taskName}", Duration: ${duration} minutes`);
    
    const session = new Session({ ...req.body, userId: req.userId });
    await session.save();
    
    console.log(`[SESSION] [REQ-${requestId}] ✅ Session saved successfully!`);
    console.log(`[SESSION] [REQ-${requestId}] Session ID: ${session._id}`);
    console.log(`[SESSION] [REQ-${requestId}] User: ${req.userId}, Task: ${taskName} (${taskId}), Duration: ${duration} min`);
    console.log(`[SESSION] [REQ-${requestId}] Start: ${startTime}, End: ${endTime}`);
    // Summary line for easy searching
    console.log(`[SESSION-SUMMARY] [REQ-${requestId}] SAVED | User:${req.userId} | Task:"${taskName}" | Duration:${duration}min | SessionID:${session._id}`);
    
    res.json(session);
  } catch (error) {
    console.error(`[SESSION] [REQ-${requestId}] ❌ Error creating session:`, error.message);
    console.error(`[SESSION] [REQ-${requestId}] Error stack:`, error.stack);
    console.error(`[SESSION] [REQ-${requestId}] Request body was:`, JSON.stringify(req.body));
    res.status(400).json({ message: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    const sessions = await Session.find(query).sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ 
      taskId: req.params.taskId, 
      userId: req.userId 
    }).sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/daily', auth, async (req, res) => {
  try {
    console.log(`[STATS] Fetching daily stats for user: ${req.userId}`);
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const sessions = await Session.aggregate([
      // In aggregations, MongoDB does not cast string -> ObjectId for us
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          completedPomodoros: { $sum: 1 },
          totalFocusTime: { $sum: '$duration' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    const formatted = sessions.map(s => ({
      date: s._id,
      completedPomodoros: s.completedPomodoros,
      totalFocusTime: s.totalFocusTime
    }));
    
    console.log(`[STATS] Daily stats retrieved: ${formatted.length} days for user: ${req.userId}`);
    res.json(formatted);
  } catch (error) {
    console.error(`[STATS] Error fetching daily stats:`, error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/tasks', auth, async (req, res) => {
  try {
    console.log(`[STATS] Fetching task stats for user: ${req.userId}`);
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const sessions = await Session.aggregate([
      // In aggregations, MongoDB does not cast string -> ObjectId for us
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $group: {
          _id: '$taskId',
          taskName: { $first: '$task.name' },
          completedPomodoros: { $sum: 1 },
          totalFocusTime: { $sum: '$duration' }
        }
      },
      { $sort: { totalFocusTime: -1 } }
    ]);
    
    const formatted = sessions.map(s => ({
      taskId: String(s._id),
      taskName: s.taskName,
      completedPomodoros: s.completedPomodoros,
      totalFocusTime: s.totalFocusTime
    }));
    
    console.log(`[STATS] Task stats retrieved: ${formatted.length} tasks for user: ${req.userId}`);
    res.json(formatted);
  } catch (error) {
    console.error(`[STATS] Error fetching task stats:`, error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

