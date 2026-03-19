import { useState, useEffect } from "react";

export default function Timer({ durationMinutes, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) { onExpire(); return; }
    const interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke="#6366f1" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="text-4xl font-extrabold tracking-tight z-10">{minutes}:{seconds}</span>
    </div>
  );
}