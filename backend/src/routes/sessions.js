const express = require('express');
const router = express.Router();
const { getSessionByRoomId, getSessionStats } = require('../models/Session');

router.get('/room/:roomId', (req, res) => {
  try {
    const session = getSessionByRoomId(req.params.roomId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'No session found' });
    }
    if (session.ended_at) {
      return res.status(410).json({ success: false, message: 'Session has already ended' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
});

router.get('/:sessionId/stats', (req, res) => {
  try {
    const stats = getSessionStats(req.params.sessionId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});


module.exports = router;