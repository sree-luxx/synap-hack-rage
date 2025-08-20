import { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../lib/mongoose";
import { Submission } from "../../../models/Submission";
import { ok, badRequest, created, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { applyCors } from "../_cors";

export const config = {
	api: {
		bodyParser: { sizeLimit: "10mb" },
	},
};

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
			const { eventId } = req.query;
			const filter: any = {};
			if (typeof eventId === "string") filter.eventId = eventId;
			const subs = await (Submission as any).find(filter as any, null, { sort: { createdAt: -1 } });
			return ok(res, subs);
		}

		if (req.method === "POST") {
			const body = req.body as any;
			if (!body?.eventId || !body?.teamId || !body?.repoUrl || !body?.title) return badRequest(res, "Missing fields");
			const sub = await (Submission as any).create({
				eventId: body.eventId,
				teamId: body.teamId,
				title: body.title,
				description: body.description,
				repoUrl: body.repoUrl,
				files: body.files ?? [],
				metadata: body.metadata ?? {},
			} as any);
			return created(res, sub);
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


