import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Announcement } from "../../../models/Announcement";
import { ok, badRequest, created, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { publish } from "../../../lib/pubsub";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (applyCors(req, res)) return;
		const session = await getServerSession(req, res, authOptions);
		let userId: string | null = session ? ((session.user as any).id as string) : null;
		let role: string | null = session ? ((session.user as any).role as string) : null;
		if (!userId) {
			const jwtUser = await getApiUser(req);
			userId = jwtUser?.id ?? null;
			role = (jwtUser?.role as any) ?? null;
		}
		if (!userId) return unauthorized(res);
		await connectMongo();

		if (req.method === "GET") {
			const { eventId, audience } = req.query as any;
			const filter: any = {};
			if (eventId) filter.eventId = eventId;
			if (audience && ["participants", "judges", "all"].includes(String(audience))) {
				filter.$or = [{ audience: audience }, { audience: "all" }];
			}
			const list = await (Announcement as any).find(filter as any, null, { sort: { createdAt: -1 } });
			return ok(res, list);
		}

		if (req.method === "POST") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			if (!body?.eventId || !body?.title || !body?.message) return badRequest(res, "Missing fields");
			const audience = ["participants", "judges", "all"].includes(String(body.audience)) ? body.audience : "participants";
			const ann = await (Announcement as any).create({ eventId: body.eventId, title: body.title, message: body.message, createdBy: userId, audience } as any);
			await publish(`event-${body.eventId}`, "announcement:new", ann);
			await publish("event-all", "announcement:new", ann);
			return created(res, ann);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


