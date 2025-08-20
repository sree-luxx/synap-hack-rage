import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type Sponsor = { _id?: string; name: string; tier: string; logoUrl: string; websiteUrl: string; description?: string };
const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"] as const;

export const OrganizerSponsors: React.FC = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Sponsor[]>([]);
  const [form, setForm] = useState<Sponsor>({ name: '', tier: 'BRONZE', logoUrl: '', websiteUrl: '' });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [eventId, setEventId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const path = eventId ? `/api/sponsors?eventId=${encodeURIComponent(eventId)}` : '/api/sponsors';
      setList(await apiFetch<Sponsor[]>(path));
    } catch { setList([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);

  useEffect(() => {
    (async () => {
      if (user?.role !== 'organizer') return;
      try {
        const evs = await apiFetch<any[]>('/api/events');
        const arr = (Array.isArray(evs) ? evs : (evs as any)?.data || []).map((e: any) => ({ id: e.id, name: e.name || e.title }));
        setEvents(arr);
        if (!eventId && arr.length) setEventId(arr[0].id);
      } catch { setEvents([]); }
    })();
  }, [user?.role]);

  const create = async () => {
    const body: any = { ...form };
    if (eventId) body.eventId = eventId;
    await apiFetch('/api/sponsors', { method: 'POST', body });
    setForm({ name: '', tier: 'BRONZE', logoUrl: '', websiteUrl: '' });
    await load();
  };

  const remove = async (id?: string) => {
    if (!id) return; await apiFetch(`/api/sponsors?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await load();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Manage Sponsors</h1>
      <Card roleColor="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
              {events.length === 0 && (<option value="">No events</option>)}
              {events.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </div>
          <Input label="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} roleColor="blue" />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tier</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={form.tier} onChange={(e)=>setForm({ ...form, tier: e.target.value })}>
              {tiers.map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <Input label="Logo URL" value={form.logoUrl} onChange={(e)=>setForm({ ...form, logoUrl: e.target.value })} roleColor="blue" />
          <Input label="Website URL" value={form.websiteUrl} onChange={(e)=>setForm({ ...form, websiteUrl: e.target.value })} roleColor="blue" />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg" rows={3} value={form.description||''} onChange={(e)=>setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button roleColor="blue" onClick={create}>Add Sponsor</Button>
        </div>
      </Card>

      <Card roleColor="blue">
        {loading ? <div className="text-gray-400">Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(s => (
              <div key={s._id} className="neon-card p-4 rounded">
                <img src={s.logoUrl} alt={s.name} className="w-full h-24 object-contain" />
                <div className="mt-2 text-white font-medium">{s.name}</div>
                <div className="text-xs text-gray-400">{s.tier}</div>
                <div className="flex justify-end mt-3"><Button variant="ghost" onClick={()=>remove(s._id)}>Delete</Button></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrganizerSponsors;


