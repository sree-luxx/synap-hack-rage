import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Calendar, Users, Megaphone, UserCheck, BarChart3, Trash2, Edit3, Eye, UploadCloud, DownloadCloud } from 'lucide-react';
import { apiFetch } from '../../lib/api';

type LiteEvent = {
  id: string;
  title: string;
  theme: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string;
  maxTeamSize: number;
  organizerId: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  registrations: number;
  maxParticipants: number;
  bannerUrl?: string;
  description?: string;
  tracks?: string[];
  rules?: string;
  prizes?: Array<{ title: string; description: string }>;
  sponsors?: Array<{ name: string; logo: string; tier: 'platinum' | 'gold' | 'silver' | 'bronze' }>;
  timeline?: Array<{ title: string; date: Date | string; description: string }>;
};

export const MyEvents: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<LiteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<LiteEvent | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<LiteEvent>>({});

  const roleColor = useMemo(() => (user?.role === 'organizer' ? 'blue' : user?.role === 'judge' ? 'orange' : 'green'), [user?.role]);
  const [participantRegs, setParticipantRegs] = useState<Array<{ eventId: string; teamId?: string; eventTitle?: string }>>([]);
  const [participantLoading, setParticipantLoading] = useState(false);
  const storageKey = useMemo(() => `hv_events_${user?.id || 'anon'}`,[user?.id]);

  const load = () => {
    setIsLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
      console.log('Loading events from localStorage:', data);
      console.log('Event IDs in localStorage:', data.map((e: any) => e.id));
      setEvents(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Load events from backend if available
  const loadFromBackend = async () => {
    if (user?.role !== 'organizer') return;
    
    try {
      console.log('Fetching events from backend...');
      const backendResponse = await apiFetch<any[]>('/api/events');
      console.log('Backend events response:', backendResponse);
      
      // Handle both direct array and wrapped response
      const backendEvents = Array.isArray(backendResponse) ? backendResponse : (backendResponse?.data || []);
      console.log('Extracted backend events:', backendEvents);
      
      if (backendEvents && backendEvents.length > 0) {
        console.log('Backend events found:', backendEvents.length);
        console.log('Backend event IDs:', backendEvents.map((e: any) => e.id));
        
        // Map backend events to frontend format
        const mappedEvents = backendEvents.map((e: any) => ({
          id: e.id,
          title: e.name,
          theme: e.theme || 'General',
          startDate: e.startAt,
          endDate: e.endAt,
          registrationDeadline: e.startAt,
          mode: e.online ? 'online' : 'offline' as 'online' | 'offline' | 'hybrid',
          location: e.location || (e.online ? 'Virtual' : ''),
          maxTeamSize: 4,
          organizerId: e.organizerId,
          status: 'published' as const,
          registrations: e.registrations?.length || 0,
          maxParticipants: 200,
          bannerUrl: '',
          description: e.description,
          tracks: e.tracks,
          rules: e.rules,
          prizes: e.prizes,
          sponsors: e.sponsors,
          timeline: e.timeline
        })) as LiteEvent[];
        
        // Merge with local events, preferring backend data
        const localEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
        console.log('Local events before merge:', localEvents);
        
        // Create a map of backend events by ID
        const backendEventMap = new Map(mappedEvents.map(e => [e.id, e]));
        
        const merged = localEvents.map((local: any) => {
          const backend = backendEventMap.get(local.id);
          if (backend) {
            console.log(`Merging local event ${local.id} with backend data:`, { local, backend });
            return { ...local, registrations: backend.registrations };
          }
          return local;
        });
        
        console.log('Merged events:', merged);
        setEvents(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } else {
        console.log('No events found in backend');
      }
    } catch (error) {
      console.error('Failed to load events from backend:', error);
      // Fallback to local storage
      load();
    }
  };

  useEffect(() => {
    load();
    loadFromBackend(); // Also try to load from backend
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`event-${highlightId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [storageKey]);

  const save = (updated: LiteEvent[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setEvents(updated);
    // Signal other tabs to refresh discovery
    localStorage.setItem('hv_events_updated', String(Date.now()));
  };

  const togglePublish = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, status: e.status === 'published' ? 'draft' : 'published' } : e);
    save(updated);
    toast.success('Status updated');
    // Seed demo submissions when publishing first time
    const target = updated.find(e => e.id === id);
    if (target && target.status === 'published') {
      seedDemoSubmissions(target.id, target.maxParticipants);
    }
  };

  const remove = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    save(updated);
    toast.info('Event deleted');
    // cleanup related
    localStorage.removeItem(`hv_participants_${id}`);
    localStorage.removeItem(`hv_submissions_${id}`);
    const assignments = JSON.parse(localStorage.getItem('hv_assignments') || '[]').filter((a: any) => a.eventId !== id);
    localStorage.setItem('hv_assignments', JSON.stringify(assignments));
  };

  const openEdit = (ev: LiteEvent) => {
    setEditing(ev);
    setEditDraft({ title: ev.title, theme: ev.theme, mode: ev.mode, location: ev.location, startDate: ev.startDate, endDate: ev.endDate, registrationDeadline: ev.registrationDeadline, maxTeamSize: ev.maxTeamSize, maxParticipants: ev.maxParticipants, description: ev.description, tracks: ev.tracks, rules: ev.rules, prizes: ev.prizes, sponsors: ev.sponsors, timeline: ev.timeline });
  };

  const saveEdit = async () => {
    if (!editing) return;
    
    try {
      // Try to update in backend first if the event exists there
      try {
        await apiFetch(`/api/events/${editing.id}`, {
          method: 'PUT',
          body: {
            name: editDraft.title || editing.title,
            description: editDraft.description || editing.description,
            theme: editDraft.theme || editing.theme,
            online: (editDraft.mode || editing.mode) !== 'offline',
            location: editDraft.location || editing.location,
            startAt: editDraft.startDate || editing.startDate,
            endAt: editDraft.endDate || editing.endDate,
            tracks: (editDraft.tracks || editing.tracks || []).map(name => ({ name })),
            rules: (editDraft.rules || editing.rules || []).map(text => ({ text })),
            prizes: (editDraft.prizes || editing.prizes || []).map(prize => ({ 
              title: prize.title, 
              description: prize.description 
            })),
            sponsors: (editDraft.sponsors || editing.sponsors || []).map(sponsor => ({ 
              name: sponsor.name, 
              logoUrl: sponsor.logo || '' 
            })),
          },
        });
        console.log('Event updated in backend');
      } catch (backendError) {
        console.log('Backend update failed, saving locally only:', backendError);
      }
      
      // Update local state
      const updated = events.map(e => e.id === editing.id ? { ...e, ...editDraft } as LiteEvent : e);
      save(updated);
      
      // Also update the specific event in localStorage for the preview page to find
      const updatedEvent = updated.find(e => e.id === editing.id);
      if (updatedEvent) {
        // Update the event in the organizer's localStorage
        localStorage.setItem(storageKey, JSON.stringify(updated));
        
        // Also create a copy that the preview page can find
        const previewKey = `hv_event_preview_${editing.id}`;
        localStorage.setItem(previewKey, JSON.stringify(updatedEvent));
      }
      
      toast.success('Event updated successfully!');
      setEditing(null);
      
      // Refresh the events list to show updated data
      load();
      
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Failed to save event', 'Please try again');
    }
  };

  const seedDemoParticipants = (eventId: string) => {
    const count = Math.floor(Math.random() * 30) + 20;
    const participants = Array.from({ length: count }).map((_, i) => ({
      id: `${eventId}_p_${i+1}`,
      name: `Participant ${i+1}`,
      email: `user${i+1}@demo.com`,
      registeredAt: new Date().toISOString()
    }));
    localStorage.setItem(`hv_participants_${eventId}`, JSON.stringify(participants));
    const updated = events.map(e => e.id === eventId ? { ...e, registrations: participants.length } : e);
    save(updated);
    toast.info('Demo participants added');
  };

  const seedDemoSubmissions = (eventId: string, maxParticipants: number) => {
    const num = Math.max(5, Math.floor((maxParticipants || 100) * 0.2));
    const subs = Array.from({ length: num }).map((_, i) => ({
      id: `${eventId}_s_${i+1}`,
      teamId: `${eventId}_team_${i+1}`,
      eventId,
      roundId: 'round-1',
      title: `Project ${i+1}`,
      description: 'Demo submission for review',
      githubUrl: '',
      demoUrl: '',
      videoUrl: '',
      documents: [],
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      scores: [],
      feedback: []
    }));
    localStorage.setItem(`hv_submissions_${eventId}`, JSON.stringify(subs));
  };
  // Participant: load registrations from backend (fallback to local)
  useEffect(() => {
    if (user?.role !== 'organizer') {
      (async () => {
        setParticipantLoading(true);
        try {
          const regs = await apiFetch<any[]>(`/api/registrations`);
          const mapped = (regs || []).map(r => ({
            eventId: r.event?.id || r.eventId,
            teamId: r.team?.id,
            eventTitle: r.event?.name || r.event?.title || 'Event'
          }));
          // Enrich with local teams if teamId missing
          try {
            const localTeams: Array<{ id: string; eventId: string }> = JSON.parse(localStorage.getItem(`hv_myteams_${user?.id}`) || '[]');
            const enriched = mapped.map(reg => reg.teamId ? reg : ({
              ...reg,
              teamId: localTeams.find(t => t.eventId === reg.eventId)?.id
            }));
            setParticipantRegs(enriched);
          } catch {
            setParticipantRegs(mapped);
          }
        } catch {
          // Fallback: local storage
          const localRegs: Array<{ eventId: string; teamId?: string; eventTitle?: string }> = JSON.parse(localStorage.getItem(`hv_regs_${user?.id}`) || '[]');
          // Also enrich local regs with local teams in case teamId missing
          try {
            const localTeams: Array<{ id: string; eventId: string }> = JSON.parse(localStorage.getItem(`hv_myteams_${user?.id}`) || '[]');
            const enriched = localRegs.map(reg => reg.teamId ? reg : ({
              ...reg,
              teamId: localTeams.find(t => t.eventId === reg.eventId)?.id
            }));
            setParticipantRegs(enriched);
          } catch {
            setParticipantRegs(localRegs);
          }
        } finally {
          setParticipantLoading(false);
        }
      })();
    }
  }, [user?.id, user?.role]);

  if (isLoading) {
    return (
      <div className="p-6"><div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" /></div>
    );
  }

  // Participant view: show teams/registrations instead of create event CTA
  if (user?.role !== 'organizer') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-orbitron font-bold">My Events</h1>
        {participantLoading ? (
          <Card roleColor={roleColor}><div className="w-16 h-16 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" /></Card>
        ) : participantRegs.length === 0 ? (
          <Card roleColor={roleColor}>
            <p className="text-gray-400">No registrations yet. Discover and join events.</p>
            <Link to="/dashboard/events"><Button className="mt-4" roleColor={roleColor}>Discover Events</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {participantRegs.map((r) => (
              <Card key={r.eventId} roleColor={roleColor} className="space-y-2" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{r.eventTitle || 'Event'}</h3>
                    <p className="text-neon-green text-sm">Registered</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {r.teamId ? (
                    <Link to={`/dashboard/teams?team=${r.teamId}`}>
                      <Button variant="outline" size="sm" roleColor={roleColor}>View Team</Button>
                    </Link>
                  ) : (
                    <>
                      <Link to={`/dashboard/teams?action=create&event=${r.eventId}`}>
                        <Button variant="outline" size="sm" roleColor={roleColor}>Create Team</Button>
                      </Link>
                      <Link to={`/dashboard/teams?action=join`}>
                        <Button variant="outline" size="sm" roleColor={roleColor}>Join Team</Button>
                      </Link>
                    </>
                  )}
                  <Link to={`/events/${r.eventId}`}>
                    <Button variant="outline" size="sm" roleColor={roleColor}>Event Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-orbitron font-bold">My Events</h1>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            roleColor={roleColor} 
            onClick={loadFromBackend}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Link to="/dashboard/create-event"><Button roleColor={roleColor}>Create Event</Button></Link>
        </div>
      </div>

      {events.length === 0 ? (
        <Card roleColor={roleColor}>
          <p className="text-gray-400">No events yet. Create your first event.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((ev) => (
            <Card key={ev.id} roleColor={roleColor} className="space-y-4" hover>
              <div id={`event-${ev.id}`} className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{ev.title}</h3>
                  <p className="text-neon-blue text-sm">{ev.theme}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${ev.status === 'published' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{ev.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-neon-blue" /> {new Date(ev.startDate).toLocaleDateString()}</div>
                <div className="flex items-center"><Users className="w-4 h-4 mr-2 text-neon-green" /> {ev.registrations}/{ev.maxParticipants}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/events/${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => console.log('Preview clicked for event:', ev.id, 'All events:', events)}><Eye className="w-4 h-4" /> Preview</Button>
                </Link>
                <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => openEdit(ev)}><Edit3 className="w-4 h-4" /> Edit</Button>
                <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => togglePublish(ev.id)}>
                  {ev.status === 'published' ? (<><DownloadCloud className="w-4 h-4" /> Unpublish</>) : (<><UploadCloud className="w-4 h-4" /> Publish</>)}
                </Button>
                <Link to={`/dashboard/participants?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><Users className="w-4 h-4" /> Participants</Button>
                </Link>
                <Link to={`/dashboard/judges?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><UserCheck className="w-4 h-4" /> Judges</Button>
                </Link>
                <Link to={`/dashboard/announcements?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><Megaphone className="w-4 h-4" /> Announcements</Button>
                </Link>
                <Link to={`/dashboard/analytics?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><BarChart3 className="w-4 h-4" /> Analytics</Button>
                </Link>
                <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white" onClick={() => remove(ev.id)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
                <Button variant="ghost" size="sm" roleColor={roleColor} onClick={() => seedDemoParticipants(ev.id)}>Seed Demo Participants</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Event" roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={editDraft.title || ''} onChange={(e) => setEditDraft(s => ({ ...s, title: e.target.value }))} roleColor={roleColor} />
          <Input label="Theme" value={editDraft.theme || ''} onChange={(e) => setEditDraft(s => ({ ...s, theme: e.target.value }))} roleColor={roleColor} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Mode</label>
            <select value={editDraft.mode || 'hybrid'} onChange={(e) => setEditDraft(s => ({ ...s, mode: e.target.value as any }))} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
              <option value="online">Online</option>
              <option value="offline">In-Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <Input label="Location" value={editDraft.location || ''} onChange={(e) => setEditDraft(s => ({ ...s, location: e.target.value }))} roleColor={roleColor} />
          <Input label="Start" type="datetime-local" value={editDraft.startDate || ''} onChange={(e) => setEditDraft(s => ({ ...s, startDate: e.target.value }))} roleColor={roleColor} />
          <Input label="End" type="datetime-local" value={editDraft.endDate || ''} onChange={(e) => setEditDraft(s => ({ ...s, endDate: e.target.value }))} roleColor={roleColor} />
          <Input label="Reg. Deadline" type="datetime-local" value={editDraft.registrationDeadline || ''} onChange={(e) => setEditDraft(s => ({ ...s, registrationDeadline: e.target.value }))} roleColor={roleColor} />
          <Input label="Max Team Size" type="number" value={(editDraft.maxTeamSize as any) || 4} onChange={(e) => setEditDraft(s => ({ ...s, maxTeamSize: Number(e.target.value) }))} roleColor={roleColor} />
          <Input label="Max Participants" type="number" value={(editDraft.maxParticipants as any) || 100} onChange={(e) => setEditDraft(s => ({ ...s, maxParticipants: Number(e.target.value) }))} roleColor={roleColor} />
        </div>
        
        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={editDraft.description || ''}
            onChange={(e) => setEditDraft(s => ({ ...s, description: e.target.value }))}
            placeholder="Describe the event, expectations, rules, etc."
            className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-24 resize-none"
          />
        </div>

        {/* Tracks */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Tracks</label>
          <div className="space-y-2">
            {(editDraft.tracks || []).map((track: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={track}
                  onChange={(e) => {
                    const newTracks = [...(editDraft.tracks || [])];
                    newTracks[index] = e.target.value;
                    setEditDraft(s => ({ ...s, tracks: newTracks }));
                  }}
                  placeholder={`Track ${index + 1}`}
                  roleColor={roleColor}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTracks = (editDraft.tracks || []).filter((_, i) => i !== index);
                    setEditDraft(s => ({ ...s, tracks: newTracks }));
                  }}
                  className="px-3"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDraft(s => ({ ...s, tracks: [...(s.tracks || []), ''] }))}
              roleColor={roleColor}
            >
              + Add Track
            </Button>
          </div>
        </div>

        {/* Rules */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Rules & Guidelines</label>
          <textarea
            value={editDraft.rules || ''}
            onChange={(e) => setEditDraft(s => ({ ...s, rules: e.target.value }))}
            placeholder="Enter event rules, guidelines, and requirements..."
            className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-24 resize-none"
          />
        </div>

        {/* Prizes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Prizes</label>
          <div className="space-y-3">
            {(editDraft.prizes || []).map((prize: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-700 rounded-lg">
                <Input
                  value={prize.title || ''}
                  onChange={(e) => {
                    const newPrizes = [...(editDraft.prizes || [])];
                    newPrizes[index] = { ...prize, title: e.target.value };
                    setEditDraft(s => ({ ...s, prizes: newPrizes }));
                  }}
                  placeholder="Prize title (e.g., $1000)"
                  roleColor={roleColor}
                />
                <Input
                  value={prize.description || ''}
                  onChange={(e) => {
                    const newPrizes = [...(editDraft.prizes || [])];
                    newPrizes[index] = { ...prize, description: e.target.value };
                    setEditDraft(s => ({ ...s, prizes: newPrizes }));
                  }}
                  placeholder="Prize description"
                  roleColor={roleColor}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPrizes = (editDraft.prizes || []).filter((_, i) => i !== index);
                    setEditDraft(s => ({ ...s, prizes: newPrizes }));
                  }}
                  className="md:col-span-2 px-3"
                >
                  Remove Prize
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDraft(s => ({ ...s, prizes: [...(s.prizes || []), { title: '', description: '' }] }))}
              roleColor={roleColor}
            >
              + Add Prize
            </Button>
          </div>
        </div>

        {/* Sponsors */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Sponsors</label>
          <div className="space-y-3">
            {(editDraft.sponsors || []).map((sponsor: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                <Input
                  value={sponsor.name || ''}
                  onChange={(e) => {
                    const newSponsors = [...(editDraft.sponsors || [])];
                    newSponsors[index] = { ...sponsor, name: e.target.value };
                    setEditDraft(s => ({ ...s, sponsors: newSponsors }));
                  }}
                  placeholder="Sponsor name"
                  roleColor={roleColor}
                />
                <Input
                  value={sponsor.logo || ''}
                  onChange={(e) => {
                    const newSponsors = [...(editDraft.sponsors || [])];
                    newSponsors[index] = { ...sponsor, logo: e.target.value };
                    setEditDraft(s => ({ ...s, sponsors: newSponsors }));
                  }}
                  placeholder="Logo URL"
                  roleColor={roleColor}
                />
                <select
                  value={sponsor.tier || 'gold'}
                  onChange={(e) => {
                    const newSponsors = [...(editDraft.sponsors || [])];
                    newSponsors[index] = { ...sponsor, tier: e.target.value as any };
                    setEditDraft(s => ({ ...s, sponsors: newSponsors }));
                  }}
                  className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
                >
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSponsors = (editDraft.sponsors || []).filter((_, i) => i !== index);
                    setEditDraft(s => ({ ...s, sponsors: newSponsors }));
                  }}
                  className="md:col-span-3 px-3"
                >
                  Remove Sponsor
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDraft(s => ({ ...s, sponsors: [...(s.sponsors || []), { name: '', logo: '', tier: 'gold' }] }))}
              roleColor={roleColor}
            >
              + Add Sponsor
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Event Timeline</label>
          <div className="space-y-3">
            {(editDraft.timeline || []).map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                <Input
                  value={item.title || ''}
                  onChange={(e) => {
                    const newTimeline = [...(editDraft.timeline || [])];
                    newTimeline[index] = { ...item, title: e.target.value };
                    setEditDraft(s => ({ ...s, timeline: newTimeline }));
                  }}
                  placeholder="Event title"
                  roleColor={roleColor}
                />
                <Input
                  value={item.date ? new Date(item.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const newTimeline = [...(editDraft.timeline || [])];
                    newTimeline[index] = { ...item, date: e.target.value };
                    setEditDraft(s => ({ ...s, timeline: newTimeline }));
                  }}
                  type="datetime-local"
                  roleColor={roleColor}
                />
                <Input
                  value={item.description || ''}
                  onChange={(e) => {
                    const newTimeline = [...(editDraft.timeline || [])];
                    newTimeline[index] = { ...item, description: e.target.value };
                    setEditDraft(s => ({ ...s, timeline: newTimeline }));
                  }}
                  placeholder="Description"
                  roleColor={roleColor}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTimeline = (editDraft.timeline || []).filter((_, i) => i !== index);
                    setEditDraft(s => ({ ...s, timeline: newTimeline }));
                  }}
                  className="md:col-span-3 px-3"
                >
                  Remove Timeline Item
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDraft(s => ({ ...s, timeline: [...(s.timeline || []), { title: '', date: '', description: '' }] }))}
              roleColor={roleColor}
            >
              + Add Timeline Item
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" roleColor={roleColor} onClick={() => setEditing(null)}>Cancel</Button>
          <Button roleColor={roleColor} onClick={saveEdit}>Save</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyEvents;



