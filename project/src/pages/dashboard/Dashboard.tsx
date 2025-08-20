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
  BarChart3
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { OrganizerDashboard } from './OrganizerDashboard';
import { JudgeDashboard } from './JudgeDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Debug logging
  console.log('Dashboard rendered with user:', user);

  // Render role-specific dashboards
  if (user?.role === 'organizer') {
    console.log('Rendering OrganizerDashboard');
    return <OrganizerDashboard />;
  }

  if (user?.role === 'judge') {
    console.log('Rendering JudgeDashboard');
    return <JudgeDashboard />;
  }

  console.log('Rendering ParticipantDashboard (default)');
  
  const getRoleColor = () => {
    if (!user) return 'purple';
    const colorMap = {
      organizer: 'blue' as const,
      participant: 'green' as const,
      judge: 'orange' as const,
    };
    return colorMap[user.role];
  };

  const stats = {
    participant: [
      { icon: Calendar, label: 'Events Joined', value: '12', color: 'text-neon-green' },
      { icon: Users, label: 'Teams Formed', value: '8', color: 'text-neon-blue' },
      { icon: Trophy, label: 'Awards Won', value: '3', color: 'text-yellow-400' },
      { icon: Activity, label: 'Projects', value: '15', color: 'text-neon-purple' }
    ],
    organizer: [
      { icon: Calendar, label: 'Events Created', value: '25', color: 'text-neon-blue' },
      { icon: Users, label: 'Total Participants', value: '1,234', color: 'text-neon-green' },
      { icon: Trophy, label: 'Prizes Awarded', value: '$125K', color: 'text-yellow-400' },
      { icon: TrendingUp, label: 'Success Rate', value: '95%', color: 'text-neon-purple' }
    ],
    judge: [
      { icon: Calendar, label: 'Events Judged', value: '18', color: 'text-neon-orange' },
      { icon: Users, label: 'Projects Reviewed', value: '156', color: 'text-neon-blue' },
      { icon: Trophy, label: 'Winners Selected', value: '42', color: 'text-yellow-400' },
      { icon: CheckCircle, label: 'Completion Rate', value: '100%', color: 'text-neon-green' }
    ]
  };

  const recentActivities = {
    participant: [
      { 
        type: 'submission', 
        title: 'New project submitted to AI Challenge',
        time: '2 hours ago',
        icon: CheckCircle,
        color: 'text-neon-green'
      },
      { 
        type: 'team', 
        title: 'Invited to join Team Alpha',
        time: '4 hours ago',
        icon: Users,
        color: 'text-neon-blue'
      },
      { 
        type: 'event', 
        title: 'Registered for Web3 Hackathon',
        time: '1 day ago',
        icon: Calendar,
        color: 'text-neon-purple'
      },
      { 
        type: 'award', 
        title: 'Won 2nd place in Blockchain Challenge',
        time: '3 days ago',
        icon: Trophy,
        color: 'text-yellow-400'
      }
    ],
    organizer: [
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
    ],
    judge: [
      { 
        type: 'review', 
        title: 'Completed review for Team Beta',
        time: '30 minutes ago',
        icon: CheckCircle,
        color: 'text-neon-orange'
      },
      { 
        type: 'assignment', 
        title: 'Assigned to HealthTech Challenge',
        time: '2 hours ago',
        icon: Target,
        color: 'text-neon-blue'
      },
      { 
        type: 'feedback', 
        title: 'Provided feedback for 5 projects',
        time: '4 hours ago',
        icon: Award,
        color: 'text-neon-green'
      },
      { 
        type: 'score', 
        title: 'Scored final round submissions',
        time: '1 day ago',
        icon: Trophy,
        color: 'text-yellow-400'
      }
    ]
  };

  const upcomingEvents = [
    {
      title: 'AI Innovation Challenge',
      date: '2024-12-15',
      status: 'registered',
      participants: 150,
      role: (() => {
        if (user?.role === 'organizer') return 'organizing';
        if (user?.role === 'judge') return 'judging';
        return 'participating';
      })()
    },
    {
      title: 'Web3 Future Hackathon', 
      date: '2024-12-22',
      status: 'open',
      participants: 89,
      role: 'available'
    },
    {
      title: 'Sustainability Tech',
      date: '2025-01-05',
      status: 'upcoming',
      participants: 45,
      role: 'available'
    }
  ];

  const currentStats = stats[user?.role as keyof typeof stats] || stats.participant;
  const currentActivities = recentActivities[user?.role as keyof typeof recentActivities] || recentActivities.participant;

  const getQuickActions = () => {
    switch (user?.role) {
      case 'organizer':
        return [
          { label: 'Create Event', icon: Plus, to: '/dashboard/create-event', color: 'neon-button-blue' },
          { label: 'Manage Events', icon: Calendar, to: '/dashboard/my-events', color: 'neon-button' },
          { label: 'View Analytics', icon: BarChart3, to: '/dashboard/analytics', color: 'neon-button-green' }
        ];
      case 'judge':
        return [
          { label: 'Review Projects', icon: Award, to: '/dashboard/reviews', color: 'neon-button-orange' },
          { label: 'View Assignments', icon: Target, to: '/dashboard/assigned-events', color: 'neon-button' },
          { label: 'Check Schedule', icon: Calendar, to: '/dashboard/assigned-events', color: 'neon-button-blue' }
        ];
      default:
        return [
          { label: 'Find Events', icon: Calendar, to: '/dashboard/events', color: 'neon-button-green' },
          { label: 'Join Team', icon: Users, to: '/dashboard/teams?action=join', color: 'neon-button' },
          { label: 'Submit Project', icon: Code, to: '/dashboard/submissions', color: 'neon-button-blue' }
        ];
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
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-400 mt-1 capitalize">
            Here's what's happening in your {user?.role} dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Button variant="ghost" className="relative" roleColor={getRoleColor()}>
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-purple rounded-full animate-pulse" />
          </Button>
          
          <div className="flex space-x-2">
            {getQuickActions().slice(0, 2).map((action, index) => (
              <Link key={index} to={action.to}>
                <Button size="sm" roleColor={getRoleColor()}>
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="text-center" roleColor={getRoleColor()}>
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
        <Card roleColor={getRoleColor()}>
          <h2 className="text-xl font-orbitron font-bold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getQuickActions().map((action, index) => (
              <Link key={index} to={action.to}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col space-y-2"
                  roleColor={getRoleColor()}
                >
                  <action.icon className="w-6 h-6" />
                  <span>{action.label}</span>
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
            <Card roleColor={getRoleColor()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  Recent Activity
                </h2>
                <Button variant="ghost" size="sm" roleColor={getRoleColor()}>
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {currentActivities.map((activity, index) => (
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

        {/* Upcoming Events */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card roleColor={getRoleColor()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  {user?.role === 'organizer' ? 'My Events' : 'Upcoming Events'}
                </h2>
                <Button variant="ghost" size="sm" roleColor={getRoleColor()}>
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium text-sm">{event.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.status === 'registered' ? `bg-${getRoleColor() === 'blue' ? 'neon-blue' : getRoleColor() === 'green' ? 'neon-green' : 'neon-orange'}/20 text-${getRoleColor() === 'blue' ? 'neon-blue' : getRoleColor() === 'green' ? 'neon-green' : 'neon-orange'}` :
                        event.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {event.role === 'organizing' ? 'Organizing' :
                         event.role === 'judging' ? 'Judging' :
                         event.role === 'participating' ? 'Participating' :
                         event.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>{event.participants} participants</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to={user?.role === 'organizer' ? '/dashboard/my-events' : '/dashboard/events'}>
                <Button className="w-full mt-4" variant="outline" roleColor={getRoleColor()}>
                  {user?.role === 'organizer' ? 'Manage Events' : 'Browse More Events'}
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};