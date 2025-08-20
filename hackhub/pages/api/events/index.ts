import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, created, ok, serverError, unauthorized, forbidden } from "../../../lib/response";
import { getServerSession } from "next-auth";
import { authOptions, getApiUser } from "../../../lib/auth";
import { applyCors } from "../_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (applyCors(req, res)) return;
		if (req.method === "GET") {
			try {
				const events = await prisma.event.findMany({
					include: { tracks: true, rules: true, prizes: true, sponsors: true },
					orderBy: { startAt: "desc" },
				});
				return ok(res, events);
			} catch (dbError) {
				// If database is unavailable, return empty array with message
				console.log("Database temporarily unavailable, returning empty events list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
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
		if (req.method === "POST") {
			if (role !== "ORGANIZER") return forbidden(res);
			const body = req.body as any;
			if (!body?.name || !body?.startAt || !body?.endAt) return badRequest(res, "Missing required fields");
			try {
				const event = await prisma.event.create({
					data: {
						name: body.name,
						description: body.description,
						theme: body.theme,
						online: body.online ?? true,
						location: body.location,
						startAt: new Date(body.startAt),
						endAt: new Date(body.endAt),
						organizerId: userId,
						tracks: { create: (body.tracks ?? []).map((name: string) => ({ name })) },
						rules: { create: (body.rules ?? []).map((text: string) => ({ text })) },
						prizes: { create: (body.prizes ?? []).map((p: any) => ({ title: p.title, description: p.description })) },
						sponsors: { create: (body.sponsors ?? []).map((s: any) => ({ name: s.name, logoUrl: s.logoUrl })) },
					},
					include: { tracks: true, rules: true, prizes: true, sponsors: true },
				});
				return created(res, event);
			} catch (dbError) {
				console.error("Database error creating event:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


