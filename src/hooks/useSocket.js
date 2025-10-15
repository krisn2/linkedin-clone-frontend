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
        socketRef.current.emit("manualDisconnect");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect error:", err.message || err);
    });

    const handleUnload = () => {
      socket.emit("manualDisconnect");
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [user, token]);

  return socketRef.current;
};
