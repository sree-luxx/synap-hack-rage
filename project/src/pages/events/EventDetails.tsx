import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  Globe,
  ArrowLeft,
  UserPlus,
  CheckCircle,
  ExternalLink,
  Star,
  Award,
  Target,
  MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Event } from '../../types';
import { apiFetch } from '../../lib/api';
import { Trophy as TrophyIcon } from 'lucide-react';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [roundId, setRoundId] = useState('');
  const [leaderRows, setLeaderRows] = useState<Array<{ teamId: string; total: number }>>([]);

  useEffect(() => {
    console.log('EventDetails useEffect triggered with ID:', id); // Debug log
    
    // Try backend first
    (async () => {
      if (!id) return;
      try {
        console.log('Attempting to fetch event from backend:', id);
        const e = await apiFetch<any>(`/api/events/${id}`);
        console.log('Backend event data:', e); // Debug log
        console.log('Backend event fields:', Object.keys(e)); // Debug: show all field names
        console.log('Backend event ID:', e?.id); // Debug: show the ID field
        console.log('Full backend response:', JSON.stringify(e, null, 2)); // Debug: show full response structure
        
        // Check if the response has a nested data structure
        const eventData = e?.data || e;
        console.log('Extracted event data:', eventData);
        console.log('Event data fields:', Object.keys(eventData || {}));
        
        // Ensure backend provided essential fields
        if (eventData && (eventData.id || eventData._id)) {
          console.log('Creating event object from backend data');
          const loaded: Event = {
            id: eventData.id || eventData._id, // Handle both id and _id fields
            title: eventData.name || eventData.title || 'Untitled Event',
            description: eventData.description || 'No description available',
            theme: eventData.theme || 'General',
            startDate: eventData.startAt ? new Date(eventData.startAt) : new Date(),
            endDate: eventData.endAt ? new Date(eventData.endAt) : new Date(),
            registrationDeadline: eventData.startAt ? new Date(eventData.startAt) : new Date(),
            mode: eventData.online === false ? 'offline' : eventData.online === true ? 'online' : 'hybrid',
            location: eventData.location || (eventData.online ? 'Virtual' : 'TBD'),
            maxTeamSize: 4,
            prizes: (eventData.prizes || []).map((p: any, idx: number) => ({ 
              rank: idx + 1, 
              amount: p.title || `Prize ${idx + 1}`, 
              description: p.description || 'Prize description' 
            })),
            sponsors: (eventData.sponsors || []).map((s: any) => ({ 
              name: s.name, 
              logo: s.logoUrl || '', 
              tier: 'gold' as const 
            })),
            tracks: (eventData.tracks || []).map((t: any) => t.name || t),
            rules: (eventData.rules || []).map((r: any) => r.text || r).join('\n') || 'Standard rules apply',
            timeline: [],
            organizerId: eventData.organizerId || 'unknown',
            status: 'published',
            registrations: Array.isArray(eventData.registrations) ? eventData.registrations.length : (eventData.registrations || 0),
            maxParticipants: 200,
            bannerUrl: '',
            rounds: [],
          };
          console.log('Setting event from backend:', loaded);
          setEvent(loaded);
          return; // Exit early if backend data is valid
        } else {
          console.log('Backend returned invalid data:', e);
          console.log('Missing required fields - id:', eventData?.id, 'name:', eventData?.name, 'title:', eventData?.title);
        }
      } catch (error) {
        console.error('Failed to load event from backend:', error);
        setLoadingError(`Backend error: ${(error as Error)?.message || 'Unknown error'}`);
      }
      
      // If backend failed or returned invalid data, try local storage
      console.log('Trying local storage fallback');
      let found: any | null = null;
      try {
        // First try to find in organizer's events
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) as string;
          if (key && key.startsWith('hv_events_')) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const ev = list.find((e: any) => e.id === id);
            if (ev) { found = ev; break; }
          }
        }
        
        // If not found, try the preview key
        if (!found) {
          const previewKey = `hv_event_preview_${id}`;
          const previewEvent = localStorage.getItem(previewKey);
          if (previewEvent) {
            found = JSON.parse(previewEvent);
            console.log('Found event in preview localStorage:', found);
          }
        }
      } catch {}

      if (found) {
        console.log('Found event in local storage:', found);
        const loaded: Event = {
          id: found.id,
          title: found.title,
          description: found.description || '',
          theme: found.theme || 'General',
          startDate: new Date(found.startDate),
          endDate: new Date(found.endDate),
          registrationDeadline: new Date(found.registrationDeadline),
          mode: found.mode,
          location: found.location || (found.mode === 'online' ? 'Virtual' : ''),
          maxTeamSize: found.maxTeamSize || 4,
          prizes: found.prizes || [],
          sponsors: found.sponsors || [],
          tracks: found.tracks || [],
          rules: found.rules || 'Standard rules',
          timeline: found.timeline?.map((t: any) => ({ ...t, date: new Date(t.date) })) || [],
          organizerId: found.organizerId,
          status: found.status || 'published',
          registrations: found.registrations || 0,
          maxParticipants: found.maxParticipants || 100,
          bannerUrl: found.bannerUrl,
          rounds: found.rounds || []
        };
        console.log('Setting event from local storage:', loaded);
        setEvent(loaded);
      } else {
        // Show error state instead of fallback mock
        console.log('Event not found in local storage or backend');
        setLoadingError(`Event with ID "${id}" not found in local storage or backend`);
        setEvent(null);
      }
    })();

    // Check registration from backend first, fallback to local
    (async () => {
      if (user && id) {
        try {
          const regs = await apiFetch<any[]>(`/api/registrations`);
          const has = (regs || []).some(r => (r.event?.id || r.eventId) === id);
          setIsRegistered(has);
        } catch {
          const regKey = `hv_reg_${user.id}_${id}`;
          setIsRegistered(!!localStorage.getItem(regKey));
        }
      }
    })();
  }, [id, user]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const qs = new URLSearchParams({ eventId: id });
        if (roundId) qs.set('roundId', roundId);
        const scores = await apiFetch<any[]>(`/api/scores?${qs.toString()}`);
        const byTeam: Record<string, number> = {};
        (scores||[]).forEach((s:any)=>{
          const teamId = s.teamId || s.team?.id;
          if (!teamId) return;
          const total = s.total || (s.criteria||[]).reduce((t:number,c:any)=>t+(c.score||0),0);
          byTeam[teamId] = (byTeam[teamId]||0) + total;
        });
        const rows = Object.entries(byTeam).map(([teamId,total])=>({ teamId, total: Number(total) }));
        rows.sort((a,b)=>b.total-a.total);
        setLeaderRows(rows);
      } catch {
        setLeaderRows([]);
      }
    })();
  }, [id, roundId]);

  const handleRegister = async () => {
    // Always redirect to login first; after login user can come back and register
    if (!user) {
      toast.info('Please login', 'You need to login to register for events');
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      if (!id) return;
      
      const registrationData: any = { eventId: id };
      if (registrationType === 'team' && teamName) {
        registrationData.teamName = teamName;
        registrationData.teamDescription = teamDescription;
        registrationData.registrationType = 'team';
      } else {
        registrationData.registrationType = 'individual';
      }
      
      const response = await apiFetch('/api/registrations', { 
        method: 'POST', 
        body: registrationData 
      });
      
      // Update local registration cache for fallbacks
      try {
        const key = `hv_regs_${user.id}`;
        const arr: Array<{ eventId: string; teamId?: string; eventTitle?: string }> = JSON.parse(localStorage.getItem(key) || '[]');
        if (!arr.some(r => r.eventId === id)) {
          arr.push({ eventId: id, eventTitle: event?.title });
          localStorage.setItem(key, JSON.stringify(arr));
        }
        // legacy flag for simple lookup
        localStorage.setItem(`hv_reg_${user.id}_${id}`, '1');
      } catch {}
      
      // Navigate to My Events
      setTimeout(() => navigate('/dashboard/my-events', { replace: true }), 0);
    } catch (error) {
      const msg = (error as any)?.message || '';
      if (msg.toLowerCase().includes('already registered')) {
        navigate('/dashboard/my-events', { replace: true });
        return;
      }
      toast.error('Registration failed', msg || 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    setIsLoading(true);
    try {
      if (!id) return;
      await apiFetch(`/api/registrations?eventId=${id}`, { method: 'DELETE' });
      if (user) localStorage.removeItem(`hv_reg_${user.id}_${id}`);
      setIsRegistered(false);
      toast.success('Unregistered successfully', 'You have been removed from the event');
    } catch (error) {
      toast.error('Failed to unregister', (error as any)?.message || 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilEvent = () => {
    if (!event) return 0;
    const now = new Date();
    const eventStart = new Date(event.startDate);
    const diffTime = eventStart.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadlineSource = event.registrationDeadline || event.startDate;
    const deadline = new Date(deadlineSource);
    if (isNaN(deadline.getTime())) return true; // assume open if invalid
    return now < deadline;
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          {loadingError ? (
            <>
              <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto mb-4" />
              <p className="text-red-400 mb-2">Failed to load event</p>
              <p className="text-gray-400 text-sm mb-4">{loadingError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neon-purple">Loading event details...</p>
              <p className="text-gray-400 text-sm mt-2">Event ID: {id}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between"
            >
              <div className="flex-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="mb-4 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <h1 className="text-4xl md:text-6xl font-orbitron font-bold neon-text mb-4">
                  {event.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-neon-purple" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-neon-blue" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-neon-green" />
                    <span>{event.registrations}/{event.maxParticipants} participants</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.mode === 'online' ? 'bg-neon-blue/20 text-neon-blue' :
                    event.mode === 'offline' ? 'bg-neon-pink/20 text-neon-pink' :
                    'bg-neon-purple/20 text-neon-purple'
                  }`}>
                    {event.mode.toUpperCase()}
                  </span>
                  
                  {getDaysUntilEvent() > 0 && (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                      {getDaysUntilEvent()} days to go
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-8">
                {user ? (
                  user.role === 'judge' ? (
                    <Link to={`/dashboard/reviews?event=${id}`}>
                      <Button size="lg" className="animate-pulse-slow">
                        View Submissions
                      </Button>
                    </Link>
                  ) : isRegistered ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-neon-green/20 rounded-full mb-4 mx-auto">
                        <CheckCircle className="w-8 h-8 text-neon-green" />
                      </div>
                      <p className="text-neon-green font-medium mb-4">You're registered!</p>
                      <Button
                        variant="outline"
                        onClick={handleUnregister}
                        isLoading={isLoading}
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Unregister
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setShowRegistrationModal(true)}
                      disabled={!isRegistrationOpen()}
                      className="animate-pulse-slow"
                    >
                      <UserPlus className="w-5 h-5" />
                      {isRegistrationOpen() ? 'Register Now' : 'Registration Closed'}
                    </Button>
                  )
                ) : (
                  <Link to="/auth">
                    <Button size="lg" className="animate-pulse-slow">
                      <UserPlus className="w-5 h-5" />
                      Login to Register
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <h2 className="text-2xl font-orbitron font-bold neon-text mb-4">About This Event</h2>
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            </Card>

            {/* Tracks */}
            <Card>
              <h2 className="text-2xl font-orbitron font-bold neon-text mb-4">Challenge Tracks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.tracks.map((track, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <Target className="w-5 h-5 text-neon-purple mr-3" />
                    <span className="text-white font-medium">{track}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <h2 className="text-2xl font-orbitron font-bold neon-text mb-6">Event Timeline</h2>
              <div className="space-y-4">
                {event.timeline.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-neon-purple text-sm">{formatDate(item.date)}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rules */}
            <Card>
              <h2 className="text-2xl font-orbitron font-bold neon-text mb-4">Rules & Guidelines</h2>
              <p className="text-gray-300 leading-relaxed">{event.rules}</p>
            </Card>

            {/* Event Leaderboard */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-orbitron font-bold neon-text flex items-center gap-2"><TrophyIcon className="w-5 h-5" /> Leaderboard</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Round</label>
                  <select className="neon-input px-3 py-2 rounded" value={roundId} onChange={(e)=>setRoundId(e.target.value)}>
                    <option value="">All rounds</option>
                    {(event.rounds || []).map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
              </div>
              {leaderRows.length === 0 ? (
                <div className="text-gray-400">No scores yet.</div>
              ) : (
                <div className="space-y-2">
                  {leaderRows.map((row, idx) => (
                    <div key={row.teamId} className="flex items-center justify-between border border-gray-800 rounded p-3">
                      <div className="text-white">#{idx+1} Team {row.teamId}</div>
                      <div className="text-neon-purple font-orbitron">{row.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <h3 className="text-xl font-orbitron font-bold neon-text mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">3 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Size</span>
                  <span className="text-white">2-{event.maxTeamSize} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registration</span>
                  <span className={isRegistrationOpen() ? 'text-neon-green' : 'text-red-400'}>
                    {isRegistrationOpen() ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants</span>
                  <span className="text-white">{event.registrations}</span>
                </div>
              </div>
            </Card>

            {/* Prizes */}
            <Card>
              <h3 className="text-xl font-orbitron font-bold neon-text mb-4">Prizes</h3>
              <div className="space-y-3">
                {event.prizes.map((prize, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{prize.amount}</div>
                      <div className="text-gray-400 text-sm">{prize.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sponsors */}
            <Card>
              <h3 className="text-xl font-orbitron font-bold neon-text mb-4">Sponsors</h3>
              <div className="space-y-3">
                {event.sponsors.map((sponsor, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="w-12 h-6 object-contain mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{sponsor.name}</div>
                      <div className="text-gray-400 text-sm capitalize">{sponsor.tier} Sponsor</div>
                    </div>
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-purple hover:text-neon-purple-dark"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Contact */}
            <Card>
              <h3 className="text-xl font-orbitron font-bold neon-text mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4" />
                  Contact Organizers
                </Button>
                <Button variant="ghost" className="w-full">
                  <Star className="w-4 h-4" />
                  Join Community
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Register for Event"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Registration Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRegistrationType('individual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  registrationType === 'individual'
                    ? 'border-neon-purple bg-neon-purple/10 text-neon-purple'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Individual</div>
                <div className="text-sm opacity-75">Join existing team later</div>
              </button>
              
              <button
                onClick={() => setRegistrationType('team')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  registrationType === 'team'
                    ? 'border-neon-purple bg-neon-purple/10 text-neon-purple'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <UserPlus className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Create Team</div>
                <div className="text-sm opacity-75">Start your own team</div>
              </button>
            </div>
          </div>

          {registrationType === 'team' && (
            <div className="space-y-4">
              <Input
                label="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Description (Optional)
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe your team's goals and what you're looking for in teammates..."
                  className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-24 resize-none"
                />
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Registration Summary</h4>
            <div className="space-y-1 text-sm text-gray-400">
              <div>Event: {event.title}</div>
              <div>Type: {registrationType === 'individual' ? 'Individual' : 'Team Leader'}</div>
              {registrationType === 'team' && teamName && <div>Team: {teamName}</div>}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowRegistrationModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              isLoading={isLoading}
              className="flex-1"
              disabled={registrationType === 'team' && !teamName.trim()}
            >
              Register
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};