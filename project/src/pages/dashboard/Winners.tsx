import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../lib/api';

export const Winners: React.FC = () => {
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [leaders, setLeaders] = useState<Array<{ teamId: string; total: number }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch<any[]>(`/api/events`);
        const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
        setEvents((list || []).map((e:any)=>({ id: e.id, title: e.name || e.title || 'Event' })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!eventId) { setLeaders([]); return; }
      try {
        const scores = await apiFetch<any[]>(`/api/scores?eventId=${encodeURIComponent(eventId)}`);
        const totals: Record<string, number> = {};
        (scores || []).forEach(sc => {
          const t = sc.total || (sc.criteria || []).reduce((sum:number,c:any)=>sum+(c.score||0),0);
          totals[sc.teamId] = (totals[sc.teamId] || 0) + t;
        });
        const arr = Object.entries(totals).map(([teamId, total]) => ({ teamId, total: total as number }))
          .sort((a,b)=>b.total-a.total).slice(0,10);
        setLeaders(arr);
      } catch { setLeaders([]); }
    })();
  }, [eventId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Winners</h1>
      <Card roleColor="blue">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
              <option value="">Select event</option>
              {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
            </select>
          </div>
        </div>
      </Card>
      <Card roleColor="blue">
        <div className="space-y-2">
          {leaders.map((r, idx)=> (
            <div key={r.teamId} className="flex justify-between border border-gray-800 rounded p-3">
              <div className="text-gray-300">#{idx+1} Team {r.teamId}</div>
              <div className="text-neon-blue font-bold">{r.total}</div>
            </div>
          ))}
          {!leaders.length && (<div className="text-gray-500">Select an event to see winners.</div>)}
        </div>
      </Card>
    </div>
  );
};

export default Winners;
