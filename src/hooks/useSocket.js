import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import { API_BASE_URL } from "../config";

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const socket = io(API_BASE_URL);
      socket.emit("register", user._id);
      socketRef.current = socket;
      return () => socket.disconnect();
    }
  }, [user]);

  return socketRef.current;
};
