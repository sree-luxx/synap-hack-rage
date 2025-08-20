import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, ok, serverError, unauthorized } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
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

		if (req.method === "GET") {
			try {
				const { eventId } = req.query as any;
				const where: any = {};
				if (eventId) where.eventId = eventId;
				const teams = await prisma.team.findMany({ where, include: { members: true } });
				return ok(res, teams);
			} catch (dbError) {
				console.log("Database temporarily unavailable, returning empty teams list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
		}

		if (req.method === "POST") {
			try {
				const { eventId, name } = req.body as any;
				if (!eventId || !name) return badRequest(res, "Missing fields");
				const team = await prisma.team.create({ data: { eventId, name } });
				await prisma.teamMember.create({ data: { teamId: team.id, userId } });
				return created(res, team);
			} catch (dbError) {
				console.error("Database error creating team:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


