import { NextApiRequest, NextApiResponse } from "next";

const docs = {
	"/api/health": { methods: ["GET"] },
	"/api/auth/[...nextauth]": {
		methods: ["POST", "GET"],
		description: "NextAuth routes for login/register and session handling.",
	},
	"/api/auth/login": { methods: ["POST"], POST: { body: { email: "string", password: "string" }, returns: { token: "string", user: { id: "string", email: "string", role: "string" } } } },
	"/api/auth/register": { methods: ["POST"], POST: { body: { name: "string?", email: "string", password: "string", role: "PARTICIPANT|ORGANIZER|JUDGE?" } } },
	"/api/events": {
		methods: ["GET", "POST"],
		POST: {
			role: "ORGANIZER",
			body: {
				name: "string",
				description: "string?",
				theme: "string?",
				tracks: ["string"],
				rules: ["string"],
				prizes: [{ title: "string", description: "string?" }],
				sponsors: [{ name: "string", logoUrl: "string?" }],
				online: "boolean",
				location: "string?",
				startAt: "ISO string",
				endAt: "ISO string",
			},
		},
	},
	"/api/events/[id]": { methods: ["GET", "PUT"], PUT: { role: "ORGANIZER" } },
	"/api/registrations": { methods: ["GET", "POST"], POST: { body: { eventId: "string" } } },
	"/api/teams": { methods: ["GET", "POST"], POST: { body: { eventId: "string", name: "string" } } },
	"/api/teams/invite": { methods: ["POST"], POST: { body: { teamId: "string", userId: "string" } } },
	"/api/teams/join": { methods: ["POST"], POST: { body: { teamId: "string" } } },
	"/api/submissions": { methods: ["GET", "POST"], POST: { body: { eventId: "string", teamId: "string", title: "string", repoUrl: "string" } } },
	"/api/upload": { methods: ["POST"], POST: { body: { base64: "string", contentType: "string?", prefix: "string?", filename: "string?" } } },
	"/api/scores": { methods: ["GET", "POST"], POST: { role: "JUDGE", body: { eventId: "string", teamId: "string", submissionId: "string", criteria: [{ name: "string", score: "number", max: "number" }] } } },
	"/api/leaderboard/[eventId]": { methods: ["GET"] },
	"/api/announcements": { methods: ["GET", "POST"], POST: { role: "ORGANIZER", body: { eventId: "string", title: "string", message: "string" } } },
	"/api/plagiarism/run": { methods: ["POST"], POST: { role: "ORGANIZER", body: { eventId: "string", submissionId: "string" } } },
	"/api/plagiarism/[id]": { methods: ["GET"] },
	"/api/certificates/generate": { methods: ["POST"], POST: { role: "ORGANIZER", body: { eventId: "string", userId: "string", participantName: "string", role: "string" } } },
	"/api/certificates/bulk": { methods: ["POST"], POST: { role: "ORGANIZER", body: { eventId: "string", users: [{ userId: "string", name: "string", role: "string" }] } } },
	"/api/chats": { methods: ["GET", "POST"], POST: { body: { eventId: "string", teamId: "string?", content: "string", attachments: "array?" } } },
	"/api/users/me": { methods: ["GET"] },
	"/api/users/role": { methods: ["POST"], POST: { role: "ORGANIZER", body: { userId: "string", role: "PARTICIPANT|ORGANIZER|JUDGE" } } },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
	res.status(200).json({ success: true, data: docs });
}


