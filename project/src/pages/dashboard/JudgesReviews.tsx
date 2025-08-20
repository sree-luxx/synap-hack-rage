import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../lib/api';

export const JudgesReviews: React.FC = () => {
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

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
      if (!eventId) { setRows([]); setReports([]); return; }
      try {
        const [subs, scores, rep] = await Promise.all([
          apiFetch<any[]>(`/api/submissions?eventId=${encodeURIComponent(eventId)}`),
          apiFetch<any[]>(`/api/scores?eventId=${encodeURIComponent(eventId)}`),
          apiFetch<any[]>(`/api/plagiarism?eventId=${encodeURIComponent(eventId)}`)
        ]);
        const bySubmission = new Map<string, any[]>(Object.entries((scores||[]).reduce((acc:any,s:any)=>{ (acc[s.submissionId] ||= []).push(s); return acc; },{})));
        const merged = (subs||[]).map(s => ({
          id: String(s._id || s.id),
          title: s.title,
          teamId: s.teamId,
          judges: (bySubmission.get(String(s._id || s.id)) || []).map(sc => ({ judgeId: sc.judgeId, total: sc.total || (sc.criteria || []).reduce((t:number,c:any)=>t+(c.score||0),0)})),
          total: (bySubmission.get(String(s._id || s.id)) || []).reduce((t,sc)=> t + (sc.total || (sc.criteria||[]).reduce((tt:number, c:any)=>tt+(c.score||0),0)),0)
        }));
        setRows(merged);
        setReports(Array.isArray(rep) ? rep : []);
      } catch { setRows([]); setReports([]); }
    })();
  }, [eventId]);

  const flagsBySubmission = useMemo(() => {
    const map = new Map<string, Array<{ other: string; score: number }>>();
    for (const r of reports) {
      const sid = String(r.submissionId);
      const sims = Array.isArray(r.similarities) ? r.similarities : [];
      for (const s of sims) {
        if ((s?.similarity ?? 0) >= 0.85) {
          (map.get(sid) || map.set(sid, []).get(sid)!)?.push({ other: String(s.otherSubmissionId), score: Number(s.similarity) });
        }
      }
    }
    return map;
  }, [reports]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Judges Reviews</h1>
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
        <div className="space-y-3">
          {!rows.length && (
            <div className="text-gray-500 text-sm">No submissions found for this event.</div>
          )}
          {rows.map(r => (
            <div key={r.id} className="border border-gray-800 rounded p-3">
              <div className="flex justify-between">
                <div className="text-white font-medium">{r.title} <span className="text-xs text-gray-500">(Team {r.teamId})</span></div>
                <div className="text-neon-blue font-bold">Total: {r.total}</div>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {r.judges.length ? r.judges.map((j:any, idx:number) => (
                  <div key={idx} className="flex justify-between"><span>Judge {j.judgeId}</span><span>{j.total}</span></div>
                )) : <div className="text-gray-500">No scores yet.</div>}
              </div>
              {/* Plagiarism Flags */}
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wider text-gray-400">Plagiarism Flags</div>
                {flagsBySubmission.get(r.id)?.length ? (
                  <div className="mt-1 space-y-1">
                    {flagsBySubmission.get(r.id)!.map((f, i) => (
                      <div key={i} className="text-sm text-red-400">Similar to submission {f.other} — {(f.score*100).toFixed(1)}%</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No high-similarity matches.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default JudgesReviews;
