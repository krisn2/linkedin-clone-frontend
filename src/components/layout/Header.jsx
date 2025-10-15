import { Home, User, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import ChatWindow from "../chat/ChatWindow";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

export default function Header() {
  const { user, logout, token } = useAuth();
  const socket = useSocket();
  const location = useLocation();

  const [showChatList, setShowChatList] = useState(false);
  const [activeReceiver, setActiveReceiver] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [onlineSet, setOnlineSet] = useState(new Set());

  useEffect(() => {
    if (token) fetchConversations();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      setUnreadMessages((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
      fetchConversations();

      // Toast only if user not chatting
      if (!location.pathname.includes("/chat")) {
        toast.custom((t) => (
          <div
            className={`bg-white border shadow-lg rounded-lg p-3 flex items-center gap-3 transition-all duration-300 ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {msg.sender?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{msg.sender?.name}</p>
              <p className="text-sm text-gray-600 line-clamp-1">{msg.text}</p>
            </div>
          </div>
        ));
      }
    };

    const handleOnlineUsers = (list) => {
      setOnlineSet(new Set(list.map(String)));
    };

    const handleUserOnline = ({ userId }) =>
      setOnlineSet((prev) => new Set(prev).add(String(userId)));

    const handleUserOffline = ({ userId }) =>
      setOnlineSet((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });

    socket.on("receiveMessage", handleReceive);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const totalUnread = Object.values(unreadMessages).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          SocialApp
        </Link>

        <nav className="flex items-center gap-8 relative">
          <Link
            to="/"
            className={`flex flex-col items-center ${
              location.pathname === "/"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Home size={20} />
          </Link>

          <button
            onClick={() => setShowChatList((v) => !v)}
            className="relative text-gray-600 hover:text-blue-600 transition"
            title="Messages"
          >
            <MessageSquare size={22} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>

          <Link
            to="/profile"
            className={`flex flex-col items-center ${
              location.pathname === "/profile"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User size={20} />
          </Link>

          <button
            onClick={logout}
            className="flex flex-col items-center text-gray-600 hover:text-red-600 transition"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>

      {/* Chat List Dropdown */}
      {showChatList && (
        <div className="absolute right-4 top-14 bg-white border rounded-lg shadow-lg w-64 z-50">
          <h3 className="font-semibold p-3 border-b text-gray-800">
            Messages
          </h3>
          <ul>
            {conversations.length === 0 ? (
              <li className="p-3 text-gray-500 text-sm">
                No conversations yet
              </li>
            ) : (
              conversations.map((c) =>
                c.participants
                  .filter((p) => p._id !== user._id)
                  .map((other) => (
                    <li
                      key={other._id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setActiveReceiver(other);
                        setShowChatList(false);
                        setUnreadMessages((prev) => {
                          const copy = { ...prev };
                          delete copy[other._id];
                          return copy;
                        });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                          {other.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {other.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {other.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onlineSet.has(String(other._id)) ? (
                          <span className="block w-3 h-3 rounded-full bg-green-400" />
                        ) : (
                          <span className="block w-3 h-3 rounded-full bg-gray-300" />
                        )}
                        {unreadMessages[other._id] && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadMessages[other._id]}
                          </span>
                        )}
                      </div>
                    </li>
                  ))
              )
            )}
          </ul>
        </div>
      )}

      {/* Chat Popup */}
      {activeReceiver && (
        <ChatWindow
          receiver={activeReceiver}
          onClose={() => setActiveReceiver(null)}
        />
      )}
    </header>
  );
}
