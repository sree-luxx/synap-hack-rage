import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Trophy, Award, Medal } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { apiFetch } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const [eventId, setEventId] = useState('');
  const [roundId, setRoundId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string; rounds?: Array<{ id: string; name: string }> }>>([]);
  const [rows, setRows] = useState<Array<{ teamId: string; teamName?: string; total: number }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch<any[]>(`/api/events`);
        const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
        const mapped = (list || []).map((e:any)=>({ id:e.id, title: e.name || e.title || 'Event', rounds: (e.rounds||[]).map((r:any)=>({ id:r.id||r._id||r.name, name:r.name||r.id })) }));
        setEvents(mapped);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!eventId) { setRows([]); return; }
      try {
        const qs = new URLSearchParams({ eventId });
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
        setRows(rows);
      } catch { setRows([]); }
    })();
  }, [eventId, roundId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Leaderboard</h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={eventId} onChange={(e)=>{ setEventId(e.target.value); setRoundId(''); }}>
              <option value="">Select event</option>
              {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Round</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={roundId} onChange={(e)=>setRoundId(e.target.value)}>
              <option value="">All rounds</option>
              {(events.find(e=>e.id===eventId)?.rounds || []).map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-800">
          {rows.length === 0 ? (
            <div className="text-gray-400 p-4">Select an event to view the leaderboard.</div>
          ) : rows.map((row, idx) => (
            <div key={row.teamId} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  {idx+1 === 1 ? <Trophy className="w-5 h-5 text-yellow-400" /> : idx+1 === 2 ? <Medal className="w-5 h-5 text-gray-300" /> : idx+1 === 3 ? <Medal className="w-5 h-5 text-amber-700" /> : <Award className="w-5 h-5 text-neon-purple" />}
                </div>
                <div>
                  <div className="text-white font-semibold">#{idx+1} Team {row.teamId}</div>
                  <div className="text-xs text-gray-500">{eventId}{roundId ? ` • ${roundId}` : ''}</div>
                </div>
              </div>
              <div className="text-neon-purple font-orbitron text-lg">{row.total}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;



