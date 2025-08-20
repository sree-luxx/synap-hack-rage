import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { badRequest, ok, serverError, unauthorized } from "../../../lib/response";
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
		if (req.method !== "POST") return badRequest(res, "Method not allowed");

		const { teamId } = req.body as any;
		if (!teamId) return badRequest(res, "Missing teamId");
		const existing = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } as any });
		if (!existing) await prisma.teamMember.create({ data: { teamId, userId } });
		return ok(res, { teamId, userId }, "Joined team");
	} catch (error) {
		return serverError(res, error);
	}
}


