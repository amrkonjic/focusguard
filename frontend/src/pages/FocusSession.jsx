import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useWebSocket } from "../hooks/useWebSocket";
import EncouragementToast from "../components/EncouragementToast";

export default function FocusSession() {
  const { roomCode, session, setSession, setStats, roomId} = useRoom();
  const navigate = useNavigate();
  const [breakPending, setBreakPending] = useState(false);
  const [encouragement, setEncouragement] = useState(null);
  const [breakDenied, setBreakDenied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [breakDuration, setBreakDuration] = useState(5);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(null);
  const [showBreakOptions, setShowBreakOptions] = useState(false);

  const intervalRef = useRef(null);
  const breakIntervalRef = useRef(null);
  const pausedRef = useRef(false);
  const totalSeconds = session ? session.durationMinutes * 60 : 0;

  const autoJoin = useMemo(() => ({ roomCode, role: "focuser" }), [roomCode]);
  const pauseStartRef = useRef(null);
  const totalPausedRef = useRef(0);

  const { sendMessage } = useWebSocket((message) => {
    if (message.type === "BREAK_RESULT") {
        setBreakPending(false);
        setShowBreakOptions(false);
        if (message.approved) {
            setPaused(true);
            pausedRef.current = true;
            pauseStartRef.current = Date.now();
            const breakSecs = message.breakDurationMinutes * 60;
            setBreakSecondsLeft(breakSecs);
            startBreakTimer(breakSecs);
        } else {
            setBreakDenied(true);
            setTimeout(() => setBreakDenied(false), 3000);
        }
    }

    if (message.type === "SESSION_STARTED") {
      setSession({
        ...message.session,
        durationMinutes: message.session.duration_minutes ?? message.session.durationMinutes
      });
    }

    if (message.type === "ENCOURAGEMENT") setEncouragement(message.message);
    
    if (message.type === "RESUME_SESSION") {
        if (pauseStartRef.current) {
            totalPausedRef.current += Date.now() - pauseStartRef.current;
            pauseStartRef.current = null;
        }
        setPaused(false);
        pausedRef.current = false;
        setBreakSecondsLeft(null);
        clearInterval(breakIntervalRef.current);
    }
    
    if (message.type === "SESSION_ENDED") {
      setStats(message.stats);
      navigate("/end");
    }
  }, autoJoin, !!session);


useEffect(() => {
  console.log("useEffect se okida:", { session, roomId });
  
  if (session) {
    console.log("session već postoji, preskačem fetch");
    return;
  }
  if (!roomId) {
    console.log("roomId je null, preskačem fetch");
    return;
  }
  
  fetch(`https://focusguard-cbhfgaauayh9eha7.westeurope-01.azurewebsites.net/api/sessions/room/${roomId}`)
    .then(r => r.json())
    .then(data => {
      console.log("odgovor od servera:", data);
      if (data.success) {
        const s = data.session;
        setSession({
          ...s,
          durationMinutes: s.duration_minutes ?? s.durationMinutes
        });
      }
    })
    .catch(err => console.error('Failed to fetch session:', err));
}, [roomId]);


useEffect(() => {
  if (!totalSeconds) return;

  const startedAt = session?.started_at
    ? new Date(session.started_at.replace(' ', 'T') + 'Z').getTime()
    : Date.now();

  const alreadyElapsed = Math.min(
    Math.floor((Date.now() - startedAt) / 1000),
    totalSeconds
  );

  setElapsed(alreadyElapsed);

  const startTime = Date.now() - alreadyElapsed * 1000;

  intervalRef.current = setInterval(() => {
    if (pausedRef.current) return;
    const newElapsed = Math.floor((Date.now() - startTime - totalPausedRef.current) / 1000);
    setElapsed(newElapsed);
    if (newElapsed >= totalSeconds) {
      clearInterval(intervalRef.current);
      handleSessionEnd(true);
    }
  }, 500);

  return () => clearInterval(intervalRef.current);
}, [totalSeconds]);


useEffect(() => {
  if (!session) return;

  async function handleVisibilityChange() {
    if (document.hidden) {
      console.log("šaljem tab switch fetch");
      try {
        const res = await fetch("https://focusguard-cbhfgaauayh9eha7.westeurope-01.azurewebsites.net/api/rooms/tab-switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode })
        });
        console.log("fetch odgovor:", res.status);
      } catch (e) {
        console.log("fetch greška:", e);
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [session, roomCode]);

  function startBreakTimer(seconds) {
  clearInterval(breakIntervalRef.current);
  const endTime = Date.now() + seconds * 1000;
  
  breakIntervalRef.current = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    setBreakSecondsLeft(remaining);
    if (remaining <= 0) {
      clearInterval(breakIntervalRef.current);
      sendMessage("BREAK_TIMER_END", { roomCode });
    }
  }, 500);
}

  function handleBreakRequest() {
    setShowBreakOptions(true);
  }

  function handleSendBreakRequest() {
    if (!session) return;
    setBreakPending(true);
    sendMessage("BREAK_REQUEST", { roomCode, sessionId: session.id, breakDurationMinutes: breakDuration });
  }

  function handleSessionEnd(completed) {
    if (!session) return;
    clearInterval(intervalRef.current);
    clearInterval(breakIntervalRef.current);
    sendMessage("SESSION_END", { roomCode, sessionId: session.id, completed });
  }

  const secondsLeft = Math.max(totalSeconds - elapsed, 0);
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = totalSeconds ? (elapsed / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 45;

  const breakMins = breakSecondsLeft !== null ? Math.floor(breakSecondsLeft / 60).toString().padStart(2, "0") : "00";
  const breakSecs = breakSecondsLeft !== null ? (breakSecondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white font-sans relative overflow-hidden px-4">
      <EncouragementToast message={encouragement} onClose={() => setEncouragement(null)} />

      <p className="text-neutral-600 text-xs tracking-widest uppercase mb-10">Focus Session</p>

      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={paused ? "#eab308" : "#6366f1"} strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-extrabold tracking-tight">{minutes}:{seconds}</span>
          <span className="text-neutral-600 text-xs mt-1 tracking-widest uppercase">
            {paused ? "paused" : "remaining"}
          </span>
        </div>
      </div>

      {paused && breakSecondsLeft !== null && (
        <div className="mb-6 bg-yellow-950/50 border border-yellow-500 rounded-xl px-6 py-4 text-center">
          <p className="text-yellow-400 text-xs uppercase tracking-widest mb-1">Break ends in</p>
          <p className="text-yellow-300 text-3xl font-extrabold">{breakMins}:{breakSecs}</p>
        </div>
      )}

      {breakDenied && (
        <div className="mb-6 bg-orange-950/50 border border-orange-500 rounded-xl px-5 py-3 text-orange-400 text-sm">
          Your guardian says: keep going! 💪
        </div>
      )}

      {showBreakOptions && !breakPending && (
        <div className="mb-6 bg-neutral-900 border border-neutral-700 rounded-xl px-6 py-5 w-full max-w-xs text-center">
          <p className="text-neutral-400 text-sm mb-3">How long do you need?</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 10, 15, 20].map((d) => (
              <button
                key={d}
                onClick={() => setBreakDuration(d)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  breakDuration === d
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBreakOptions(false)}
              className="flex-1 py-2 rounded-xl border border-neutral-700 text-neutral-500 text-sm transition-colors hover:border-neutral-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSendBreakRequest}
              className="flex-1 py-2 rounded-xl border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold text-sm transition-colors"
            >
              Send Request
            </button>
          </div>
        </div>
      )}

      {!paused && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {!breakPending && !showBreakOptions && (
            <button
              onClick={handleBreakRequest}
              className="w-full py-3 rounded-xl border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold transition-colors"
            >
              Request Break
            </button>
          )}
          {breakPending && (
            <div className="flex items-center gap-3 text-neutral-500 text-sm py-3">
              <div className="w-4 h-4 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin" />
              Waiting for guardian's response...
            </div>
          )}
          <button
            onClick={() => handleSessionEnd(false)}
            className="w-full py-3 rounded-xl border border-neutral-800 text-neutral-600 hover:border-neutral-600 text-sm transition-colors"
          >
            End Session
          </button>
        </div>
      )}
    </div>
  );
}