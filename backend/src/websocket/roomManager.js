const rooms = new Map();

function joinRoom(roomCode, role, ws) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, { focuser: null, guardian: null });
  }

  const room = rooms.get(roomCode);

  if (role === 'focuser') {
    room.focuser = ws;
  } else if (role === 'guardian') {
    room.guardian = ws;
  }

  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

function removeFromRoom(roomCode, role) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room[role] = null;

  if (!room.focuser && !room.guardian) {
    rooms.delete(roomCode);
  }
}

function sendToClient(ws, type, payload = {}) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function isRoomReady(room) {
  return room.focuser !== null && room.guardian !== null;
}

module.exports = { joinRoom, getRoom, removeFromRoom, sendToClient, isRoomReady };