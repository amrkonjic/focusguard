import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useWebSocket } from "../hooks/useWebSocket";
import BreakRequestModal from "../components/BreakRequestModal";

export default function GuardianPanel() {
  const { roomCode, session, setSession, setStats, roomId } = useRoom();
  const navigate = useNavigate();
  const [breakRequest, setBreakRequest] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(null);
  const [tabWarning, setTabWarning] = useState(false);

  const intervalRef = useRef(null);
  const pausedRef = useRef(false);
  const totalSeconds = session ? session.durationMinutes * 60 : 0;

  const autoJoin = useMemo(() => ({ roomCode, role: "guardian" }), [roomCode]);

  const pauseStartRef = useRef(null);
  const totalPausedRef = useRef(0);

  const { sendMessage } = useWebSocket((message) => {
    if (message.type === "SESSION_STARTED") {
      setSession({
        ...message.session,
        durationMinutes: message.session.duration_minutes ?? message.session.durationMinutes
      });
    }
    if (message.type === "BREAK_REQUEST") {
      setBreakRequest({
        id: message.breakRequestId,
        sessionId: message.sessionId,
        breakDurationMinutes: message.breakDurationMinutes
      });
    }
    if (message.type === "TAB_SWITCH") {
      setTabWarning(true);
      setTimeout(() => setTabWarning(false), 5000);
    }
    if (message.type === "RESUME_SESSION") {
      if (pauseStartRef.current) {
        totalPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      
      setPaused(false);
      pausedRef.current = false;
      setBreakSecondsLeft(null);
    }
    if (message.type === "SESSION_ENDED") {
      setStats(message.stats);
      navigate("/end");
    }
  }, autoJoin, !!session);

  useEffect(() => {
    if (session) return;
    if (!roomId) return;

    fetch(`https://focusguard-cbhfgaauayh9eha7.westeurope-01.azurewebsites.net/api/sessions/room/${roomId}`)
      .then(r => r.json())
      .then(data => {
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
    if (!session?.started_at) return;

    const startedAt = new Date(session.started_at.replace(' ', 'T') + 'Z').getTime();
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
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [totalSeconds]);

  useEffect(() => {
    if (!paused || breakSecondsLeft === null) return;
    const endTime = Date.now() + breakSecondsLeft * 1000;

    const interval = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      setBreakSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [paused]);

  function handleBreakResponse(approved) {
    if (!breakRequest) return;
    sendMessage("BREAK_RESPONSE", {
      roomCode,
      breakRequestId: breakRequest.id,
      sessionId: breakRequest.sessionId,
      approved,
      breakDurationMinutes: breakRequest.breakDurationMinutes,
    });
    if (approved) {
      setPaused(true);
      pausedRef.current = true;
      pauseStartRef.current = Date.now();
      setBreakSecondsLeft(breakRequest.breakDurationMinutes * 60);
    }
    setBreakRequest(null);
  }

  const secondsLeft = Math.max(totalSeconds - elapsed, 0);
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = totalSeconds ? (elapsed / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 45;

  const breakMins = breakSecondsLeft !== null ? Math.floor(breakSecondsLeft / 60).toString().padStart(2, "0") : "00";
  const breakSecs = breakSecondsLeft !== null ? (breakSecondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white font-sans relative px-4">
      {breakRequest && (
        <BreakRequestModal
          duration={breakRequest.breakDurationMinutes}
          onApprove={() => handleBreakResponse(true)}
          onDeny={() => handleBreakResponse(false)}
        />
      )}

      <p className="text-neutral-600 text-xs tracking-widest uppercase mb-10">Guardian Panel</p>

      {tabWarning && (
        <div className="mb-6 bg-red-950/50 border border-red-500 rounded-xl px-5 py-3 text-red-400 text-sm animate-pulse">
          ⚠️ Your focuser just switched tabs!
        </div>
      )}

      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={paused ? "#eab308" : "#22c55e"} strokeWidth="4"
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

      {session ? (
        <p className="text-neutral-600 text-sm mb-4">
          Monitoring a <span className="text-white font-semibold">{session.durationMinutes} min</span> session
        </p>
      ) : (
        <p className="text-neutral-700 text-sm mb-4">Waiting for session to start...</p>
      )}

      {!paused && (
        <p className="text-neutral-700 text-xs text-center max-w-xs">
          You'll be notified if your focuser requests a break
        </p>
      )}
    </div>
  );
}