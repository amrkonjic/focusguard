const express = require('express');
const router = express.Router();
const { createRoom, getRoomByCode } = require('../models/Room');
const { getRoom, sendToClient } = require('../websocket/roomManager');
const EVENTS = require('../websocket/events');

router.post('/create', (req, res) => {
  try {
    const room = createRoom();
    res.status(201).json({ success: true, room });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
});

router.get('/:code', (req, res) => {
  try {
    const room = getRoomByCode(req.params.code.toUpperCase());
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
});

router.post('/tab-switch', (req, res) => {
  const { roomCode } = req.body;
  
  const room = getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  sendToClient(room.guardian, EVENTS.TAB_SWITCH, {
    message: " Your focuser just switched tabs!"
  });

  res.json({ success: true });
});

module.exports = router;