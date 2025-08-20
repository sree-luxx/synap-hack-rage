import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/Toast';
import { Landing } from './pages/Landing';
import { Leaderboard } from './pages/Leaderboard';
import { About } from './pages/About';
import { Sponsors } from './pages/Sponsors';
import { Auth } from './pages/auth/Auth';
import { Dashboard } from './pages/dashboard/Dashboard';
import { EventDetails } from './pages/events/EventDetails';
import { EventDiscovery } from './pages/events/EventDiscovery';
import { TeamManagement } from './pages/teams/TeamManagement';
import { ProjectSubmissions } from './pages/submissions/ProjectSubmissions';
import { useToast } from './hooks/useToast';
import { CreateEvent } from './pages/dashboard/CreateEvent';
import { MyEvents } from './pages/dashboard/MyEvents';
import { Participants } from './pages/dashboard/Participants';
import { Judges } from './pages/dashboard/Judges';
import { Analytics } from './pages/dashboard/Analytics';
import { AssignedEvents } from './pages/dashboard/AssignedEvents';
import { Reviews } from './pages/dashboard/Reviews';
import { JudgesReviews } from './pages/dashboard/JudgesReviews';
import { Winners } from './pages/dashboard/Winners';
import { Announcements } from './pages/dashboard/Announcements';
import { Profile } from './pages/dashboard/Profile';
import { Plagiarism } from './pages/dashboard/Plagiarism';
import { OrganizerSponsors } from './pages/dashboard/OrganizerSponsors';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neon-purple">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      {user ? (
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
};

const AppWithToast: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  return (
    <>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <Routes>
                      <Route index element={<Dashboard />} />
                      <Route path="events" element={<EventDiscovery />} />
                      <Route path="my-events" element={<MyEvents />} />
                      <Route path="teams" element={<TeamManagement />} />
                      <Route path="submissions" element={<ProjectSubmissions />} />
                      <Route path="announcements" element={<Announcements />} />
                      <Route path="create-event" element={<CreateEvent />} />
                      <Route path="participants" element={<Participants />} />
                      <Route path="judges" element={<Judges />} />
                      <Route path="judges-reviews" element={<JudgesReviews />} />
                      <Route path="plagiarism" element={<Plagiarism />} />
                      <Route path="organizer-sponsors" element={<OrganizerSponsors />} />
                      <Route path="winners" element={<Winners />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="assigned-events" element={<AssignedEvents />} />
                      <Route path="reviews" element={<Reviews />} />
                      <Route path="profile" element={<Profile />} />
                    </Routes>
                  </ProtectedRoute>
                } />
                
                {/* Public Event Details */}
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/events" element={<EventDiscovery />} />
                {/* Leaderboard now requires login */}
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/sponsors" element={<Sponsors />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

function App() {
  return <AppWithToast />;
}

export default App;