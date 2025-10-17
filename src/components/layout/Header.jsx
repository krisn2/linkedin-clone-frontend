import { Home, User, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useState, useEffect, useCallback } from "react";
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

  // Load existing conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // SOCKET EVENT HANDLING
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const sender =
        typeof msg.sender === "object"
          ? msg.sender
          : { _id: msg.sender, name: "Unknown User" };

      // ✅ Add unread count for that user
      setUnreadMessages((prev) => ({
        ...prev,
        [sender._id]: (prev[sender._id] || 0) + 1,
      }));

      // Refresh conversation list
      fetchConversations();

      // ✅ Toast notification that opens chat on click
      toast.custom((t) => (
        <div
          onClick={(e) => {
            e.preventDefault();
            setActiveReceiver(sender);
            setUnreadMessages((prev) => {
              const copy = { ...prev };
              delete copy[sender._id];
              return copy;
            });
            toast.dismiss(t.id);
          }}
          className={`cursor-pointer bg-white border shadow-lg rounded-lg p-3 flex items-center gap-3 transition-all ${
            t.visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {sender.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{sender.name}</p>
            <p className="text-sm text-gray-600 line-clamp-1">{msg.text}</p>
          </div>
        </div>
      ));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("onlineUsers", (list) => setOnlineSet(new Set(list.map(String))));
    socket.on("userOnline", ({ userId }) =>
      setOnlineSet((prev) => new Set(prev).add(String(userId)))
    );
    socket.on("userOffline", ({ userId }) => {
      setOnlineSet((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    });

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("onlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [socket, fetchConversations]);

  // Total unread count
  const totalUnread = Object.values(unreadMessages).reduce((a, b) => a + b, 0);

  // ✅ Clear unread count when opening chat directly
  const openChat = (receiver) => {
    setActiveReceiver(receiver);
    setShowChatList(false);
    setUnreadMessages((prev) => {
      const copy = { ...prev };
      delete copy[receiver._id];
      return copy;
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          SocialApp
        </Link>

        <nav className="flex items-center gap-8 relative">
          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }
          >
            <Home size={20} />
          </Link>

          {/* 🔵 Chat Icon with dynamic count */}
          <button
            onClick={() => setShowChatList((v) => !v)}
            className="relative text-gray-600 hover:text-blue-600 transition"
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
            className={
              location.pathname === "/profile"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }
          >
            <User size={20} />
          </Link>

          <button
            onClick={logout}
            className="text-gray-600 hover:text-red-600 transition"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>

      {/* 🗂️ Chat List */}
      {showChatList && (
        <div className="absolute right-4 top-14 bg-white border rounded-lg shadow-lg w-64 z-50">
          <h3 className="font-semibold p-3 border-b text-gray-800">Messages</h3>
          <ul>
            {conversations.length === 0 ? (
              <li className="p-3 text-gray-500 text-sm">No conversations yet</li>
            ) : (
              conversations.map((c) =>
                c.participants
                  .filter((p) => p._id !== user._id)
                  .map((other) => (
                    <li
                      key={other._id}
                      onClick={() => openChat(other)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
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
                      {unreadMessages[other._id] && (
                        <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadMessages[other._id]}
                        </span>
                      )}
                    </li>
                  ))
              )
            )}
          </ul>
        </div>
      )}

      {/* Online Users Bar */}
      {socket && onlineSet.size > 0 && (
        <div className="overflow-x-auto whitespace-nowrap px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2">
          {[...onlineSet].map((id) => {
            const foundUser = conversations
              .flatMap((c) => c.participants)
              .find((p) => p._id === id);
            if (!foundUser || foundUser._id === user._id) return null;

            return (
              <button
                key={id}
                onClick={() => openChat(foundUser)}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {foundUser.name}
              </button>
            );
          })}
        </div>
      )}

      {activeReceiver && (
        <ChatWindow
          receiver={activeReceiver}
          onClose={() => setActiveReceiver(null)}
        />
      )}
    </header>
  );
}
