# SynapHack 3.0 – Event & Hackathon Hosting Platform  

## 📌 Overview  
SynapHack 3.0 is a modern, scalable **event and hackathon hosting platform** designed for student-led and community-driven initiatives.  
The platform provides smooth workflows for **organizers, participants, and judges**, with real-time engagement, automated certificates, leaderboards, and analytics.  

---

## 🚀 Tech Stack  

### Frontend (synaphack-frontend)  
- **Framework:** React 18 + TypeScript  
- **Build Tool:** Vite  
- **Routing:** React Router DOM  
- **UI/UX:** Tailwind CSS, Framer Motion, lucide-react  
- **State Management:** React Context API (Auth, Notifications)  
- **Realtime:** socket.io-client + Pusher integration  

### Backend (backend)  
- **Framework:** Next.js 14 (API routes in `/pages/api`)  
- **Authentication:** NextAuth.js (Google, GitHub, Credentials) + Prisma Adapter  
- **Databases:**  
  - **Azure SQL (via Prisma):** Users, Events, Teams, Registrations, Judge Assignments  
  - **MongoDB (via Mongoose):** Q&A, Announcements, Unstructured data  
- **Realtime:** Pusher SDK (announcements, leaderboard, chat)  
- **Utilities:** bcryptjs, JWT, pdfkit (certificates), formidable (uploads), Azure Blob Storage  

### Deployment  
- **Cloud:** Azure Web Apps + Azure Blob Storage  
- **Databases:** Azure SQL + MongoDB Atlas  


---

## Features  

### Core Features  
- Event creation & management (tracks, rules, timeline, sponsors, prizes)  
- Registration (individual/team) with social/email login  
- Team formation & invites  
- Project submission (docs, GitHub, videos)  
- Judge evaluation with multi-round scoring and feedback  
- Announcements & Q&A channels  
- Role-based dashboards (Organizer, Participant, Judge)  

### Bonus Features  
- Automated certificate generation  
- Real-time leaderboard  
- Web3-based POAP/NFT badges  
- Analytics dashboard for organizers  

---

## Installation & Setup  

### Prerequisites  
- Node.js (>= 18.x)  
- npm or yarn  
- Azure SQL database connection string  
- MongoDB connection URI  

## Frontend Setup 
 npm install
 npm run dev

## Backend Setup 
npm install 
npm run dev

