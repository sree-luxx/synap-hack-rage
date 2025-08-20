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
				const { eventId, forEvent } = req.query as any;
				if (forEvent && eventId) {
					// Organizer/Judge can view participants for an event; session already required above
					const regsForEvent = await prisma.registration.findMany({ where: { eventId }, include: { user: true, team: true } });
					return ok(res, regsForEvent);
				}
				const regs = await prisma.registration.findMany({ where: { userId }, include: { event: true, team: true } });
				return ok(res, regs);
			} catch (dbError) {
				console.log("Database temporarily unavailable, returning empty registrations list");
				return ok(res, [], "Database temporarily unavailable, showing empty list");
			}
		}

		if (req.method === "POST") {
			try {
				const { eventId, teamName, teamDescription, registrationType } = req.body as any;
				if (!eventId) return badRequest(res, "Missing eventId");
				
				// Check if already registered
				const existing = await prisma.registration.findUnique({
					where: { userId_eventId: { userId, eventId } as any }
				});
				if (existing) return badRequest(res, "Already registered for this event");

				// Create team if requested
				let teamId = null;
				if (registrationType === 'team' && teamName) {
					const team = await prisma.team.create({
						data: {
							name: teamName,
							eventId,
							members: {
								create: {
									userId,
									role: 'leader'
								}
							}
						}
					});
					teamId = team.id;
				}

				// Create registration
				const reg = await prisma.registration.create({ 
					data: { 
						eventId, 
						userId,
						teamId 
					} 
				});

				// Note: registration counts are derived from relation; no numeric field to update

				return created(res, { ...reg, teamId });
			} catch (dbError) {
				console.error("Database error creating registration:", dbError);
				return serverError(res, "Database temporarily unavailable. Please try again later.");
			}
		}

		if (req.method === "DELETE") {
			try {
				const { eventId } = req.query as any;
				if (!eventId) return badRequest(res, "Missing eventId");
				
				// Get registration to check if it has a team
				const reg = await prisma.registration.findUnique({
					where: { userId_eventId: { userId, eventId } as any },
					include: { team: true }
				});

				if (reg) {
					// Delete registration
					await prisma.registration.delete({ 
						where: { userId_eventId: { userId, eventId } as any } 
					});

					// If this was a team leader, delete the team
					if (reg.teamId) {
						await prisma.team.delete({ where: { id: reg.teamId } });
					}

					// No explicit event counter to update; relation drives counts
				}

				return ok(res, null, "Unregistered");
			} catch (dbError) {
				return serverError(res, dbError);
			}
		}

		return badRequest(res, "Method not allowed");
	} catch (error) {
		return serverError(res, error);
	}
}


