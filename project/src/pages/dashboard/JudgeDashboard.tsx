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
  Star,
  FileText,
  Eye
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const JudgeDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Calendar, label: 'Events Judged', value: '18', color: 'text-neon-orange' },
    { icon: Users, label: 'Projects Reviewed', value: '156', color: 'text-neon-blue' },
    { icon: Trophy, label: 'Winners Selected', value: '42', color: 'text-yellow-400' },
    { icon: CheckCircle, label: 'Completion Rate', value: '100%', color: 'text-neon-green' }
  ];

  const recentActivities = [
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
  ];

  const assignedEvents = [
    {
      title: 'AI Innovation Challenge',
      date: '2024-12-15',
      status: 'judging',
      projectsToReview: 25,
      completedReviews: 20
    },
    {
      title: 'Web3 Future Hackathon', 
      date: '2024-12-22',
      status: 'upcoming',
      projectsToReview: 18,
      completedReviews: 0
    },
    {
      title: 'Sustainability Tech',
      date: '2025-01-05',
      status: 'completed',
      projectsToReview: 30,
      completedReviews: 30
    }
  ];

  const quickActions = [
    { label: 'Review Projects', icon: Award, to: '/dashboard/reviews', color: 'neon-button-orange' },
    { label: 'View Assignments', icon: Target, to: '/dashboard/assigned-events', color: 'neon-button' },
    { label: 'Check Schedule', icon: Calendar, to: '/dashboard/assigned-events', color: 'neon-button-blue' },
    { label: 'View Criteria', icon: FileText, to: '/dashboard/reviews', color: 'neon-button-green' },
    { label: 'Submit Scores', icon: CheckCircle, to: '/dashboard/reviews', color: 'neon-button-purple' },
    { label: 'Profile Settings', icon: Settings, to: '/dashboard/profile', color: 'neon-button-cyan' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'judging': return 'bg-orange-500/20 text-orange-400';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
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
            Judge Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {user?.name}! Review projects and provide expert feedback
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Button variant="ghost" className="relative" roleColor="orange">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-purple rounded-full animate-pulse" />
          </Button>
          
          <Link to="/dashboard/reviews">
            <Button size="sm" roleColor="orange">
              <Award className="w-4 h-4" />
              Review Projects
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
            <Card hover className="text-center" roleColor="orange">
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
        <Card roleColor="orange">
          <h2 className="text-xl font-orbitron font-bold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.to}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col space-y-2"
                  roleColor="orange"
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
            <Card roleColor="orange">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  Recent Activity
                </h2>
                <Button variant="ghost" size="sm" roleColor="orange">
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

        {/* Assigned Events */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card roleColor="orange">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  Assigned Events
                </h2>
                <Link to="/dashboard/assigned-events">
                  <Button variant="ghost" size="sm" roleColor="orange">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {assignedEvents.map((event, index) => (
                  <div key={index} className="border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium text-sm">{event.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <span>{event.completedReviews}/{event.projectsToReview} reviews</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-neon-orange h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(event.completedReviews, event.projectsToReview)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {getProgressPercentage(event.completedReviews, event.projectsToReview)}% complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/dashboard/assigned-events">
                <Button className="w-full mt-4" variant="outline" roleColor="orange">
                  View All Assignments
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};



