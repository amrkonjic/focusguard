import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(onMessage, autoJoin = null, disableReconnect = false) {
  const ws = useRef(null);
  const onMessageRef = useRef(onMessage);
  const pendingMessages = useRef([]);
  const autoJoinRef = useRef(autoJoin);
  const unmounted = useRef(false);
  const disableReconnectRef = useRef(disableReconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    autoJoinRef.current = autoJoin;
  }, [autoJoin]);

  useEffect(() => {
    disableReconnectRef.current = disableReconnect;
  }, [disableReconnect]);

  useEffect(() => {
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;

      const socket = new WebSocket("ws://localhost:3001");

      socket.onopen = () => {
        if (unmounted.current) { socket.close(); return; }
        console.log("WebSocket connected");
        if (autoJoinRef.current) {
          socket.send(JSON.stringify({ type: "JOIN_ROOM", payload: autoJoinRef.current }));
        }
        pendingMessages.current.forEach((msg) => socket.send(msg));
        pendingMessages.current = [];
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);
        onMessageRef.current(data);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        if (!unmounted.current && !disableReconnectRef.current) {
          setTimeout(connect, 1000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      ws.current = socket;
    }

    connect();

    return () => {
      unmounted.current = true;
      if (ws.current) ws.current.close();
    };
  }, []);

  const sendMessage = useCallback((type, payload = {}) => {
    const message = JSON.stringify({ type, payload });
    console.log("Sending:", type, "readyState:", ws.current?.readyState);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.log("WebSocket not open, queuing message");
      pendingMessages.current.push(message);
    }
  }, []);

  return { sendMessage };
}