import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoomProvider } from "./context/RoomContext";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import FocusSession from "./pages/FocusSession";
import GuardianPanel from "./pages/GuardianPanel";
import EndScreen from "./pages/EndScreen";

export default function App() {
  return (
    <RoomProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/focus" element={<FocusSession />} />
          <Route path="/guardian" element={<GuardianPanel />} />
          <Route path="/end" element={<EndScreen />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}