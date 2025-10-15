import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import { API_BASE_URL } from "../config";

export const useSocket = () => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log('socket connected', socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error", err.message || err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  return socketRef.current;
};