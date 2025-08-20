import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Eye, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

type EventSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  organizerId: string;
  projectsToReview: number;
  completedReviews: number;
};

type Assignment = { eventId: string; judgeId: string; judgeName: string; organizerId: string };

export const AssignedEvents: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => 'orange' as const, []);
  const [events, setEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    const assigns: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]').filter((a: Assignment) => a.judgeId === `judge-${user.email}` || a.judgeName === user.name);
    const summaries: EventSummary[] = assigns.map((a) => {
      const orgEvents = JSON.parse(localStorage.getItem(`hv_events_${a.organizerId}`) || '[]');
      const ev = orgEvents.find((e: any) => e.id === a.eventId) || { id: a.eventId, title: 'Event', startDate: new Date().toISOString(), endDate: new Date().toISOString(), status: 'published' };
      const subs = JSON.parse(localStorage.getItem(`hv_submissions_${a.eventId}`) || '[]');
      const judgeScores = JSON.parse(localStorage.getItem(`hv_scores_${user.id}_${a.eventId}`) || '[]');
      return {
        id: ev.id,
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        status: ev.status,
        organizerId: a.organizerId,
        projectsToReview: subs.length,
        completedReviews: judgeScores.length
      };
    });
    setEvents(summaries);
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Assigned Events</h1>
      {events.length === 0 ? (
        <Card roleColor={roleColor}><p className="text-gray-400">No assignments yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((ev) => (
            <Card key={ev.id} roleColor={roleColor}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">{ev.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${ev.status === 'completed' ? 'bg-green-500/20 text-green-400' : ev.status === 'judging' || ev.status === 'ongoing' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{ev.status}</span>
              </div>
              <div className="flex items-center text-gray-400 text-sm mb-3"><Calendar className="w-4 h-4 mr-2 text-neon-blue" /> {new Date(ev.startDate).toLocaleDateString()} - {new Date(ev.endDate).toLocaleDateString()}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div className="bg-neon-orange h-2 rounded-full" style={{ width: `${ev.projectsToReview ? Math.round((ev.completedReviews/Math.max(ev.projectsToReview,1))*100) : 0}%` }} />
              </div>
              <div className="text-xs text-gray-400 mb-4">{ev.completedReviews}/{ev.projectsToReview} reviews completed</div>
              <div className="flex gap-2">
                <Link to={`/dashboard/reviews?event=${ev.id}`}>
                  <Button roleColor={roleColor}><CheckCircle className="w-4 h-4" /> Review Now</Button>
                </Link>
                <Link to={`/events/${ev.id}`}>
                  <Button variant="outline" roleColor={roleColor}><Eye className="w-4 h-4" /> View</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedEvents;



