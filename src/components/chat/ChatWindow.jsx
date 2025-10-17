import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

export default function ChatWindow({
  receiver,
  onClose,
  index = 0,
  initialIsOnline = false,
}) {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isReceiverOnline, setIsReceiverOnline] = useState(initialIsOnline);
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (
        msg.sender === receiver._id ||
        msg.sender?._id === receiver._id ||
        msg.receiverId === user._id
      ) {
        setMessages((prev) => [...prev, msg]);
        toast.custom((t) => (
          <div
            className={`bg-white border shadow-lg rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {receiver.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{receiver.name}</p>
              <p className="text-sm text-gray-600 line-clamp-1">{msg.text}</p>
            </div>
          </div>
        ));
      }
    };

    const handleTyping = ({ from, typing }) => {
      if (String(from) === String(receiver._id)) {
        setIsReceiverTyping(Boolean(typing));
        if (typing) {
          if (stopTypingTimerRef.current)
            clearTimeout(stopTypingTimerRef.current);
          stopTypingTimerRef.current = setTimeout(
            () => setIsReceiverTyping(false),
            3000
          );
        }
      }
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    };
  }, [socket, receiver, user._id]);

  useEffect(() => {
    setIsReceiverOnline(initialIsOnline);
  }, [initialIsOnline]);

  useEffect(() => {
    if (!receiver?._id || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${receiver._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [receiver, token]);

  // Send message
  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg = {
      sender: user,
      text,
      receiverId: receiver._id,
      createdAt: new Date().toISOString(),
    };
    socket?.emit("sendMessage", {
      senderId: user._id,
      receiverId: receiver._id,
      text,
    });
    setMessages((prev) => [...prev, newMsg]);
    setText("");
    emitTyping(false);
  };

  // Emit typing events (debounced)
  const emitTyping = (isTyping) => {
    if (!socket) return;
    socket.emit("typing", { to: receiver._id, typing: Boolean(isTyping) });
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1000);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{
        right: 16 + index * 320,
        maxWidth: 420,
      }}
    >
      <div className="w-[95vw] sm:w-80 md:w-96 bg-white rounded-lg shadow-lg border flex flex-col max-h-[80vh] animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-t-lg">
          <div>
            <h3 className="font-semibold">{receiver.name}</h3>
            <div className="text-xs text-blue-200 flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isReceiverOnline ? "bg-green-400" : "bg-gray-400"
                }`}
              />
              <span>{isReceiverOnline ? "Online" : "Offline"}</span>
            </div>
            {isReceiverTyping && (
              <div className="text-xs text-white/90 mt-1 animate-pulse">
                typing...
              </div>
            )}
          </div>
          <button
            onClick={() => {
              emitTyping(false);
              onClose();
            }}
            className="hover:text-gray-200"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              Start a new conversation...
            </p>
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
                  className={`max-w-[85%] p-2 rounded-lg text-sm shadow-sm transition-all duration-200 ${
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
            onChange={handleInputChange}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
