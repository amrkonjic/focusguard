const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function createSession(roomId, durationMinutes) {
  const id = uuidv4();
  db.prepare('INSERT INTO sessions (id, room_id, duration_minutes) VALUES (?, ?, ?)').run(id, roomId, durationMinutes);
  return { id, roomId, durationMinutes };
}

function endSession(sessionId, completed) {
  db.prepare('UPDATE sessions SET ended_at = CURRENT_TIMESTAMP, completed = ? WHERE id = ?').run(completed ? 1 : 0, sessionId);
}

function getSessionByRoomId(roomId) {
  return db.prepare('SELECT * FROM sessions WHERE room_id = ? ORDER BY started_at DESC LIMIT 1').get(roomId) || null;
}

function createBreakRequest(sessionId) {
  const id = uuidv4();
  db.prepare('INSERT INTO break_requests (id, session_id) VALUES (?, ?)').run(id, sessionId);
  return { id, sessionId };
}

function respondToBreakRequest(breakRequestId, approved) {
  db.prepare('UPDATE break_requests SET responded_at = CURRENT_TIMESTAMP, approved = ? WHERE id = ?').run(approved ? 1 : 0, breakRequestId);
}

function getSessionStats(sessionId) {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END) AS denied
    FROM break_requests
    WHERE session_id = ?
  `).get(sessionId);

  return {
    session,
    totalBreakRequests: stats.total,
    approvedBreaks: stats.approved,
    deniedBreaks: stats.denied
  };
}

module.exports = { createSession, endSession, getSessionByRoomId, createBreakRequest, respondToBreakRequest, getSessionStats };