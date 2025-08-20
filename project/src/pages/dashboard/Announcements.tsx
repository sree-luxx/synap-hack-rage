import React, { useEffect, useMemo, useState } from 'react';
import Pusher from 'pusher-js';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone } from 'lucide-react';
import { apiFetch } from '../../lib/api';

type Ann = { id: string; title: string; content: string; createdAt: string; eventId?: string; author: string; audience?: 'participants' | 'judges' | 'all' };

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'judge' ? 'orange' : user?.role === 'organizer' ? 'blue' : 'green') as 'orange' | 'blue' | 'green', [user?.role]);
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<Ann[]>([]);
  const [audience, setAudience] = useState<'participants' | 'judges' | 'all'>(user?.role === 'judge' ? 'judges' : 'participants');
  const [organizerEvents, setOrganizerEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [searchName, setSearchName] = useState('');
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [judgeEvents, setJudgeEvents] = useState<Array<{ id: string; title: string }>>([]);

  const load = async () => {
    try {
      const params: string[] = [];
      if (eventId) params.push(`eventId=${encodeURIComponent(eventId)}`);
      // Do not filter by audience at the API level so we also get 'all'
      const qs = params.length ? `?${params.join('&')}` : '';
      const list = await apiFetch<any[]>(`/api/announcements${qs}`);
      const mapped: Ann[] = (list || []).map((a: any) => ({ id: String(a._id || a.id), title: a.title, content: a.message || a.content, createdAt: a.createdAt, eventId: a.eventId, author: a.createdBy || 'Organizer', audience: a.audience }));
      const role = user?.role === 'judge' ? 'judges' : user?.role === 'participant' ? 'participants' : undefined;
      const filtered = role ? mapped.filter(a => !a.audience || a.audience === 'all' || a.audience === role) : mapped;
      setItems(filtered);
      return;
    } catch {}
    const all: Ann[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
    const role = user?.role === 'judge' ? 'judges' : user?.role === 'participant' ? 'participants' : undefined;
    const filtered = all.filter(a => (!eventId || a.eventId === eventId) && (!role || !a.audience || a.audience === 'all' || a.audience === role));
    setItems(filtered);
  };

  useEffect(() => { load(); }, [eventId, user?.role]);

  // Realtime updates via Pusher
  useEffect(() => {
    // Expect these to be set in Vite env when available
    const key = (import.meta as any).env?.VITE_PUSHER_KEY;
    const cluster = (import.meta as any).env?.VITE_PUSHER_CLUSTER || 'mt1';
    if (!key) return;
    const p = new Pusher(key, { cluster });
    const channel = p.subscribe(`event-${eventId || 'all'}`);
    const handler = () => {
      // For announcements and chat events, just reload for simplicity
      load();
    };
    channel.bind('announcement:new', handler);
    channel.bind('chat:new', handler);
    return () => {
      try {
        channel.unbind('announcement:new', handler);
        channel.unbind('chat:new', handler);
        p.unsubscribe(`event-${eventId || 'all'}`);
        p.disconnect();
      } catch {}
    };
  }, [eventId]);

  // For organizers, build event dropdown of all their events (backend + local)
  useEffect(() => {
    (async () => {
      if (user?.role !== 'organizer') return;
      const pairs: Array<{ id: string; title: string }>= [];
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
      setOrganizerEvents(Array.from(map.values()));
    })();
  }, [user?.role, user?.id]);

  // For judges, build event dropdown from assignments
  useEffect(() => {
    (async () => {
      if (user?.role !== 'judge') return;
      const pairs: Array<{ id: string; title: string }> = [];
      try {
        const allAssigns: Array<{ eventId: string; judgeId?: string; judgeName?: string; organizerId?: string }> = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
        const mine = allAssigns.filter(a => a.judgeId === `judge-${user?.email}` || a.judgeName === user?.name);
        for (const a of mine) {
          let title: string | undefined;
          // try organizer local storage bucket first
          try {
            const list = JSON.parse(localStorage.getItem(`hv_events_${a.organizerId}`) || '[]');
            const ev = list.find((e: any) => e.id === a.eventId);
            if (ev) title = ev.title;
          } catch {}
          if (!title) {
            try {
              const e = await apiFetch<any>(`/api/events/${a.eventId}`);
              title = e?.name || e?.title;
            } catch {}
          }
          pairs.push({ id: a.eventId, title: title || a.eventId });
        }
      } catch {}
      const map = new Map(pairs.map(p => [p.id, p]));
      setJudgeEvents(Array.from(map.values()));
    })();
  }, [user?.role, user?.id, user?.email, user?.name]);

  // Build the list of event IDs the current user is registered to
  useEffect(() => {
    (async () => {
      if (!user || user.role !== 'participant') return;
      let apiIds: string[] = [];
      const idToTitle: Record<string, string> = {};
      try {
        const regs = await apiFetch<any[]>(`/api/registrations`);
        // Prefer user-scoped if available; otherwise use all
        const filtered = (regs || []).filter(r => (r.userId === user.id) || (r.user?.id === user.id));
        const source = filtered.length > 0 ? filtered : (regs || []);
        apiIds = source.map(r => r.event?.id || r.eventId).filter(Boolean);
        for (const r of source) {
          const eid = r.event?.id || r.eventId;
          const etitle = r.event?.name || r.event?.title;
          if (eid && etitle) idToTitle[eid] = etitle;
        }
      } catch {}
      // Fallback to local registration store
      let localRegIds: string[] = [];
      try {
        const localRegs: Array<{ eventId: string; eventTitle?: string }> = JSON.parse(localStorage.getItem(`hv_regs_${user.id}`) || '[]');
        localRegIds = localRegs.map(r => r.eventId);
        localRegs.forEach(r => { if (r.eventId && r.eventTitle) idToTitle[r.eventId] = r.eventTitle; });
      } catch {}
      // Derive from local teams as participation signal
      let teamEventIds: string[] = [];
      try {
        const localTeams: Array<{ eventId: string }> = JSON.parse(localStorage.getItem(`hv_myteams_${user.id}`) || '[]');
        teamEventIds = localTeams.map(t => t.eventId);
      } catch {}
      const merged = Array.from(new Set([...apiIds, ...localRegIds, ...teamEventIds]).values());
      setRegisteredEventIds(merged);

      // Fill missing titles from API or organizer local storage
      const unresolved = merged.filter(id => !idToTitle[id]);
      const resolvedPairs: Array<{ id: string; title: string }> = [];
      for (const id of unresolved) {
        let title: string | undefined;
        // Try local organizer stores
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            if (key && key.startsWith('hv_events_')) {
              const list = JSON.parse(localStorage.getItem(key) || '[]');
              const ev = list.find((e: any) => e.id === id);
              if (ev) { title = ev.title; break; }
            }
          }
        } catch {}
        // Try API
        if (!title) {
          try {
            const e = await apiFetch<any>(`/api/events/${id}`);
            title = e?.name || e?.title;
          } catch {}
        }
        if (title) idToTitle[id] = title;
      }
      for (const id of merged) {
        resolvedPairs.push({ id, title: idToTitle[id] || id });
      }
      setRegisteredEvents(resolvedPairs);
    })();
  }, [user?.id, user?.role]);

  // When no specific event filter is set, show announcements from all registered events
  useEffect(() => {
    (async () => {
      if (user?.role !== 'participant' || eventId || registeredEventIds.length === 0) return;
      const all: Ann[] = [];
      // Try API first per event
      for (const eid of registeredEventIds) {
        try {
          const list = await apiFetch<any[]>(`/api/announcements?eventId=${encodeURIComponent(eid)}`);
          const mapped: Ann[] = (list || []).map((a: any) => ({ id: String(a._id || a.id), title: a.title, content: a.message, createdAt: a.createdAt, eventId: a.eventId, author: a.createdBy || 'Organizer' }));
          all.push(...mapped);
        } catch {}
      }
      // Fallback: from local stored announcements filtered by registered events
      if (all.length === 0) {
        try {
          const stored: Ann[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
          const filtered = stored.filter(a => a.eventId && registeredEventIds.includes(a.eventId));
          all.push(...filtered);
        } catch {}
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(all);
    })();
  }, [user?.role, eventId, registeredEventIds]);

  const post = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await apiFetch('/api/announcements', { method: 'POST', body: { eventId: eventId || undefined, title: title.trim(), message: content.trim(), audience } });
      setTitle('');
      setContent('');
      await load();
    } catch {
      const newItem: Ann = { id: `${Date.now()}`, title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), eventId: eventId || undefined, author: user?.name || 'User', audience };
      const all: Ann[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
      localStorage.setItem('hv_announcements', JSON.stringify([newItem, ...all]));
      setTitle('');
      setContent('');
      load();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Announcements & Chat</h1>

      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by My Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="neon-input w-full px-4 py-2.5 text-white rounded-lg bg-black/90 focus:border-neon-green"
            >
              <option value="">All My Events</option>
              {(user?.role === 'organizer' ? organizerEvents : user?.role === 'judge' ? judgeEvents : registeredEvents).map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
          <Input label="Filter by Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Event ID" roleColor={roleColor} />
          {user?.role === 'organizer' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
                <option value="participants">Participants</option>
                <option value="judges">Judges</option>
                <option value="all">All</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Audience</label>
              <div className="text-gray-400 text-sm py-2.5">{user?.role === 'judge' ? 'Judges' : 'Participants'}</div>
            </div>
          )}
        </div>
        {user?.role === 'participant' && (
          <p className="text-gray-400 text-sm mt-3">Showing announcements from all your registered events when no Event ID is selected.</p>
        )}
      </Card>

      {/* Two-column: Announcements (left) and Q&A (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements column */}
        <div className="space-y-4">
          {user?.role === 'organizer' && (
            <Card roleColor={roleColor}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" roleColor={roleColor} />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
                  >
                    <option value="">Select an event</option>
                    {organizerEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                  <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-28" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your update..." />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={post} roleColor={roleColor}><Megaphone className="w-4 h-4" /> Post</Button>
                </div>
              </div>
            </Card>
          )}

          <Card roleColor={roleColor}>
            <h2 className="text-xl font-orbitron font-bold mb-3">Announcements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Search by Event Name</label>
                <input
                  className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
                  placeholder="Type event name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              {(() => {
                const nameById: Record<string, string> = {};
                (user?.role === 'organizer' ? organizerEvents : registeredEvents).forEach(e => { nameById[e.id] = e.title; });
                const list = items.filter(a => {
                  if (!searchName.trim()) return true;
                  const n = (nameById[a.eventId || ''] || '').toLowerCase();
                  const s = searchName.trim().toLowerCase();
                  return n.includes(s);
                });
                return list.map((a) => (
                <Card key={a.id} roleColor={roleColor}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white font-semibold">{a.title}</div>
                    <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    {a.eventId && (
                      <span className="text-neon-blue">Event: {(nameById[a.eventId] ? `${nameById[a.eventId]} • ` : '')}{a.eventId}</span>
                    )}
                    {a.audience && <span className="text-gray-400">Audience: {a.audience}</span>}
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap">{a.content}</div>
                  <div className="text-xs text-gray-500 mt-2">By {a.author}</div>
                </Card>
                ));
              })()}
            </div>
          </Card>
        </div>

        {/* Chat column */}
        <div className="space-y-4">
          <Card roleColor={roleColor}>
            <h2 className="text-xl font-orbitron font-bold mb-3">Chat with Organizer</h2>
            {eventId ? (
              <QA eventId={eventId} allowPost={true} />
            ) : (
              <div className="text-gray-400">Select an event to view chat.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Announcements;

// --- Inline Q&A component ---
const QA: React.FC<{ eventId: string; allowPost: boolean }> = ({ eventId, allowPost }) => {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<Array<{ id: string; content: string; userId?: string; createdAt: string }>>([]);
  const [text, setText] = React.useState('');

  const load = async () => {
    try {
      const list = await apiFetch<any[]>(`/api/chats?eventId=${encodeURIComponent(eventId)}`);
      const mapped = (list || []).map((m: any) => ({ id: String(m._id || m.id), content: m.content, userId: m.userId, createdAt: m.createdAt }));
      setMessages(mapped);
    } catch {
      // fallback local
      const stored: any[] = JSON.parse(localStorage.getItem(`hv_qna_${eventId}`) || '[]');
      setMessages(stored);
    }
  };

  React.useEffect(() => { load(); }, [eventId]);

  const post = async () => {
    if (!text.trim()) return;
    try {
      await apiFetch(`/api/chats`, { method: 'POST', body: { eventId, content: text.trim() } });
      setText('');
      load();
    } catch {
      const local = { id: `${Date.now()}`, content: text.trim(), userId: user?.id, createdAt: new Date().toISOString() };
      const stored: any[] = JSON.parse(localStorage.getItem(`hv_qna_${eventId}`) || '[]');
      localStorage.setItem(`hv_qna_${eventId}`, JSON.stringify([local, ...stored]));
      setText('');
      load();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-orbitron font-bold">Chat</h2>
      </div>
      {allowPost && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-4">
            <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-16" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message for this event..." />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button onClick={post}>Post</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {messages.length === 0 && <div className="text-gray-400">No messages yet.</div>}
        {messages.map(m => (
          <div key={m.id} className="border border-gray-800 rounded-lg p-3">
            <div className="text-gray-300 whitespace-pre-wrap">{m.content}</div>
            <div className="text-xs text-gray-500 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QAManaged: React.FC<{ eventId: string; isOrganizer: boolean }> = ({ eventId, isOrganizer }) => {
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [answering, setAnswering] = React.useState<any | null>(null);
  const [answer, setAnswer] = React.useState('');

  const load = async () => {
    try {
      const list = await apiFetch<any[]>(`/api/chats?eventId=${encodeURIComponent(eventId)}&onlyParticipants=true&onlyQuestions=true`);
      setQuestions(list || []);
    } catch {
      const stored: any[] = JSON.parse(localStorage.getItem(`hv_qna_${eventId}`) || '[]');
      setQuestions(stored);
    }
  };

  React.useEffect(() => { load(); }, [eventId]);

  const submitAnswer = async () => {
    if (!answering || !answer.trim()) return;
    try {
      await apiFetch('/api/chats', { method: 'POST', body: { eventId, content: answer.trim(), replyTo: String(answering._id || answering.id), authorRole: 'ORGANIZER' } });
      setAnswer('');
      setAnswering(null);
      load();
    } catch {
      setAnswer('');
      setAnswering(null);
      load();
    }
  };

  return (
    <div className="space-y-2">
      {questions.length === 0 && <div className="text-gray-400">No questions yet.</div>}
      {questions.map((q: any) => (
        <div key={String(q._id || q.id)} className="border border-gray-800 rounded p-3 hover:bg-gray-900/40 cursor-pointer" onClick={() => isOrganizer && setAnswering(q)}>
          <div className="text-gray-300 whitespace-pre-wrap">{q.content}</div>
          <div className="text-xs text-gray-500 mt-1">{new Date(q.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {isOrganizer && answering && (
        <div className="mt-3 border border-gray-800 rounded p-3">
          <div className="text-sm text-gray-400 mb-2">Answering: {answering.content}</div>
          <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-20" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer..." />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setAnswer(''); setAnswering(null); }}>Cancel</Button>
            <Button onClick={submitAnswer}>Post Answer</Button>
          </div>
        </div>
      )}
    </div>
  );
};



