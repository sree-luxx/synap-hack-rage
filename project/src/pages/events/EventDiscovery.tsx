import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy,
  Clock,
  Globe,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';
import { apiFetch } from '../../lib/api';

export const EventDiscovery: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const defaultBanner = 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const genericImages = [
    'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3861961/pexels-photo-3861961.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];
  const themeImages: Record<string, string[]> = {
    'Artificial Intelligence': [
      'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/8386336/pexels-photo-8386336.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Blockchain & Crypto': [
      'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6770772/pexels-photo-6770772.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Sustainability': [
      'https://images.pexels.com/photos/9028894/pexels-photo-9028894.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/7658329/pexels-photo-7658329.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Healthcare': [
      'https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/4167544/pexels-photo-4167544.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Mobile Apps': [
      'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1181243/pexels-photo-1181243.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Cybersecurity': [
      'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/5380655/pexels-photo-5380655.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Web Development': [
      'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Data Science': [
      'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Gaming': [
      'https://images.pexels.com/photos/907173/pexels-photo-907173.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/845917/pexels-photo-845917.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    'Education': [
      'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/4144096/pexels-photo-4144096.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  };

  const hashString = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const getBannerForEvent = (e: Event) => {
    if (e.bannerUrl && e.bannerUrl.trim().length > 0) return e.bannerUrl;
    const imgs = themeImages[e.theme]?.length ? themeImages[e.theme] : genericImages;
    const idx = hashString(e.id || e.title) % imgs.length;
    return imgs[idx] || defaultBanner;
  };

  const mergeWithLocalPublished = (base: Event[]) => {
    const stored: Event[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) as string;
        if (key && key.startsWith('hv_events_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          list.forEach((e: any) => {
            if (e.status === 'published') {
              stored.push({
                id: e.id,
                title: e.title,
                description: e.description || '',
                theme: e.theme || 'General',
                startDate: new Date(e.startDate),
                endDate: new Date(e.endDate),
                registrationDeadline: new Date(e.registrationDeadline || e.startDate),
                mode: e.mode,
                location: e.location || (e.mode === 'online' ? 'Virtual' : ''),
                maxTeamSize: e.maxTeamSize || 4,
                prizes: e.prizes || [],
                sponsors: e.sponsors || [],
                tracks: e.tracks || [],
                rules: e.rules || 'Standard rules',
                timeline: e.timeline || [],
                organizerId: e.organizerId,
                status: 'published',
                registrations: e.registrations || 0,
                maxParticipants: e.maxParticipants || 100,
                bannerUrl: e.bannerUrl,
                rounds: e.rounds || []
              });
            }
          });
        }
      }
    } catch {}
    const byId = new Map<string, Event>();
    [...base, ...stored].forEach(ev => byId.set(ev.id, ev));
    return Array.from(byId.values());
  };

  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'open', label: 'Open for Registration' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'online', label: 'Online' },
    { id: 'offline', label: 'In-Person' },
    { id: 'hybrid', label: 'Hybrid' }
  ];

  const themes = [
    'All Themes',
    'Artificial Intelligence',
    'Blockchain & Crypto',
    'Web Development',
    'Mobile Apps',
    'IoT & Hardware',
    'Data Science',
    'Cybersecurity',
    'Gaming',
    'Healthcare',
    'Education',
    'Sustainability'
  ];

  useEffect(() => {
    // First try API; fallback to local organizer store + mock
    (async () => {
      setIsLoading(true);
      try {
        const apiEvents = await apiFetch<any[]>(`/api/events`);
        const mapped: Event[] = (apiEvents || []).map((e: any) => ({
          id: e.id,
          title: e.name,
          description: e.description || '',
          theme: e.theme || 'General',
          startDate: new Date(e.startAt),
          endDate: new Date(e.endAt),
          registrationDeadline: new Date(e.startAt),
          mode: e.online ? 'online' : 'offline',
          location: e.location || (e.online ? 'Virtual' : ''),
          maxTeamSize: 4,
          prizes: (e.prizes || []).map((p: any, idx: number) => ({ rank: idx + 1, amount: p.title || '', description: p.description || '' })),
          sponsors: (e.sponsors || []).map((s: any) => ({ name: s.name, logo: s.logoUrl || '', tier: 'gold' as const })),
          tracks: (e.tracks || []).map((t: any) => t.name),
          rules: (e.rules || []).map((r: any) => r.text).join('\n'),
          timeline: [],
          organizerId: e.organizerId,
          status: (e.status as any) || 'published',
          registrations: Array.isArray(e.registrations) ? e.registrations.length : (e.registrations || 0),
          maxParticipants: e.maxParticipants || 200,
          bannerUrl: '',
          rounds: [],
        }));
        // Keep going to merge with organizer local events below; do not early return
        let aggregate: Event[] = mapped;
        // Merge in organizer-published events saved in localStorage
        const stored: Event[] = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            if (key && key.startsWith('hv_events_')) {
              const list = JSON.parse(localStorage.getItem(key) || '[]');
              list.forEach((e: any) => {
                if (e.status === 'published') {
                  stored.push({
                    id: e.id,
                    title: e.title,
                    description: e.description || '',
                    theme: e.theme || 'General',
                    startDate: new Date(e.startDate),
                    endDate: new Date(e.endDate),
                    registrationDeadline: new Date(e.registrationDeadline),
                    mode: e.mode,
                    location: e.location || (e.mode === 'online' ? 'Virtual' : ''),
                    maxTeamSize: e.maxTeamSize || 4,
                    prizes: e.prizes || [],
                    sponsors: e.sponsors || [],
                    tracks: e.tracks || [],
                    rules: e.rules || 'Standard rules',
                    timeline: e.timeline || [],
                    organizerId: e.organizerId,
                    status: 'published',
                    registrations: e.registrations || 0,
                    maxParticipants: e.maxParticipants || 100,
                    bannerUrl: e.bannerUrl,
                    rounds: e.rounds || []
                  });
                }
              });
            }
          }
        } catch {}
        const byId = new Map<string, Event>();
        [...aggregate, ...stored].forEach(ev => byId.set(ev.id, ev));
        const mergedList = Array.from(byId.values());
        setEvents(mergedList);
        setFilteredEvents(mergedList);
        setIsLoading(false);
        return;
      } catch {}
      const mockEvents: Event[] = [
      {
        id: '1',
        title: 'AI Innovation Challenge',
        description: 'Build the next generation of AI-powered applications that solve real-world problems.',
        theme: 'Artificial Intelligence',
        startDate: new Date('2024-12-15T09:00:00'),
        endDate: new Date('2024-12-17T18:00:00'),
        registrationDeadline: new Date('2024-12-10T23:59:59'),
        mode: 'hybrid',
        location: 'San Francisco, CA',
        maxTeamSize: 4,
        prizes: [{ rank: 1, amount: '$50,000', description: 'Grand Prize' }],
        sponsors: [],
        tracks: ['Healthcare AI', 'Educational Technology'],
        rules: 'Standard hackathon rules apply',
        timeline: [],
        organizerId: 'org-1',
        status: 'published',
        registrations: 150,
        maxParticipants: 200,
        bannerUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      },
      {
        id: '2',
        title: 'Web3 Future Hackathon',
        description: 'Create decentralized applications that will shape the future of the internet.',
        theme: 'Blockchain & Crypto',
        startDate: new Date('2024-12-22T10:00:00'),
        endDate: new Date('2024-12-24T20:00:00'),
        registrationDeadline: new Date('2024-12-18T23:59:59'),
        mode: 'online',
        location: 'Virtual',
        maxTeamSize: 5,
        prizes: [{ rank: 1, amount: '$25,000', description: 'First Place' }],
        sponsors: [],
        tracks: ['DeFi', 'NFTs', 'DAOs'],
        rules: 'Blockchain-focused development',
        timeline: [],
        organizerId: 'org-2',
        status: 'published',
        registrations: 89,
        maxParticipants: 150,
        bannerUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      },
      {
        id: '3',
        title: 'Sustainability Tech Challenge',
        description: 'Develop technology solutions to combat climate change and promote sustainability.',
        theme: 'Sustainability',
        startDate: new Date('2025-01-05T09:00:00'),
        endDate: new Date('2025-01-07T18:00:00'),
        registrationDeadline: new Date('2025-01-01T23:59:59'),
        mode: 'offline',
        location: 'Austin, TX',
        maxTeamSize: 4,
        prizes: [{ rank: 1, amount: '$30,000', description: 'Green Innovation Prize' }],
        sponsors: [],
        tracks: ['Clean Energy', 'Waste Management', 'Carbon Tracking'],
        rules: 'Focus on environmental impact',
        timeline: [],
        organizerId: 'org-3',
        status: 'published',
        registrations: 45,
        maxParticipants: 100,
        bannerUrl: 'https://images.pexels.com/photos/9028894/pexels-photo-9028894.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      },
      {
        id: '4',
        title: 'HealthTech Innovation',
        description: 'Revolutionary healthcare solutions using cutting-edge technology.',
        theme: 'Healthcare',
        startDate: new Date('2025-01-12T08:00:00'),
        endDate: new Date('2025-01-14T19:00:00'),
        registrationDeadline: new Date('2025-01-08T23:59:59'),
        mode: 'hybrid',
        location: 'Boston, MA',
        maxTeamSize: 6,
        prizes: [{ rank: 1, amount: '$40,000', description: 'Healthcare Innovation Award' }],
        sponsors: [],
        tracks: ['Telemedicine', 'Medical Devices', 'Health Analytics'],
        rules: 'Healthcare compliance required',
        timeline: [],
        organizerId: 'org-4',
        status: 'published',
        registrations: 78,
        maxParticipants: 120,
        bannerUrl: 'https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      },
      {
        id: '5',
        title: 'Mobile App Championship',
        description: 'Create the next viral mobile application with innovative features.',
        theme: 'Mobile Apps',
        startDate: new Date('2025-01-20T09:00:00'),
        endDate: new Date('2025-01-22T17:00:00'),
        registrationDeadline: new Date('2025-01-15T23:59:59'),
        mode: 'online',
        location: 'Virtual',
        maxTeamSize: 3,
        prizes: [{ rank: 1, amount: '$35,000', description: 'Mobile Innovation Prize' }],
        sponsors: [],
        tracks: ['iOS Development', 'Android Development', 'Cross-Platform'],
        rules: 'Mobile-first development',
        timeline: [],
        organizerId: 'org-5',
        status: 'published',
        registrations: 120,
        maxParticipants: 180,
        bannerUrl: 'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      },
      {
        id: '6',
        title: 'Cybersecurity Defense',
        description: 'Build robust security solutions to protect against modern cyber threats.',
        theme: 'Cybersecurity',
        startDate: new Date('2025-02-01T10:00:00'),
        endDate: new Date('2025-02-03T16:00:00'),
        registrationDeadline: new Date('2025-01-25T23:59:59'),
        mode: 'offline',
        location: 'Washington, DC',
        maxTeamSize: 4,
        prizes: [{ rank: 1, amount: '$45,000', description: 'Security Excellence Award' }],
        sponsors: [],
        tracks: ['Network Security', 'Application Security', 'Threat Intelligence'],
        rules: 'Security-focused development',
        timeline: [],
        organizerId: 'org-6',
        status: 'published',
        registrations: 95,
        maxParticipants: 140,
        bannerUrl: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
        rounds: []
      }
    ];

    // Merge in organizer-published events saved in localStorage
    const stored: Event[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) as string;
        if (key && key.startsWith('hv_events_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          list.forEach((e: any) => {
            if (e.status === 'published') {
              stored.push({
                id: e.id,
                title: e.title,
                description: e.description || '',
                theme: e.theme || 'General',
                startDate: new Date(e.startDate),
                endDate: new Date(e.endDate),
                registrationDeadline: new Date(e.registrationDeadline),
                mode: e.mode,
                location: e.location || (e.mode === 'online' ? 'Virtual' : ''),
                maxTeamSize: e.maxTeamSize || 4,
                prizes: e.prizes || [],
                sponsors: e.sponsors || [],
                tracks: e.tracks || [],
                rules: e.rules || 'Standard rules',
                timeline: e.timeline || [],
                organizerId: e.organizerId,
                status: 'published',
                registrations: e.registrations || 0,
                maxParticipants: e.maxParticipants || 100,
                bannerUrl: e.bannerUrl,
                rounds: e.rounds || []
              });
            }
          });
        }
      }
    } catch {}

      // Merge by id, prefer stored entries for recency
      const byId = new Map<string, Event>();
      [...mockEvents, ...stored].forEach(ev => byId.set(ev.id, ev));
      const merged = Array.from(byId.values());
      setEvents(merged);
      setFilteredEvents(merged);
      setIsLoading(false);
    })();
  }, []);

  // Live refresh when organizer publishes/unpublishes in another tab/session on same origin
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('hv_events_') || e.key === 'hv_events_updated') {
        setEvents(prev => mergeWithLocalPublished(prev));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.theme.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status/Mode filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(event => {
        const now = new Date();
        const registrationDeadline = new Date(event.registrationDeadline);
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        switch (selectedFilter) {
          case 'open':
            return now < registrationDeadline;
          case 'upcoming':
            return now < startDate;
          case 'ongoing':
            return now >= startDate && now <= endDate;
          case 'online':
          case 'offline':
          case 'hybrid':
            return event.mode === selectedFilter;
          default:
            return true;
        }
      });
    }

    // Theme filter
    if (selectedTheme !== 'all' && selectedTheme !== 'All Themes') {
      filtered = filtered.filter(event => event.theme === selectedTheme);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedFilter, selectedTheme]);

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const registrationDeadline = new Date(event.registrationDeadline);
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now > endDate) return { status: 'completed', color: 'text-gray-400' };
    if (now >= startDate && now <= endDate) return { status: 'ongoing', color: 'text-neon-green' };
    if (now < registrationDeadline) return { status: 'open', color: 'text-neon-blue' };
    if (now < startDate) return { status: 'upcoming', color: 'text-yellow-400' };
    return { status: 'closed', color: 'text-red-400' };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neon-purple">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold neon-text mb-4">
            Discover Events
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find the perfect hackathon to showcase your skills and build amazing projects
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
            <div className="flex-1 w-full">
              <Input
                type="text"
                placeholder="Search events by name, theme, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
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
              
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="neon-input px-4 py-2.5 rounded-lg text-white bg-black/90"
              >
                {themes.map(theme => (
                  <option key={theme} value={theme === 'All Themes' ? 'all' : theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedFilter !== 'all' || selectedTheme !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchTerm && (
                <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedFilter !== 'all' && (
                <span className="px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-full text-sm">
                  {filters.find(f => f.id === selectedFilter)?.label}
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className="ml-2 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTheme !== 'all' && (
                <span className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full text-sm">
                  {selectedTheme}
                  <button
                    onClick={() => setSelectedTheme('all')}
                    className="ml-2 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            Showing {filteredEvents.length} of {events.length} events
          </p>
          
          {user?.role === 'organizer' && (
            <Link to="/dashboard/create-event">
              <Button>
                <Zap className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
              No events found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
                setSelectedTheme('all');
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => {
              const eventStatus = getEventStatus(event);
              const daysUntilStart = getDaysUntil(new Date(event.startDate));
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="h-full overflow-hidden group">
                    <div className="relative mb-4">
                      <img
                        src={getBannerForEvent(event)}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(ev) => { (ev.currentTarget as HTMLImageElement).src = defaultBanner; }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          event.mode === 'online' ? 'bg-neon-blue/20 text-neon-blue' :
                          event.mode === 'offline' ? 'bg-neon-pink/20 text-neon-pink' :
                          'bg-neon-purple/20 text-neon-purple'
                        }`}>
                          {event.mode.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold bg-black/80 ${eventStatus.color}`}>
                          {eventStatus.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {daysUntilStart > 0 && daysUntilStart <= 30 && (
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                            {daysUntilStart} days to go
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-neon-purple transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-neon-purple font-medium mb-3">{event.theme}</p>
                      
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-neon-purple" />
                        <span>{formatDate(new Date(event.startDate))}</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-neon-blue" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Users className="w-4 h-4 mr-2 text-neon-green" />
                        <span>{event.registrations}/{event.maxParticipants} participants</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                        <span>{event.prizes[0]?.amount} prize pool</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Registration</span>
                        <span>{Math.round((event.registrations / (event.maxParticipants || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((event.registrations / (event.maxParticipants || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <Link to={`/events/${event.id}`}>
                      <Button className="w-full group-hover:scale-105 transition-transform">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load More Button (for pagination) */}
        {filteredEvents.length > 0 && filteredEvents.length >= 6 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};