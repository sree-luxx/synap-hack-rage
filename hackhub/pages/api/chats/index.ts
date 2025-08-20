import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { ChatMessage } from "../../../models/Chat";
import { ok, badRequest, created, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { publish } from "../../../lib/pubsub";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (applyCors(req, res)) return;
		const session = await getServerSession(req, res, authOptions);
		let userId: string | null = session ? ((session.user as any).id as string) : null;
		if (!userId) {
			const jwtUser = await getApiUser(req);
			userId = jwtUser?.id ?? null;
		}
		if (!userId) return unauthorized(res);
		await connectMongo();

		if (req.method === "GET") {
			const { eventId, teamId, onlyParticipants, onlyQuestions } = req.query as any;
			const filter: any = {};
			if (eventId) filter.eventId = eventId;
			if (teamId) filter.teamId = teamId;
			if (onlyParticipants === "true") filter.authorRole = "PARTICIPANT";
			if (onlyQuestions === "true") filter.replyTo = { $exists: false };
			const list = await (ChatMessage as any).find(filter as any, null, { sort: { createdAt: -1 }, limit: 200 });
			return ok(res, list);
		}

		if (req.method === "POST") {
			const body = req.body as any;
			if (!body?.eventId || !body?.content) return badRequest(res, "Missing fields");
			const msg = await (ChatMessage as any).create({ eventId: body.eventId, teamId: body.teamId, userId, content: body.content, attachments: body.attachments ?? [], replyTo: body.replyTo, authorRole: body.authorRole } as any);
			await publish(`event-${body.eventId}`, "chat:new", { _id: String(msg._id), content: msg.content, teamId: msg.teamId, userId: msg.userId, createdAt: msg.createdAt });
			await publish("event-all", "chat:new", { _id: String(msg._id), content: msg.content, teamId: msg.teamId, userId: msg.userId, createdAt: msg.createdAt });
			return created(res, msg);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


