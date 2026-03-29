import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Compass, MessageCircle, User, Shield, LogOut,
  Menu, X, Bell, MailOpen, MailPlus, Moon, Sun,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserMe } from '@/hooks/useUserMe';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import clsx from 'clsx';
import { AnnouncementModal } from './AnnouncementModal';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/conversations', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

const HIDDEN_PATHS = ['/login', '/register', '/setup', '/recover-password', '/reset-password', '/confirm'];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [announcementId, setAnnouncementId] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, profilePicture } = useUserMe();
  const { notifications, markAllAsRead, hasUnread } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const isAdmin = user?.username === 'pulgamecanica';
  const hidden = HIDDEN_PATHS.includes(location.pathname) || location.pathname.startsWith('/intra/callback');

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notifOpen) markAllAsRead();
  }, [notifOpen, markAllAsRead]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (hidden) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNotifClick = (n: any) => {
    switch (n.type) {
      case 'announcement':
        if (n.target_id) setAnnouncementId(parseInt(n.target_id));
        break;
      case 'like':
      case 'unlike':
      case 'match':
      case 'connection':
      case 'view':
      case 'other':
        navigate(`/profile/${n.from_username}`);
        break;
      case 'message':
      case 'date':
        navigate(`/conversations?user=${n.from_username}`);
        break;
    }
    setNotifOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link to="https://github.com/42-Course/matcha" className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/logo/fixed.png"
                alt="Matcha"
                className="h-8 w-auto"
              />
            </Link>

            {/* Center: Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(to)
                      ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive('/admin')
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(prev => !prev)}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Bell size={18} />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 text-sm overflow-hidden">
                    <div className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      Notifications
                    </div>
                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.length === 0 && (
                        <li className="px-4 py-6 text-center text-gray-400">No notifications yet</li>
                      )}
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={clsx(
                            'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer',
                            n.read !== 't' && 'bg-blue-50 dark:bg-blue-900/10'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">{n.message}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {n.from_username || 'System'} · {new Date(n.created_at).toLocaleString()}
                              </div>
                            </div>
                            {n.read === 't'
                              ? <MailOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              : <MailPlus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            }
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Profile avatar (desktop) */}
              <Link
                to="/profile"
                className="hidden md:block ml-1"
              >
                <img
                  src={profilePicture?.url || '/default.png'}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-pink-400 transition"
                />
              </Link>

              {/* Logout (desktop) */}
              <button
                onClick={logout}
                className="hidden md:flex items-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                title="Log out"
              >
                <LogOut size={18} />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(to)
                      ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive('/admin')
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
              <hr className="border-gray-200 dark:border-gray-800 my-2" />
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {announcementId && (
        <AnnouncementModal
          announcementId={announcementId}
          onClose={() => setAnnouncementId(null)}
        />
      )}
    </>
  );
}
