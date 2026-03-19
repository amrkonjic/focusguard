// globalni state aplikacije - bilo koja komponenta moze direktno dohvatit roomCode, ulogu korisnika, podatke sesije
// inace bi se moralo prosljedivati kroz propse 


// roomProvider omotava cijelu aplikaciju i cini state dostupnim svima
// useRoom - costum hook koji moze pozvati bilo koja komponenta ako zeli dohvatiti ili promjeniti taj state
// (umisto useState u svakoj stranici posebno, imamo jedno centralno misto)


import { createContext, useContext, useState } from "react";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('roomCode') || null);
  const [role, setRole] = useState(() => sessionStorage.getItem('role') || null);
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem('roomId') || null);
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);

  function clearRoom() {
    setRoomCode(null);
    setRole(null);
    setRoomId(null);
    setSession(null);
    setStats(null);
    sessionStorage.removeItem('roomCode');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('roomId');
  }

  return (
    <RoomContext.Provider value={{
      roomCode, setRoomCode,
      role, setRole,
      roomId, setRoomId,
      session, setSession,
      stats, setStats,
      clearRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}