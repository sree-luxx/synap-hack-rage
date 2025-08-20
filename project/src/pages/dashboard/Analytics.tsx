import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

type SeriesPoint = { date: string; count: number };
type Team = { id: string; members?: Array<any> };
type Score = { teamId: string };
type PlagiarismReport = { status: 'PENDING' | 'COMPLETED' | 'FAILED' };

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  const [registrationTrend, setRegistrationTrend] = useState<SeriesPoint[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<SeriesPoint[]>([]);
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [seedAttempted, setSeedAttempted] = useState(false);

  // Aggregates/KPIs
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [teamSizeBuckets, setTeamSizeBuckets] = useState<{ size: string; count: number }[]>([]);
  const [judgedTeams, setJudgedTeams] = useState(0);
  const [submittingTeams, setSubmittingTeams] = useState(0);
  const [plagiarismCounts, setPlagiarismCounts] = useState<{ pending: number; completed: number; failed: number }>({ pending: 0, completed: 0, failed: 0 });

  useEffect(() => {
    // populate event list for organizers
    (async () => {
      if (user?.role !== 'organizer') return;
      const pairs: Array<{ id: string; title: string }> = [];
      try {
        const resp = await apiFetch<any[]>(`/api/events`);
        const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
        pairs.push(...(list || []).map((e: any) => ({ id: e.id, title: e.name || e.title || 'Event' })));
      } catch {}
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) as string;
          if (key && key.startsWith('hv_events_')) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            pairs.push(...list.map((e: any) => ({ id: e.id, title: e.title })));
          }
        }
      } catch {}
      const map = new Map(pairs.map(p => [p.id, p]));
      const unique = Array.from(map.values());
      setEvents(unique);
      // Auto-select first event if none chosen for better UX
      if (!eventId && unique.length > 0) {
        setEventId(unique[0].id);
      }

      // If no events exist, try to seed demo data (dev only)
      if ((unique.length === 0) && !seedAttempted) {
        try {
          await apiFetch(`/api/dev/seed?secret=dev`, { method: 'POST' });
          setSeedAttempted(true);
          // Refetch events
          const seeded = await apiFetch<any[]>(`/api/events`);
          const seededList = Array.isArray(seeded) ? seeded : (seeded as any)?.data || [];
          const seededPairs = (seededList || []).map((e: any) => ({ id: e.id, title: e.name || e.title || 'Event' }));
          if (seededPairs.length > 0) {
            setEvents(seededPairs);
            setEventId(seededPairs[0].id);
          } else {
            // As a final fallback, attach demo event id so Mongo-only analytics still work
            const demo = [{ id: 'demo-event-1', title: 'Demo Event' }];
            setEvents(demo);
            setEventId('demo-event-1');
          }
        } catch {
          // Ignore seeding errors
        }
      }
    })();
  }, [user?.role, user?.id]);

  useEffect(() => {
    (async () => {
      const days = 14;
      const today = new Date();
      const zeroSeries = Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - i));
        return { date: d.toISOString().slice(0, 10), count: 0 } as SeriesPoint;
      });

      const byDate = (list: Array<{ createdAt: string }>) => {
        const counts: Record<string, number> = {};
        for (const item of list) {
          const key = new Date(item.createdAt).toISOString().slice(0, 10);
          counts[key] = (counts[key] || 0) + 1;
        }
        return zeroSeries.map(p => ({ ...p, count: counts[p.date] || 0 }));
      };

      // Registrations per event
      try {
        const regs = eventId
          ? await apiFetch<any[]>(`/api/registrations?forEvent=1&eventId=${encodeURIComponent(eventId)}`)
          : [];
        const filtered = (regs || []).filter((r: any) => !eventId || (r.event?.id || r.eventId) === eventId);
        setRegistrationTrend(byDate(filtered.map((r: any) => ({ createdAt: r.createdAt }))));
        setTotalRegistrations(filtered.length);
      } catch {
        // local fallback
        const local: Array<{ createdAt: string; eventId: string }> = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            if (key && key.startsWith('hv_reg_')) {
              const parts = key.split('_');
              const eid = parts[parts.length - 1];
              if (!eventId || eid === eventId) {
                local.push({ createdAt: new Date().toISOString(), eventId: eid });
              }
            }
          }
        } catch {}
        const trend = byDate(local);
        setRegistrationTrend(trend);
        setTotalRegistrations(local.length);
      }

      // Submissions per event
      try {
        const subs = eventId
          ? await apiFetch<any[]>(`/api/submissions?eventId=${encodeURIComponent(eventId)}`)
          : [];
        const filtered = (subs || []).filter((s: any) => !eventId || (s.event?.id || s.eventId) === eventId);
        setSubmissionTrend(byDate(filtered.map((s: any) => ({ createdAt: s.createdAt }))));
        setTotalSubmissions(filtered.length);
      } catch {
        // local fallback
        const localSubs: Array<{ createdAt: string }> = JSON.parse(localStorage.getItem(`hv_submissions_${eventId}`) || '[]');
        const trend = byDate(localSubs);
        setSubmissionTrend(trend);
        setTotalSubmissions(localSubs.length);
      }
    })();
  }, [eventId, user?.id]);

  // Additional organizer analytics: teams, scoring progress, plagiarism
  useEffect(() => {
    if (user?.role !== 'organizer') return;
    (async () => {
      // Teams + size distribution
      try {
        const teams = eventId ? await apiFetch<Team[]>(`/api/teams?eventId=${encodeURIComponent(eventId)}`) : [];
        setTotalTeams(teams.length);
        const buckets: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
        for (const t of teams) {
          const size = Math.max(1, (t.members?.length ?? 0));
          if (size >= 5) buckets['5+'] += 1;
          else buckets[String(size)] += 1;
        }
        setTeamSizeBuckets(Object.entries(buckets).map(([size, count]) => ({ size, count })));
      } catch {
        setTotalTeams(0);
        setTeamSizeBuckets([]);
      }

      // Scoring progress
      try {
        const subs = eventId ? await apiFetch<any[]>(`/api/submissions?eventId=${encodeURIComponent(eventId)}`) : [];
        const submittingTeamIds = new Set<string>((subs || []).map((s: any) => s.teamId));
        setSubmittingTeams(submittingTeamIds.size);
        const scores = eventId ? await apiFetch<Score[]>(`/api/scores?eventId=${encodeURIComponent(eventId)}`) : [];
        const judgedTeamIds = new Set<string>((scores || []).map((sc: any) => sc.teamId).filter((tid: string) => submittingTeamIds.has(tid)));
        setJudgedTeams(judgedTeamIds.size);
      } catch {
        setSubmittingTeams(0);
        setJudgedTeams(0);
      }

      // Plagiarism report status counts
      try {
        const reports = eventId ? await apiFetch<PlagiarismReport[]>(`/api/plagiarism?eventId=${encodeURIComponent(eventId)}`) : [];
        const counts = { pending: 0, completed: 0, failed: 0 };
        for (const r of reports) {
          if (r.status === 'PENDING') counts.pending += 1;
          else if (r.status === 'COMPLETED') counts.completed += 1;
          else if (r.status === 'FAILED') counts.failed += 1;
        }
        setPlagiarismCounts(counts);
      } catch {
        setPlagiarismCounts({ pending: 0, completed: 0, failed: 0 });
      }
    })();
  }, [eventId, user?.role]);

  // Demo data fallback when everything is empty
  useEffect(() => {
    if (user?.role !== 'organizer') return;
    const noTrends = (registrationTrend.every(p => p.count === 0) && submissionTrend.every(p => p.count === 0));
    const noCounts = (totalRegistrations === 0 && totalSubmissions === 0 && totalTeams === 0 && judgedTeams === 0 && submittingTeams === 0);
    const noPlagiarism = (plagiarismCounts.completed + plagiarismCounts.pending + plagiarismCounts.failed === 0);
    if (noTrends && noCounts && noPlagiarism) {
      setIsDemo(true);

      // Build demo 14-day series with a gentle ramp-up
      const days = 14;
      const today = new Date();
      const buildSeries = (base: number) => Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - i));
        const jitter = Math.floor(Math.random() * 3);
        return { date: d.toISOString().slice(0, 10), count: Math.max(0, Math.floor((i / 3)) + jitter + base) } as SeriesPoint;
      });
      setRegistrationTrend(buildSeries(0));
      setSubmissionTrend(buildSeries(1));

      // Demo KPIs
      setTotalRegistrations(128);
      setTotalTeams(22);
      setTotalSubmissions(15);
      setSubmittingTeams(15);
      setJudgedTeams(9);

      // Demo team sizes
      setTeamSizeBuckets([
        { size: '1', count: 2 },
        { size: '2', count: 6 },
        { size: '3', count: 7 },
        { size: '4', count: 4 },
        { size: '5+', count: 3 },
      ]);

      // Demo plagiarism
      setPlagiarismCounts({ completed: 4, pending: 2, failed: 1 });
    } else {
      setIsDemo(false);
    }
  }, [user?.role, registrationTrend, submissionTrend, totalRegistrations, totalSubmissions, totalTeams, judgedTeams, submittingTeams, plagiarismCounts]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Analytics</h1>
      {user?.role === 'organizer' && (
        <Card roleColor={roleColor}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
                <option value="">All Events</option>
                {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
              </select>
            </div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-3">Registrations (last 14 days)</h2>
          {registrationTrend.length === 0 || registrationTrend.every(p => p.count === 0) ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No registration activity</div>
          ) : (
            <div className="flex gap-1.5 items-end h-40">
              {registrationTrend.map((p, i) => (
                <div
                  key={i}
                  className="w-3 bg-gradient-to-t from-neon-blue/30 to-neon-green/70 rounded-t"
                  style={{ height: `${(p.count/Math.max(1, Math.max(...registrationTrend.map(x=>x.count))))*100}%` }}
                  title={`${p.date}: ${p.count}`}
                />
              ))}
            </div>
          )}
        </Card>
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-3">Submissions (last 14 days)</h2>
          {submissionTrend.length === 0 || submissionTrend.every(p => p.count === 0) ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No submissions yet</div>
          ) : (
            <div className="flex gap-1.5 items-end h-40">
              {submissionTrend.map((p, i) => (
                <div
                  key={i}
                  className="w-3 bg-gradient-to-t from-neon-purple/30 to-neon-pink/70 rounded-t"
                  style={{ height: `${(p.count/Math.max(1, Math.max(...submissionTrend.map(x=>x.count))))*100}%` }}
                  title={`${p.date}: ${p.count}`}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {user?.role === 'organizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card roleColor={roleColor}>
            <h2 className="text-white font-semibold mb-4">Key Metrics</h2>
            {isDemo && (
              <div className="mb-3 text-xs text-gray-400">Showing sample analytics</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-gray-400 text-xs">Registrations</div>
                <div className="text-2xl font-bold text-white">{totalRegistrations}</div>
              </div>
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-gray-400 text-xs">Teams</div>
                <div className="text-2xl font-bold text-white">{totalTeams}</div>
              </div>
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-gray-400 text-xs">Submissions</div>
                <div className="text-2xl font-bold text-white">{totalSubmissions}</div>
              </div>
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-gray-400 text-xs">Teams Judged</div>
                <div className="text-2xl font-bold text-white">{judgedTeams}</div>
              </div>
            </div>
          </Card>

          <Card roleColor={roleColor}>
            <h2 className="text-white font-semibold mb-3">Team Size Distribution</h2>
            {teamSizeBuckets.length === 0 || teamSizeBuckets.every(b => b.count === 0) ? (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No teams yet</div>
            ) : (
              <div className="flex gap-3 items-end h-40">
                {teamSizeBuckets.map((b, idx) => {
                  const max = Math.max(1, ...teamSizeBuckets.map(x => x.count));
                  const colors = [
                    'from-neon-blue/30 to-neon-blue/80',
                    'from-neon-green/30 to-neon-green/80',
                    'from-neon-purple/30 to-neon-purple/80',
                    'from-neon-pink/30 to-neon-pink/80',
                    'from-neon-orange/30 to-neon-orange/80',
                  ];
                  return (
                    <div key={b.size} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 bg-gradient-to-t ${colors[idx % colors.length]} rounded-t`}
                        style={{ height: `${(b.count/max)*100}%` }}
                        title={`${b.size}: ${b.count}`}
                      />
                      <div className="text-xs text-gray-400">{b.size}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card roleColor={roleColor}>
            <h2 className="text-white font-semibold mb-3">Scoring Progress</h2>
            <div className="space-y-2">
              <div className="text-sm text-gray-300">Judged Teams: {judgedTeams} / {submittingTeams}</div>
              <div className="w-full h-3 bg-gray-800 rounded">
                <div className="h-3 bg-neon-blue rounded" style={{ width: `${Math.min(100, Math.round((judgedTeams/Math.max(1, submittingTeams))*100))}%` }} />
              </div>
            </div>
          </Card>

          <Card roleColor={roleColor}>
            <h2 className="text-white font-semibold mb-3">Plagiarism Reports</h2>
            {(plagiarismCounts.completed + plagiarismCounts.pending + plagiarismCounts.failed) === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No reports</div>
            ) : (
              <div className="flex gap-3 items-end h-40">
                {[
                  { key: 'Completed', value: plagiarismCounts.completed, color: 'from-neon-purple/30 to-neon-purple/80' },
                  { key: 'Pending', value: plagiarismCounts.pending, color: 'from-neon-blue/30 to-neon-blue/80' },
                  { key: 'Failed', value: plagiarismCounts.failed, color: 'from-neon-orange/30 to-neon-orange/80' },
                ].map((p) => {
                  const max = Math.max(1, plagiarismCounts.completed, plagiarismCounts.pending, plagiarismCounts.failed);
                  return (
                    <div key={p.key} className="flex flex-col items-center gap-1">
                      <div className={`w-8 bg-gradient-to-t ${p.color} rounded-t`} style={{ height: `${(p.value/max)*100}%` }} title={`${p.key}: ${p.value}`} />
                      <div className="text-xs text-gray-400">{p.key}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;


