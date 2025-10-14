import { Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-blue-600">SocialApp</h1>
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 transition ${
              location.pathname === '/' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home size={20} />
            <span className="text-xs font-medium hidden sm:block">Home</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition ${
              location.pathname === '/profile' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={20} />
            <span className="text-xs font-medium hidden sm:block">Profile</span>
          </Link>

          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut size={20} />
            <span className="text-xs font-medium hidden sm:block">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}