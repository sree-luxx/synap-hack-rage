import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Activity,
  Plus,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Award,
  Code,
  Zap,
  BarChart3,
  Settings,
  MessageSquare,
  Star
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Calendar, label: 'Events Created', value: '25', color: 'text-neon-blue' },
    { icon: Users, label: 'Total Participants', value: '1,234', color: 'text-neon-green' },
    { icon: Trophy, label: 'Prizes Awarded', value: '$125K', color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'Success Rate', value: '95%', color: 'text-neon-purple' }
  ];

  const recentActivities = [
    { 
      type: 'event', 
      title: 'AI Innovation Challenge published',
      time: '1 hour ago',
      icon: Calendar,
      color: 'text-neon-blue'
    },
    { 
      type: 'registration', 
      title: '25 new participants registered',
      time: '3 hours ago',
      icon: Users,
      color: 'text-neon-green'
    },
    { 
      type: 'judge', 
      title: 'Judge assigned to Web3 event',
      time: '5 hours ago',
      icon: Award,
      color: 'text-neon-orange'
    },
    { 
      type: 'announcement', 
      title: 'Posted update about timeline',
      time: '1 day ago',
      icon: Bell,
      color: 'text-neon-purple'
    }
  ];

  const upcomingEvents = [
    {
      title: 'AI Innovation Challenge',
      date: '2024-12-15',
      status: 'ongoing',
      participants: 150,
      maxParticipants: 200
    },
    {
      title: 'Web3 Future Hackathon', 
      date: '2024-12-22',
      status: 'published',
      participants: 89,
      maxParticipants: 150
    },
    {
      title: 'Sustainability Tech',
      date: '2025-01-05',
      status: 'draft',
      participants: 0,
      maxParticipants: 100
    }
  ];

  const quickActions = [
    { label: 'Create Event', icon: Plus, to: '/dashboard/create-event', color: 'neon-button-blue' },
    { label: 'Manage Events', icon: Calendar, to: '/dashboard/my-events', color: 'neon-button' },
    { label: 'View Analytics', icon: BarChart3, to: '/dashboard/analytics', color: 'neon-button-green' },
    { label: 'Manage Judges', icon: Award, to: '/dashboard/judges', color: 'neon-button-orange' },
    { label: 'Announcements', icon: Bell, to: '/dashboard/announcements', color: 'neon-button-purple' },
    { label: 'Participants', icon: Users, to: '/dashboard/participants', color: 'neon-button-cyan' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500/20 text-green-400';
      case 'published': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-orbitron font-bold neon-text">
            Organizer Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {user?.name}! Manage your events and participants
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Button variant="ghost" className="relative" roleColor="blue">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-purple rounded-full animate-pulse" />
          </Button>
          
          <Link to="/dashboard/create-event">
            <Button size="sm" roleColor="blue">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="text-center" roleColor="blue">
              <div className="flex justify-center mb-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-orbitron font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card roleColor="blue">
          <h2 className="text-xl font-orbitron font-bold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.to}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col space-y-2"
                  roleColor="blue"
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card roleColor="blue">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  Recent Activity
                </h2>
                <Button variant="ghost" size="sm" roleColor="blue">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-900/50`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.title}</p>
                      <div className="flex items-center mt-1">
                        <Clock className="w-3 h-3 text-gray-500 mr-1" />
                        <span className="text-gray-500 text-xs">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* My Events */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card roleColor="blue">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  My Events
                </h2>
                <Link to="/dashboard/my-events">
                  <Button variant="ghost" size="sm" roleColor="blue">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium text-sm">{event.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>{event.participants}/{event.maxParticipants} participants</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/dashboard/my-events">
                <Button className="w-full mt-4" variant="outline" roleColor="blue">
                  Manage All Events
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};



