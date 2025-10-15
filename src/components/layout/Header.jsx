import { Home, User, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ChatWindow from '../chat/ChatWindow';
import { API_BASE_URL } from '../../config';

export default function Header() {
  const { user, logout, token } = useAuth();
  const socket = useSocket();
  const location = useLocation();

  const [showChatList, setShowChatList] = useState(false);
  const [activeReceiver, setActiveReceiver] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 

  useEffect(() => {
    if (token) fetchConversations();
  }, [token]);

  // Socket event listener for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receiveMessage', (msg) => {
      // Increment unread count & show alert
      setUnreadCount((prev) => prev + 1);
      alert(`💬 New message from ${msg.sender?.name || 'someone'}`);
      fetchConversations();
    });

    return () => socket.off('receiveMessage');
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">SocialApp</Link>

        <nav className="flex items-center gap-8 relative">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 transition ${
              location.pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home size={20} />
          </Link>

          {/* Message icon with badge */}
          <button
            onClick={() => {
              setShowChatList(!showChatList);
              setUnreadCount(0); // reset when opened
            }}
            className="relative flex items-center justify-center text-gray-600 hover:text-blue-600 transition"
            title="Messages"
          >
            <MessageSquare size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition ${
              location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={20} />
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>

      {/* Chat List Dropdown */}
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
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setActiveReceiver(other)}
                    >
                      {other.name}
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
