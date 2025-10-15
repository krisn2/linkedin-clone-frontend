import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { API_BASE_URL } from "../../config";

export default function ChatWindow({ receiver, onClose }) {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    if (receiver) fetchMessages();
  }, [receiver]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new incoming messages
  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg) => {
      if (
        msg.sender._id === receiver._id ||
        msg.sender === receiver._id ||
        msg.receiverId === user._id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [socket, receiver]);

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${receiver._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Send new message
  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg = {
      sender: user,
      text,
      receiverId: receiver._id,
    };
    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: receiver._id,
      text,
    });
    setMessages((prev) => [...prev, newMsg]);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-t-lg">
        <h3 className="font-semibold">{receiver.name}</h3>
        <button onClick={onClose} className="hover:text-gray-200">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm">Start a new conversation...</p>
        )}
        {messages.map((m, i) => {
          const isMine = m.sender?._id === user._id || m.sender === user._id;
          return (
            <div
              key={i}
              className={`flex flex-col ${
                isMine ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm shadow-sm ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="font-semibold text-xs mb-1">
                  {isMine ? "You" : m.sender?.name || receiver.name}
                </p>
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="flex border-t p-2 bg-white">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
