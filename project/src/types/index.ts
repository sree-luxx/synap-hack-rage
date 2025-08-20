export interface User {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'organizer' | 'judge';
  avatar?: string;
  createdAt: Date;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  mode: 'online' | 'offline' | 'hybrid';
  location?: string;
  maxTeamSize: number;
  prizes: Prize[];
  sponsors: Sponsor[];
  tracks: string[];
  rules: string;
  timeline: TimelineItem[];
  organizerId: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  registrations: number;
  maxParticipants?: number;
  bannerUrl?: string;
  rounds: Round[];
}

export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  criteria: JudgingCriteria[];
}

export interface JudgingCriteria {
  name: string;
  description: string;
  maxScore: number;
}

export interface Prize {
  rank: number;
  amount: string;
  description: string;
}

export interface Sponsor {
  name: string;
  logo: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  website?: string;
}

export interface TimelineItem {
  title: string;
  date: Date;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  eventId: string;
  leaderId: string;
  members: TeamMember[];
  inviteCode: string;
  maxSize: number;
  description?: string;
  skills: string[];
  status: 'forming' | 'complete' | 'disbanded';
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'member';
  joinedAt: Date;
  skills?: string[];
}

export interface TeamInvite {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Submission {
  id: string;
  teamId: string;
  eventId: string;
  roundId: string;
  title: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  documents: SubmissionFile[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
  scores: Score[];
  feedback: string[];
}

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Score {
  judgeId: string;
  judgeName: string;
  criteria: CriteriaScore[];
  overallFeedback: string;
  submittedAt: Date;
}

export interface CriteriaScore {
  criteriaName: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface Announcement {
  id: string;
  eventId?: string;
  title: string;
  content: string;
  type: 'general' | 'event' | 'urgent';
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface QAThread {
  id: string;
  eventId?: string;
  question: string;
  answer?: string;
  askedBy: string;
  askedByName: string;
  answeredBy?: string;
  answeredByName?: string;
  createdAt: Date;
  answeredAt?: Date;
  upvotes: number;
  upvotedBy: string[];
  status: 'open' | 'answered' | 'closed';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  teamId?: string;
  registrationType: 'individual' | 'team';
  status: 'registered' | 'waitlisted' | 'cancelled';
  registeredAt: Date;
}

export interface Analytics {
  eventId: string;
  totalRegistrations: number;
  teamCount: number;
  submissionCount: number;
  participationByTrack: Record<string, number>;
  registrationTrend: { date: string; count: number }[];
  submissionTrend: { date: string; count: number }[];
}