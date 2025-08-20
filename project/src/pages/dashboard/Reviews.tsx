import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, FileText, Star, Github, Link as LinkIcon, Video, Download, Eye } from 'lucide-react';
import { apiFetch } from '../../lib/api';

 type Criteria = { name: string; maxScore: number };
 type Submission = { id: string; title: string; description: string; teamId?: string; githubUrl?: string; demoUrl?: string; videoUrl?: string; documents: Array<{ id: string; name: string; url?: string; size?: number }> };

 export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const roleColor = useMemo(() => 'orange' as const, []);
  const params = new URLSearchParams(useLocation().search);
  const initialEventId = params.get('event') || '';
  const [eventId, setEventId] = useState<string>(initialEventId);

  const [tab, setTab] = useState<'review'|'leaderboard'>('review');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; rounds?: Array<{ id: string; name: string }> }>>([]);
  const [roundId, setRoundId] = useState<string>('');
  const [criteria, setCriteria] = useState<Criteria[]>([
    { name: 'Innovation', maxScore: 25 },
    { name: 'Technical', maxScore: 25 },
    { name: 'Impact', maxScore: 25 },
    { name: 'Presentation', maxScore: 25 },
  ]);
  const [active, setActive] = useState<Submission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [myScores, setMyScores] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!eventId) { setSubmissions([]); return; }
      try {
        const list = await apiFetch<any[]>(`/api/submissions?eventId=${encodeURIComponent(eventId)}`);
        setSubmissions((list || []).map((s:any) => {
          const githubUrl = s.githubUrl || s.repoUrl || s.repository || s.repo || s.codeUrl || s.sourceCodeUrl;
          const demoUrl = s.demoUrl || s.liveUrl || s.url || s.link || s.website || (s.metadata && (s.metadata.demoUrl || s.metadata.demo));
          const videoUrl = s.videoUrl || s.video || s.youtubeUrl || (s.metadata && (s.metadata.videoUrl || s.metadata.video));
          const rawDocs = s.documents || s.files || s.attachments || s.assets || [];
          const documents = (rawDocs || []).map((f:any, idx:number) => ({
            id: String(f.id || f._id || `${s._id || s.id}-f-${idx}`),
            name: f.name || f.filename || f.title || `File ${idx+1}`,
            url: f.url || f.fileUrl || f.href || f.link,
            size: f.size || f.length || f.bytes
          }));
          return {
            id: String(s._id || s.id),
            title: s.title,
            description: s.description || '',
            teamId: s.teamId,
            githubUrl,
            demoUrl,
            videoUrl,
            documents
          } as Submission;
        }));
      } catch {
        const subs = JSON.parse(localStorage.getItem(`hv_submissions_${eventId}`) || '[]');
        setSubmissions(subs.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          teamId: s.teamId,
          githubUrl: s.githubUrl,
          demoUrl: s.demoUrl,
          videoUrl: s.videoUrl,
          documents: (s.documents || []).map((d:any)=>({ id:d.id || d.name, name:d.name, url:d.url, size:d.size }))
        })));
      }
      // Load my scores for leaderboard
      try {
        const qs = new URLSearchParams({ eventId });
        if (roundId) qs.set('roundId', roundId);
        const scores = await apiFetch<any[]>(`/api/scores?${qs.toString()}`);
        const mine = (scores || []).filter(s => s.judgeId === user?.id);
        setMyScores(mine);
      } catch {
        const local = JSON.parse(localStorage.getItem(`hv_scores_${user?.id}_${eventId}`) || '[]').filter((x:any)=>!roundId || x.roundId===roundId);
        setMyScores(local);
      }
    })();
  }, [eventId, roundId, user?.id]);

  useEffect(() => {
    (async () => {
      if (user?.role !== 'judge') return;
      const pairs: Array<{ id: string; title: string; rounds?: Array<{ id: string; name: string }> }> = [];
      try {
        const allAssigns: Array<{ eventId: string; judgeId?: string; judgeName?: string; judgeEmail?: string; organizerId?: string }> = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
        const mine = allAssigns.filter(a => a.judgeId === user?.id || a.judgeId === `judge-${user?.email}` || a.judgeName === user?.name || a.judgeEmail === user?.email);
        for (const a of mine) {
          let title: string | undefined;
          let rounds: Array<{ id: string; name: string }> | undefined;
          // Try organizer-local stored events first if organizerId is present
          if (a.organizerId) {
            try {
              const list = JSON.parse(localStorage.getItem(`hv_events_${a.organizerId}`) || '[]');
              const ev = list.find((e: any) => e.id === a.eventId);
              if (ev) { title = ev.title; rounds = ev.rounds; }
            } catch {}
          }
          // Fallback to API event lookup
          if (!title) {
            try {
              const ev = await apiFetch<any>(`/api/events/${a.eventId}`);
              title = ev?.name || ev?.title;
              rounds = (ev?.rounds || []).map((r:any)=>({ id: r.id || r._id || r.name, name: r.name || r.id }));
            } catch {}
          }
          pairs.push({ id: a.eventId, title: title || a.eventId, rounds });
        }
      } catch {}
      const map = new Map(pairs.map(p => [p.id, p]));
      setEvents(Array.from(map.values()));
    })();
  }, [user?.role]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (eventId) url.searchParams.set('event', eventId); else url.searchParams.delete('event');
    window.history.replaceState({}, '', url.toString());
  }, [eventId]);

  const openReview = (s: Submission) => {
    setActive(s);
    const existing = myScores.find((x: any) => x.submissionId === s.id);
    if (existing) {
      setScores(existing.criteria.reduce((acc: any, c: any) => ({ ...acc, [c.name]: c.score }), {}));
      setFeedback(existing.overallFeedback || '');
    } else {
      setScores({});
      setFeedback('');
    }
  };

  const saveScore = async () => {
    if (!eventId || !user || !active) return;
    setIsSaving(true);
    try {
      const record = {
        eventId,
        submissionId: active.id,
        teamId: active.teamId,
        criteria: criteria.map(c => ({ name: c.name, max: c.maxScore, score: Math.min(Math.max(Number(scores[c.name] || 0), 0), c.maxScore) })),
        notes: feedback
      };
      // Try backend first
      try {
        await apiFetch(`/api/scores`, { method: 'POST', body: record });
      } catch {
        const existing = JSON.parse(localStorage.getItem(`hv_scores_${user.id}_${eventId}`) || '[]');
        const updated = [
          {
            submissionId: active.id,
            judgeId: user.id,
            judgeName: user.name,
            criteria: record.criteria.map(c => ({ name: c.name, maxScore: c.max, score: c.score })),
            overallFeedback: feedback,
            createdAt: new Date().toISOString()
          },
          ...existing.filter((x: any) => x.submissionId !== active.id)
        ];
        localStorage.setItem(`hv_scores_${user.id}_${eventId}`, JSON.stringify(updated));
      }
      toast.success('Scores saved');
      setActive(null);
      // reload my scores
      try {
        const scores = await apiFetch<any[]>(`/api/scores?eventId=${encodeURIComponent(eventId)}`);
        const mine = (scores || []).filter(s => s.judgeId === user?.id);
        setMyScores(mine);
      } catch {
        const local = JSON.parse(localStorage.getItem(`hv_scores_${user?.id}_${eventId}`) || '[]');
        setMyScores(local);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const teamScore = (teamId: string) => {
    const entries = myScores.filter(s => s.teamId === teamId || s.submissionId === submissions.find(x=>x.teamId===teamId)?.id);
    const sum = entries.reduce((acc, s: any) => acc + (s.total || s.criteria?.reduce((t:number,c:any)=>t+(c.score||0),0) || 0), 0);
    return sum;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Project Reviews</h1>

      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
              <option value="">Select an event</option>
              {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Round</label>
            <select className="neon-input w-full px-4 py-2.5 text-white rounded-lg" value={roundId} onChange={(e)=>setRoundId(e.target.value)}>
              <option value="">All rounds</option>
              {(events.find(e=>e.id===eventId)?.rounds || []).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant={tab==='review'?'':'outline'} roleColor={roleColor} onClick={()=>setTab('review')}>Review</Button>
        <Button variant={tab==='leaderboard'?'':'outline'} roleColor={roleColor} onClick={()=>setTab('leaderboard')}>My Leaderboard</Button>
      </div>

      {tab==='review' ? (
        submissions.length === 0 ? (
          <Card roleColor={roleColor}><p className="text-gray-400">{eventId ? 'No submissions available yet.' : 'Select an event to view submissions.'}</p></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {submissions.map((s) => (
              <Card key={s.id} roleColor={roleColor}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold">{s.title}</div>
                    {s.teamId && <div className="text-xs text-gray-500 mb-1">Team {s.teamId}</div>}
                    <div className="text-gray-400 text-sm">{s.description}</div>
                  </div>
                  <Button onClick={() => openReview(s)} roleColor={roleColor}><FileText className="w-4 h-4" /> Score</Button>
                </div>
                {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {[
                    { label: 'Source Code', icon: Github, url: s.githubUrl },
                    { label: 'Live Demo', icon: LinkIcon, url: s.demoUrl },
                    { label: 'Demo Video', icon: Video, url: s.videoUrl }
                  ].map((item, idx) => (
                    item.url ? (
                      <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                        <item.icon className="w-4 h-4 text-neon-orange mr-2" />
                        <span className="text-sm text-gray-300">{item.label}</span>
                      </a>
                    ) : (
                      <div key={idx} className="flex items-center p-3 bg-gray-900/30 rounded-lg border border-gray-800 opacity-60 cursor-not-allowed">
                        <item.icon className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-400">{item.label} • Not provided</span>
                      </div>
                    )
                  ))}
                </div>
                {/* Documents */}
                {s.documents?.length ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Documents</div>
                    {s.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-gray-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300 text-sm">{doc.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs text-gray-300 hover:text-white"><Eye className="w-3 h-3" /></a>
                          )}
                          {doc.url && (
                            <a href={doc.url} download className="px-2 py-1 text-xs text-gray-300 hover:text-white"><Download className="w-3 h-3" /></a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-3">Teams ranked by my scores</h2>
          <div className="space-y-2">
            {Array.from(new Set(submissions.map(s=>s.teamId).filter(Boolean) as string[]))
              .map(tid => ({ teamId: tid, total: teamScore(tid) }))
              .sort((a,b)=>b.total-a.total)
              .map((row,idx)=> (
                <div key={row.teamId} className="flex justify-between border border-gray-800 rounded p-3">
                  <div className="text-gray-300">#{idx+1} Team {row.teamId}</div>
                  <div className="text-neon-green font-bold">{row.total}</div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Modal isOpen={!!active} onClose={() => setActive(null)} title={`Score: ${active?.title || ''}`} roleColor={roleColor} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map((c) => (
            <Input key={c.name} label={`${c.name} (0-${c.maxScore})`} type="number" value={String(scores[c.name] ?? '')} onChange={(e) => setScores(s => ({ ...s, [c.name]: Number(e.target.value) }))} roleColor={roleColor} />
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Overall Feedback</label>
            <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-28" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share your notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" roleColor={roleColor} onClick={() => setActive(null)}>Cancel</Button>
          <Button roleColor={roleColor} isLoading={isSaving} onClick={saveScore}><CheckCircle className="w-4 h-4" /> Save</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Reviews;



