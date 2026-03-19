import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("focuser");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setRoomCode, setRole, setRoomId } = useRoom();
  const navigate = useNavigate();

  async function handleCreateRoom() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://focusguard-cbhfgaauayh9eha7.westeurope-01.azurewebsites.net/api/rooms/create", { method: "POST" });
      const data = await res.json();
      
      setRoomCode(data.room.code);
      setRoomId(data.room.id);
      setRole("focuser");
      sessionStorage.setItem('roomCode', data.room.code);
      sessionStorage.setItem('roomId', data.room.id);
      sessionStorage.setItem('role', 'focuser');
      navigate("/lobby");
    } catch {
      setError("Failed to create room. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://focusguard-cbhfgaauayh9eha7.westeurope-01.azurewebsites.net/api/rooms/${joinCode.toUpperCase()}`);
      const data = await res.json();
      if (!data.success) {
        setError("Room not found. Check the code and try again.");
        return;
      }
      setRoomCode(joinCode.toUpperCase());
      setRoomId(data.room.id);
      setRole(selectedRole);
      sessionStorage.setItem('roomCode', joinCode.toUpperCase());
      sessionStorage.setItem('roomId', data.room.id);
      sessionStorage.setItem('role', selectedRole);
      navigate("/lobby");
    } catch {
      setError("Failed to join room. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white px-4 font-sans">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">FocusGuard</h1>
      <p className="text-neutral-500 mb-10 text-sm">Stay focused. Your guardian is watching.</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm mb-4">
        <h2 className="font-semibold mb-1">Create a new room</h2>
        <p className="text-neutral-500 text-xs mb-4">You'll automatically become the focuser</p>
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 font-semibold transition-colors"
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>

      <div className="text-neutral-600 text-sm my-1">or</div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-semibold mb-4">Join existing room</h2>
        <input
          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-sm mb-3 outline-none focus:border-indigo-500 transition-colors"
          placeholder="Enter room code (e.g. TIGER-4821)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
        />
        <div className="flex items-center gap-2 mb-4">
          <span className="text-neutral-500 text-sm">Join as:</span>
          {["focuser", "guardian"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedRole === r
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleJoinRoom}
          disabled={loading || !joinCode.trim()}
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 font-semibold transition-colors"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
}