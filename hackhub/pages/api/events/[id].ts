import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { id } = req.query;
	if (typeof id !== "string") return badRequest(res, "Invalid id");
	try {
		if (applyCors(req, res)) return;
		if (req.method === "GET") {
			const event = await prisma.event.findUnique({
				where: { id },
				include: { tracks: true, rules: true, prizes: true, sponsors: true, teams: true, registrations: true },
			});
			return ok(res, event);
		}

		const session = await getServerSession(req, res, authOptions);
		let userId: string | null = session ? ((session.user as any).id as string) : null;
		let role: string | null = session ? ((session.user as any).role as string) : null;
		if (!userId) {
			const jwtUser = await getApiUser(req);
			userId = jwtUser?.id ?? null;
			role = (jwtUser?.role as any) ?? null;
		}
		if (!userId) return unauthorized(res);

		if (req.method === "PUT") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			const event = await prisma.event.update({
				where: { id },
				data: {
					name: body.name,
					description: body.description,
					theme: body.theme,
					online: body.online,
					location: body.location,
					startAt: body.startAt ? new Date(body.startAt) : undefined,
					endAt: body.endAt ? new Date(body.endAt) : undefined,
				},
			});
			return ok(res, event, "Updated");
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


