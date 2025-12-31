const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const session = new Session({ ...req.body, userId: req.userId });
    await session.save();
    res.json(session);
  } catch (error) {
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
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/tasks', auth, async (req, res) => {
  try {
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
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

