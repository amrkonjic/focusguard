const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function generateRoomCode() {
  const adjectives = ['TIGER', 'STORM', 'IRON', 'SWIFT', 'BOLD', 'KEEN', 'CALM', 'DARK'];
  const number = Math.floor(1000 + Math.random() * 9000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective}-${number}`;
}

function createRoom() {
  const id = uuidv4();            // 128-bitni nasumični string
  let code = generateRoomCode();

  while (getRoomByCode(code)) {
    code = generateRoomCode();
  }

  db.prepare('INSERT INTO rooms (id, code) VALUES (?, ?)').run(id, code);
  return { id, code };
}

function getRoomByCode(code) {
  return db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) || null;
}

function updateRoomStatus(id, status) {
  db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run(status, id);
}

module.exports = { createRoom, getRoomByCode, updateRoomStatus };