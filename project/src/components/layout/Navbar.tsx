import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Zap, User, LogOut, Bell, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfile(false);
  };

  const getRoleColor = () => {
    if (!user) return 'purple';
    const colorMap = {
      organizer: 'blue' as const,
      participant: 'green' as const,
      judge: 'orange' as const,
    };
    return colorMap[user.role];
  };

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-neon-purple/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-neon-purple" />
            <span className="text-2xl font-orbitron font-bold neon-text">HackVerse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="text-gray-300 hover:text-neon-purple transition-colors">
              Events
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-neon-purple transition-colors">
              Leaderboard
            </Link>
            <Link to="/sponsors" className="text-gray-300 hover:text-neon-purple transition-colors">
              Sponsors
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-neon-purple transition-colors">
              About
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-gray-300 hover:text-neon-purple transition-colors">
                  Dashboard
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-gray-300 hover:text-neon-purple transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-purple rounded-full animate-pulse" />
                    )}
                  </button>
                  
                  {showNotifications && (
                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-neon-purple transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-8 h-8 rounded-full border-2 border-neon-${getRoleColor()}`}
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="hidden lg:block">{user.name}</span>
                  </button>
                  
                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-48 neon-card rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-800">
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        </div>
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-neon-purple"
                          onClick={() => setShowProfile(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-red-400"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="primary">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-neon-purple"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-t border-neon-purple/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/events"
              className="block px-3 py-2 text-gray-300 hover:text-neon-purple"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/leaderboard"
              className="block px-3 py-2 text-gray-300 hover:text-neon-purple"
              onClick={() => setIsOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              to="/sponsors"
              className="block px-3 py-2 text-gray-300 hover:text-neon-purple"
              onClick={() => setIsOpen(false)}
            >
              Sponsors
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 text-gray-300 hover:text-neon-purple"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-300 hover:text-neon-purple"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="px-3 py-2 text-gray-300">
                  Welcome, {user.name}
                </div>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-gray-300 hover:text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};