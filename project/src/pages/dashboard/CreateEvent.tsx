import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../lib/api';

type NewEventForm = {
  title: string;
  theme: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeamSize: number;
  maxParticipants: number;
  description: string;
  tracks: string[];
  rules: string;
  prizes: Array<{ title: string; description: string }>;
  sponsors: Array<{ name: string; logoUrl: string; tier: 'platinum' | 'gold' | 'silver' | 'bronze' }>;
  timeline: Array<{ title: string; date: string; description: string }>;
  rounds: Array<{ id: string; name: string; description: string }>;
};

const defaultForm: NewEventForm = {
  title: '',
  theme: '',
  mode: 'hybrid',
  location: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  maxTeamSize: 4,
  maxParticipants: 100,
  description: '',
  tracks: ['AI & Machine Learning', 'Web Development', 'Mobile Apps'],
  rules: 'Standard hackathon rules apply',
  prizes: [{ title: '$1000', description: 'First Place Prize' }],
  sponsors: [],
  timeline: [],
  rounds: [
    { id: 'round-1', name: 'Round 1', description: 'Initial submission' }
  ]
};

export const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<NewEventForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(false);

  const roleColor = useMemo(() => 'blue' as const, []);

  const storageKey = useMemo(() => `hv_events_${user?.id || 'anon'}`,[user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'maxTeamSize' || name === 'maxParticipants' ? Number(value) : value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.theme.trim()) return 'Theme is required';
    if (!form.startDate || !form.endDate) return 'Start and End dates are required';
    if (new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start date';
    if (!form.registrationDeadline) return 'Registration deadline is required';
    if (new Date(form.registrationDeadline) > new Date(form.startDate)) return 'Registration deadline must be before start date';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error('Invalid form', error);
      return;
    }
    setIsLoading(true);
    try {
      // Create event in backend first
      console.log('Creating event in backend...');
      const backendEvent = await apiFetch('/api/events', {
        method: 'POST',
        body: {
          name: form.title.trim(),
          description: form.description.trim(),
          theme: form.theme.trim(),
          online: form.mode !== 'offline',
          location: form.location.trim() || (form.mode === 'online' ? 'Virtual' : ''),
          startAt: new Date(form.startDate).toISOString(),
          endAt: new Date(form.endDate).toISOString(),
          tracks: form.tracks.filter(t => t.trim()),
          rules: (form.rules ? form.rules.split('\n') : []).map(r => r.trim()).filter(Boolean),
          rounds: form.rounds.map(r => ({ id: r.id, name: r.name, description: r.description })),
          prizes: form.prizes.filter(p => p.title.trim() && p.description.trim()).map((prize, idx) => ({ 
            title: prize.title.trim(), 
            description: prize.description.trim() 
          })),
          sponsors: form.sponsors.filter(s => s.name.trim()).map(sponsor => ({ 
            name: sponsor.name.trim(), 
            logoUrl: sponsor.logoUrl.trim() || '' 
          })),
        },
      });
      
      console.log('Backend event created:', backendEvent);
      
      // Create local event with the backend ID
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const bannerChoices = [
        'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/9028894/pexels-photo-9028894.jpeg?auto=compress&cs=tinysrgb&w=1200'
      ];
      
      const newEvent = {
        id: backendEvent.id, // Use the backend ID
        title: form.title.trim(),
        description: form.description.trim(),
        theme: form.theme.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        registrationDeadline: form.registrationDeadline,
        mode: form.mode,
        location: form.location.trim() || (form.mode === 'online' ? 'Virtual' : ''),
        maxTeamSize: form.maxTeamSize,
        prizes: form.prizes.filter(p => p.title.trim() && p.description.trim()),
        sponsors: form.sponsors.filter(s => s.name.trim()),
        tracks: form.tracks.filter(t => t.trim()),
        rules: form.rules.trim() || 'Standard hackathon rules apply',
        timeline: form.timeline.filter(t => t.title.trim() && t.date && t.description.trim()).map(item => ({
          ...item,
          date: new Date(item.date)
        })),
        organizerId: user?.id || 'anon',
        status: 'draft',
        registrations: 0,
        maxParticipants: form.maxParticipants,
        bannerUrl: bannerChoices[Math.floor(Math.random() * bannerChoices.length)],
        rounds: form.rounds
      };
      
      localStorage.setItem(storageKey, JSON.stringify([newEvent, ...existing]));
      toast.success('Event created successfully!', 'You can publish it from My Events');
      navigate('/dashboard/my-events');
      
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event', (error as Error)?.message || 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card roleColor={roleColor}>
        <h1 className="text-2xl font-orbitron font-bold text-white mb-6">Create Event</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., AI Innovation Challenge" roleColor={roleColor} required />
          </div>
          <Input label="Theme" name="theme" value={form.theme} onChange={handleChange} placeholder="e.g., Artificial Intelligence" roleColor={roleColor} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Mode</label>
            <select name="mode" value={form.mode} onChange={handleChange} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
              <option value="online">Online</option>
              <option value="offline">In-Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder={form.mode === 'online' ? 'Virtual' : 'City, Venue'} roleColor={roleColor} />
          <div>
            <Input label="Start Date" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <div>
            <Input label="End Date" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <div>
            <Input label="Registration Deadline" name="registrationDeadline" type="datetime-local" value={form.registrationDeadline} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <Input label="Max Team Size" name="maxTeamSize" type="number" min={1} max={10} value={form.maxTeamSize} onChange={handleChange} roleColor={roleColor} />
          <Input label="Max Participants" name="maxParticipants" type="number" min={10} max={10000} value={form.maxParticipants} onChange={handleChange} roleColor={roleColor} />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the event, expectations, rules, etc." className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-32 resize-none" />
          </div>
          
          {/* Tracks */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Tracks</label>
            <div className="space-y-2">
              {form.tracks.map((track, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={track}
                    onChange={(e) => {
                      const newTracks = [...form.tracks];
                      newTracks[index] = e.target.value;
                      setForm(prev => ({ ...prev, tracks: newTracks }));
                    }}
                    placeholder={`Track ${index + 1}`}
                    roleColor={roleColor}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTracks = form.tracks.filter((_, i) => i !== index);
                      setForm(prev => ({ ...prev, tracks: newTracks }));
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
                onClick={() => setForm(prev => ({ ...prev, tracks: [...prev.tracks, ''] }))}
                roleColor={roleColor}
              >
                + Add Track
              </Button>
            </div>
          </div>

          {/* Rules */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Rules & Guidelines</label>
            <textarea
              name="rules"
              value={form.rules}
              onChange={handleChange}
              placeholder="Enter event rules, guidelines, and requirements..."
              className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-24 resize-none"
            />
          </div>

          {/* Prizes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Prizes</label>
            <div className="space-y-3">
              {form.prizes.map((prize, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-700 rounded-lg">
                  <Input
                    value={prize.title}
                    onChange={(e) => {
                      const newPrizes = [...form.prizes];
                      newPrizes[index] = { ...prize, title: e.target.value };
                      setForm(prev => ({ ...prev, prizes: newPrizes }));
                    }}
                    placeholder="Prize title (e.g., $1000)"
                    roleColor={roleColor}
                  />
                  <Input
                    value={prize.description}
                    onChange={(e) => {
                      const newPrizes = [...form.prizes];
                      newPrizes[index] = { ...prize, description: e.target.value };
                      setForm(prev => ({ ...prev, prizes: newPrizes }));
                    }}
                    placeholder="Prize description"
                    roleColor={roleColor}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPrizes = form.prizes.filter((_, i) => i !== index);
                      setForm(prev => ({ ...prev, prizes: newPrizes }));
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
                onClick={() => setForm(prev => ({ ...prev, prizes: [...prev.prizes, { title: '', description: '' }] }))}
                roleColor={roleColor}
              >
                + Add Prize
              </Button>
            </div>
          </div>

          {/* Sponsors */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Sponsors</label>
            <div className="space-y-3">
              {form.sponsors.map((sponsor, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                  <Input
                    value={sponsor.name}
                    onChange={(e) => {
                      const newSponsors = [...form.sponsors];
                      newSponsors[index] = { ...sponsor, name: e.target.value };
                      setForm(prev => ({ ...prev, sponsors: newSponsors }));
                    }}
                    placeholder="Sponsor name"
                    roleColor={roleColor}
                  />
                  <Input
                    value={sponsor.logoUrl}
                    onChange={(e) => {
                      const newSponsors = [...form.sponsors];
                      newSponsors[index] = { ...sponsor, logoUrl: e.target.value };
                      setForm(prev => ({ ...prev, sponsors: newSponsors }));
                    }}
                    placeholder="Logo URL"
                    roleColor={roleColor}
                  />
                  <select
                    value={sponsor.tier}
                    onChange={(e) => {
                      const newSponsors = [...form.sponsors];
                      newSponsors[index] = { ...sponsor, tier: e.target.value as any };
                      setForm(prev => ({ ...prev, sponsors: newSponsors }));
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
                      const newSponsors = form.sponsors.filter((_, i) => i !== index);
                      setForm(prev => ({ ...prev, sponsors: newSponsors }));
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
                onClick={() => setForm(prev => ({ ...prev, sponsors: [...prev.sponsors, { name: '', logoUrl: '', tier: 'gold' }] }))}
                roleColor={roleColor}
              >
                + Add Sponsor
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Timeline</label>
            <div className="space-y-3">
              {form.timeline.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const newTimeline = [...form.timeline];
                      newTimeline[index] = { ...item, title: e.target.value };
                      setForm(prev => ({ ...prev, timeline: newTimeline }));
                    }}
                    placeholder="Event title"
                    roleColor={roleColor}
                  />
                  <Input
                    value={item.date}
                    onChange={(e) => {
                      const newTimeline = [...form.timeline];
                      newTimeline[index] = { ...item, date: e.target.value };
                      setForm(prev => ({ ...prev, timeline: newTimeline }));
                    }}
                    type="datetime-local"
                    roleColor={roleColor}
                  />
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const newTimeline = [...form.timeline];
                      newTimeline[index] = { ...item, description: e.target.value };
                      setForm(prev => ({ ...prev, timeline: newTimeline }));
                    }}
                    placeholder="Description"
                    roleColor={roleColor}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTimeline = form.timeline.filter((_, i) => i !== index);
                      setForm(prev => ({ ...prev, timeline: newTimeline }));
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
                onClick={() => setForm(prev => ({ ...prev, timeline: [...prev.timeline, { title: '', date: '', description: '' }] }))}
                roleColor={roleColor}
              >
                + Add Timeline Item
              </Button>
            </div>
          </div>

          {/* Rounds */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Rounds</label>
            <div className="space-y-3">
              {form.rounds.map((round, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                  <Input
                    value={round.id}
                    onChange={(e) => {
                      const newRounds = [...form.rounds];
                      newRounds[index] = { ...round, id: e.target.value };
                      setForm(prev => ({ ...prev, rounds: newRounds }));
                    }}
                    placeholder="round-1"
                    roleColor={roleColor}
                  />
                  <Input
                    value={round.name}
                    onChange={(e) => {
                      const newRounds = [...form.rounds];
                      newRounds[index] = { ...round, name: e.target.value };
                      setForm(prev => ({ ...prev, rounds: newRounds }));
                    }}
                    placeholder="Round name"
                    roleColor={roleColor}
                  />
                  <Input
                    value={round.description}
                    onChange={(e) => {
                      const newRounds = [...form.rounds];
                      newRounds[index] = { ...round, description: e.target.value };
                      setForm(prev => ({ ...prev, rounds: newRounds }));
                    }}
                    placeholder="Description"
                    roleColor={roleColor}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newRounds = form.rounds.filter((_, i) => i !== index);
                      setForm(prev => ({ ...prev, rounds: newRounds }));
                    }}
                    className="md:col-span-3 px-3"
                  >
                    Remove Round
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm(prev => ({ ...prev, rounds: [...prev.rounds, { id: `round-${prev.rounds.length+1}`, name: '', description: '' }] }))}
                roleColor={roleColor}
              >
                + Add Round
              </Button>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" roleColor={roleColor} onClick={() => navigate('/dashboard/my-events')}>Cancel</Button>
            <Button type="submit" roleColor={roleColor} isLoading={isLoading}>Create Event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateEvent;



