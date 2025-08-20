import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Target, UserPlus, UserMinus } from 'lucide-react';
import { apiFetch } from '../../lib/api';

 type Assignment = { eventId: string; judgeId: string; judgeName: string; organizerId: string; eventTitle?: string };

 export const Judges: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => 'blue' as const, []);
  const params = new URLSearchParams(useLocation().search);
  const [eventId, setEventId] = useState<string>(params.get('event') || '');
  const [judgeEmail, setJudgeEmail] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  const storageKey = useMemo(() => `hv_events_${user?.id || 'anon'}`,[user?.id]);

  const loadAssignments = (currentEventId?: string) => {
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    const filtered = all.filter(a => a.organizerId === (user?.id || '') && (!currentEventId || a.eventId === currentEventId));
    setAssignments(filtered);
  };

  const loadEvents = async () => {
    try {
      // Local events created by this organizer
      const localEvents: Array<{ id: string; title: string }> = JSON.parse(localStorage.getItem(storageKey) || '[]')
        .map((e: any) => ({ id: e.id, title: e.title }))
        .filter((e: any) => !!e.id);

      // Backend events (if available)
      let backendEvents: Array<{ id: string; title: string }> = [];
      try {
        const resp = await apiFetch<any[]>(`/api/events`);
        const list = Array.isArray(resp) ? resp : (resp as any)?.data || [];
        backendEvents = (list || []).map((e: any) => ({ id: e.id, title: e.name || e.title || 'Event' }));
      } catch {}

      // Merge unique by id, prefer local titles if present
      const byId = new Map<string, { id: string; title: string }>();
      for (const e of backendEvents) byId.set(e.id, e);
      for (const e of localEvents) byId.set(e.id, e);
      const merged = Array.from(byId.values());
      setEvents(merged);
      // If an eventId is present in URL but not in list, keep it as free text
    } catch {}
  };

  useEffect(() => { loadEvents(); }, [storageKey]);

  useEffect(() => { loadAssignments(eventId); }, [eventId, user?.id]);

  const resolveEvent = (id: string | undefined): { id: string; title: string } | null => {
    if (!id) return null;
    const found = events.find(e => e.id === id);
    if (found) return found;
    return { id, title: id };
  };

  const addJudge = () => {
    const chosenEventId = eventId || events[0]?.id || '';
    if (!chosenEventId || !judgeEmail.trim()) return;
    const ev = resolveEvent(chosenEventId);
    const newAssign: Assignment = {
      eventId: chosenEventId,
      judgeId: `judge-${judgeEmail}`,
      judgeName: judgeEmail.split('@')[0],
      organizerId: user?.id || '',
      eventTitle: ev?.title || 'Event',
    };
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    localStorage.setItem('hv_assignments', JSON.stringify([newAssign, ...all]));
    setJudgeEmail('');
    loadAssignments(eventId);
  };

  const addJudgeForEvent = (targetEventId: string, targetJudgeEmail: string) => {
    if (!targetEventId || !targetJudgeEmail.trim()) return;
    const ev = resolveEvent(targetEventId);
    const newAssign: Assignment = {
      eventId: targetEventId,
      judgeId: `judge-${targetJudgeEmail}`,
      judgeName: targetJudgeEmail.split('@')[0],
      organizerId: user?.id || '',
      eventTitle: ev?.title || 'Event',
    };
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    localStorage.setItem('hv_assignments', JSON.stringify([newAssign, ...all]));
    loadAssignments(eventId);
  };

  const removeJudge = (a: Assignment) => {
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    const filtered = all.filter(x => !(x.eventId === a.eventId && x.judgeId === a.judgeId && x.organizerId === (user?.id || '')));
    localStorage.setItem('hv_assignments', JSON.stringify(filtered));
    loadAssignments(eventId);
  };

  // Group assignments by event for "assigned work"
  const grouped = assignments.reduce<Record<string, Assignment[]>>((acc, a) => {
    (acc[a.eventId] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Judges</h1>

      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Event (optional)</label>
            <select
              className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">All events</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title} ({ev.id})</option>
              ))}
            </select>
          </div>
          <Input label="Judge email" value={judgeEmail} onChange={(e) => setJudgeEmail(e.target.value)} placeholder="judge@example.com" roleColor={roleColor} />
          <div className="flex items-end">
            <Button onClick={addJudge} roleColor={roleColor}><UserPlus className="w-4 h-4" /> Assign</Button>
          </div>
        </div>
      </Card>

      {/* Assigned work grouped by event */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 && (
          <Card roleColor={roleColor}><div className="text-gray-400">No assignments yet.</div></Card>
        )}
        {Object.entries(grouped).map(([evId, list]) => {
          const ev = resolveEvent(evId);
          return (
            <Card key={evId} roleColor={roleColor} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-neon-blue" /> {ev?.title || 'Event'} <span className="text-gray-500 text-xs">({evId})</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Input label="Assign by email" value={''} onChange={() => {}} roleColor={roleColor} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {list.map((a, idx) => (
                  <div key={`${a.eventId}-${a.judgeId}-${idx}`} className="flex items-center justify-between border border-gray-800 rounded-md p-3">
                    <div>
                      <div className="text-white font-medium flex items-center gap-2"><Award className="w-4 h-4 text-neon-orange" /> {a.judgeName}</div>
                      <div className="text-gray-400 text-xs">{a.judgeId.replace('judge-','')}</div>
                    </div>
                    <Button variant="outline" roleColor={roleColor} onClick={() => removeJudge(a)}><UserMinus className="w-4 h-4" /> Remove</Button>
                  </div>
                ))}
              </div>
              {/* Quick assign for this event */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input label="Assign another judge (email)" value={''} onChange={() => {}} placeholder="judge@example.com" roleColor={roleColor} />
                </div>
                {/* simple prompt-based assign to avoid extra state per row */}
                <Button
                  variant="outline"
                  roleColor={roleColor}
                  onClick={() => {
                    const email = window.prompt(`Enter judge email to assign to ${ev?.title || evId}`) || '';
                    if (email.trim()) addJudgeForEvent(evId, email.trim());
                  }}
                >
                  <UserPlus className="w-4 h-4" /> Assign to this event
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

 export default Judges;



