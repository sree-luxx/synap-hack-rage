import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Code, 
  Globe, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Search,
  Filter,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const Landing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockEvents = [
    {
      id: '1',
      title: 'AI Innovation Challenge',
      theme: 'Artificial Intelligence',
      date: '2024-12-15',
      mode: 'hybrid',
      participants: 150,
      prizes: '$50K',
      location: 'San Francisco, CA',
      status: 'open',
      bannerUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '2',
      title: 'Web3 Future Hackathon',
      theme: 'Blockchain & Crypto',
      date: '2024-12-22',
      mode: 'online',
      participants: 89,
      prizes: '$25K',
      location: 'Virtual',
      status: 'open',
      bannerUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '3',
      title: 'Sustainability Tech',
      theme: 'Green Technology',
      date: '2025-01-05',
      mode: 'offline',
      participants: 45,
      prizes: '$30K',
      location: 'Austin, TX',
      status: 'upcoming',
      bannerUrl: 'https://images.pexels.com/photos/9028894/pexels-photo-9028894.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '4',
      title: 'HealthTech Innovation',
      theme: 'Healthcare Technology',
      date: '2025-01-12',
      mode: 'hybrid',
      participants: 78,
      prizes: '$40K',
      location: 'Boston, MA',
      status: 'upcoming',
      bannerUrl: 'https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '5',
      title: 'EdTech Revolution',
      theme: 'Education Technology',
      date: '2025-01-20',
      mode: 'online',
      participants: 120,
      prizes: '$35K',
      location: 'Virtual',
      status: 'upcoming',
      bannerUrl: 'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '6',
      title: 'FinTech Disruptors',
      theme: 'Financial Technology',
      date: '2025-02-01',
      mode: 'offline',
      participants: 95,
      prizes: '$45K',
      location: 'New York, NY',
      status: 'upcoming',
      bannerUrl: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Easy Event Management',
      description: 'Create and manage hackathons with intuitive tools and real-time analytics.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Form teams, invite members, and collaborate seamlessly with built-in tools.'
    },
    {
      icon: Trophy,
      title: 'Fair Judging System',
      description: 'Multi-criteria scoring with transparent feedback and automated leaderboards.'
    },
    {
      icon: Code,
      title: 'Project Submissions',
      description: 'Upload code, demos, and documentation with integrated GitHub support.'
    }
  ];

  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'open', label: 'Open for Registration' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'online', label: 'Online' },
    { id: 'offline', label: 'In-Person' },
    { id: 'hybrid', label: 'Hybrid' }
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         event.status === selectedFilter || 
                         event.mode === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative gradient-bg particle-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-6">
              <span className="neon-text">Welcome to HackVerse</span>
              <br />
              <span className="text-white">Host & Join Innovation</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate platform for organizing and participating in hackathons. 
              Connect with innovators, build amazing projects, and win incredible prizes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto animate-pulse-slow">
                  <Zap className="w-5 h-5" />
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Events
              </Button>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { number: '500+', label: 'Active Hackathons' },
              { number: '10K+', label: 'Participants' },
              { number: '$2M+', label: 'Prize Pool' }
            ].map((stat, index) => (
              <Card key={index} className="text-center animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                <div className="text-3xl font-orbitron font-bold neon-text mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-orbitron font-bold neon-text mb-4">
              Why Choose HackVerse?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to run successful hackathons or participate in amazing challenges.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">
                    <feature.icon className="w-12 h-12 text-neon-purple" />
                  </div>
                  <h3 className="text-xl font-orbitron font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-orbitron font-bold neon-text mb-4">
              Discover Amazing Hackathons
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Join these incredible hackathons and showcase your skills to the world.
            </p>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <Input
                    type="text"
                    placeholder="Search events by name or theme..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-neon-purple" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="neon-input px-4 py-2.5 rounded-lg text-white bg-black/90"
                  >
                    {filters.map(filter => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card hover className="h-full overflow-hidden">
                  <div className="relative mb-4">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        event.mode === 'online' ? 'bg-neon-blue/20 text-neon-blue' :
                        event.mode === 'offline' ? 'bg-neon-pink/20 text-neon-pink' :
                        'bg-neon-purple/20 text-neon-purple'
                      }`}>
                        {event.mode.toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        event.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {event.status === 'open' ? 'Open' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-neon-purple font-medium mb-3">{event.theme}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{event.participants} participants</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Trophy className="w-4 h-4 mr-2" />
                      <span>{event.prizes} prizes</span>
                    </div>
                  </div>

                  <Link to={`/events/${event.id}`}>
                    <Button className="w-full" variant="outline">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                No events found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/events">
              <Button size="lg">
                View All Events
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-orbitron font-bold neon-text mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers, designers, and innovators who are building the future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  <Star className="w-5 h-5" />
                  Join as Participant
                </Button>
              </Link>
              
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <CheckCircle className="w-5 h-5" />
                  Become an Organizer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};