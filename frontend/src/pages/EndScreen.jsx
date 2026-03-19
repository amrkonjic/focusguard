import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

export default function EndScreen() {
  const { stats } = useRoom();
  const navigate = useNavigate();
  const session = stats?.session;
  const completed = session?.completed === 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4 font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{completed ? "🎉" : "💪"}</div>
        <h1 className="text-2xl font-extrabold mb-2">{completed ? "Session Complete!" : "Session Ended"}</h1>
        <p className="text-neutral-500 mb-8 text-sm">
          {completed ? "You stayed focused the entire time." : "Good effort. Every minute counts."}
        </p>

        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { value: session?.duration_minutes ?? "-", label: "Minutes planned" },
              { value: stats.totalBreakRequests, label: "Break requests" },
              { value: stats.approvedBreaks, label: "Approved" },
              { value: stats.deniedBreaks, label: "Denied" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-neutral-950 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-2xl font-extrabold text-indigo-400">{value}</span>
                <span className="text-neutral-600 text-xs">{label}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-bold transition-colors"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}