const EVENTS = require('./events');
const { joinRoom, getRoom, removeFromRoom, sendToClient, isRoomReady } = require('./roomManager');
const { getRoomByCode, updateRoomStatus } = require('../models/Room');
const { createSession, endSession, getSessionByRoomId, createBreakRequest, respondToBreakRequest, getSessionStats } = require('../models/Session');

function handleConnection(ws) {
  let currentRoomCode = null;
  let currentRole = null;

  ws.on('message', (data) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      return sendToClient(ws, EVENTS.ERROR, { message: 'Invalid message format' });
    }

    const { type, payload } = parsed;

  if (type === EVENTS.JOIN_ROOM) {
        const { roomCode, role } = payload;
        const roomRecord = getRoomByCode(roomCode);

        if (!roomRecord) {
            return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
        }

        currentRoomCode = roomCode;
        currentRole = role;

        const room = joinRoom(roomCode, role, ws);
        sendToClient(ws, EVENTS.ROOM_JOINED, { roomCode, role });

        if (isRoomReady(room)) {
            updateRoomStatus(roomRecord.id, 'ready');
            sendToClient(room.focuser, EVENTS.ROOM_READY, { roomCode });
            sendToClient(room.guardian, EVENTS.ROOM_READY, { roomCode });

            const activeSession = getSessionByRoomId(roomRecord.id);
            if (activeSession && !activeSession.ended_at) {
            sendToClient(ws, EVENTS.SESSION_STARTED, { session: activeSession });
            }
        }
    }

    if (type === EVENTS.SESSION_START) {
      const { roomCode, durationMinutes } = payload;
      const roomRecord = getRoomByCode(roomCode);
      const room = getRoom(roomCode);

      if (!roomRecord || !room) {
        return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
      }

      const session = createSession(roomRecord.id, durationMinutes);
      updateRoomStatus(roomRecord.id, 'active');

      sendToClient(room.focuser, EVENTS.SESSION_STARTED, { session });
      sendToClient(room.guardian, EVENTS.SESSION_STARTED, { session });
    }

    if (type === EVENTS.BREAK_REQUEST) {
        const { roomCode, sessionId, breakDurationMinutes } = payload;
        const room = getRoom(roomCode);
        if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
        const breakRequest = createBreakRequest(sessionId);
        sendToClient(room.guardian, EVENTS.BREAK_REQUEST, {
            breakRequestId: breakRequest.id,
            sessionId,
            breakDurationMinutes
        });
    }

    if (type === EVENTS.BREAK_RESPONSE) {
        const { roomCode, breakRequestId, approved, sessionId, breakDurationMinutes } = payload;
        const room = getRoom(roomCode);
        if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
        respondToBreakRequest(breakRequestId, approved);
        sendToClient(room.focuser, EVENTS.BREAK_RESULT, { approved, breakRequestId, breakDurationMinutes });
        if (!approved) {
            sendToClient(room.focuser, EVENTS.ENCOURAGEMENT, {
            message: "Your guardian believes in you. Stay focused! 💪"
            });
        }
    }

    if (type === EVENTS.SEND_ENCOURAGEMENT) {
      const { roomCode, message } = payload;
      const room = getRoom(roomCode);

      if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });

      sendToClient(room.focuser, EVENTS.ENCOURAGEMENT, { message });
    }

    if (type === EVENTS.TAB_SWITCH) {
      const { roomCode } = payload;
      console.log("TAB_SWITCH received, room:", getRoom(roomCode));
      const room = getRoom(roomCode);
      if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
      sendToClient(room.guardian, EVENTS.TAB_SWITCH, {
        message: " Your focuser just switched tabs!"
      });
    }

    if (type === EVENTS.RESUME_SESSION) {
      const { roomCode } = payload;
      const room = getRoom(roomCode);
      if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
      sendToClient(room.focuser, EVENTS.RESUME_SESSION, {});
      sendToClient(room.guardian, EVENTS.RESUME_SESSION, {});
    }

    if (type === EVENTS.BREAK_TIMER_END) {
      const { roomCode } = payload;
      const room = getRoom(roomCode);
      if (!room) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
      sendToClient(room.focuser, EVENTS.RESUME_SESSION, {});
      sendToClient(room.guardian, EVENTS.RESUME_SESSION, {});
    }

    if (type === EVENTS.SESSION_END) {
      const { roomCode, sessionId, completed } = payload;
      const room = getRoom(roomCode);
      const roomRecord = getRoomByCode(roomCode);

      if (!room || !roomRecord) return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });

      endSession(sessionId, completed);
      updateRoomStatus(roomRecord.id, 'finished');

      const stats = getSessionStats(sessionId);

      sendToClient(room.focuser, EVENTS.SESSION_ENDED, { stats });
      sendToClient(room.guardian, EVENTS.SESSION_ENDED, { stats });
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentRole) {
      const room = getRoom(currentRoomCode);
      if (room) {
        const other = currentRole === 'focuser' ? room.guardian : room.focuser;
        sendToClient(other, EVENTS.USER_DISCONNECTED, { role: currentRole });
      }
      removeFromRoom(currentRoomCode, currentRole);
    }
  });
}

module.exports = { handleConnection };