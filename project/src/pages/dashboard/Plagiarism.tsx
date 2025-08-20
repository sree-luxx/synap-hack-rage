import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';

export const Plagiarism: React.FC = () => {
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async() => {
    try {
      const resp = await apiFetch<any[]>(`/api/events`);
      const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
      setEvents((list || []).map((e:any)=>({ id:e.id, title: e.name || e.title || 'Event' })));
    } catch {}
  })(); }, []);

  const load = async () => {
    if (!eventId) { setSubs([]); setReports([]); return; }
    try {
      setSubs(await apiFetch<any[]>(`/api/submissions?eventId=${encodeURIComponent(eventId)}`));
      setReports(await apiFetch<any[]>(`/api/plagiarism?eventId=${encodeURIComponent(eventId)}`));
    } catch { setSubs([]); setReports([]); }
  };

  useEffect(() => { load(); }, [eventId]);

  const run = async (submissionId: string) => {
    setLoading(true);
    try { await apiFetch(`/api/plagiarism/run`, { method: 'POST', body: { eventId, submissionId } }); await load(); } finally { setLoading(false); }
  };

  const bySubmission = new Map<string, any[]>(reports.map(r => [String(r.submissionId), r.similarities || []]));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Plagiarism</h1>
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
          {subs.map(s => (
            <div key={String(s._id || s.id)} className="border border-gray-800 rounded p-3">
              <div className="flex justify-between items-center">
                <div className="text-white font-medium">{s.title}</div>
                <Button roleColor="blue" onClick={()=>run(String(s._id || s.id))} disabled={loading}>Run</Button>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {(bySubmission.get(String(s._id || s.id)) || []).slice(0,5).map((m, idx) => (
                  <div key={idx} className="flex justify-between"><span>vs {m.otherSubmissionId}</span><span>{((m.similarity||0)*100).toFixed(1)}%</span></div>
                ))}
                {!bySubmission.get(String(s._id || s.id))?.length && (
                  <div className="text-gray-500">No report yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Plagiarism;


