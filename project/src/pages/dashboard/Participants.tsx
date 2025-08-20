import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { Search, Users } from 'lucide-react';

export const Participants: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'organizer' ? 'blue' : user?.role === 'judge' ? 'orange' : 'green') as const, [user?.role]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [eventId, setEventId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch<any[]>(`/api/events`);
        const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
        setEvents((list || []).map((e:any)=>({ id:e.id, title: e.name || e.title || 'Event' })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!eventId) { setRows([]); return; }
      try {
        const regs = await apiFetch<any[]>(`/api/registrations?forEvent=1&eventId=${encodeURIComponent(eventId)}`);
        const mapped = (regs||[]).map((r:any) => ({
          id: String(r.user?.id || r.userId),
          name: r.user?.name || 'User',
          email: r.user?.email || '',
          team: r.team?.name || '-',
          registeredAt: r.createdAt || r.created_at || '',
        }));
        setRows(mapped);
      } catch { setRows([]); }
    })();
  }, [eventId]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => (r.name||'').toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q) || (r.team||'').toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Participants</h1>
      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
              <option value="">Select event</option>
              {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <input className="neon-input w-full px-4 py-2.5 text-white rounded-lg pr-9" placeholder="Search name, email or team" value={query} onChange={(e)=>setQuery(e.target.value)} />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400">Quick Stats</div>
            <div className="text-neon-green text-lg font-medium flex items-center justify-end"><Users className="w-4 h-4 mr-2" />{filtered.length} participants</div>
          </div>
        </div>
      </Card>

      <Card roleColor={roleColor}>
        {eventId ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Registered At</th>
                  {user?.role === 'organizer' && <th className="text-left p-2">Certificate</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-900/50">
                    <td className="p-2 text-white">{row.name}</td>
                    <td className="p-2 text-gray-300">{row.email}</td>
                    <td className="p-2 text-gray-300">{row.team}</td>
                    <td className="p-2 text-gray-300">{row.registeredAt ? new Date(row.registeredAt).toLocaleString() : '-'}</td>
                    {user?.role === 'organizer' && (
                      <td className="p-2">
                        <button
                          className="text-neon-blue hover:underline disabled:opacity-50"
                          disabled={isGenerating === row.id}
                          onClick={async ()=>{
                            try {
                              setIsGenerating(row.id);
                              const cert:any = await apiFetch(`/api/certificates/generate`, { method: 'POST', body: { eventId, userId: row.id, participantName: row.name, role: 'Participant' } });
                              const url = (cert?.url) || cert?.data?.url || cert?.data?.data?.url;
                              // Auto download (PDF). If you need PNG, I can add a PNG endpoint.
                              if (url) {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${row.name}-${eventId}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                              }
                            } catch (e:any) { alert(e?.message || 'Failed'); } finally { setIsGenerating(null); }
                          }}
                        >
                          {isGenerating === row.id ? 'Generating...' : 'Generate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={4} className="p-4 text-gray-500">No participants found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">Select an event to view its participants.</div>
        )}
      </Card>
    </div>
  );
};

export default Participants;



