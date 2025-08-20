import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  Plus,
  Award,
  BarChart3,
  Megaphone,
  UserCheck,
  Search,
  Trophy,
  Target,
  Code
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const participantLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/events', icon: Search, label: 'Discover Events' },
  { to: '/dashboard/my-events', icon: Calendar, label: 'My Events' },
  { to: '/dashboard/teams', icon: Users, label: 'My Teams' },
  { to: '/dashboard/submissions', icon: FileText, label: 'Submissions' },
  { to: '/dashboard/announcements', icon: Megaphone, label: 'Announcements & Chat' },
  { to: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

const organizerLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/create-event', icon: Plus, label: 'Create Event' },
  { to: '/dashboard/my-events', icon: Calendar, label: 'My Events' },
  { to: '/dashboard/participants', icon: Users, label: 'Participants' },
  { to: '/dashboard/judges', icon: UserCheck, label: 'Judges' },
  { to: '/dashboard/judges-reviews', icon: FileText, label: 'Judges Reviews' },
  { to: '/dashboard/plagiarism', icon: Code, label: 'Plagiarism' },
  { to: '/dashboard/organizer-sponsors', icon: Trophy, label: 'Sponsors' },
  { to: '/dashboard/winners', icon: Trophy, label: 'Winners' },
  { to: '/dashboard/announcements', icon: Megaphone, label: 'Announcements & Chat' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

const judgeLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/dashboard/assigned-events', icon: Calendar, label: 'Assigned Events' },
  { to: '/dashboard/reviews', icon: Award, label: 'Project Reviews' },
  { to: '/dashboard/announcements', icon: Megaphone, label: 'Announcements & Chat' },
  { to: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'organizer':
        return organizerLinks;
      case 'judge':
        return judgeLinks;
      default:
        return participantLinks;
    }
  };

  const getRoleColor = () => {
    const colorMap = {
      organizer: 'blue',
      participant: 'green',
      judge: 'orange',
    };
    return colorMap[user.role];
  };

  const getRoleAccentClasses = (isActive: boolean) => {
    const colorMap = {
      organizer: isActive 
        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50' 
        : 'text-gray-300 hover:text-neon-blue hover:bg-gray-900/50',
      participant: isActive 
        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
        : 'text-gray-300 hover:text-neon-green hover:bg-gray-900/50',
      judge: isActive 
        ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50' 
        : 'text-gray-300 hover:text-neon-orange hover:bg-gray-900/50',
    };
    return colorMap[user.role];
  };

  const getRoleTextClass = () => {
    const colorMap = {
      organizer: 'neon-text-blue',
      participant: 'neon-text-green',
      judge: 'neon-text-orange',
    };
    return colorMap[user.role];
  };

  const links = getLinks();

  return (
    <div className="w-64 bg-black/80 backdrop-blur-md border-r border-neon-purple/20 h-screen sticky top-16 overflow-y-auto scrollbar-neon">
      <div className="p-6">
        <div className="mb-8">
          <h3 className={`text-lg font-orbitron font-bold ${getRoleTextClass()} capitalize`}>
            {user.role} Dashboard
          </h3>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {user.name}</p>
        </div>

        <nav className="space-y-2">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group ${getRoleAccentClasses(isActive)}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Role-specific quick actions */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            {user.role === 'organizer' && (
              <Link
                to="/dashboard/create-event"
                className="flex items-center space-x-2 text-sm text-neon-blue hover:text-blue-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </Link>
            )}
            {user.role === 'participant' && (
              <Link
                to="/dashboard/events"
                className="flex items-center space-x-2 text-sm text-neon-green hover:text-green-400 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Find Events</span>
              </Link>
            )}
            {user.role === 'judge' && (
              <Link
                to="/dashboard/reviews"
                className="flex items-center space-x-2 text-sm text-neon-orange hover:text-orange-400 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>Review Projects</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};