import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Lobby() {
  const { roomCode, role, setSession, setRoomId } = useRoom();
  const navigate = useNavigate();
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [duration, setDuration] = useState(25);

  const { sendMessage } = useWebSocket((message) => {
    if (message.type === "ROOM_READY") setPartnerJoined(true);
    if (message.type === "SESSION_STARTED") {
      const s = message.session;
      setSession({
        ...s,
        durationMinutes: s.duration_minutes ?? s.durationMinutes
      });
      setRoomId(s.room_id);
      sessionStorage.setItem('roomId', s.room_id);
      navigate(role === "focuser" ? "/focus" : "/guardian");
    }
  });

  useEffect(() => {
    if (roomCode && role) sendMessage("JOIN_ROOM", { roomCode, role });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4 font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 w-full max-w-sm text-center">
        <p className="text-neutral-500 text-sm mb-4">
          {role === "focuser" ? "🎯 You are the Focuser" : "🛡️ You are the Guardian"}
        </p>
        <p className="text-neutral-500 text-xs mb-2">Room Code</p>
        <div className="text-3xl font-extrabold tracking-widest bg-neutral-950 border border-neutral-700 rounded-xl py-4 mb-2">
          {roomCode}
        </div>
        <p className="text-neutral-600 text-xs mb-6">
          Share this code with your {role === "focuser" ? "guardian" : "focuser"}
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={`w-2.5 h-2.5 rounded-full ${partnerJoined ? "bg-green-500" : "bg-orange-400 animate-pulse"}`} />
          <span className="text-neutral-400 text-sm">
            {partnerJoined ? "Partner connected! Ready to start." : "Waiting for partner to join..."}
          </span>
        </div>

        {role === "focuser" && partnerJoined && (
          <div className="border-t border-neutral-800 pt-6">
            <p className="text-neutral-500 text-xs mb-3">Session duration (minutes)</p>
            <div className="flex justify-center gap-2 mb-5">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    duration === d
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
            <button
              onClick={() => sendMessage("SESSION_START", { roomCode, durationMinutes: duration })}
              className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 font-bold transition-colors"
            >
              Start Session
            </button>
          </div>
        )}

        {role === "guardian" && partnerJoined && (
          <p className="text-neutral-600 text-sm italic">Waiting for focuser to start the session...</p>
        )}
      </div>
    </div>
  );
}